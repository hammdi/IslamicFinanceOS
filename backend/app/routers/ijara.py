from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.jwt import get_current_user
from app.database import get_db
from app.models.ijara import IjaraContract, IjaraPayment
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.ijara import IjaraRequest, IjaraResponse
from app.services.hashgraph import record_transaction_on_hashgraph
from app.services.notifications import notify
from app.routers.wallet import get_or_create_wallet

router = APIRouter(prefix="/ijara", tags=["Ijara (Islamic Leasing)"])


@router.post("/request", response_model=IjaraResponse)
def request_ijara(
    payload: IjaraRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Request an Ijara lease for an asset."""
    contract = IjaraContract(
        lessee_id=current_user.id,
        asset_description=payload.asset_description,
        asset_value=payload.asset_value,
        monthly_rent=payload.monthly_rent,
        lease_duration_months=payload.lease_duration_months,
        purchase_option_price=payload.purchase_option_price,
    )
    db.add(contract)
    db.commit()
    db.refresh(contract)
    return contract


@router.get("/available", response_model=list[IjaraResponse])
def list_available(db: Session = Depends(get_db)):
    return db.query(IjaraContract).filter(IjaraContract.status.in_(["approved", "active"])).all()


@router.get("/my", response_model=list[IjaraResponse])
def my_ijara(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(IjaraContract).filter(IjaraContract.lessee_id == current_user.id).all()


@router.post("/{ijara_id}/approve", response_model=IjaraResponse)
def approve_ijara(
    ijara_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Admin approves an Ijara lease and generates monthly payment schedule."""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    c = db.query(IjaraContract).filter(IjaraContract.id == ijara_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Contract not found")
    if c.status != "pending":
        raise HTTPException(status_code=400, detail="Already processed")

    c.status = "approved"
    c.approved_by = current_user.id
    c.start_date = date.today()

    for i in range(1, c.lease_duration_months + 1):
        payment = IjaraPayment(
            contract_id=c.id, month=i,
            amount=float(c.monthly_rent),
        )
        db.add(payment)

    notify(db, c.lessee_id, "Ijara Approved",
           f"Your lease for '{c.asset_description}' has been approved.", "ijara")
    db.commit()
    db.refresh(c)
    return c


@router.post("/{ijara_id}/pay", response_model=IjaraResponse)
def pay_rent(
    ijara_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Pay the next monthly rent from wallet."""
    c = db.query(IjaraContract).filter(IjaraContract.id == ijara_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Contract not found")
    if c.lessee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your contract")
    if c.status not in ("approved", "active"):
        raise HTTPException(status_code=400, detail="Contract not active")

    next_payment = (
        db.query(IjaraPayment)
        .filter(IjaraPayment.contract_id == c.id, IjaraPayment.status == "pending")
        .order_by(IjaraPayment.month)
        .first()
    )
    if not next_payment:
        raise HTTPException(status_code=400, detail="All payments completed")

    wallet = get_or_create_wallet(db, current_user.id)
    if float(wallet.balance) < float(next_payment.amount):
        raise HTTPException(status_code=400, detail="Insufficient balance")

    wallet.balance = float(wallet.balance) - float(next_payment.amount)
    next_payment.status = "paid"
    next_payment.paid_date = date.today()
    c.status = "active"

    remaining = db.query(IjaraPayment).filter(
        IjaraPayment.contract_id == c.id, IjaraPayment.status == "pending"
    ).count()
    if remaining == 0:
        c.status = "completed"

    tx = Transaction(
        from_user=current_user.id, to_user="platform",
        amount=float(next_payment.amount), type="ijara_rent",
        product_type="ijara", product_id=c.id,
    )
    tx.hashgraph_tx_id = record_transaction_on_hashgraph(
        tx.id, tx.from_user, tx.to_user, float(tx.amount),
        tx.type, tx.product_type, tx.product_id,
    )
    db.add(tx)
    db.commit()
    db.refresh(c)
    return c


@router.post("/{ijara_id}/purchase", response_model=IjaraResponse)
def purchase_asset(
    ijara_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Exercise purchase option at end of lease (Ijara wa Iqtina)."""
    c = db.query(IjaraContract).filter(IjaraContract.id == ijara_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Contract not found")
    if c.lessee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your contract")
    if c.status != "completed":
        raise HTTPException(status_code=400, detail="Lease must be completed first")

    wallet = get_or_create_wallet(db, current_user.id)
    price = float(c.purchase_option_price)
    if float(wallet.balance) < price:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    wallet.balance = float(wallet.balance) - price
    c.status = "purchased"

    tx = Transaction(
        from_user=current_user.id, to_user="platform",
        amount=price, type="ijara_purchase",
        product_type="ijara", product_id=c.id,
    )
    tx.hashgraph_tx_id = record_transaction_on_hashgraph(
        tx.id, tx.from_user, tx.to_user, price,
        tx.type, tx.product_type, tx.product_id,
    )
    db.add(tx)
    notify(db, current_user.id, "Asset Purchased",
           f"You now own '{c.asset_description}'. Congratulations!", "ijara")
    db.commit()
    db.refresh(c)
    return c
