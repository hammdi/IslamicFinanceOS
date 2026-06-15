from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.jwt import get_current_user
from app.database import get_db
from app.models.screener import HalalCompany, ScreeningHistory
from app.models.user import User
from app.schemas.screener import ScreenRequest, CompanyResponse

router = APIRouter(prefix="/screener", tags=["Halal Investment Screener"])

HARAM_ACTIVITIES = [
    "alcohol", "pork", "gambling", "tobacco",
    "adult_content", "conventional_banking", "weapons",
]


def screen_company(data: ScreenRequest) -> tuple[str, dict]:
    """
    Screen a company based on Sharia criteria.

    Business screening: reject if involved in haram activities.
    Financial screening:
      - Debt/Assets < 33%
      - Interest income < 5% of revenue
      - Accounts receivable/Assets < 49%
    """
    issues = []
    # Business activity screening
    for activity in data.business_activities:
        if activity.lower() in HARAM_ACTIVITIES:
            issues.append(f"Haram activity: {activity}")

    # Financial ratio screening
    if data.debt_to_assets >= 33:
        issues.append(f"Debt/Assets ratio too high: {data.debt_to_assets}% (max 33%)")
    if data.interest_income_ratio >= 5:
        issues.append(f"Interest income too high: {data.interest_income_ratio}% (max 5%)")
    if data.receivables_to_assets >= 49:
        issues.append(f"Receivables/Assets too high: {data.receivables_to_assets}% (max 49%)")

    if any("Haram activity" in i for i in issues):
        status = "haram"
    elif issues:
        status = "doubtful"
    else:
        status = "halal"

    report = {
        "business_activities": data.business_activities,
        "debt_to_assets": data.debt_to_assets,
        "interest_income_ratio": data.interest_income_ratio,
        "receivables_to_assets": data.receivables_to_assets,
        "issues": issues,
        "criteria": {
            "business_clean": not any("Haram" in i for i in issues),
            "debt_ratio_ok": data.debt_to_assets < 33,
            "interest_ok": data.interest_income_ratio < 5,
            "receivables_ok": data.receivables_to_assets < 49,
        },
    }
    return status, report


@router.post("/check", response_model=CompanyResponse)
def check_company(
    payload: ScreenRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Screen a company/stock for Sharia compliance."""
    status, report = screen_company(payload)

    # Check if already in database
    existing = None
    if payload.ticker:
        existing = db.query(HalalCompany).filter(HalalCompany.ticker == payload.ticker).first()

    if existing:
        existing.halal_status = status
        existing.screening_report = report
        company = existing
    else:
        company = HalalCompany(
            name=payload.name,
            ticker=payload.ticker,
            sector=payload.sector,
            country=payload.country,
            halal_status=status,
            screening_report=report,
        )
        db.add(company)
    db.flush()

    history = ScreeningHistory(
        company_id=company.id,
        screened_by=current_user.id,
        result=status,
        rationale="; ".join(report["issues"]) if report["issues"] else "All criteria passed",
    )
    db.add(history)
    db.commit()
    db.refresh(company)
    return company


@router.get("/halal-list", response_model=list[CompanyResponse])
def halal_list(db: Session = Depends(get_db)):
    """List all pre-screened halal companies."""
    return db.query(HalalCompany).filter(HalalCompany.halal_status == "halal").all()


@router.get("/all", response_model=list[CompanyResponse])
def all_companies(db: Session = Depends(get_db)):
    """List all screened companies."""
    return db.query(HalalCompany).order_by(HalalCompany.last_screened.desc()).all()


@router.get("/{ticker}", response_model=CompanyResponse)
def get_by_ticker(ticker: str, db: Session = Depends(get_db)):
    """Get screening report for a company by ticker."""
    company = db.query(HalalCompany).filter(HalalCompany.ticker == ticker).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company
