import uuid
from datetime import datetime

from sqlalchemy import String, Numeric, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class FaraidCalculation(Base):
    """
    Faraid (فرائض) — Islamic Inheritance Calculator

    Calculates the distribution of a deceased's estate according to
    Quranic rules (Surah An-Nisa 4:11-12, 4:176).

    Fixed shares (fard):
    - Husband: 1/4 (with children) or 1/2 (without)
    - Wife: 1/8 (with children) or 1/4 (without)
    - Father: 1/6 (with children)
    - Mother: 1/6 (with children) or 1/3 (without)
    - Daughter: 1/2 (alone) or 2/3 (multiple, no son)
    - Son: residuary (asaba) after fixed shares
    """

    __tablename__ = "faraid_calculations"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False, index=True)
    estate_value: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    debts: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    funeral_costs: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    wasiyya: Mapped[float] = mapped_column(Numeric(15, 2), default=0)  # bequest (max 1/3)
    net_estate: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    heirs: Mapped[dict] = mapped_column(JSONB, nullable=False)
    # e.g. {"wife": 1, "sons": 2, "daughters": 1, "father": true, "mother": true}
    distribution: Mapped[dict] = mapped_column(JSONB, nullable=False)
    # e.g. {"wife": {"share": "1/8", "amount": 12500}, "son": {"share": "residuary", "amount": ...}}
    calculated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
