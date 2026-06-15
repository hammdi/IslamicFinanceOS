from fastapi import APIRouter, Depends
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.auth.jwt import get_current_user
from app.database import get_db
from app.models.qard import QardHasan, QardContribution
from app.models.musharaka import Musharaka, MusharakaInvestment
from app.models.tontine import TontineMember
from app.models.transaction import Transaction
from app.models.wallet import Wallet
from app.models.zakat import ZakatDistribution
from app.models.waqf import WaqfDonation
from app.models.user import User
from app.routers.wallet import get_or_create_wallet

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
def get_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get dashboard statistics for the current user."""
    wallet = get_or_create_wallet(db, current_user.id)

    qards_requested = db.query(func.count(QardHasan.id)).filter(
        QardHasan.borrower_id == current_user.id
    ).scalar()
    total_lent = db.query(func.coalesce(func.sum(QardContribution.amount), 0)).filter(
        QardContribution.lender_id == current_user.id
    ).scalar()

    projects_created = db.query(func.count(Musharaka.id)).filter(
        Musharaka.entrepreneur_id == current_user.id
    ).scalar()
    investments_made = db.query(func.count(MusharakaInvestment.id)).filter(
        MusharakaInvestment.investor_id == current_user.id
    ).scalar()
    total_invested = db.query(func.coalesce(func.sum(MusharakaInvestment.amount), 0)).filter(
        MusharakaInvestment.investor_id == current_user.id
    ).scalar()

    tontine_memberships = db.query(func.count(TontineMember.id)).filter(
        TontineMember.user_id == current_user.id
    ).scalar()

    zakat_given = db.query(func.coalesce(func.sum(ZakatDistribution.amount), 0)).filter(
        ZakatDistribution.donor_id == current_user.id
    ).scalar()

    waqf_donated = db.query(func.coalesce(func.sum(WaqfDonation.amount), 0)).filter(
        WaqfDonation.donor_id == current_user.id
    ).scalar()

    tx_count = db.query(func.count(Transaction.id)).filter(
        or_(Transaction.from_user == current_user.id, Transaction.to_user == current_user.id)
    ).scalar()

    db.commit()

    return {
        "wallet_balance": float(wallet.balance),
        "qard": {
            "loans_requested": qards_requested,
            "total_lent": float(total_lent),
        },
        "musharaka": {
            "projects_created": projects_created,
            "investments_made": investments_made,
            "total_invested": float(total_invested),
        },
        "tontine": {"memberships": tontine_memberships},
        "zakat": {"total_given": float(zakat_given)},
        "waqf": {"total_donated": float(waqf_donated)},
        "transactions": tx_count,
    }
