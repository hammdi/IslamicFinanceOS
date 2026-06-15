from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth.jwt import get_current_user
from app.database import get_db
from app.models.employee import EmployeeProfile, KYCRequest, SupportTicket, EmployeeActionLog
from app.models.user import User
from app.models.murabaha import Murabaha
from app.models.ijara import IjaraContract
from app.models.sadaqa import SadaqaCampaign
from app.models.sulh import SulhDispute
from app.models.transaction import Transaction
from app.models.wallet import Wallet
from app.services.notifications import notify

router = APIRouter(prefix="/employee", tags=["Employee Portal"])


def require_employee(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(EmployeeProfile).filter(
        EmployeeProfile.user_id == current_user.id, EmployeeProfile.is_active == True
    ).first()
    if not profile and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Employee access required")
    return current_user, profile


def log_action(db: Session, employee_id: str, action: str, target_type: str, target_id: str, details: str = ""):
    log = EmployeeActionLog(
        employee_id=employee_id, action=action,
        target_type=target_type, target_id=target_id, details=details,
    )
    db.add(log)


# ── Employee Management ──

class EmployeeCreate(BaseModel):
    user_id: str
    role: str  # admin | agent | supervisor | auditor | support
    department: str = "general"


@router.post("/create")
def create_employee(
    payload: EmployeeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Admin creates an employee profile."""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    existing = db.query(EmployeeProfile).filter(EmployeeProfile.user_id == payload.user_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already an employee")

    profile = EmployeeProfile(
        user_id=payload.user_id, role=payload.role, department=payload.department,
    )
    db.add(profile)
    log_action(db, current_user.id, "employee_create", "employee", profile.id, f"Role: {payload.role}")
    notify(db, payload.user_id, "Employee Access Granted",
           f"You now have {payload.role} access to the Employee Portal.", "system")
    db.commit()
    return {"status": "created", "role": payload.role}


@router.get("/profile")
def my_profile(deps=Depends(require_employee), db: Session = Depends(get_db)):
    """Get current employee profile."""
    user, profile = deps
    if not profile:
        return {"user_id": user.id, "role": "admin", "department": "all", "is_active": True}
    return {
        "id": profile.id, "user_id": profile.user_id, "role": profile.role,
        "department": profile.department, "is_active": profile.is_active,
    }


@router.get("/team")
def list_employees(deps=Depends(require_employee), db: Session = Depends(get_db)):
    """List all employees."""
    employees = db.query(EmployeeProfile).filter(EmployeeProfile.is_active == True).all()
    result = []
    for e in employees:
        user = db.query(User).filter(User.id == e.user_id).first()
        result.append({
            "id": e.id, "user_id": e.user_id, "name": user.name if user else "",
            "email": user.email if user else "", "role": e.role,
            "department": e.department,
        })
    return result


# ── Dashboard ──

@router.get("/dashboard")
def employee_dashboard(deps=Depends(require_employee), db: Session = Depends(get_db)):
    """Employee task dashboard — what needs attention."""
    user, profile = deps
    return {
        "kyc_pending": db.query(func.count(KYCRequest.id)).filter(KYCRequest.status == "pending").scalar(),
        "kyc_under_review": db.query(func.count(KYCRequest.id)).filter(KYCRequest.status == "under_review").scalar(),
        "tickets_open": db.query(func.count(SupportTicket.id)).filter(SupportTicket.status.in_(["open", "assigned"])).scalar(),
        "tickets_mine": db.query(func.count(SupportTicket.id)).filter(SupportTicket.assigned_to == user.id).scalar(),
        "murabaha_pending": db.query(func.count(Murabaha.id)).filter(Murabaha.status == "pending").scalar(),
        "ijara_pending": db.query(func.count(IjaraContract.id)).filter(IjaraContract.status == "pending").scalar(),
        "campaigns_unverified": db.query(func.count(SadaqaCampaign.id)).filter(SadaqaCampaign.verified == False).scalar(),
        "disputes_open": db.query(func.count(SulhDispute.id)).filter(SulhDispute.status.in_(["open", "mediation"])).scalar(),
        "total_users": db.query(func.count(User.id)).scalar(),
        "total_transactions": db.query(func.count(Transaction.id)).scalar(),
        "total_wallet_balance": float(db.query(func.coalesce(func.sum(Wallet.balance), 0)).scalar()),
    }


# ── KYC Workflow ──

class KYCSubmit(BaseModel):
    full_name: str
    date_of_birth: str
    nationality: str
    id_type: str
    id_number: str
    address: str


class KYCReview(BaseModel):
    status: str  # approved | rejected
    notes: str = ""


@router.post("/kyc/submit")
def submit_kyc(payload: KYCSubmit, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """User submits KYC verification."""
    existing = db.query(KYCRequest).filter(KYCRequest.user_id == current_user.id, KYCRequest.status.in_(["pending", "under_review", "approved"])).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"KYC already {existing.status}")
    kyc = KYCRequest(
        user_id=current_user.id, full_name=payload.full_name,
        date_of_birth=payload.date_of_birth, nationality=payload.nationality,
        id_type=payload.id_type, id_number=payload.id_number, address=payload.address,
    )
    db.add(kyc)
    db.commit()
    return {"status": "submitted", "id": kyc.id}


@router.get("/kyc/pending")
def list_kyc_pending(deps=Depends(require_employee), db: Session = Depends(get_db)):
    """List pending KYC requests for review."""
    requests = db.query(KYCRequest).filter(KYCRequest.status.in_(["pending", "under_review"])).order_by(KYCRequest.submitted_at).all()
    return [
        {"id": r.id, "user_id": r.user_id, "full_name": r.full_name,
         "nationality": r.nationality, "id_type": r.id_type, "id_number": r.id_number,
         "address": r.address, "status": r.status, "submitted_at": r.submitted_at.isoformat()}
        for r in requests
    ]


@router.post("/kyc/{kyc_id}/review")
def review_kyc(kyc_id: str, payload: KYCReview, deps=Depends(require_employee), db: Session = Depends(get_db)):
    """Employee reviews a KYC request."""
    user, profile = deps
    kyc = db.query(KYCRequest).filter(KYCRequest.id == kyc_id).first()
    if not kyc:
        raise HTTPException(status_code=404, detail="KYC request not found")

    kyc.status = payload.status
    kyc.reviewed_by = user.id
    kyc.review_notes = payload.notes
    kyc.reviewed_at = datetime.utcnow()

    if payload.status == "approved":
        target_user = db.query(User).filter(User.id == kyc.user_id).first()
        if target_user:
            target_user.verified = True
        notify(db, kyc.user_id, "KYC Approved", "Your identity has been verified. You now have full access.", "system")
    else:
        notify(db, kyc.user_id, "KYC Rejected", f"Your KYC was rejected. Reason: {payload.notes}", "system")

    log_action(db, user.id, "kyc_review", "kyc", kyc_id, f"{payload.status}: {payload.notes}")
    db.commit()
    return {"status": kyc.status}


# ── Support Tickets ──

class TicketCreate(BaseModel):
    subject: str
    description: str
    category: str = "other"
    priority: str = "medium"


class TicketRespond(BaseModel):
    response: str
    status: str = "resolved"


@router.post("/tickets/create")
def create_ticket(payload: TicketCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """User creates a support ticket."""
    ticket = SupportTicket(
        user_id=current_user.id, subject=payload.subject,
        description=payload.description, category=payload.category, priority=payload.priority,
    )
    db.add(ticket)
    db.commit()
    return {"id": ticket.id, "status": "open"}


@router.get("/tickets/my")
def my_tickets(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """User views their tickets."""
    tickets = db.query(SupportTicket).filter(SupportTicket.user_id == current_user.id).order_by(SupportTicket.created_at.desc()).all()
    return [_ticket_resp(t) for t in tickets]


@router.get("/tickets/queue")
def ticket_queue(deps=Depends(require_employee), db: Session = Depends(get_db)):
    """Employee views all open tickets."""
    tickets = db.query(SupportTicket).filter(
        SupportTicket.status.in_(["open", "assigned", "in_progress"])
    ).order_by(
        SupportTicket.priority.desc(), SupportTicket.created_at
    ).all()
    result = []
    for t in tickets:
        user = db.query(User).filter(User.id == t.user_id).first()
        r = _ticket_resp(t)
        r["user_name"] = user.name if user else ""
        r["user_email"] = user.email if user else ""
        result.append(r)
    return result


@router.post("/tickets/{ticket_id}/assign")
def assign_ticket(ticket_id: str, deps=Depends(require_employee), db: Session = Depends(get_db)):
    """Employee assigns a ticket to themselves."""
    user, profile = deps
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    ticket.assigned_to = user.id
    ticket.status = "assigned"
    log_action(db, user.id, "ticket_assign", "ticket", ticket_id)
    db.commit()
    return {"status": "assigned"}


@router.post("/tickets/{ticket_id}/respond")
def respond_ticket(ticket_id: str, payload: TicketRespond, deps=Depends(require_employee), db: Session = Depends(get_db)):
    """Employee responds to and resolves a ticket."""
    user, profile = deps
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    ticket.response = payload.response
    ticket.status = payload.status
    if payload.status in ("resolved", "closed"):
        ticket.resolved_at = datetime.utcnow()
    notify(db, ticket.user_id, "Ticket Updated", f"Your ticket '{ticket.subject}' has been {payload.status}.", "system")
    log_action(db, user.id, "ticket_resolve", "ticket", ticket_id, payload.response[:100])
    db.commit()
    return {"status": ticket.status}


# ── Campaign Verification ──

@router.get("/campaigns/unverified")
def unverified_campaigns(deps=Depends(require_employee), db: Session = Depends(get_db)):
    """List unverified Sadaqa campaigns."""
    campaigns = db.query(SadaqaCampaign).filter(SadaqaCampaign.verified == False).all()
    return [
        {"id": c.id, "title": c.title, "description": c.description,
         "category": c.category, "target": float(c.target_amount),
         "creator_id": c.creator_id, "created_at": c.created_at.isoformat()}
        for c in campaigns
    ]


@router.post("/campaigns/{campaign_id}/verify")
def verify_campaign(campaign_id: str, deps=Depends(require_employee), db: Session = Depends(get_db)):
    """Employee verifies a Sadaqa campaign."""
    user, profile = deps
    campaign = db.query(SadaqaCampaign).filter(SadaqaCampaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    campaign.verified = True
    notify(db, campaign.creator_id, "Campaign Verified",
           f"Your campaign '{campaign.title}' has been verified.", "sadaqa")
    log_action(db, user.id, "campaign_verify", "campaign", campaign_id)
    db.commit()
    return {"status": "verified"}


# ── Action Logs ──

@router.get("/logs")
def action_logs(
    limit: int = Query(50, ge=1, le=200),
    deps=Depends(require_employee), db: Session = Depends(get_db),
):
    """View employee action audit log."""
    logs = db.query(EmployeeActionLog).order_by(EmployeeActionLog.timestamp.desc()).limit(limit).all()
    result = []
    for l in logs:
        emp = db.query(User).filter(User.id == l.employee_id).first()
        result.append({
            "id": l.id, "employee": emp.name if emp else l.employee_id,
            "action": l.action, "target_type": l.target_type,
            "target_id": l.target_id[:8], "details": l.details,
            "timestamp": l.timestamp.isoformat(),
        })
    return result


# ── Performance Metrics ──

@router.get("/performance")
def employee_performance(deps=Depends(require_employee), db: Session = Depends(get_db)):
    """Employee performance metrics."""
    user, profile = deps
    my_kyc = db.query(func.count(KYCRequest.id)).filter(KYCRequest.reviewed_by == user.id).scalar()
    my_tickets = db.query(func.count(SupportTicket.id)).filter(
        SupportTicket.assigned_to == user.id, SupportTicket.status.in_(["resolved", "closed"])
    ).scalar()
    my_actions = db.query(func.count(EmployeeActionLog.id)).filter(EmployeeActionLog.employee_id == user.id).scalar()

    return {
        "kyc_reviewed": my_kyc,
        "tickets_resolved": my_tickets,
        "total_actions": my_actions,
    }


def _ticket_resp(t):
    return {
        "id": t.id, "subject": t.subject, "description": t.description,
        "category": t.category, "priority": t.priority, "status": t.status,
        "response": t.response, "created_at": t.created_at.isoformat(),
        "resolved_at": t.resolved_at.isoformat() if t.resolved_at else None,
    }
