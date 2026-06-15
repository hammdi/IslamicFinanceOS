import uuid
from datetime import datetime

from sqlalchemy import String, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Wallet(Base):
    """
    User Wallet — the core of all financial operations.

    Every user gets a wallet upon registration. All products
    (Qard, Musharaka, Tontine, Zakat, Waqf) debit/credit through the wallet.
    """

    __tablename__ = "wallets"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id"), unique=True, nullable=False, index=True
    )
    balance: Mapped[float] = mapped_column(Numeric(15, 2), default=0, nullable=False)
    total_deposited: Mapped[float] = mapped_column(Numeric(15, 2), default=0, nullable=False)
    total_withdrawn: Mapped[float] = mapped_column(Numeric(15, 2), default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )
