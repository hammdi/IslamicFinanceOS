import uuid
from datetime import datetime

from sqlalchemy import String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class HalalCompany(Base):
    """
    Halal Investment Screener

    Screens companies/stocks based on Islamic criteria:
    - Business activity: no alcohol, pork, gambling, conventional banking,
      adult content, weapons, tobacco
    - Financial ratios: debt/assets < 33%, interest income < 5% of revenue,
      accounts receivable/assets < 49%
    """

    __tablename__ = "halal_companies"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    ticker: Mapped[str] = mapped_column(String(20), nullable=True, index=True)
    sector: Mapped[str] = mapped_column(String(100), nullable=True)
    country: Mapped[str] = mapped_column(String(100), nullable=True)
    halal_status: Mapped[str] = mapped_column(String(20), nullable=False)
    # halal | haram | doubtful
    screening_report: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    last_screened: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class ScreeningHistory(Base):
    """Record of screening performed by a user."""

    __tablename__ = "screening_history"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id: Mapped[str] = mapped_column(String, ForeignKey("halal_companies.id"), nullable=False, index=True)
    screened_by: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    result: Mapped[str] = mapped_column(String(20), nullable=False)
    rationale: Mapped[str | None] = mapped_column(Text, nullable=True)
    screened_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
