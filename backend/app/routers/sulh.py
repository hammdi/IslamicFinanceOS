from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth.jwt import get_current_user
from app.database import get_db
from app.models.sulh import SulhDispute
from app.models.user import User
from app.services.hashgraph import record_transaction_on_hashgraph
from app.services.notifications import notify

router = APIRouter(prefix="/sulh", tags=["Sulh (Islamic Dispute Resolution)"])


class DisputeCreate(BaseModel):
    respondent_id: str
    product_type: str
    product_id: str
    amount_in_dispute: float
    description: str


class ResolutionCreate(BaseModel):
    resolution: str
    resolution_amount: float = 0


@router.post("/disputes")
def open_dispute(payload: DisputeCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Open a Sulh dispute for mediation."""
    dispute = SulhDispute(
        complainant_id=current_user.id,
        respondent_id=payload.respondent_id,
        product_type=payload.product_type,
        product_id=payload.product_id,
        amount_in_dispute=payload.amount_in_dispute,
        description=payload.description,
    )
    db.add(dispute)
    notify(db, payload.respondent_id, "Dispute Filed Against You",
           f"A Sulh dispute for {payload.amount_in_dispute} USD has been opened.", "sulh")
    db.commit()
    db.refresh(dispute)
    return _dispute_resp(dispute)


@router.get("/disputes")
def my_disputes(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List disputes involving the current user."""
    disputes = db.query(SulhDispute).filter(
        (SulhDispute.complainant_id == current_user.id) | (SulhDispute.respondent_id == current_user.id)
    ).order_by(SulhDispute.created_at.desc()).all()
    return [_dispute_resp(d) for d in disputes]


@router.post("/disputes/{dispute_id}/volunteer")
def volunteer_mediator(dispute_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Volunteer as a mediator for a dispute."""
    dispute = db.query(SulhDispute).filter(SulhDispute.id == dispute_id).first()
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")
    if current_user.id in (dispute.complainant_id, dispute.respondent_id):
        raise HTTPException(status_code=400, detail="Parties cannot mediate their own dispute")

    mediators = dispute.mediator_ids or []
    if current_user.id in mediators:
        raise HTTPException(status_code=400, detail="Already a mediator")
    if len(mediators) >= 3:
        raise HTTPException(status_code=400, detail="Already 3 mediators assigned")

    mediators.append(current_user.id)
    dispute.mediator_ids = mediators
    if len(mediators) >= 3:
        dispute.status = "mediation"
    db.commit()
    return _dispute_resp(dispute)


@router.post("/disputes/{dispute_id}/resolve")
def resolve_dispute(
    dispute_id: str, payload: ResolutionCreate,
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    """Mediator submits resolution."""
    dispute = db.query(SulhDispute).filter(SulhDispute.id == dispute_id).first()
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")
    mediators = dispute.mediator_ids or []
    if current_user.id not in mediators and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Only mediators can resolve")

    dispute.resolution = payload.resolution
    dispute.resolution_amount = payload.resolution_amount
    dispute.status = "resolved"
    dispute.resolved_at = datetime.utcnow()
    dispute.hashgraph_resolution_id = record_transaction_on_hashgraph(
        dispute.id, dispute.complainant_id, dispute.respondent_id,
        payload.resolution_amount, "sulh_resolution", "sulh", dispute.id,
    )

    notify(db, dispute.complainant_id, "Dispute Resolved",
           f"Your dispute has been resolved: {payload.resolution}", "sulh")
    notify(db, dispute.respondent_id, "Dispute Resolved",
           f"The dispute against you has been resolved: {payload.resolution}", "sulh")
    db.commit()
    return _dispute_resp(dispute)


@router.get("/open")
def open_disputes(db: Session = Depends(get_db)):
    """List open disputes needing mediators."""
    disputes = db.query(SulhDispute).filter(SulhDispute.status == "open").all()
    return [_dispute_resp(d) for d in disputes]


def _dispute_resp(d):
    return {
        "id": d.id, "complainant_id": d.complainant_id,
        "respondent_id": d.respondent_id, "product_type": d.product_type,
        "amount": float(d.amount_in_dispute), "description": d.description,
        "mediators": d.mediator_ids or [], "mediators_count": len(d.mediator_ids or []),
        "resolution": d.resolution, "resolution_amount": float(d.resolution_amount) if d.resolution_amount else None,
        "status": d.status, "hashgraph_id": d.hashgraph_resolution_id,
    }
