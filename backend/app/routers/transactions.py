from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.auth.jwt import get_current_user
from app.database import get_db
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.transaction import TransactionResponse

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.get("/", response_model=list[TransactionResponse])
def list_transactions(
    product_type: str | None = Query(None, description="Filter: qard, musharaka, tontine"),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all transactions involving the current user."""
    query = db.query(Transaction).filter(
        or_(Transaction.from_user == current_user.id, Transaction.to_user == current_user.id)
    )
    if product_type:
        query = query.filter(Transaction.product_type == product_type)
    return query.order_by(Transaction.timestamp.desc()).limit(limit).all()
