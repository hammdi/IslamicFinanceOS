"""Helper to create notifications across the platform."""

from sqlalchemy.orm import Session

from app.models.notification import Notification


def notify(db: Session, user_id: str, title: str, message: str, type: str):
    n = Notification(user_id=user_id, title=title, message=message, type=type)
    db.add(n)
