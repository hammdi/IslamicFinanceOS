import uuid
from datetime import datetime

from sqlalchemy import String, Numeric, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class MarketplaceListing(Base):
    """
    Halal Marketplace — Buy/sell with Murabaha financing option.
    All products verified halal. Community trust scoring.
    """

    __tablename__ = "marketplace_listings"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    seller_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    # electronics | vehicles | property | services | food | clothing | other
    price: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    murabaha_available: Mapped[bool] = mapped_column(Boolean, default=False)
    location: Mapped[str | None] = mapped_column(String(200), nullable=True)
    images: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False, index=True)
    # active | sold | closed
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class MarketplaceOrder(Base):
    """Purchase order in the marketplace."""

    __tablename__ = "marketplace_orders"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    listing_id: Mapped[str] = mapped_column(String, ForeignKey("marketplace_listings.id"), nullable=False)
    buyer_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    payment_method: Mapped[str] = mapped_column(String(20), nullable=False)  # wallet | murabaha
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    # pending | paid | delivered | completed
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class ShuraVote(Base):
    """Community governance vote for Waqf/pool allocations."""

    __tablename__ = "shura_votes"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    proposal_title: Mapped[str] = mapped_column(String(200), nullable=False)
    proposal_description: Mapped[str] = mapped_column(Text, nullable=False)
    proposer_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)  # waqf | takaful | community
    target_id: Mapped[str | None] = mapped_column(String, nullable=True)
    amount: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    votes_for: Mapped[int] = mapped_column(default=0)
    votes_against: Mapped[int] = mapped_column(default=0)
    voters: Mapped[dict | None] = mapped_column(JSONB, default=dict)
    status: Mapped[str] = mapped_column(String(20), default="open", nullable=False)
    # open | passed | rejected | executed
    deadline: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
