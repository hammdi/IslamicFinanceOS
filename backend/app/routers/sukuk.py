from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth.jwt import get_current_user
from app.database import get_db
from app.models.sukuk import SukukOffering, SukukHolding
from app.models.transaction import Transaction
from app.models.user import User
from app.services.hashgraph import record_transaction_on_hashgraph
from app.services.notifications import notify
from app.routers.wallet import get_or_create_wallet

router = APIRouter(prefix="/sukuk", tags=["Sukuk (Islamic Bonds)"])


class SukukCreate(BaseModel):
    name: str
    description: str
    asset_type: str  # real_estate | infrastructure | trade | project | mixed
    total_value: float
    unit_price: float
    expected_return_percent: float
    maturity_months: int


class SukukBuy(BaseModel):
    units: int


@router.post("/create")
def create_sukuk(payload: SukukCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Issue a new Sukuk offering backed by real assets."""
    total_units = int(payload.total_value / payload.unit_price)
    offering = SukukOffering(
        issuer_id=current_user.id, name=payload.name, description=payload.description,
        asset_type=payload.asset_type, total_value=payload.total_value,
        unit_price=payload.unit_price, total_units=total_units,
        expected_return_percent=payload.expected_return_percent,
        maturity_months=payload.maturity_months,
    )
    db.add(offering)
    db.commit()
    db.refresh(offering)
    return _offering_resp(offering)


@router.get("/available")
def list_offerings(db: Session = Depends(get_db)):
    return [_offering_resp(o) for o in db.query(SukukOffering).filter(SukukOffering.status == "open").all()]


@router.get("/my")
def my_holdings(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    holdings = db.query(SukukHolding).filter(SukukHolding.investor_id == current_user.id).all()
    result = []
    for h in holdings:
        o = db.query(SukukOffering).filter(SukukOffering.id == h.offering_id).first()
        result.append({
            "holding_id": h.id, "offering": o.name if o else "", "units": h.units,
            "invested": float(h.total_invested), "returns": float(h.returns_received),
            "status": o.status if o else "unknown",
        })
    return result


@router.post("/{offering_id}/buy")
def buy_sukuk(offering_id: str, payload: SukukBuy, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Buy units of a Sukuk offering from wallet."""
    offering = db.query(SukukOffering).filter(SukukOffering.id == offering_id).first()
    if not offering:
        raise HTTPException(status_code=404, detail="Offering not found")
    if offering.status != "open":
        raise HTTPException(status_code=400, detail="Offering not open")
    available = offering.total_units - offering.sold_units
    if payload.units > available:
        raise HTTPException(status_code=400, detail=f"Only {available} units available")

    total_cost = round(payload.units * float(offering.unit_price), 2)
    wallet = get_or_create_wallet(db, current_user.id)
    if float(wallet.balance) < total_cost:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    wallet.balance = float(wallet.balance) - total_cost
    offering.sold_units += payload.units
    if offering.sold_units >= offering.total_units:
        offering.status = "funded"

    holding = SukukHolding(
        offering_id=offering.id, investor_id=current_user.id,
        units=payload.units, total_invested=total_cost,
    )
    db.add(holding)

    tx = Transaction(
        from_user=current_user.id, to_user=offering.issuer_id,
        amount=total_cost, type="sukuk_buy",
        product_type="sukuk", product_id=offering.id,
    )
    tx.hashgraph_tx_id = record_transaction_on_hashgraph(
        tx.id, tx.from_user, tx.to_user, total_cost, tx.type, tx.product_type, tx.product_id)
    db.add(tx)
    notify(db, current_user.id, "Sukuk Purchased",
           f"Bought {payload.units} units of '{offering.name}' for {total_cost} USD.", "sukuk")
    db.commit()
    db.refresh(offering)
    return _offering_resp(offering)


@router.post("/{offering_id}/distribute-returns")
def distribute_returns(
    offering_id: str, total_return: float,
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    """Issuer distributes returns proportionally to all holders."""
    offering = db.query(SukukOffering).filter(SukukOffering.id == offering_id).first()
    if not offering:
        raise HTTPException(status_code=404, detail="Offering not found")
    if offering.issuer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the issuer can distribute")

    offering.status = "active"
    for holding in offering.holdings:
        proportion = holding.units / offering.sold_units
        share = round(total_return * proportion, 2)
        wallet = get_or_create_wallet(db, holding.investor_id)
        wallet.balance = float(wallet.balance) + share
        holding.returns_received = float(holding.returns_received) + share
        tx = Transaction(
            from_user=current_user.id, to_user=holding.investor_id,
            amount=share, type="sukuk_return",
            product_type="sukuk", product_id=offering.id,
        )
        tx.hashgraph_tx_id = record_transaction_on_hashgraph(
            tx.id, tx.from_user, tx.to_user, share, tx.type, tx.product_type, tx.product_id)
        db.add(tx)
        notify(db, holding.investor_id, "Sukuk Returns",
               f"Received {share} USD returns from '{offering.name}'.", "sukuk")
    db.commit()
    return {"distributed": total_return, "holders": len(offering.holdings)}


def _offering_resp(o):
    return {
        "id": o.id, "name": o.name, "description": o.description,
        "asset_type": o.asset_type, "total_value": float(o.total_value),
        "unit_price": float(o.unit_price), "total_units": o.total_units,
        "sold_units": o.sold_units, "available_units": o.total_units - o.sold_units,
        "expected_return_percent": float(o.expected_return_percent),
        "maturity_months": o.maturity_months, "status": o.status,
    }
