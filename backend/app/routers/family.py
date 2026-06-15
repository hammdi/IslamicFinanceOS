from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth.jwt import get_current_user
from app.database import get_db
from app.models.family import SavingsGoal
from app.models.user import User
from app.services.notifications import notify
from app.routers.wallet import get_or_create_wallet

router = APIRouter(prefix="/family", tags=["Family Finance"])

GOAL_TYPES = ["hajj", "wedding", "education", "emergency", "home", "custom"]


class GoalCreate(BaseModel):
    name: str
    goal_type: str
    target_amount: float
    monthly_contribution: float = 0
    auto_deduct: bool = False


class GoalContribute(BaseModel):
    amount: float


@router.post("/goals")
def create_goal(payload: GoalCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create a savings goal (Hajj, Wedding, Education, etc)."""
    if payload.goal_type not in GOAL_TYPES:
        raise HTTPException(status_code=400, detail=f"Type must be: {GOAL_TYPES}")
    goal = SavingsGoal(
        user_id=current_user.id, name=payload.name, goal_type=payload.goal_type,
        target_amount=payload.target_amount, monthly_contribution=payload.monthly_contribution,
        auto_deduct=payload.auto_deduct,
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return _goal_resp(goal)


@router.get("/goals")
def my_goals(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List all savings goals."""
    goals = db.query(SavingsGoal).filter(SavingsGoal.user_id == current_user.id).all()
    return [_goal_resp(g) for g in goals]


@router.post("/goals/{goal_id}/contribute")
def contribute_to_goal(goal_id: str, payload: GoalContribute, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Add money from wallet to a savings goal."""
    goal = db.query(SavingsGoal).filter(SavingsGoal.id == goal_id, SavingsGoal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    if goal.status != "active":
        raise HTTPException(status_code=400, detail="Goal not active")

    wallet = get_or_create_wallet(db, current_user.id)
    if float(wallet.balance) < payload.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    wallet.balance = float(wallet.balance) - payload.amount
    goal.current_amount = float(goal.current_amount) + payload.amount
    if goal.current_amount >= float(goal.target_amount):
        goal.status = "completed"
        notify(db, current_user.id, "Goal Achieved!",
               f"Your '{goal.name}' savings goal is complete! {goal.current_amount} USD saved.", "family")

    db.commit()
    db.refresh(goal)
    return _goal_resp(goal)


@router.post("/goals/{goal_id}/withdraw")
def withdraw_from_goal(goal_id: str, payload: GoalContribute, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Withdraw from a completed savings goal back to wallet."""
    goal = db.query(SavingsGoal).filter(SavingsGoal.id == goal_id, SavingsGoal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    if payload.amount > float(goal.current_amount):
        raise HTTPException(status_code=400, detail="Insufficient goal balance")

    wallet = get_or_create_wallet(db, current_user.id)
    wallet.balance = float(wallet.balance) + payload.amount
    goal.current_amount = float(goal.current_amount) - payload.amount
    db.commit()
    db.refresh(goal)
    return _goal_resp(goal)


def _goal_resp(g):
    progress = (float(g.current_amount) / float(g.target_amount) * 100) if float(g.target_amount) > 0 else 0
    return {
        "id": g.id, "name": g.name, "goal_type": g.goal_type,
        "target_amount": float(g.target_amount), "current_amount": float(g.current_amount),
        "monthly_contribution": float(g.monthly_contribution),
        "auto_deduct": g.auto_deduct, "status": g.status,
        "progress": round(min(progress, 100), 1),
    }
