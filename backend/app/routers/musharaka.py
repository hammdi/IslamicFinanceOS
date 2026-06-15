from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.jwt import get_current_user
from app.database import get_db
from app.models.musharaka import Musharaka, MusharakaInvestment
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.musharaka import (
    MusharakaCreate, MusharakaInvest, ProfitDistribution, MusharakaResponse,
)
from app.services.hashgraph import record_transaction_on_hashgraph

router = APIRouter(prefix="/musharaka", tags=["Musharaka (Profit-Sharing Partnership)"])


@router.post("/create", response_model=MusharakaResponse)
def create_musharaka(
    payload: MusharakaCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Entrepreneur creates a Musharaka project seeking investors."""
    project = Musharaka(
        entrepreneur_id=current_user.id,
        project_name=payload.project_name,
        description=payload.description,
        target_amount=payload.target_amount,
        expected_profit_percent=payload.expected_profit_percent,
        duration_months=payload.duration_months,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.get("/available", response_model=list[MusharakaResponse])
def list_available(db: Session = Depends(get_db)):
    """List all open Musharaka projects accepting investment."""
    return db.query(Musharaka).filter(Musharaka.status == "open").all()


@router.get("/my", response_model=list[MusharakaResponse])
def my_musharakas(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List Musharaka projects where user is entrepreneur or investor."""
    as_entrepreneur = db.query(Musharaka).filter(Musharaka.entrepreneur_id == current_user.id).all()
    invested_ids = (
        db.query(MusharakaInvestment.musharaka_id)
        .filter(MusharakaInvestment.investor_id == current_user.id)
        .distinct()
        .all()
    )
    invested_id_set = {r[0] for r in invested_ids}
    as_investor = (
        db.query(Musharaka).filter(Musharaka.id.in_(invested_id_set)).all()
        if invested_id_set
        else []
    )
    seen = set()
    result = []
    for m in as_entrepreneur + as_investor:
        if m.id not in seen:
            seen.add(m.id)
            result.append(m)
    return result


@router.get("/{musharaka_id}", response_model=MusharakaResponse)
def get_musharaka(musharaka_id: str, db: Session = Depends(get_db)):
    """Get details of a specific Musharaka project."""
    project = db.query(Musharaka).filter(Musharaka.id == musharaka_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Musharaka project not found")
    return project


@router.post("/{musharaka_id}/invest", response_model=MusharakaResponse)
def invest_in_musharaka(
    musharaka_id: str,
    payload: MusharakaInvest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Investor joins a Musharaka partnership.

    Profit AND loss are shared proportionally — no guaranteed return.
    This risk-sharing is what makes Musharaka halal.
    """
    project = db.query(Musharaka).filter(Musharaka.id == musharaka_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Musharaka project not found")
    if project.status != "open":
        raise HTTPException(status_code=400, detail="Project is not accepting investments")

    investment = MusharakaInvestment(
        musharaka_id=project.id,
        investor_id=current_user.id,
        amount=payload.amount,
    )
    db.add(investment)

    project.current_amount = float(project.current_amount or 0) + payload.amount
    if project.current_amount >= float(project.target_amount):
        project.status = "funded"

    tx = Transaction(
        from_user=current_user.id,
        to_user=project.entrepreneur_id,
        amount=payload.amount,
        type="musharaka_invest",
        product_type="musharaka",
        product_id=project.id,
    )
    tx.hashgraph_tx_id = record_transaction_on_hashgraph(
        tx.id, tx.from_user, tx.to_user, float(tx.amount),
        tx.type, tx.product_type, tx.product_id,
    )
    db.add(tx)
    db.commit()
    db.refresh(project)
    return project


@router.post("/{musharaka_id}/profit", response_model=MusharakaResponse)
def distribute_profit(
    musharaka_id: str,
    payload: ProfitDistribution,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Record profit (or loss) distribution for a Musharaka project.

    Profit is shared proportionally to each investor's contribution.
    If total_profit is negative, it represents a loss — also shared proportionally.
    """
    project = db.query(Musharaka).filter(Musharaka.id == musharaka_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Musharaka project not found")
    if project.entrepreneur_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the entrepreneur can distribute profit")
    if project.status not in ("funded", "active"):
        raise HTTPException(status_code=400, detail="Project not in distributable state")

    project.status = "active" if payload.total_profit > 0 else "completed"
    total_invested = float(project.current_amount)
    is_loss = payload.total_profit < 0
    tx_type = "musharaka_loss" if is_loss else "musharaka_profit"

    for investment in project.investments:
        proportion = float(investment.amount) / total_invested
        share = round(abs(payload.total_profit) * proportion, 2)

        if is_loss:
            from_user, to_user = investment.investor_id, project.entrepreneur_id
        else:
            from_user, to_user = project.entrepreneur_id, investment.investor_id

        tx = Transaction(
            from_user=from_user,
            to_user=to_user,
            amount=share,
            type=tx_type,
            product_type="musharaka",
            product_id=project.id,
        )
        tx.hashgraph_tx_id = record_transaction_on_hashgraph(
            tx.id, tx.from_user, tx.to_user, float(tx.amount),
            tx.type, tx.product_type, tx.product_id,
        )
        db.add(tx)

    db.commit()
    db.refresh(project)
    return project
