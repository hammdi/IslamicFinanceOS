from datetime import datetime

from pydantic import BaseModel


class WaqfCreate(BaseModel):
    name: str
    description: str
    category: str  # mosque, school, hospital, water, orphanage, general
    target_amount: float


class WaqfDonate(BaseModel):
    amount: float


class WaqfDonationResponse(BaseModel):
    id: str
    donor_id: str
    amount: float
    donated_at: datetime

    model_config = {"from_attributes": True}


class WaqfResponse(BaseModel):
    id: str
    creator_id: str
    name: str
    description: str
    category: str
    target_amount: float
    current_amount: float
    donors_count: int
    status: str
    created_at: datetime
    donations: list[WaqfDonationResponse] = []

    model_config = {"from_attributes": True}
