import uuid
from datetime import datetime

from sqlalchemy import String, Boolean, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class CommunityStory(Base):
    """Success stories shared by the community (anonymized)."""

    __tablename__ = "community_stories"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    story: Mapped[str] = mapped_column(Text, nullable=False)
    product_type: Mapped[str] = mapped_column(String(30), nullable=False)
    anonymous: Mapped[bool] = mapped_column(Boolean, default=True)
    likes: Mapped[int] = mapped_column(Integer, default=0)
    approved: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
