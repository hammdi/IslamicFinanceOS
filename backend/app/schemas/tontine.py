from datetime import datetime

from pydantic import BaseModel


class TontineCreate(BaseModel):
    name: str
    monthly_amount: float
    members_count: int


class TontinePay(BaseModel):
    amount: float


class TontineMemberResponse(BaseModel):
    id: str
    user_id: str
    payout_order: int | None
    has_received: bool
    joined_at: datetime

    model_config = {"from_attributes": True}


class TontineResponse(BaseModel):
    id: str
    name: str
    creator_id: str
    monthly_amount: float
    members_count: int
    current_cycle: int
    status: str
    created_at: datetime
    members: list[TontineMemberResponse] = []

    model_config = {"from_attributes": True}
