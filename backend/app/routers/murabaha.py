from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.jwt import get_current_user
from app.database import get_db
from app.models.murabaha import Murabaha, MurabahaPayment
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.murabaha import MurabahaRequest, MurabahaResponse
from app.services.hashgraph import record_transaction_on_hashgraph
from app.services.notifications import notify
from app.routers.wallet import get_or_create_wallet

router = APIRouter(prefix="/murabaha", tags=["Murabaha (Cost-Plus Financing)"])


@router.post("/request", response_model=MurabahaResponse)
def request_murabaha(
    payload: MurabahaRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Client requests cost-plus financing for an asset."""
    total = round(payload.asset_price * (1 + payload.platform_margin_percent / 100), 2)
    installment = round(total / payload.installments_count, 2)

    m = Murabaha(
        client_id=current_user.id,
        asset_description=payload.asset_description,
        asset_price=payload.asset_price,
        platform_margin_percent=payload.platform_margin_percent,
        total_price=total,
        installments_count=payload.installments_count,
        installment_amount=installment,
    )
    db.add(m)
    db.commit()
    db.refresh(m)
    return m


@router.get("/available", response_model=list[MurabahaResponse])
def list_available(db: Session = Depends(get_db)):
    """List approved Murabaha contracts."""
    return db.query(Murabaha).filter(Murabaha.status.in_(["approved", "active"])).all()


@router.get("/my", response_model=list[MurabahaResponse])
def my_murabaha(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List user's Murabaha contracts."""
    return db.query(Murabaha).filter(Murabaha.client_id == current_user.id).all()


@router.get("/{murabaha_id}", response_model=MurabahaResponse)
def get_murabaha(murabaha_id: str, db: Session = Depends(get_db)):
    m = db.query(Murabaha).filter(Murabaha.id == murabaha_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Murabaha not found")
    return m


@router.post("/{murabaha_id}/approve", response_model=MurabahaResponse)
def approve_murabaha(
    murabaha_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Admin approves a Murabaha request and generates payment schedule."""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    m = db.query(Murabaha).filter(Murabaha.id == murabaha_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Murabaha not found")
    if m.status != "pending":
        raise HTTPException(status_code=400, detail="Already processed")

    m.status = "approved"
    m.approved_by = current_user.id

    # Generate payment schedule (monthly installments starting next month)
    today = date.today()
    for i in range(1, m.installments_count + 1):
        due = today + timedelta(days=30 * i)
        payment = MurabahaPayment(
            murabaha_id=m.id,
            installment_number=i,
            amount=float(m.installment_amount),
            due_date=due,
        )
        db.add(payment)

    notify(db, m.client_id, "Murabaha Approved",
           f"Your Murabaha for '{m.asset_description}' has been approved.", "murabaha")
    db.commit()
    db.refresh(m)
    return m


@router.post("/{murabaha_id}/pay", response_model=MurabahaResponse)
def pay_installment(
    murabaha_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Pay the next due installment from wallet."""
    m = db.query(Murabaha).filter(Murabaha.id == murabaha_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Murabaha not found")
    if m.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your contract")
    if m.status not in ("approved", "active"):
        raise HTTPException(status_code=400, detail="Contract not active")

    next_payment = (
        db.query(MurabahaPayment)
        .filter(MurabahaPayment.murabaha_id == m.id, MurabahaPayment.status == "pending")
        .order_by(MurabahaPayment.installment_number)
        .first()
    )
    if not next_payment:
        raise HTTPException(status_code=400, detail="All installments paid")

    wallet = get_or_create_wallet(db, current_user.id)
    if float(wallet.balance) < float(next_payment.amount):
        raise HTTPException(status_code=400, detail="Insufficient balance")

    wallet.balance = float(wallet.balance) - float(next_payment.amount)
    next_payment.status = "paid"
    next_payment.paid_date = date.today()
    m.status = "active"

    # Check if all paid
    remaining = (
        db.query(MurabahaPayment)
        .filter(MurabahaPayment.murabaha_id == m.id, MurabahaPayment.status == "pending")
        .count()
    )
    if remaining == 0:
        m.status = "completed"

    tx = Transaction(
        from_user=current_user.id, to_user="platform",
        amount=float(next_payment.amount), type="murabaha_payment",
        product_type="murabaha", product_id=m.id,
    )
    tx.hashgraph_tx_id = record_transaction_on_hashgraph(
        tx.id, tx.from_user, tx.to_user, float(tx.amount),
        tx.type, tx.product_type, tx.product_id,
    )
    db.add(tx)
    notify(db, current_user.id, "Installment Paid",
           f"Installment #{next_payment.installment_number} of {next_payment.amount} USD paid.", "murabaha")
    db.commit()
    db.refresh(m)
    return m


@router.get("/{murabaha_id}/schedule", response_model=list)
def payment_schedule(murabaha_id: str, db: Session = Depends(get_db)):
    """Get full payment schedule."""
    payments = (
        db.query(MurabahaPayment)
        .filter(MurabahaPayment.murabaha_id == murabaha_id)
        .order_by(MurabahaPayment.installment_number)
        .all()
    )
    return [
        {
            "installment": p.installment_number,
            "amount": float(p.amount),
            "due_date": p.due_date.isoformat(),
            "paid_date": p.paid_date.isoformat() if p.paid_date else None,
            "status": p.status,
        }
        for p in payments
    ]
