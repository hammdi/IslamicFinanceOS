import uuid
from datetime import datetime, date

from sqlalchemy import String, Numeric, Integer, DateTime, Date, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Murabaha(Base):
    """
    Murabaha (مرابحة) — Cost-Plus Financing

    The platform purchases an asset and sells it to the client at a known,
    transparent markup. The client pays in installments.
    No interest — just a fixed, agreed-upon profit margin disclosed upfront.
    This is the most widely used Islamic finance product globally.
    """

    __tablename__ = "murabaha_requests"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    client_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False, index=True)
    asset_description: Mapped[str] = mapped_column(Text, nullable=False)
    asset_price: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    platform_margin_percent: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    total_price: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    installments_count: Mapped[int] = mapped_column(Integer, nullable=False)
    installment_amount: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False, index=True)
    # pending | approved | active | completed | rejected
    approved_by: Mapped[str | None] = mapped_column(String, ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    payments = relationship("MurabahaPayment", back_populates="murabaha", lazy="selectin")


class MurabahaPayment(Base):
    """Individual installment payment for a Murabaha contract."""

    __tablename__ = "murabaha_payments"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    murabaha_id: Mapped[str] = mapped_column(String, ForeignKey("murabaha_requests.id"), nullable=False, index=True)
    installment_number: Mapped[int] = mapped_column(Integer, nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    paid_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    # pending | paid | overdue

    murabaha = relationship("Murabaha", back_populates="payments")
