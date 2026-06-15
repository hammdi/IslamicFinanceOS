from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.jwt import get_current_user
from app.database import get_db
from app.models.qard import QardHasan, QardContribution
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.qard import QardRequest, QardFund, QardRepay, QardResponse
from app.services.hashgraph import record_transaction_on_hashgraph

router = APIRouter(prefix="/qard", tags=["Qard Hasan (Interest-Free Loan)"])


@router.post("/request", response_model=QardResponse)
def request_qard(
    payload: QardRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Borrower requests an interest-free loan (Qard Hasan)."""
    qard = QardHasan(
        borrower_id=current_user.id,
        amount=payload.amount,
        purpose=payload.purpose,
    )
    db.add(qard)
    db.commit()
    db.refresh(qard)
    return qard


@router.get("/available", response_model=list[QardResponse])
def list_available(db: Session = Depends(get_db)):
    """List all pending Qard Hasan requests that need funding."""
    return db.query(QardHasan).filter(QardHasan.status == "pending").all()


@router.get("/my", response_model=list[QardResponse])
def my_qards(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all Qard Hasan loans where the user is borrower or lender."""
    as_borrower = db.query(QardHasan).filter(QardHasan.borrower_id == current_user.id).all()
    funded_ids = (
        db.query(QardContribution.qard_id)
        .filter(QardContribution.lender_id == current_user.id)
        .distinct()
        .all()
    )
    funded_id_set = {r[0] for r in funded_ids}
    as_lender = (
        db.query(QardHasan)
        .filter(QardHasan.id.in_(funded_id_set))
        .all()
        if funded_id_set
        else []
    )
    seen = set()
    result = []
    for q in as_borrower + as_lender:
        if q.id not in seen:
            seen.add(q.id)
            result.append(q)
    return result


@router.get("/{qard_id}", response_model=QardResponse)
def get_qard(qard_id: str, db: Session = Depends(get_db)):
    """Get details of a specific Qard Hasan loan."""
    qard = db.query(QardHasan).filter(QardHasan.id == qard_id).first()
    if not qard:
        raise HTTPException(status_code=404, detail="Qard not found")
    return qard


@router.post("/{qard_id}/fund", response_model=QardResponse)
def fund_qard(
    qard_id: str,
    payload: QardFund,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lender contributes to funding a Qard Hasan loan. No interest earned — purely charitable."""
    qard = db.query(QardHasan).filter(QardHasan.id == qard_id).first()
    if not qard:
        raise HTTPException(status_code=404, detail="Qard not found")
    if qard.status != "pending":
        raise HTTPException(status_code=400, detail="Qard is not accepting funding")
    if qard.borrower_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot fund your own Qard")

    contribution = QardContribution(
        qard_id=qard.id,
        lender_id=current_user.id,
        amount=payload.amount,
    )
    db.add(contribution)

    # Check if fully funded
    total_funded = sum(c.amount for c in qard.contributions) + payload.amount
    if total_funded >= qard.amount:
        qard.status = "funded"
        qard.funded_at = datetime.utcnow()

    # Record transaction with audit trail
    tx = Transaction(
        from_user=current_user.id,
        to_user=qard.borrower_id,
        amount=payload.amount,
        type="qard_fund",
        product_type="qard",
        product_id=qard.id,
    )
    tx.hashgraph_tx_id = record_transaction_on_hashgraph(
        tx.id, tx.from_user, tx.to_user, float(tx.amount),
        tx.type, tx.product_type, tx.product_id,
    )
    db.add(tx)
    db.commit()
    db.refresh(qard)
    return qard


@router.post("/{qard_id}/repay", response_model=QardResponse)
def repay_qard(
    qard_id: str,
    payload: QardRepay,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Borrower repays the exact amount — no interest, no extra fees."""
    qard = db.query(QardHasan).filter(QardHasan.id == qard_id).first()
    if not qard:
        raise HTTPException(status_code=404, detail="Qard not found")
    if qard.borrower_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the borrower can repay")
    if qard.status not in ("funded", "repaying"):
        raise HTTPException(status_code=400, detail="Qard is not in a repayable state")

    qard.status = "repaying"

    # Track repayment in schedule
    schedule = qard.repayment_schedule or {"payments": [], "total_repaid": 0}
    schedule["payments"].append({
        "amount": payload.amount,
        "date": datetime.utcnow().isoformat(),
    })
    schedule["total_repaid"] = schedule.get("total_repaid", 0) + payload.amount
    qard.repayment_schedule = schedule

    if schedule["total_repaid"] >= float(qard.amount):
        qard.status = "completed"

    # Record each repayment to lenders proportionally
    for contribution in qard.contributions:
        proportion = float(contribution.amount) / float(qard.amount)
        repay_amount = round(payload.amount * proportion, 2)
        tx = Transaction(
            from_user=current_user.id,
            to_user=contribution.lender_id,
            amount=repay_amount,
            type="qard_repay",
            product_type="qard",
            product_id=qard.id,
        )
        tx.hashgraph_tx_id = record_transaction_on_hashgraph(
            tx.id, tx.from_user, tx.to_user, float(tx.amount),
            tx.type, tx.product_type, tx.product_id,
        )
        db.add(tx)

    db.commit()
    db.refresh(qard)
    return qard
