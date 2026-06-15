import uuid
from datetime import datetime

from sqlalchemy import String, Numeric, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Musharaka(Base):
    """
    Musharaka (مشاركة) — Profit-Sharing Partnership

    A joint venture where all partners contribute capital and share
    profits proportionally. Losses are also shared proportionally.
    No guaranteed return — this is what makes it halal.
    Unlike conventional loans, the investor shares the risk.
    """

    __tablename__ = "musharaka"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    entrepreneur_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id"), nullable=False, index=True
    )
    project_name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    target_amount: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    current_amount: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    expected_profit_percent: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    duration_months: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), default="open", nullable=False, index=True
    )  # open | funded | active | completed | cancelled
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    investments = relationship("MusharakaInvestment", back_populates="musharaka", lazy="selectin")


class MusharakaInvestment(Base):
    """Individual investment in a Musharaka partnership."""

    __tablename__ = "musharaka_investments"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    musharaka_id: Mapped[str] = mapped_column(
        String, ForeignKey("musharaka.id"), nullable=False, index=True
    )
    investor_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id"), nullable=False
    )
    amount: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    invested_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    musharaka = relationship("Musharaka", back_populates="investments")
