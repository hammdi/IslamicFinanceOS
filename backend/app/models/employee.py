import uuid
from datetime import datetime

from sqlalchemy import String, Boolean, Integer, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class EmployeeProfile(Base):
    """Employee profile with role-based access control."""

    __tablename__ = "employee_profiles"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), unique=True, nullable=False, index=True)
    role: Mapped[str] = mapped_column(String(30), nullable=False)
    # admin | agent | supervisor | auditor | support
    department: Mapped[str] = mapped_column(String(50), default="general")
    # general | finance | compliance | support | operations
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    permissions: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    hired_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class KYCRequest(Base):
    """Know Your Customer verification request."""

    __tablename__ = "kyc_requests"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    date_of_birth: Mapped[str] = mapped_column(String(20), nullable=False)
    nationality: Mapped[str] = mapped_column(String(100), nullable=False)
    id_type: Mapped[str] = mapped_column(String(30), nullable=False)  # passport | national_id | driver_license
    id_number: Mapped[str] = mapped_column(String(50), nullable=False)
    address: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False, index=True)
    # pending | under_review | approved | rejected
    reviewed_by: Mapped[str | None] = mapped_column(String, ForeignKey("users.id"), nullable=True)
    review_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    submitted_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class SupportTicket(Base):
    """User support ticket / complaint."""

    __tablename__ = "support_tickets"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False, index=True)
    subject: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(30), nullable=False)
    # account | transaction | product | technical | complaint | other
    priority: Mapped[str] = mapped_column(String(10), default="medium")  # low | medium | high | urgent
    status: Mapped[str] = mapped_column(String(20), default="open", nullable=False, index=True)
    # open | assigned | in_progress | resolved | closed
    assigned_to: Mapped[str | None] = mapped_column(String, ForeignKey("users.id"), nullable=True)
    response: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class EmployeeActionLog(Base):
    """Audit log of all employee actions."""

    __tablename__ = "employee_action_logs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False, index=True)
    action: Mapped[str] = mapped_column(String(50), nullable=False)
    # kyc_review | ticket_resolve | murabaha_approve | user_verify | campaign_verify | dispute_mediate
    target_type: Mapped[str] = mapped_column(String(30), nullable=False)
    target_id: Mapped[str] = mapped_column(String, nullable=False)
    details: Mapped[str | None] = mapped_column(Text, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
