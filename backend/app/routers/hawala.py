import random
import string
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth.jwt import get_current_user
from app.database import get_db
from app.models.hawala import HawalaTransfer
from app.models.transaction import Transaction
from app.models.user import User
from app.services.hashgraph import record_transaction_on_hashgraph
from app.services.notifications import notify
from app.routers.wallet import get_or_create_wallet

router = APIRouter(prefix="/hawala", tags=["Hawala (Digital Money Transfer)"])

FEE_PERCENT = 0.5  # 0.5% fee — much lower than Western Union's 7-10%


class HawalaRequest(BaseModel):
    recipient_name: str
    recipient_phone: str
    recipient_country: str
    amount: float
    target_currency: str = "USD"
    note: str = ""


def generate_code() -> str:
    return "HW-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=8))


@router.post("/send")
def send_hawala(
    payload: HawalaRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Send money via Hawala — low-cost cross-border transfer."""
    if payload.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    fee = round(payload.amount * FEE_PERCENT / 100, 2)
    total = payload.amount + fee

    wallet = get_or_create_wallet(db, current_user.id)
    if float(wallet.balance) < total:
        raise HTTPException(status_code=400, detail="Insufficient balance (amount + fee)")

    wallet.balance = float(wallet.balance) - total
    code = generate_code()

    transfer = HawalaTransfer(
        sender_id=current_user.id,
        recipient_name=payload.recipient_name,
        recipient_phone=payload.recipient_phone,
        recipient_country=payload.recipient_country,
        amount=payload.amount,
        fee=fee,
        target_currency=payload.target_currency,
        hawala_code=code,
        status="sent",
        note=payload.note or None,
    )
    db.add(transfer)
    db.flush()

    tx = Transaction(
        from_user=current_user.id, to_user="hawala_network",
        amount=total, type="hawala_send",
        product_type="hawala", product_id=transfer.id,
    )
    tx.hashgraph_tx_id = record_transaction_on_hashgraph(
        tx.id, tx.from_user, tx.to_user, total, tx.type, tx.product_type, tx.product_id)
    db.add(tx)

    notify(db, current_user.id, "Hawala Sent",
           f"Transfer of {payload.amount} USD sent. Code: {code}. Share with recipient.", "hawala")
    db.commit()
    db.refresh(transfer)

    return {
        "id": transfer.id, "hawala_code": code,
        "amount": float(transfer.amount), "fee": float(transfer.fee),
        "recipient": transfer.recipient_name, "country": transfer.recipient_country,
        "status": transfer.status, "note": transfer.note,
    }


@router.get("/my")
def my_transfers(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    transfers = db.query(HawalaTransfer).filter(
        HawalaTransfer.sender_id == current_user.id
    ).order_by(HawalaTransfer.created_at.desc()).all()
    return [
        {"id": t.id, "hawala_code": t.hawala_code, "amount": float(t.amount),
         "fee": float(t.fee), "recipient": t.recipient_name,
         "country": t.recipient_country, "status": t.status,
         "created_at": t.created_at.isoformat()}
        for t in transfers
    ]


@router.post("/collect/{code}")
def collect_hawala(code: str, db: Session = Depends(get_db)):
    """Recipient collects the transfer using the Hawala code."""
    transfer = db.query(HawalaTransfer).filter(HawalaTransfer.hawala_code == code).first()
    if not transfer:
        raise HTTPException(status_code=404, detail="Invalid Hawala code")
    if transfer.status != "sent":
        raise HTTPException(status_code=400, detail=f"Transfer already {transfer.status}")

    transfer.status = "collected"
    transfer.collected_at = datetime.utcnow()
    notify(db, transfer.sender_id, "Hawala Collected",
           f"{transfer.recipient_name} collected {transfer.amount} USD.", "hawala")
    db.commit()
    return {"status": "collected", "amount": float(transfer.amount), "recipient": transfer.recipient_name}


@router.get("/track/{code}")
def track_hawala(code: str, db: Session = Depends(get_db)):
    """Track a Hawala transfer by code."""
    transfer = db.query(HawalaTransfer).filter(HawalaTransfer.hawala_code == code).first()
    if not transfer:
        raise HTTPException(status_code=404, detail="Invalid code")
    return {
        "hawala_code": transfer.hawala_code, "amount": float(transfer.amount),
        "recipient": transfer.recipient_name, "country": transfer.recipient_country,
        "status": transfer.status, "created_at": transfer.created_at.isoformat(),
        "collected_at": transfer.collected_at.isoformat() if transfer.collected_at else None,
    }
