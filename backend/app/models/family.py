import uuid
from datetime import datetime

from sqlalchemy import String, Numeric, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class SavingsGoal(Base):
    """
    Family Savings Goals — Hajj, Wedding, Education, Emergency

    Automated savings toward life goals. Users set a target,
    monthly auto-deduction from wallet, progress tracking.
    """

    __tablename__ = "savings_goals"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    goal_type: Mapped[str] = mapped_column(String(30), nullable=False)
    # hajj | wedding | education | emergency | home | custom
    target_amount: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    current_amount: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    monthly_contribution: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    auto_deduct: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False)
    # active | completed | paused
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class FamilyGroup(Base):
    """Joint family account for shared financial management."""

    __tablename__ = "family_groups"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    creator_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    member_ids: Mapped[str] = mapped_column(Text, default="")  # comma-separated user IDs
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
