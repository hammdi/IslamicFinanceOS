import uuid
from datetime import datetime

from sqlalchemy import String, Numeric, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Waqf(Base):
    """
    Waqf (وقف) — Islamic Endowment

    A voluntary, permanent, irrevocable dedication of wealth
    for religious or charitable purposes. The principal is preserved
    and only the returns/benefits are used.

    Historically, Waqf funded mosques, schools, hospitals, water wells,
    and other community infrastructure across the Islamic world.
    """

    __tablename__ = "waqf"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    creator_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # mosque, school, hospital, water, orphanage, general
    target_amount: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    current_amount: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    donors_count: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(
        String(20), default="active", nullable=False, index=True
    )  # active | funded | completed
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    donations = relationship("WaqfDonation", back_populates="waqf", lazy="selectin")


class WaqfDonation(Base):
    """Individual donation to a Waqf endowment."""

    __tablename__ = "waqf_donations"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    waqf_id: Mapped[str] = mapped_column(
        String, ForeignKey("waqf.id"), nullable=False, index=True
    )
    donor_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id"), nullable=False
    )
    amount: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    donated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    waqf = relationship("Waqf", back_populates="donations")
