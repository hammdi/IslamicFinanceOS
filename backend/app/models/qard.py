import uuid
from datetime import datetime

from sqlalchemy import String, Numeric, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class QardHasan(Base):
    """
    Qard Hasan (قرض حسن) — Interest-Free Loan

    A benevolent loan where the borrower returns exactly what they borrowed.
    No interest (ribā), no fees — purely a social good.
    The lender earns spiritual reward (ajr), not financial profit.
    """

    __tablename__ = "qard_hasan"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    borrower_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id"), nullable=False, index=True
    )
    amount: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    purpose: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), default="pending", nullable=False, index=True
    )  # pending | funded | repaying | completed
    funded_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    repayment_schedule: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    contributions = relationship("QardContribution", back_populates="qard", lazy="selectin")


class QardContribution(Base):
    """Individual contribution from a lender toward a Qard Hasan loan."""

    __tablename__ = "qard_contributions"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    qard_id: Mapped[str] = mapped_column(
        String, ForeignKey("qard_hasan.id"), nullable=False, index=True
    )
    lender_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id"), nullable=False
    )
    amount: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    date: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    qard = relationship("QardHasan", back_populates="contributions")
