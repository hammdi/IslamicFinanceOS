from datetime import datetime

from pydantic import BaseModel


class QardRequest(BaseModel):
    amount: float
    purpose: str


class QardFund(BaseModel):
    amount: float


class QardRepay(BaseModel):
    amount: float


class QardContributionResponse(BaseModel):
    id: str
    lender_id: str
    amount: float
    date: datetime

    model_config = {"from_attributes": True}


class QardResponse(BaseModel):
    id: str
    borrower_id: str
    amount: float
    purpose: str
    status: str
    funded_at: datetime | None
    repayment_schedule: dict | None
    created_at: datetime
    contributions: list[QardContributionResponse] = []

    model_config = {"from_attributes": True}
