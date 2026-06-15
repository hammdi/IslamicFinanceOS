import uuid
from datetime import datetime

from sqlalchemy import String, Numeric, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class SukukOffering(Base):
    """
    Sukuk (صكوك) — Islamic Bonds / Asset-Backed Securities

    Unlike conventional bonds (which pay interest), Sukuk represent
    ownership shares in a tangible asset, project, or investment.
    Returns come from real economic activity, not interest.
    """

    __tablename__ = "sukuk_offerings"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    issuer_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    asset_type: Mapped[str] = mapped_column(String(50), nullable=False)
    # real_estate | infrastructure | trade | project | mixed
    total_value: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    unit_price: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    total_units: Mapped[int] = mapped_column(Integer, nullable=False)
    sold_units: Mapped[int] = mapped_column(Integer, default=0)
    expected_return_percent: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    maturity_months: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="open", nullable=False, index=True)
    # open | funded | active | matured | closed
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    holdings = relationship("SukukHolding", back_populates="offering", lazy="selectin")


class SukukHolding(Base):
    """Individual investor's holding in a Sukuk offering."""

    __tablename__ = "sukuk_holdings"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    offering_id: Mapped[str] = mapped_column(String, ForeignKey("sukuk_offerings.id"), nullable=False, index=True)
    investor_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False, index=True)
    units: Mapped[int] = mapped_column(Integer, nullable=False)
    total_invested: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    returns_received: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    purchased_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    offering = relationship("SukukOffering", back_populates="holdings")
