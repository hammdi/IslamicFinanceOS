import uuid
from datetime import datetime

from sqlalchemy import String, Numeric, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class SulhDispute(Base):
    """
    Sulh (صلح) — Islamic Dispute Resolution / Mediation

    When a financial obligation is not met (loan not repaid,
    contract breached), either party can open a Sulh process.
    3 community mediators review evidence and propose a resolution.
    The resolution is recorded immutably on Hashgraph.
    """

    __tablename__ = "sulh_disputes"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    complainant_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False, index=True)
    respondent_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    product_type: Mapped[str] = mapped_column(String(30), nullable=False)
    product_id: Mapped[str] = mapped_column(String, nullable=False)
    amount_in_dispute: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    evidence: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    mediator_ids: Mapped[dict | None] = mapped_column(JSONB, nullable=True)  # list of 3 user IDs
    resolution: Mapped[str | None] = mapped_column(Text, nullable=True)
    resolution_amount: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="open", nullable=False, index=True)
    # open | mediation | resolved | escalated
    hashgraph_resolution_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
