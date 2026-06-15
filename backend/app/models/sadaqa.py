import uuid
from datetime import datetime, date

from sqlalchemy import String, Numeric, Integer, Boolean, DateTime, Date, ForeignKey, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class SadaqaCampaign(Base):
    """
    Sadaqa (صدقة) — Transparent Voluntary Charity

    Unlike Zakat (obligatory), Sadaqa is voluntary charity.
    Campaigns are created with full transparency — every donation
    tracked, every expenditure documented with evidence.
    """

    __tablename__ = "sadaqa_campaigns"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    creator_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    # education | health | food | shelter | orphans | disaster | general
    target_amount: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    current_amount: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    donors_count: Mapped[int] = mapped_column(Integer, default=0)
    deadline: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False, index=True)
    # active | funded | completed | closed
    evidence_urls: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    verified: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    donations = relationship("SadaqaDonation", back_populates="campaign", lazy="selectin")
    updates = relationship("CampaignUpdate", back_populates="campaign", lazy="selectin")


class SadaqaDonation(Base):
    """Individual donation to a Sadaqa campaign."""

    __tablename__ = "sadaqa_donations"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    campaign_id: Mapped[str] = mapped_column(String, ForeignKey("sadaqa_campaigns.id"), nullable=False, index=True)
    donor_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    anonymous: Mapped[bool] = mapped_column(Boolean, default=False)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    donated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    campaign = relationship("SadaqaCampaign", back_populates="donations")


class CampaignUpdate(Base):
    """Progress update posted by campaign creator for transparency."""

    __tablename__ = "campaign_updates"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    campaign_id: Mapped[str] = mapped_column(String, ForeignKey("sadaqa_campaigns.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    amount_spent: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    photos: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    campaign = relationship("SadaqaCampaign", back_populates="updates")
