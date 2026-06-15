import random

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.jwt import get_current_user
from app.database import get_db
from app.models.tontine import Tontine, TontineMember
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.tontine import TontineCreate, TontinePay, TontineResponse
from app.services.hashgraph import record_transaction_on_hashgraph

router = APIRouter(prefix="/tontine", tags=["Tontine Digitale (Rotating Savings)"])


@router.post("/create", response_model=TontineResponse)
def create_tontine(
    payload: TontineCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new Tontine (Jam'iyya) savings group."""
    if not 5 <= payload.members_count <= 20:
        raise HTTPException(status_code=400, detail="Members count must be between 5 and 20")

    tontine = Tontine(
        name=payload.name,
        creator_id=current_user.id,
        monthly_amount=payload.monthly_amount,
        members_count=payload.members_count,
    )
    db.add(tontine)
    db.flush()

    # Creator auto-joins
    member = TontineMember(tontine_id=tontine.id, user_id=current_user.id)
    db.add(member)
    db.commit()
    db.refresh(tontine)
    return tontine


@router.get("/available", response_model=list[TontineResponse])
def list_available(db: Session = Depends(get_db)):
    """List Tontine groups that are still forming and accepting members."""
    return db.query(Tontine).filter(Tontine.status == "forming").all()


@router.get("/my", response_model=list[TontineResponse])
def my_tontines(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all Tontine groups the user belongs to."""
    member_tontine_ids = (
        db.query(TontineMember.tontine_id)
        .filter(TontineMember.user_id == current_user.id)
        .all()
    )
    ids = [r[0] for r in member_tontine_ids]
    if not ids:
        return []
    return db.query(Tontine).filter(Tontine.id.in_(ids)).all()


@router.get("/{tontine_id}", response_model=TontineResponse)
def get_tontine(tontine_id: str, db: Session = Depends(get_db)):
    """Get the current status of a Tontine group."""
    tontine = db.query(Tontine).filter(Tontine.id == tontine_id).first()
    if not tontine:
        raise HTTPException(status_code=404, detail="Tontine not found")
    return tontine


@router.post("/{tontine_id}/join", response_model=TontineResponse)
def join_tontine(
    tontine_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Join an existing Tontine group."""
    tontine = db.query(Tontine).filter(Tontine.id == tontine_id).first()
    if not tontine:
        raise HTTPException(status_code=404, detail="Tontine not found")
    if tontine.status != "forming":
        raise HTTPException(status_code=400, detail="Tontine is not accepting new members")

    already_member = (
        db.query(TontineMember)
        .filter(TontineMember.tontine_id == tontine_id, TontineMember.user_id == current_user.id)
        .first()
    )
    if already_member:
        raise HTTPException(status_code=400, detail="Already a member")

    current_members = len(tontine.members)
    if current_members >= tontine.members_count:
        raise HTTPException(status_code=400, detail="Tontine is full")

    member = TontineMember(tontine_id=tontine.id, user_id=current_user.id)
    db.add(member)

    # If group is now full, activate and assign random payout order
    if current_members + 1 >= tontine.members_count:
        tontine.status = "active"
        tontine.current_cycle = 1
        db.flush()
        members = tontine.members
        order = list(range(1, len(members) + 1))
        random.shuffle(order)
        for m, o in zip(members, order):
            m.payout_order = o

    db.commit()
    db.refresh(tontine)
    return tontine


@router.post("/{tontine_id}/pay", response_model=TontineResponse)
def pay_contribution(
    tontine_id: str,
    payload: TontinePay,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Pay monthly contribution to the Tontine pot.

    Each cycle, all members contribute and one member receives the full pot.
    The recipient rotates — decided by the payout order assigned at group formation.
    """
    tontine = db.query(Tontine).filter(Tontine.id == tontine_id).first()
    if not tontine:
        raise HTTPException(status_code=404, detail="Tontine not found")
    if tontine.status != "active":
        raise HTTPException(status_code=400, detail="Tontine is not active")

    member = (
        db.query(TontineMember)
        .filter(TontineMember.tontine_id == tontine_id, TontineMember.user_id == current_user.id)
        .first()
    )
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this Tontine")

    if payload.amount != float(tontine.monthly_amount):
        raise HTTPException(
            status_code=400,
            detail=f"Contribution must be exactly {tontine.monthly_amount}",
        )

    # Find current cycle recipient
    recipient_member = (
        db.query(TontineMember)
        .filter(TontineMember.tontine_id == tontine_id, TontineMember.payout_order == tontine.current_cycle)
        .first()
    )

    tx = Transaction(
        from_user=current_user.id,
        to_user=recipient_member.user_id if recipient_member else tontine.creator_id,
        amount=payload.amount,
        type="tontine_contribute",
        product_type="tontine",
        product_id=tontine.id,
    )
    tx.hashgraph_tx_id = record_transaction_on_hashgraph(
        tx.id, tx.from_user, tx.to_user, float(tx.amount),
        tx.type, tx.product_type, tx.product_id,
    )
    db.add(tx)
    db.commit()
    db.refresh(tontine)
    return tontine


@router.get("/{tontine_id}/status", response_model=TontineResponse)
def tontine_status(tontine_id: str, db: Session = Depends(get_db)):
    """Get detailed cycle status of a Tontine group."""
    tontine = db.query(Tontine).filter(Tontine.id == tontine_id).first()
    if not tontine:
        raise HTTPException(status_code=404, detail="Tontine not found")
    return tontine
