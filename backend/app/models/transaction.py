import uuid
from datetime import datetime

from sqlalchemy import String, Numeric, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Transaction(Base):
    """
    Immutable transaction record.

    Every financial movement is recorded here with an optional
    Hashgraph transaction ID for blockchain-level auditability.
    Types: qard_fund, qard_repay, musharaka_invest, musharaka_profit,
           musharaka_loss, tontine_contribute, tontine_payout
    """

    __tablename__ = "transactions"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    from_user: Mapped[str] = mapped_column(String, nullable=False, index=True)
    to_user: Mapped[str] = mapped_column(String, nullable=False, index=True)
    amount: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    type: Mapped[str] = mapped_column(String(30), nullable=False)
    product_type: Mapped[str] = mapped_column(
        String(20), nullable=False
    )  # qard | musharaka | tontine
    product_id: Mapped[str] = mapped_column(String, nullable=False)
    hashgraph_tx_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False, index=True
    )
