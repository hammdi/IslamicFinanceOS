import uuid
from datetime import datetime

from sqlalchemy import String, Numeric, Integer, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class TakafulPool(Base):
    """
    Takaful (تكافل) — Islamic Mutual Micro-Insurance

    Members contribute to a shared pool. When a member faces hardship,
    they file a claim that is verified by community vote.
    Surplus at year-end is redistributed or donated as sadaqa.
    No insurance company profits — just mutual aid.
    """

    __tablename__ = "takaful_pools"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    creator_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    # health | education | agriculture | disaster | funeral | general
    monthly_contribution: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    max_members: Mapped[int] = mapped_column(Integer, default=50)
    pool_balance: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    total_claims_paid: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    members = relationship("TakafulMember", back_populates="pool", lazy="selectin")
    claims = relationship("TakafulClaim", back_populates="pool", lazy="selectin")


class TakafulMember(Base):
    __tablename__ = "takaful_members"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    pool_id: Mapped[str] = mapped_column(String, ForeignKey("takaful_pools.id"), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    total_contributed: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    joined_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    pool = relationship("TakafulPool", back_populates="members")


class TakafulClaim(Base):
    """Claim against the Takaful pool, verified by community vote."""

    __tablename__ = "takaful_claims"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    pool_id: Mapped[str] = mapped_column(String, ForeignKey("takaful_pools.id"), nullable=False, index=True)
    claimant_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    # pending | approved | rejected | paid
    votes_for: Mapped[int] = mapped_column(Integer, default=0)
    votes_against: Mapped[int] = mapped_column(Integer, default=0)
    voters: Mapped[dict | None] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    pool = relationship("TakafulPool", back_populates="claims")
