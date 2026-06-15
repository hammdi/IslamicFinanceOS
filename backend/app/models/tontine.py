import uuid
from datetime import datetime

from sqlalchemy import String, Numeric, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Tontine(Base):
    """
    Tontine Digitale (جمعية) — Rotating Savings Group

    A community savings circle where members contribute a fixed amount
    each cycle. Each cycle, one member receives the full pot.
    Common across Africa, the Middle East, and Asia.
    Known as "Jam'iyya" in Arabic, "Tontine" in French-speaking regions.
    No interest — just community trust and mutual aid.
    """

    __tablename__ = "tontines"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    creator_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id"), nullable=False
    )
    monthly_amount: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    members_count: Mapped[int] = mapped_column(Integer, nullable=False)
    current_cycle: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(
        String(20), default="forming", nullable=False, index=True
    )  # forming | active | completed
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    members = relationship("TontineMember", back_populates="tontine", lazy="selectin")


class TontineMember(Base):
    """Member of a Tontine savings group with their payout order."""

    __tablename__ = "tontine_members"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    tontine_id: Mapped[str] = mapped_column(
        String, ForeignKey("tontines.id"), nullable=False, index=True
    )
    user_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id"), nullable=False
    )
    payout_order: Mapped[int | None] = mapped_column(Integer, nullable=True)
    has_received: Mapped[bool] = mapped_column(Boolean, default=False)
    joined_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    tontine = relationship("Tontine", back_populates="members")
