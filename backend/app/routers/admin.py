from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth.jwt import get_current_user
from app.database import get_db
from app.models.user import User
from app.models.wallet import Wallet
from app.models.qard import QardHasan
from app.models.musharaka import Musharaka
from app.models.tontine import Tontine
from app.models.murabaha import Murabaha
from app.models.ijara import IjaraContract
from app.models.transaction import Transaction
from app.models.waqf import Waqf
from app.models.zakat import ZakatDistribution
from app.models.sadaqa import SadaqaCampaign
from app.schemas.user import UserResponse

router = APIRouter(prefix="/admin", tags=["Admin"])


def require_admin(current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


@router.get("/stats")
def platform_stats(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    """Get platform-wide statistics."""
    return {
        "users": {"total": db.query(func.count(User.id)).scalar()},
        "wallets": {"total_balance": float(db.query(func.coalesce(func.sum(Wallet.balance), 0)).scalar())},
        "qard_hasan": {
            "count": db.query(func.count(QardHasan.id)).scalar(),
            "total_amount": float(db.query(func.coalesce(func.sum(QardHasan.amount), 0)).scalar()),
        },
        "musharaka": {
            "count": db.query(func.count(Musharaka.id)).scalar(),
            "total_invested": float(db.query(func.coalesce(func.sum(Musharaka.current_amount), 0)).scalar()),
        },
        "tontine": {"count": db.query(func.count(Tontine.id)).scalar()},
        "murabaha": {
            "count": db.query(func.count(Murabaha.id)).scalar(),
            "pending": db.query(func.count(Murabaha.id)).filter(Murabaha.status == "pending").scalar(),
        },
        "ijara": {
            "count": db.query(func.count(IjaraContract.id)).scalar(),
            "pending": db.query(func.count(IjaraContract.id)).filter(IjaraContract.status == "pending").scalar(),
        },
        "waqf": {
            "count": db.query(func.count(Waqf.id)).scalar(),
            "total_donated": float(db.query(func.coalesce(func.sum(Waqf.current_amount), 0)).scalar()),
        },
        "zakat": {"total_distributed": float(db.query(func.coalesce(func.sum(ZakatDistribution.amount), 0)).scalar())},
        "sadaqa": {
            "campaigns": db.query(func.count(SadaqaCampaign.id)).scalar(),
            "total_raised": float(db.query(func.coalesce(func.sum(SadaqaCampaign.current_amount), 0)).scalar()),
        },
        "transactions": {"count": db.query(func.count(Transaction.id)).scalar()},
    }


@router.get("/users", response_model=list[UserResponse])
def list_users(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    return db.query(User).order_by(User.created_at.desc()).limit(100).all()


@router.post("/users/{user_id}/verify")
def verify_user(user_id: str, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.verified = True
    db.commit()
    return {"status": "verified", "user_id": user_id}


@router.get("/pending-approvals")
def pending_approvals(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    """List all items needing admin approval."""
    murabaha = db.query(Murabaha).filter(Murabaha.status == "pending").all()
    ijara = db.query(IjaraContract).filter(IjaraContract.status == "pending").all()
    return {
        "murabaha": [
            {"id": m.id, "client_id": m.client_id, "asset": m.asset_description,
             "price": float(m.asset_price), "margin": float(m.platform_margin_percent)}
            for m in murabaha
        ],
        "ijara": [
            {"id": c.id, "lessee_id": c.lessee_id, "asset": c.asset_description,
             "value": float(c.asset_value), "rent": float(c.monthly_rent)}
            for c in ijara
        ],
    }


@router.get("/transactions")
def all_transactions(limit: int = 50, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    txs = db.query(Transaction).order_by(Transaction.timestamp.desc()).limit(limit).all()
    return [
        {
            "id": tx.id, "from_user": tx.from_user, "to_user": tx.to_user,
            "amount": float(tx.amount), "type": tx.type, "product_type": tx.product_type,
            "hashgraph_tx_id": tx.hashgraph_tx_id, "timestamp": tx.timestamp.isoformat(),
        }
        for tx in txs
    ]
