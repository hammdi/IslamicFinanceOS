import uuid
from datetime import datetime

from sqlalchemy import String, Numeric, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class TimeBankOffer(Base):
    """
    Time Banking (بنك الوقت) — Skill Exchange Without Money

    Members offer skills/services measured in hours.
    1 hour of any skill = 1 time credit.
    A doctor's hour equals a teacher's hour — radical equality.
    Perfectly halal: barter of services, no ribā possible.
    """

    __tablename__ = "timebank_offers"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False, index=True)
    skill: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    # teaching | tech | health | crafts | transport | cooking | legal | other
    description: Mapped[str] = mapped_column(Text, nullable=False)
    hours_available: Mapped[float] = mapped_column(Numeric(5, 1), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="available", nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class TimeBankExchange(Base):
    """Record of a time exchange between two members."""

    __tablename__ = "timebank_exchanges"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    offer_id: Mapped[str] = mapped_column(String, ForeignKey("timebank_offers.id"), nullable=False)
    provider_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    receiver_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    hours: Mapped[float] = mapped_column(Numeric(5, 1), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    # pending | confirmed | completed
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class TimeBankBalance(Base):
    """User's time credit balance."""

    __tablename__ = "timebank_balances"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), unique=True, nullable=False, index=True)
    hours_earned: Mapped[float] = mapped_column(Numeric(7, 1), default=0)
    hours_spent: Mapped[float] = mapped_column(Numeric(7, 1), default=0)
    balance: Mapped[float] = mapped_column(Numeric(7, 1), default=5)  # Start with 5 free hours
