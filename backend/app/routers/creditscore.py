from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth.jwt import get_current_user
from app.database import get_db
from app.models.creditscore import HalalCreditScore
from app.models.qard import QardHasan, QardContribution
from app.models.musharaka import MusharakaInvestment
from app.models.murabaha import Murabaha, MurabahaPayment
from app.models.ijara import IjaraPayment
from app.models.tontine import TontineMember
from app.models.takaful import TakafulMember
from app.models.waqf import WaqfDonation
from app.models.sadaqa import SadaqaDonation
from app.models.user import User

router = APIRouter(prefix="/credit-score", tags=["Halal Credit Score"])


def calculate_score(db: Session, user_id: str) -> dict:
    """Calculate halal credit score based on platform activity."""
    # Repayment score (max 250): Qard repayments completed
    qards_completed = db.query(func.count(QardHasan.id)).filter(
        QardHasan.borrower_id == user_id, QardHasan.status == "completed").scalar()
    qards_total = db.query(func.count(QardHasan.id)).filter(
        QardHasan.borrower_id == user_id).scalar()
    repayment = min(int((qards_completed / max(qards_total, 1)) * 200 + min(qards_completed * 25, 50)), 250)

    # Contribution regularity (max 200): Tontine + Takaful memberships
    tontine_count = db.query(func.count(TontineMember.id)).filter(TontineMember.user_id == user_id).scalar()
    takaful_count = db.query(func.count(TakafulMember.id)).filter(TakafulMember.user_id == user_id).scalar()
    contribution = min((tontine_count + takaful_count) * 40, 200)

    # Payment timeliness (max 250): Murabaha + Ijara payments on time
    murabaha_paid = db.query(func.count(MurabahaPayment.id)).join(Murabaha).filter(
        Murabaha.client_id == user_id, MurabahaPayment.status == "paid").scalar()
    ijara_paid = db.query(func.count(IjaraPayment.id)).filter(IjaraPayment.status == "paid").scalar()
    payment = min((murabaha_paid + ijara_paid) * 20, 250)

    # Community participation (max 150): Waqf, Sadaqa, Qard lending
    waqf_donations = db.query(func.count(WaqfDonation.id)).filter(WaqfDonation.donor_id == user_id).scalar()
    sadaqa_donations = db.query(func.count(SadaqaDonation.id)).filter(SadaqaDonation.donor_id == user_id).scalar()
    qard_funded = db.query(func.count(QardContribution.id)).filter(QardContribution.lender_id == user_id).scalar()
    community = min((waqf_donations + sadaqa_donations + qard_funded) * 15, 150)

    # Tenure (max 150): base 100, grows with time
    user = db.query(User).filter(User.id == user_id).first()
    from datetime import datetime
    days = (datetime.utcnow() - user.created_at).days if user else 0
    tenure = min(100 + int(days / 30) * 5, 150)

    total = repayment + contribution + payment + community + tenure

    return {
        "total_score": min(total, 1000),
        "repayment_score": repayment,
        "contribution_score": contribution,
        "payment_score": payment,
        "community_score": community,
        "tenure_score": tenure,
        "breakdown": {
            "qards_completed": qards_completed, "qards_total": qards_total,
            "tontine_memberships": tontine_count, "takaful_memberships": takaful_count,
            "murabaha_payments": murabaha_paid, "ijara_payments": ijara_paid,
            "waqf_donations": waqf_donations, "sadaqa_donations": sadaqa_donations,
            "qard_funded": qard_funded, "days_on_platform": days,
        },
    }


@router.get("/my")
def my_score(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get or recalculate your Halal Credit Score."""
    scores = calculate_score(db, current_user.id)

    existing = db.query(HalalCreditScore).filter(HalalCreditScore.user_id == current_user.id).first()
    if existing:
        for k, v in scores.items():
            if k != "breakdown":
                setattr(existing, k, v)
        existing.breakdown = scores["breakdown"]
    else:
        existing = HalalCreditScore(user_id=current_user.id, **{k: v for k, v in scores.items() if k != "breakdown"}, breakdown=scores["breakdown"])
        db.add(existing)
    db.commit()

    return {
        "score": scores["total_score"],
        "max": 1000,
        "grade": "A+" if scores["total_score"] >= 800 else "A" if scores["total_score"] >= 650 else "B" if scores["total_score"] >= 450 else "C" if scores["total_score"] >= 250 else "D",
        "components": {
            "repayment": {"score": scores["repayment_score"], "max": 250},
            "contributions": {"score": scores["contribution_score"], "max": 200},
            "payments": {"score": scores["payment_score"], "max": 250},
            "community": {"score": scores["community_score"], "max": 150},
            "tenure": {"score": scores["tenure_score"], "max": 150},
        },
        "breakdown": scores["breakdown"],
    }


@router.get("/user/{user_id}")
def user_score(user_id: str, db: Session = Depends(get_db)):
    """Get a user's public credit score (score + grade only)."""
    scores = calculate_score(db, user_id)
    total = scores["total_score"]
    grade = "A+" if total >= 800 else "A" if total >= 650 else "B" if total >= 450 else "C" if total >= 250 else "D"
    return {"user_id": user_id, "score": total, "grade": grade}
