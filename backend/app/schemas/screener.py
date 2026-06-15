from datetime import datetime
from pydantic import BaseModel


class ScreenRequest(BaseModel):
    name: str
    ticker: str | None = None
    sector: str | None = None
    country: str | None = None
    debt_to_assets: float = 0
    interest_income_ratio: float = 0
    receivables_to_assets: float = 0
    business_activities: list[str] = []


class CompanyResponse(BaseModel):
    id: str
    name: str
    ticker: str | None
    sector: str | None
    country: str | None
    halal_status: str
    screening_report: dict | None
    last_screened: datetime
    model_config = {"from_attributes": True}
