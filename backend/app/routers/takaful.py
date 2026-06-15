from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.jwt import get_current_user
from app.database import get_db
from app.models.takaful import TakafulPool, TakafulMember, TakafulClaim
from app.models.transaction import Transaction
from app.models.user import User
from app.services.hashgraph import record_transaction_on_hashgraph
from app.services.notifications import notify
from app.routers.wallet import get_or_create_wallet

router = APIRouter(prefix="/takaful", tags=["Takaful (Islamic Micro-Insurance)"])

CATEGORIES = ["health", "education", "agriculture", "disaster", "funeral", "general"]


@router.post("/create")
def create_pool(
    name: str, category: str, monthly_contribution: float, max_members: int = 50,
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    if category not in CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Category must be: {CATEGORIES}")
    pool = TakafulPool(
        name=name, creator_id=current_user.id, category=category,
        monthly_contribution=monthly_contribution, max_members=max_members,
    )
    db.add(pool)
    db.flush()
    member = TakafulMember(pool_id=pool.id, user_id=current_user.id)
    db.add(member)
    db.commit()
    db.refresh(pool)
    return _pool_response(pool)


@router.get("/available")
def list_pools(db: Session = Depends(get_db)):
    pools = db.query(TakafulPool).filter(TakafulPool.status == "active").all()
    return [_pool_response(p) for p in pools]


@router.get("/my")
def my_pools(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ids = [r[0] for r in db.query(TakafulMember.pool_id).filter(TakafulMember.user_id == current_user.id).all()]
    if not ids:
        return []
    return [_pool_response(p) for p in db.query(TakafulPool).filter(TakafulPool.id.in_(ids)).all()]


@router.post("/{pool_id}/join")
def join_pool(pool_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    pool = db.query(TakafulPool).filter(TakafulPool.id == pool_id).first()
    if not pool:
        raise HTTPException(status_code=404, detail="Pool not found")
    if len(pool.members) >= pool.max_members:
        raise HTTPException(status_code=400, detail="Pool is full")
    existing = db.query(TakafulMember).filter(
        TakafulMember.pool_id == pool_id, TakafulMember.user_id == current_user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already a member")
    db.add(TakafulMember(pool_id=pool.id, user_id=current_user.id))
    db.commit()
    db.refresh(pool)
    return _pool_response(pool)


@router.post("/{pool_id}/contribute")
def contribute(pool_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    pool = db.query(TakafulPool).filter(TakafulPool.id == pool_id).first()
    if not pool:
        raise HTTPException(status_code=404, detail="Pool not found")
    member = db.query(TakafulMember).filter(
        TakafulMember.pool_id == pool_id, TakafulMember.user_id == current_user.id).first()
    if not member:
        raise HTTPException(status_code=403, detail="Not a member")
    wallet = get_or_create_wallet(db, current_user.id)
    amount = float(pool.monthly_contribution)
    if float(wallet.balance) < amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")
    wallet.balance = float(wallet.balance) - amount
    pool.pool_balance = float(pool.pool_balance) + amount
    member.total_contributed = float(member.total_contributed) + amount
    tx = Transaction(from_user=current_user.id, to_user="takaful_pool", amount=amount,
                     type="takaful_contribute", product_type="takaful", product_id=pool.id)
    tx.hashgraph_tx_id = record_transaction_on_hashgraph(
        tx.id, tx.from_user, tx.to_user, amount, tx.type, tx.product_type, tx.product_id)
    db.add(tx)
    db.commit()
    db.refresh(pool)
    return _pool_response(pool)


@router.post("/{pool_id}/claim")
def file_claim(
    pool_id: str, amount: float, reason: str,
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    pool = db.query(TakafulPool).filter(TakafulPool.id == pool_id).first()
    if not pool:
        raise HTTPException(status_code=404, detail="Pool not found")
    member = db.query(TakafulMember).filter(
        TakafulMember.pool_id == pool_id, TakafulMember.user_id == current_user.id).first()
    if not member:
        raise HTTPException(status_code=403, detail="Not a member")
    if amount > float(pool.pool_balance):
        raise HTTPException(status_code=400, detail="Claim exceeds pool balance")
    claim = TakafulClaim(pool_id=pool.id, claimant_id=current_user.id, amount=amount, reason=reason)
    db.add(claim)
    for m in pool.members:
        if m.user_id != current_user.id:
            notify(db, m.user_id, "Takaful Claim Filed",
                   f"A member filed a claim for {amount} USD. Please vote.", "takaful")
    db.commit()
    db.refresh(claim)
    return {"id": claim.id, "amount": float(claim.amount), "reason": claim.reason, "status": claim.status,
            "votes_for": claim.votes_for, "votes_against": claim.votes_against}


@router.post("/claims/{claim_id}/vote")
def vote_claim(
    claim_id: str, approve: bool,
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    claim = db.query(TakafulClaim).filter(TakafulClaim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    if claim.status != "pending":
        raise HTTPException(status_code=400, detail="Voting closed")
    member = db.query(TakafulMember).filter(
        TakafulMember.pool_id == claim.pool_id, TakafulMember.user_id == current_user.id).first()
    if not member:
        raise HTTPException(status_code=403, detail="Not a member")
    voters = claim.voters or {}
    if current_user.id in voters:
        raise HTTPException(status_code=400, detail="Already voted")
    voters[current_user.id] = approve
    claim.voters = voters
    if approve:
        claim.votes_for += 1
    else:
        claim.votes_against += 1
    # Auto-resolve: majority of members voted
    pool = db.query(TakafulPool).filter(TakafulPool.id == claim.pool_id).first()
    total_members = len(pool.members)
    total_votes = claim.votes_for + claim.votes_against
    if total_votes >= (total_members // 2 + 1):
        if claim.votes_for > claim.votes_against:
            claim.status = "approved"
            # Pay out from pool
            wallet = get_or_create_wallet(db, claim.claimant_id)
            wallet.balance = float(wallet.balance) + float(claim.amount)
            pool.pool_balance = float(pool.pool_balance) - float(claim.amount)
            pool.total_claims_paid = float(pool.total_claims_paid) + float(claim.amount)
            claim.status = "paid"
            notify(db, claim.claimant_id, "Claim Approved & Paid",
                   f"Your claim for {claim.amount} USD was approved and paid.", "takaful")
        else:
            claim.status = "rejected"
            notify(db, claim.claimant_id, "Claim Rejected",
                   f"Your claim for {claim.amount} USD was rejected by the community.", "takaful")
    db.commit()
    return {"status": claim.status, "votes_for": claim.votes_for, "votes_against": claim.votes_against}


def _pool_response(p):
    return {
        "id": p.id, "name": p.name, "category": p.category,
        "monthly_contribution": float(p.monthly_contribution),
        "max_members": p.max_members, "pool_balance": float(p.pool_balance),
        "total_claims_paid": float(p.total_claims_paid),
        "members_count": len(p.members), "status": p.status,
        "claims": [{"id": c.id, "amount": float(c.amount), "reason": c.reason,
                     "status": c.status, "votes_for": c.votes_for, "votes_against": c.votes_against}
                    for c in (p.claims or [])],
    }
