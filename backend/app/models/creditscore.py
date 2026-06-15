import uuid
from datetime import datetime

from sqlalchemy import String, Integer, Numeric, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class HalalCreditScore(Base):
    """
    Halal Credit Score — Community Trust Rating (0-1000)

    Unlike conventional credit scores based on debt history,
    this score measures trustworthiness through:
    - Qard repayment punctuality (0-250)
    - Tontine/Takaful contribution regularity (0-200)
    - Murabaha/Ijara payment timeliness (0-250)
    - Community participation: Sadaqa, Waqf, Shura (0-150)
    - Platform tenure and verification (0-150)
    """

    __tablename__ = "halal_credit_scores"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), unique=True, nullable=False, index=True)
    total_score: Mapped[int] = mapped_column(Integer, default=100)
    repayment_score: Mapped[int] = mapped_column(Integer, default=0)  # max 250
    contribution_score: Mapped[int] = mapped_column(Integer, default=0)  # max 200
    payment_score: Mapped[int] = mapped_column(Integer, default=0)  # max 250
    community_score: Mapped[int] = mapped_column(Integer, default=0)  # max 150
    tenure_score: Mapped[int] = mapped_column(Integer, default=100)  # max 150
    breakdown: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class SmartMatch(Base):
    """Smart matching suggestions between users and products."""

    __tablename__ = "smart_matches"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False, index=True)
    match_type: Mapped[str] = mapped_column(String(30), nullable=False)
    # qard_lend | qard_borrow | musharaka_invest | tontine_join | takaful_join
    target_id: Mapped[str] = mapped_column(String, nullable=False)
    score: Mapped[float] = mapped_column(Numeric(5, 2), default=0)
    reason: Mapped[str] = mapped_column(String(200), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
