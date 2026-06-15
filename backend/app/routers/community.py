from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth.jwt import get_current_user
from app.database import get_db
from app.models.community import CommunityStory
from app.models.transaction import Transaction
from app.models.user import User
from app.models.wallet import Wallet
from app.models.qard import QardHasan
from app.models.waqf import WaqfDonation
from app.models.sadaqa import SadaqaDonation
from app.models.zakat import ZakatDistribution

router = APIRouter(prefix="/community", tags=["Community & Impact"])


class StoryCreate(BaseModel):
    title: str
    story: str
    product_type: str
    anonymous: bool = True


@router.get("/impact")
def global_impact(db: Session = Depends(get_db)):
    """Platform-wide impact metrics — how the community is changing lives."""
    total_users = db.query(func.count(User.id)).scalar()
    total_transactions = db.query(func.count(Transaction.id)).scalar()
    total_volume = float(db.query(func.coalesce(func.sum(Transaction.amount), 0)).scalar())

    qards_completed = db.query(func.count(QardHasan.id)).filter(QardHasan.status == "completed").scalar()
    qard_total = float(db.query(func.coalesce(func.sum(QardHasan.amount), 0)).filter(QardHasan.status == "completed").scalar())

    zakat_distributed = float(db.query(func.coalesce(func.sum(ZakatDistribution.amount), 0)).scalar())
    waqf_donated = float(db.query(func.coalesce(func.sum(WaqfDonation.amount), 0)).scalar())
    sadaqa_donated = float(db.query(func.coalesce(func.sum(SadaqaDonation.amount), 0)).scalar())

    return {
        "community": {"total_users": total_users, "total_transactions": total_transactions, "total_volume": total_volume},
        "lives_impacted": {
            "families_helped": qards_completed,
            "loans_repaid_amount": qard_total,
            "zakat_distributed": zakat_distributed,
            "waqf_donated": waqf_donated,
            "sadaqa_donated": sadaqa_donated,
            "total_charity": zakat_distributed + waqf_donated + sadaqa_donated,
        },
    }


@router.post("/stories")
def share_story(payload: StoryCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Share a success story (anonymized by default)."""
    story = CommunityStory(
        user_id=current_user.id, title=payload.title, story=payload.story,
        product_type=payload.product_type, anonymous=payload.anonymous,
    )
    db.add(story)
    db.commit()
    db.refresh(story)
    return {"id": story.id, "title": story.title, "status": "pending approval"}


@router.get("/stories")
def list_stories(db: Session = Depends(get_db)):
    """Browse approved community success stories."""
    stories = db.query(CommunityStory).filter(CommunityStory.approved == True).order_by(CommunityStory.created_at.desc()).limit(20).all()
    return [
        {
            "id": s.id, "title": s.title, "story": s.story,
            "product_type": s.product_type, "likes": s.likes,
            "anonymous": s.anonymous,
            "created_at": s.created_at.isoformat(),
        }
        for s in stories
    ]


@router.post("/stories/{story_id}/like")
def like_story(story_id: str, db: Session = Depends(get_db)):
    story = db.query(CommunityStory).filter(CommunityStory.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    story.likes += 1
    db.commit()
    return {"likes": story.likes}


@router.post("/stories/{story_id}/approve")
def approve_story(story_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    story = db.query(CommunityStory).filter(CommunityStory.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    story.approved = True
    db.commit()
    return {"status": "approved"}
