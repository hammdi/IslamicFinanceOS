from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.jwt import get_current_user
from app.database import get_db
from app.models.sadaqa import SadaqaCampaign, SadaqaDonation, CampaignUpdate
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.sadaqa import (
    CampaignCreate, DonateRequest, CampaignUpdateCreate, CampaignResponse,
)
from app.services.hashgraph import record_transaction_on_hashgraph
from app.services.notifications import notify
from app.routers.wallet import get_or_create_wallet

router = APIRouter(prefix="/sadaqa", tags=["Sadaqa (Voluntary Charity)"])

VALID_CATEGORIES = ["education", "health", "food", "shelter", "orphans", "disaster", "general"]


@router.post("/campaigns", response_model=CampaignResponse)
def create_campaign(
    payload: CampaignCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a Sadaqa charity campaign."""
    if payload.category not in VALID_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Category must be: {VALID_CATEGORIES}")
    campaign = SadaqaCampaign(
        creator_id=current_user.id,
        title=payload.title,
        description=payload.description,
        category=payload.category,
        target_amount=payload.target_amount,
        deadline=payload.deadline,
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return campaign


@router.get("/campaigns", response_model=list[CampaignResponse])
def list_campaigns(db: Session = Depends(get_db)):
    """Browse active Sadaqa campaigns."""
    return db.query(SadaqaCampaign).filter(SadaqaCampaign.status == "active").all()


@router.get("/campaigns/my", response_model=list[CampaignResponse])
def my_campaigns(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List campaigns created by or donated to by user."""
    created = db.query(SadaqaCampaign).filter(SadaqaCampaign.creator_id == current_user.id).all()
    donated_ids = (
        db.query(SadaqaDonation.campaign_id)
        .filter(SadaqaDonation.donor_id == current_user.id)
        .distinct().all()
    )
    ids = {r[0] for r in donated_ids}
    donated = db.query(SadaqaCampaign).filter(SadaqaCampaign.id.in_(ids)).all() if ids else []
    seen = set()
    result = []
    for c in created + donated:
        if c.id not in seen:
            seen.add(c.id)
            result.append(c)
    return result


@router.get("/campaigns/{campaign_id}", response_model=CampaignResponse)
def get_campaign(campaign_id: str, db: Session = Depends(get_db)):
    c = db.query(SadaqaCampaign).filter(SadaqaCampaign.id == campaign_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return c


@router.post("/campaigns/{campaign_id}/donate", response_model=CampaignResponse)
def donate(
    campaign_id: str,
    payload: DonateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Donate to a Sadaqa campaign from wallet."""
    if payload.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    campaign = db.query(SadaqaCampaign).filter(SadaqaCampaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if campaign.status != "active":
        raise HTTPException(status_code=400, detail="Campaign not accepting donations")

    wallet = get_or_create_wallet(db, current_user.id)
    if float(wallet.balance) < payload.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    wallet.balance = float(wallet.balance) - payload.amount

    donation = SadaqaDonation(
        campaign_id=campaign.id,
        donor_id=current_user.id,
        amount=payload.amount,
        anonymous=payload.anonymous,
        message=payload.message or None,
    )
    db.add(donation)

    campaign.current_amount = float(campaign.current_amount) + payload.amount
    campaign.donors_count += 1
    if campaign.current_amount >= float(campaign.target_amount):
        campaign.status = "funded"

    tx = Transaction(
        from_user=current_user.id, to_user=campaign.creator_id,
        amount=payload.amount, type="sadaqa_donate",
        product_type="sadaqa", product_id=campaign.id,
    )
    tx.hashgraph_tx_id = record_transaction_on_hashgraph(
        tx.id, tx.from_user, tx.to_user, payload.amount,
        tx.type, tx.product_type, tx.product_id,
    )
    db.add(tx)
    notify(db, campaign.creator_id, "Sadaqa Donation",
           f"{'Someone' if payload.anonymous else current_user.name} donated {payload.amount} USD to '{campaign.title}'.", "sadaqa")
    db.commit()
    db.refresh(campaign)
    return campaign


@router.post("/campaigns/{campaign_id}/update", response_model=CampaignResponse)
def post_update(
    campaign_id: str,
    payload: CampaignUpdateCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Creator posts a transparency update on how funds are being used."""
    campaign = db.query(SadaqaCampaign).filter(SadaqaCampaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if campaign.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the creator can post updates")

    update = CampaignUpdate(
        campaign_id=campaign.id,
        title=payload.title,
        description=payload.description,
        amount_spent=payload.amount_spent,
    )
    db.add(update)
    db.commit()
    db.refresh(campaign)
    return campaign


@router.get("/campaigns/{campaign_id}/transparency")
def transparency(campaign_id: str, db: Session = Depends(get_db)):
    """Full money trail for a campaign — donations in, spending out."""
    campaign = db.query(SadaqaCampaign).filter(SadaqaCampaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    donations = [
        {"amount": float(d.amount), "anonymous": d.anonymous, "date": d.donated_at.isoformat()}
        for d in campaign.donations
    ]
    updates = [
        {"title": u.title, "spent": float(u.amount_spent), "date": u.created_at.isoformat()}
        for u in campaign.updates
    ]
    total_donated = sum(d["amount"] for d in donations)
    total_spent = sum(u["spent"] for u in updates)

    return {
        "campaign": campaign.title,
        "total_donated": total_donated,
        "total_spent": total_spent,
        "remaining": total_donated - total_spent,
        "donations": donations,
        "updates": updates,
    }
