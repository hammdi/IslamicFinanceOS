from datetime import datetime, date
from pydantic import BaseModel


class IjaraRequest(BaseModel):
    asset_description: str
    asset_value: float
    monthly_rent: float
    lease_duration_months: int
    purchase_option_price: float


class IjaraPaymentResponse(BaseModel):
    id: str
    month: int
    amount: float
    paid_date: date | None
    status: str
    model_config = {"from_attributes": True}


class IjaraResponse(BaseModel):
    id: str
    lessee_id: str
    asset_description: str
    asset_value: float
    monthly_rent: float
    lease_duration_months: int
    purchase_option_price: float
    status: str
    approved_by: str | None
    start_date: date | None
    created_at: datetime
    payments: list[IjaraPaymentResponse] = []
    model_config = {"from_attributes": True}
