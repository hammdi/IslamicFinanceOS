from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.jwt import get_current_user
from app.database import get_db
from app.models.waqf import Waqf, WaqfDonation
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.waqf import WaqfCreate, WaqfDonate, WaqfResponse
from app.services.hashgraph import record_transaction_on_hashgraph
from app.services.notifications import notify
from app.routers.wallet import get_or_create_wallet

router = APIRouter(prefix="/waqf", tags=["Waqf (Islamic Endowment)"])

VALID_CATEGORIES = ["mosque", "school", "hospital", "water", "orphanage", "general"]


@router.post("/create", response_model=WaqfResponse)
def create_waqf(
    payload: WaqfCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new Waqf (endowment) project."""
    if payload.category not in VALID_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Category must be one of: {VALID_CATEGORIES}")

    waqf = Waqf(
        creator_id=current_user.id,
        name=payload.name,
        description=payload.description,
        category=payload.category,
        target_amount=payload.target_amount,
    )
    db.add(waqf)
    db.commit()
    db.refresh(waqf)
    return waqf


@router.get("/available", response_model=list[WaqfResponse])
def list_available(db: Session = Depends(get_db)):
    """List all active Waqf projects accepting donations."""
    return db.query(Waqf).filter(Waqf.status == "active").all()


@router.get("/my", response_model=list[WaqfResponse])
def my_waqfs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List Waqf projects the user created or donated to."""
    created = db.query(Waqf).filter(Waqf.creator_id == current_user.id).all()
    donated_ids = (
        db.query(WaqfDonation.waqf_id)
        .filter(WaqfDonation.donor_id == current_user.id)
        .distinct()
        .all()
    )
    donated_id_set = {r[0] for r in donated_ids}
    donated = (
        db.query(Waqf).filter(Waqf.id.in_(donated_id_set)).all()
        if donated_id_set else []
    )
    seen = set()
    result = []
    for w in created + donated:
        if w.id not in seen:
            seen.add(w.id)
            result.append(w)
    return result


@router.get("/{waqf_id}", response_model=WaqfResponse)
def get_waqf(waqf_id: str, db: Session = Depends(get_db)):
    """Get details of a Waqf project."""
    waqf = db.query(Waqf).filter(Waqf.id == waqf_id).first()
    if not waqf:
        raise HTTPException(status_code=404, detail="Waqf not found")
    return waqf


@router.post("/{waqf_id}/donate", response_model=WaqfResponse)
def donate_to_waqf(
    waqf_id: str,
    payload: WaqfDonate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Donate to a Waqf endowment from wallet. This is sadaqa jariya (continuous charity)."""
    if payload.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    waqf = db.query(Waqf).filter(Waqf.id == waqf_id).first()
    if not waqf:
        raise HTTPException(status_code=404, detail="Waqf not found")
    if waqf.status != "active":
        raise HTTPException(status_code=400, detail="Waqf is not accepting donations")

    wallet = get_or_create_wallet(db, current_user.id)
    if float(wallet.balance) < payload.amount:
        raise HTTPException(status_code=400, detail="Insufficient wallet balance")

    wallet.balance = float(wallet.balance) - payload.amount

    donation = WaqfDonation(
        waqf_id=waqf.id,
        donor_id=current_user.id,
        amount=payload.amount,
    )
    db.add(donation)

    waqf.current_amount = float(waqf.current_amount) + payload.amount
    waqf.donors_count = waqf.donors_count + 1
    if waqf.current_amount >= float(waqf.target_amount):
        waqf.status = "funded"

    tx = Transaction(
        from_user=current_user.id,
        to_user=waqf.creator_id,
        amount=payload.amount,
        type="waqf_donate",
        product_type="waqf",
        product_id=waqf.id,
    )
    tx.hashgraph_tx_id = record_transaction_on_hashgraph(
        tx.id, tx.from_user, tx.to_user, payload.amount,
        tx.type, tx.product_type, tx.product_id,
    )
    db.add(tx)

    notify(db, current_user.id, "Waqf Donation",
           f"You donated {payload.amount} USD to '{waqf.name}'. Jazak Allahu Khairan.", "waqf")
    notify(db, waqf.creator_id, "Waqf Donation Received",
           f"{current_user.name} donated {payload.amount} USD to '{waqf.name}'.", "waqf")
    db.commit()
    db.refresh(waqf)
    return waqf
