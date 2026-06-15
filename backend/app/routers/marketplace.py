from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth.jwt import get_current_user
from app.database import get_db
from app.models.marketplace import MarketplaceListing, MarketplaceOrder, ShuraVote
from app.models.transaction import Transaction
from app.models.user import User
from app.services.hashgraph import record_transaction_on_hashgraph
from app.services.notifications import notify
from app.routers.wallet import get_or_create_wallet

router = APIRouter(prefix="/marketplace", tags=["Halal Marketplace"])

LISTING_CATEGORIES = ["electronics", "vehicles", "property", "services", "food", "clothing", "other"]


class ListingCreate(BaseModel):
    title: str
    description: str
    category: str
    price: float
    murabaha_available: bool = False
    location: str = ""


class ProposalCreate(BaseModel):
    title: str
    description: str
    category: str  # waqf | takaful | community
    target_id: str | None = None
    amount: float | None = None


# --- Marketplace ---

@router.post("/listings")
def create_listing(payload: ListingCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    listing = MarketplaceListing(
        seller_id=current_user.id, title=payload.title, description=payload.description,
        category=payload.category, price=payload.price,
        murabaha_available=payload.murabaha_available, location=payload.location or None,
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)
    return _listing_resp(listing)


@router.get("/listings")
def browse_listings(category: str | None = None, db: Session = Depends(get_db)):
    q = db.query(MarketplaceListing).filter(MarketplaceListing.status == "active")
    if category:
        q = q.filter(MarketplaceListing.category == category)
    return [_listing_resp(l) for l in q.order_by(MarketplaceListing.created_at.desc()).limit(50).all()]


@router.post("/listings/{listing_id}/buy")
def buy_listing(listing_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    listing = db.query(MarketplaceListing).filter(MarketplaceListing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.status != "active":
        raise HTTPException(status_code=400, detail="Listing not available")
    if listing.seller_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot buy your own listing")

    wallet = get_or_create_wallet(db, current_user.id)
    price = float(listing.price)
    if float(wallet.balance) < price:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    wallet.balance = float(wallet.balance) - price
    seller_wallet = get_or_create_wallet(db, listing.seller_id)
    seller_wallet.balance = float(seller_wallet.balance) + price
    listing.status = "sold"

    order = MarketplaceOrder(listing_id=listing.id, buyer_id=current_user.id, amount=price, payment_method="wallet", status="paid")
    db.add(order)

    tx = Transaction(from_user=current_user.id, to_user=listing.seller_id, amount=price,
                     type="marketplace_buy", product_type="marketplace", product_id=listing.id)
    tx.hashgraph_tx_id = record_transaction_on_hashgraph(
        tx.id, tx.from_user, tx.to_user, price, tx.type, tx.product_type, tx.product_id)
    db.add(tx)
    notify(db, listing.seller_id, "Item Sold!", f"'{listing.title}' sold for {price} USD.", "marketplace")
    db.commit()
    return {"status": "purchased", "order_id": order.id}


# --- Shura (Community Governance) ---

@router.post("/shura/propose")
def create_proposal(payload: ProposalCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create a community governance proposal for vote."""
    vote = ShuraVote(
        proposal_title=payload.title, proposal_description=payload.description,
        proposer_id=current_user.id, category=payload.category,
        target_id=payload.target_id, amount=payload.amount,
    )
    db.add(vote)
    db.commit()
    db.refresh(vote)
    return _vote_resp(vote)


@router.get("/shura/proposals")
def list_proposals(db: Session = Depends(get_db)):
    votes = db.query(ShuraVote).filter(ShuraVote.status == "open").order_by(ShuraVote.created_at.desc()).all()
    return [_vote_resp(v) for v in votes]


@router.post("/shura/{proposal_id}/vote")
def vote_on_proposal(proposal_id: str, approve: bool, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    vote = db.query(ShuraVote).filter(ShuraVote.id == proposal_id).first()
    if not vote:
        raise HTTPException(status_code=404, detail="Proposal not found")
    if vote.status != "open":
        raise HTTPException(status_code=400, detail="Voting closed")
    voters = vote.voters or {}
    if current_user.id in voters:
        raise HTTPException(status_code=400, detail="Already voted")
    voters[current_user.id] = approve
    vote.voters = voters
    if approve:
        vote.votes_for += 1
    else:
        vote.votes_against += 1
    db.commit()
    return _vote_resp(vote)


def _listing_resp(l):
    return {
        "id": l.id, "title": l.title, "description": l.description,
        "category": l.category, "price": float(l.price),
        "murabaha_available": l.murabaha_available,
        "location": l.location, "status": l.status,
        "seller_id": l.seller_id,
    }


def _vote_resp(v):
    return {
        "id": v.id, "title": v.proposal_title, "description": v.proposal_description,
        "category": v.category, "amount": float(v.amount) if v.amount else None,
        "votes_for": v.votes_for, "votes_against": v.votes_against,
        "status": v.status, "total_voters": len(v.voters or {}),
    }
