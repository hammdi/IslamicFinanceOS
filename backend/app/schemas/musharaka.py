from datetime import datetime

from pydantic import BaseModel


class MusharakaCreate(BaseModel):
    project_name: str
    description: str
    target_amount: float
    expected_profit_percent: float
    duration_months: int


class MusharakaInvest(BaseModel):
    amount: float


class ProfitDistribution(BaseModel):
    total_profit: float


class MusharakaInvestmentResponse(BaseModel):
    id: str
    investor_id: str
    amount: float
    invested_at: datetime

    model_config = {"from_attributes": True}


class MusharakaResponse(BaseModel):
    id: str
    entrepreneur_id: str
    project_name: str
    description: str
    target_amount: float
    current_amount: float
    expected_profit_percent: float
    duration_months: int
    status: str
    created_at: datetime
    investments: list[MusharakaInvestmentResponse] = []

    model_config = {"from_attributes": True}
