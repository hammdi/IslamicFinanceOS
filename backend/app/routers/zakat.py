from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.jwt import get_current_user
from app.database import get_db
from app.models.zakat import ZakatCalculation, ZakatDistribution
from app.models.wallet import Wallet
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.zakat import (
    ZakatCalculateRequest, ZakatCalculationResponse,
    ZakatDistributeRequest, ZakatDistributionResponse,
)
from app.services.hashgraph import record_transaction_on_hashgraph
from app.services.notifications import notify
from app.routers.wallet import get_or_create_wallet

router = APIRouter(prefix="/zakat", tags=["Zakat (Obligatory Charity)"])

# Nisab based on approximate value of 85g of gold (~$5,500 USD as reference)
NISAB_USD = 5500.00
ZAKAT_RATE = 0.025  # 2.5%

VALID_CATEGORIES = [
    "poor", "needy", "zakat_workers", "new_muslims",
    "freeing_captives", "debtors", "fi_sabilillah", "travelers",
]


@router.post("/calculate", response_model=ZakatCalculationResponse)
def calculate_zakat(
    payload: ZakatCalculateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Calculate Zakat based on user's declared wealth.

    Zakat = 2.5% of eligible wealth above the nisab threshold.
    Nisab = value of 85 grams of gold (~$5,500 USD).
    """
    # Include wallet balance automatically
    wallet = get_or_create_wallet(db, current_user.id)

    total_assets = (
        float(wallet.balance)
        + payload.cash_and_savings
        + payload.investments
        + payload.gold_silver_value
        + payload.business_assets
        + payload.debts_owed_to_you
    )
    total_deductions = payload.debts_you_owe + payload.expenses
    total_eligible = max(total_assets - total_deductions, 0)
    is_above_nisab = total_eligible >= NISAB_USD
    zakat_due = round(total_eligible * ZAKAT_RATE, 2) if is_above_nisab else 0

    calc = ZakatCalculation(
        user_id=current_user.id,
        cash_and_savings=payload.cash_and_savings,
        investments=payload.investments,
        gold_silver_value=payload.gold_silver_value,
        business_assets=payload.business_assets,
        debts_owed_to_you=payload.debts_owed_to_you,
        debts_you_owe=payload.debts_you_owe,
        expenses=payload.expenses,
        total_eligible=total_eligible,
        nisab_value=NISAB_USD,
        zakat_due=zakat_due,
        is_above_nisab=is_above_nisab,
    )
    db.add(calc)
    db.commit()
    db.refresh(calc)
    return calc


@router.get("/history", response_model=list[ZakatCalculationResponse])
def zakat_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get user's past Zakat calculations."""
    return (
        db.query(ZakatCalculation)
        .filter(ZakatCalculation.user_id == current_user.id)
        .order_by(ZakatCalculation.calculated_at.desc())
        .limit(20)
        .all()
    )


@router.post("/distribute", response_model=ZakatDistributionResponse)
def distribute_zakat(
    payload: ZakatDistributeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Distribute Zakat to a beneficiary category from wallet."""
    if payload.category not in VALID_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Invalid category. Must be one of: {VALID_CATEGORIES}")
    if payload.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    calc = db.query(ZakatCalculation).filter(
        ZakatCalculation.id == payload.calculation_id,
        ZakatCalculation.user_id == current_user.id,
    ).first()
    if not calc:
        raise HTTPException(status_code=404, detail="Zakat calculation not found")

    wallet = get_or_create_wallet(db, current_user.id)
    if float(wallet.balance) < payload.amount:
        raise HTTPException(status_code=400, detail="Insufficient wallet balance")

    wallet.balance = float(wallet.balance) - payload.amount

    dist = ZakatDistribution(
        calculation_id=calc.id,
        donor_id=current_user.id,
        recipient_id=payload.recipient_id,
        amount=payload.amount,
        category=payload.category,
        description=payload.description,
    )
    db.add(dist)

    # If distributing to a specific user, credit their wallet
    if payload.recipient_id:
        recipient_wallet = get_or_create_wallet(db, payload.recipient_id)
        recipient_wallet.balance = float(recipient_wallet.balance) + payload.amount
        notify(db, payload.recipient_id, "Zakat Received",
               f"You received {payload.amount} USD in Zakat.", "zakat")

    tx = Transaction(
        from_user=current_user.id,
        to_user=payload.recipient_id or "zakat_pool",
        amount=payload.amount,
        type="zakat_distribute",
        product_type="zakat",
        product_id=calc.id,
    )
    tx.hashgraph_tx_id = record_transaction_on_hashgraph(
        tx.id, tx.from_user, tx.to_user, payload.amount,
        tx.type, tx.product_type, tx.product_id,
    )
    db.add(tx)

    notify(db, current_user.id, "Zakat Distributed",
           f"{payload.amount} USD distributed as Zakat ({payload.category}).", "zakat")
    db.commit()
    db.refresh(dist)
    return dist


@router.get("/distributions", response_model=list[ZakatDistributionResponse])
def list_distributions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List user's Zakat distributions."""
    return (
        db.query(ZakatDistribution)
        .filter(ZakatDistribution.donor_id == current_user.id)
        .order_by(ZakatDistribution.distributed_at.desc())
        .all()
    )
