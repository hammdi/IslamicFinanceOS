from datetime import datetime, date
from pydantic import BaseModel


class CampaignCreate(BaseModel):
    title: str
    description: str
    category: str
    target_amount: float
    deadline: date | None = None


class DonateRequest(BaseModel):
    amount: float
    anonymous: bool = False
    message: str = ""


class CampaignUpdateCreate(BaseModel):
    title: str
    description: str
    amount_spent: float = 0


class CampaignUpdateResponse(BaseModel):
    id: str
    title: str
    description: str
    amount_spent: float
    created_at: datetime
    model_config = {"from_attributes": True}


class DonationResponse(BaseModel):
    id: str
    donor_id: str
    amount: float
    anonymous: bool
    message: str | None
    donated_at: datetime
    model_config = {"from_attributes": True}


class CampaignResponse(BaseModel):
    id: str
    creator_id: str
    title: str
    description: str
    category: str
    target_amount: float
    current_amount: float
    donors_count: int
    deadline: date | None
    status: str
    verified: bool
    created_at: datetime
    donations: list[DonationResponse] = []
    updates: list[CampaignUpdateResponse] = []
    model_config = {"from_attributes": True}
