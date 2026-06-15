from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth.jwt import get_current_user
from app.database import get_db
from app.models.faraid import FaraidCalculation
from app.models.user import User

router = APIRouter(prefix="/faraid", tags=["Faraid (Islamic Inheritance)"])


class FaraidRequest(BaseModel):
    estate_value: float
    debts: float = 0
    funeral_costs: float = 0
    wasiyya: float = 0  # bequest, max 1/3 of estate
    has_husband: bool = False
    has_wife: int = 0  # 0-4
    sons: int = 0
    daughters: int = 0
    has_father: bool = False
    has_mother: bool = False
    brothers: int = 0
    sisters: int = 0


def calculate_shares(req: FaraidRequest) -> dict:
    """
    Calculate Islamic inheritance shares per Quran (4:11-12, 4:176).
    Simplified implementation covering the most common cases.
    """
    net = req.estate_value - req.debts - req.funeral_costs
    wasiyya = min(req.wasiyya, net / 3)  # Max 1/3
    distributable = net - wasiyya

    has_children = req.sons > 0 or req.daughters > 0
    shares = {}
    allocated = 0

    # Spouse share
    if req.has_husband:
        share = distributable * (1/4 if has_children else 1/2)
        shares["husband"] = {"fraction": "1/4" if has_children else "1/2",
                             "amount": round(share, 2), "count": 1}
        allocated += share

    if req.has_wife > 0:
        share = distributable * (1/8 if has_children else 1/4)
        per_wife = round(share / req.has_wife, 2)
        shares["wife"] = {"fraction": "1/8" if has_children else "1/4",
                          "amount": round(share, 2), "each": per_wife, "count": req.has_wife}
        allocated += share

    # Parents
    if req.has_father:
        if has_children:
            share = distributable * (1/6)
            shares["father"] = {"fraction": "1/6", "amount": round(share, 2), "count": 1}
            allocated += share
        # If no children, father gets residuary (handled below)

    if req.has_mother:
        if has_children or req.brothers + req.sisters >= 2:
            share = distributable * (1/6)
        else:
            share = distributable * (1/3)
        shares["mother"] = {"fraction": "1/6" if has_children else "1/3",
                            "amount": round(share, 2), "count": 1}
        allocated += share

    # Children
    residuary = distributable - allocated
    if req.sons > 0 and req.daughters > 0:
        # Sons get 2x daughters (2:1 ratio)
        total_parts = req.sons * 2 + req.daughters
        per_part = residuary / total_parts if total_parts > 0 else 0
        son_share = round(per_part * 2, 2)
        daughter_share = round(per_part, 2)
        shares["sons"] = {"fraction": "residuary (2:1)", "amount": round(son_share * req.sons, 2),
                          "each": son_share, "count": req.sons}
        shares["daughters"] = {"fraction": "residuary (2:1)", "amount": round(daughter_share * req.daughters, 2),
                               "each": daughter_share, "count": req.daughters}
    elif req.sons > 0:
        per_son = round(residuary / req.sons, 2)
        shares["sons"] = {"fraction": "residuary", "amount": round(residuary, 2),
                          "each": per_son, "count": req.sons}
    elif req.daughters > 0:
        if req.daughters == 1:
            share = distributable * (1/2)
            shares["daughters"] = {"fraction": "1/2", "amount": round(share, 2),
                                   "each": round(share, 2), "count": 1}
            residuary -= share
        else:
            share = distributable * (2/3)
            per_d = round(share / req.daughters, 2)
            shares["daughters"] = {"fraction": "2/3", "amount": round(share, 2),
                                   "each": per_d, "count": req.daughters}
            residuary -= share

        # Father as residuary if no sons
        if req.has_father and "father" not in shares:
            shares["father"] = {"fraction": "residuary", "amount": round(max(residuary, 0), 2), "count": 1}
    else:
        # No children — siblings
        if req.has_father and "father" not in shares:
            shares["father"] = {"fraction": "residuary", "amount": round(residuary, 2), "count": 1}
        elif req.brothers > 0 or req.sisters > 0:
            if req.brothers > 0 and req.sisters > 0:
                total_parts = req.brothers * 2 + req.sisters
                per_part = residuary / total_parts if total_parts > 0 else 0
                shares["brothers"] = {"fraction": "residuary (2:1)", "amount": round(per_part * 2 * req.brothers, 2),
                                      "each": round(per_part * 2, 2), "count": req.brothers}
                shares["sisters"] = {"fraction": "residuary (2:1)", "amount": round(per_part * req.sisters, 2),
                                     "each": round(per_part, 2), "count": req.sisters}
            elif req.brothers > 0:
                per_b = round(residuary / req.brothers, 2)
                shares["brothers"] = {"fraction": "residuary", "amount": round(residuary, 2),
                                      "each": per_b, "count": req.brothers}
            elif req.sisters == 1:
                shares["sisters"] = {"fraction": "1/2", "amount": round(distributable * 0.5, 2),
                                     "each": round(distributable * 0.5, 2), "count": 1}
            else:
                shares["sisters"] = {"fraction": "2/3", "amount": round(distributable * 2/3, 2),
                                     "each": round(distributable * 2/3 / req.sisters, 2), "count": req.sisters}

    return {
        "estate_value": req.estate_value,
        "debts": req.debts,
        "funeral_costs": req.funeral_costs,
        "wasiyya": wasiyya,
        "net_estate": net,
        "distributable": round(distributable, 2),
        "shares": shares,
    }


@router.post("/calculate")
def calculate_faraid(
    payload: FaraidRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Calculate Islamic inheritance distribution."""
    result = calculate_shares(payload)

    heirs = {
        "husband": payload.has_husband, "wife": payload.has_wife,
        "sons": payload.sons, "daughters": payload.daughters,
        "father": payload.has_father, "mother": payload.has_mother,
        "brothers": payload.brothers, "sisters": payload.sisters,
    }

    calc = FaraidCalculation(
        user_id=current_user.id,
        estate_value=payload.estate_value,
        debts=payload.debts,
        funeral_costs=payload.funeral_costs,
        wasiyya=result["wasiyya"],
        net_estate=result["net_estate"],
        heirs=heirs,
        distribution=result["shares"],
    )
    db.add(calc)
    db.commit()

    return result


@router.get("/history")
def faraid_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    calcs = db.query(FaraidCalculation).filter(
        FaraidCalculation.user_id == current_user.id
    ).order_by(FaraidCalculation.calculated_at.desc()).limit(10).all()
    return [
        {"id": c.id, "estate_value": float(c.estate_value), "net_estate": float(c.net_estate),
         "heirs": c.heirs, "distribution": c.distribution, "calculated_at": c.calculated_at.isoformat()}
        for c in calcs
    ]
