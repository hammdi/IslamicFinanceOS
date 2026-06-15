import uuid
from datetime import datetime, date

from sqlalchemy import String, Numeric, Integer, DateTime, Date, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class IjaraContract(Base):
    """
    Ijara (إجارة) — Islamic Leasing

    The platform owns an asset and leases it to the client.
    The client pays monthly rent and may purchase the asset
    at the end of the lease term (Ijara wa Iqtina).
    Ownership risk stays with the platform until purchase.
    """

    __tablename__ = "ijara_contracts"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    lessee_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False, index=True)
    asset_description: Mapped[str] = mapped_column(Text, nullable=False)
    asset_value: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    monthly_rent: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    lease_duration_months: Mapped[int] = mapped_column(Integer, nullable=False)
    purchase_option_price: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False, index=True)
    # pending | approved | active | completed | purchased | rejected
    approved_by: Mapped[str | None] = mapped_column(String, ForeignKey("users.id"), nullable=True)
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    payments = relationship("IjaraPayment", back_populates="contract", lazy="selectin")


class IjaraPayment(Base):
    """Monthly rent payment for an Ijara lease."""

    __tablename__ = "ijara_payments"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    contract_id: Mapped[str] = mapped_column(String, ForeignKey("ijara_contracts.id"), nullable=False, index=True)
    month: Mapped[int] = mapped_column(Integer, nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    paid_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)

    contract = relationship("IjaraContract", back_populates="payments")
