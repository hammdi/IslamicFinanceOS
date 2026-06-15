from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth.jwt import get_current_user
from app.database import get_db
from app.models.timebank import TimeBankOffer, TimeBankExchange, TimeBankBalance
from app.models.user import User
from app.services.notifications import notify

router = APIRouter(prefix="/timebank", tags=["Time Banking (Skill Exchange)"])

CATEGORIES = ["teaching", "tech", "health", "crafts", "transport", "cooking", "legal", "other"]


class OfferCreate(BaseModel):
    skill: str
    category: str
    description: str
    hours_available: float


class ExchangeRequest(BaseModel):
    hours: float


def get_balance(db: Session, user_id: str) -> TimeBankBalance:
    bal = db.query(TimeBankBalance).filter(TimeBankBalance.user_id == user_id).first()
    if not bal:
        bal = TimeBankBalance(user_id=user_id)
        db.add(bal)
        db.flush()
    return bal


@router.get("/balance")
def my_balance(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get your time credit balance."""
    bal = get_balance(db, current_user.id)
    db.commit()
    return {"balance": float(bal.balance), "earned": float(bal.hours_earned), "spent": float(bal.hours_spent)}


@router.post("/offers")
def create_offer(payload: OfferCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Offer a skill/service to the community."""
    if payload.category not in CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Category must be: {CATEGORIES}")
    offer = TimeBankOffer(
        user_id=current_user.id, skill=payload.skill, category=payload.category,
        description=payload.description, hours_available=payload.hours_available,
    )
    db.add(offer)
    db.commit()
    db.refresh(offer)
    return _offer_resp(offer)


@router.get("/offers")
def browse_offers(category: str | None = None, db: Session = Depends(get_db)):
    """Browse available skill offers."""
    q = db.query(TimeBankOffer).filter(TimeBankOffer.status == "available")
    if category:
        q = q.filter(TimeBankOffer.category == category)
    return [_offer_resp(o) for o in q.order_by(TimeBankOffer.created_at.desc()).limit(50).all()]


@router.post("/offers/{offer_id}/request")
def request_exchange(
    offer_id: str, payload: ExchangeRequest,
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    """Request a time exchange — spend time credits to get a service."""
    offer = db.query(TimeBankOffer).filter(TimeBankOffer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    if offer.user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot request your own offer")
    if payload.hours > float(offer.hours_available):
        raise HTTPException(status_code=400, detail="Not enough hours available")

    requester_bal = get_balance(db, current_user.id)
    if float(requester_bal.balance) < payload.hours:
        raise HTTPException(status_code=400, detail="Insufficient time credits")

    exchange = TimeBankExchange(
        offer_id=offer.id, provider_id=offer.user_id,
        receiver_id=current_user.id, hours=payload.hours,
    )
    db.add(exchange)
    notify(db, offer.user_id, "Time Exchange Request",
           f"{current_user.name} requested {payload.hours}h of '{offer.skill}'.", "timebank")
    db.commit()
    db.refresh(exchange)
    return {"id": exchange.id, "status": exchange.status, "hours": float(exchange.hours)}


@router.post("/exchanges/{exchange_id}/complete")
def complete_exchange(exchange_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Provider confirms the service was delivered."""
    exchange = db.query(TimeBankExchange).filter(TimeBankExchange.id == exchange_id).first()
    if not exchange:
        raise HTTPException(status_code=404, detail="Exchange not found")
    if exchange.provider_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only provider can complete")
    if exchange.status != "pending":
        raise HTTPException(status_code=400, detail="Already processed")

    exchange.status = "completed"
    hours = float(exchange.hours)

    provider_bal = get_balance(db, exchange.provider_id)
    provider_bal.hours_earned = float(provider_bal.hours_earned) + hours
    provider_bal.balance = float(provider_bal.balance) + hours

    receiver_bal = get_balance(db, exchange.receiver_id)
    receiver_bal.hours_spent = float(receiver_bal.hours_spent) + hours
    receiver_bal.balance = float(receiver_bal.balance) - hours

    # Update offer availability
    offer = db.query(TimeBankOffer).filter(TimeBankOffer.id == exchange.offer_id).first()
    if offer:
        offer.hours_available = float(offer.hours_available) - hours
        if offer.hours_available <= 0:
            offer.status = "completed"

    notify(db, exchange.receiver_id, "Service Completed",
           f"{current_user.name} confirmed {hours}h service delivery.", "timebank")
    db.commit()
    return {"status": "completed", "hours": hours}


@router.get("/my-offers")
def my_offers(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return [_offer_resp(o) for o in db.query(TimeBankOffer).filter(TimeBankOffer.user_id == current_user.id).all()]


def _offer_resp(o):
    return {
        "id": o.id, "skill": o.skill, "category": o.category,
        "description": o.description, "hours_available": float(o.hours_available),
        "status": o.status, "user_id": o.user_id,
    }
