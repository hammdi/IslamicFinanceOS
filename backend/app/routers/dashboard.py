from fastapi import APIRouter, Depends
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.auth.jwt import get_current_user
from app.database import get_db
from app.models.qard import QardHasan, QardContribution
from app.models.musharaka import Musharaka, MusharakaInvestment
from app.models.tontine import TontineMember
from app.models.murabaha import Murabaha
from app.models.ijara import IjaraContract
from app.models.takaful import TakafulMember
from app.models.hawala import HawalaTransfer
from app.models.sukuk import SukukHolding
from app.models.transaction import Transaction
from app.models.wallet import Wallet
from app.models.zakat import ZakatDistribution
from app.models.waqf import WaqfDonation
from app.models.sadaqa import SadaqaDonation
from app.models.family import SavingsGoal
from app.models.creditscore import HalalCreditScore
from app.models.user import User
from app.routers.wallet import get_or_create_wallet

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
def get_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Comprehensive dashboard statistics for the current user."""
    wallet = get_or_create_wallet(db, current_user.id)

    # Qard Hasan
    qards = db.query(func.count(QardHasan.id)).filter(QardHasan.borrower_id == current_user.id).scalar()
    lent = float(db.query(func.coalesce(func.sum(QardContribution.amount), 0)).filter(QardContribution.lender_id == current_user.id).scalar())

    # Musharaka
    investments = db.query(func.count(MusharakaInvestment.id)).filter(MusharakaInvestment.investor_id == current_user.id).scalar()
    invested = float(db.query(func.coalesce(func.sum(MusharakaInvestment.amount), 0)).filter(MusharakaInvestment.investor_id == current_user.id).scalar())

    # Tontine
    tontines = db.query(func.count(TontineMember.id)).filter(TontineMember.user_id == current_user.id).scalar()

    # Murabaha
    murabahas = db.query(func.count(Murabaha.id)).filter(Murabaha.client_id == current_user.id).scalar()

    # Ijara
    ijaras = db.query(func.count(IjaraContract.id)).filter(IjaraContract.lessee_id == current_user.id).scalar()

    # Takaful
    takaful = db.query(func.count(TakafulMember.id)).filter(TakafulMember.user_id == current_user.id).scalar()

    # Hawala
    hawalas = db.query(func.count(HawalaTransfer.id)).filter(HawalaTransfer.sender_id == current_user.id).scalar()

    # Sukuk
    sukuk = db.query(func.count(SukukHolding.id)).filter(SukukHolding.investor_id == current_user.id).scalar()

    # Charity
    zakat = float(db.query(func.coalesce(func.sum(ZakatDistribution.amount), 0)).filter(ZakatDistribution.donor_id == current_user.id).scalar())
    waqf = float(db.query(func.coalesce(func.sum(WaqfDonation.amount), 0)).filter(WaqfDonation.donor_id == current_user.id).scalar())
    sadaqa = float(db.query(func.coalesce(func.sum(SadaqaDonation.amount), 0)).filter(SadaqaDonation.donor_id == current_user.id).scalar())

    # Savings goals
    goals = db.query(func.count(SavingsGoal.id)).filter(SavingsGoal.user_id == current_user.id, SavingsGoal.status == "active").scalar()

    # Credit score
    score_row = db.query(HalalCreditScore).filter(HalalCreditScore.user_id == current_user.id).first()
    credit_score = score_row.total_score if score_row else 100

    # Transactions
    tx_count = db.query(func.count(Transaction.id)).filter(
        or_(Transaction.from_user == current_user.id, Transaction.to_user == current_user.id)
    ).scalar()

    db.commit()

    return {
        "wallet_balance": float(wallet.balance),
        "credit_score": credit_score,
        "qard": {"count": qards, "total_lent": lent},
        "musharaka": {"investments": investments, "total_invested": invested},
        "tontine": {"memberships": tontines},
        "murabaha": {"contracts": murabahas},
        "ijara": {"contracts": ijaras},
        "takaful": {"pools": takaful},
        "hawala": {"transfers": hawalas},
        "sukuk": {"holdings": sukuk},
        "zakat": {"total_given": zakat},
        "waqf": {"total_donated": waqf},
        "sadaqa": {"total_donated": sadaqa},
        "total_charity": zakat + waqf + sadaqa,
        "savings_goals": goals,
        "transactions": tx_count,
    }
