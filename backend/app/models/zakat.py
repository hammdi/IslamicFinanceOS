import uuid
from datetime import datetime

from sqlalchemy import String, Numeric, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ZakatCalculation(Base):
    """
    Zakat (زكاة) — Obligatory Charity

    Zakat is one of the Five Pillars of Islam. Muslims who possess wealth
    above the nisab (minimum threshold) for one lunar year must give 2.5%
    of their eligible wealth to those in need.

    Nisab is based on the value of 85 grams of gold or 595 grams of silver.
    """

    __tablename__ = "zakat_calculations"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id"), nullable=False, index=True
    )
    # Wealth components
    cash_and_savings: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    investments: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    gold_silver_value: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    business_assets: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    debts_owed_to_you: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    # Deductions
    debts_you_owe: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    expenses: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    # Result
    total_eligible: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    nisab_value: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    zakat_due: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    is_above_nisab: Mapped[bool] = mapped_column(default=False)
    calculated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )


class ZakatDistribution(Base):
    """Record of zakat distributed to beneficiaries."""

    __tablename__ = "zakat_distributions"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    calculation_id: Mapped[str] = mapped_column(
        String, ForeignKey("zakat_calculations.id"), nullable=False
    )
    donor_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id"), nullable=False, index=True
    )
    recipient_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("users.id"), nullable=True
    )
    amount: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    category: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # poor, needy, zakat_workers, new_muslims, freeing_captives, debtors, fi_sabilillah, travelers
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    distributed_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
