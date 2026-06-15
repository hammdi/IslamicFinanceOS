import uuid
from datetime import datetime

from sqlalchemy import String, Numeric, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class HawalaTransfer(Base):
    """
    Hawala (حوالة) — Digital Money Transfer

    Ancient Islamic money transfer system digitized. Money moves
    between agents without physical transfer — just trust and records.
    Lower fees than conventional remittance services.
    """

    __tablename__ = "hawala_transfers"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    sender_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False, index=True)
    recipient_name: Mapped[str] = mapped_column(String(200), nullable=False)
    recipient_phone: Mapped[str] = mapped_column(String(20), nullable=False)
    recipient_country: Mapped[str] = mapped_column(String(100), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    fee: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    source_currency: Mapped[str] = mapped_column(String(10), default="USD")
    target_currency: Mapped[str] = mapped_column(String(10), default="USD")
    hawala_code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False, index=True)
    # pending | sent | collected | expired
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    collected_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
