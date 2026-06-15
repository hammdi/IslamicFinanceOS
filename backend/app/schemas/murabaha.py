from datetime import datetime, date
from pydantic import BaseModel


class MurabahaRequest(BaseModel):
    asset_description: str
    asset_price: float
    platform_margin_percent: float
    installments_count: int


class MurabahaPaymentResponse(BaseModel):
    id: str
    installment_number: int
    amount: float
    due_date: date
    paid_date: date | None
    status: str
    model_config = {"from_attributes": True}


class MurabahaResponse(BaseModel):
    id: str
    client_id: str
    asset_description: str
    asset_price: float
    platform_margin_percent: float
    total_price: float
    installments_count: int
    installment_amount: float
    status: str
    approved_by: str | None
    created_at: datetime
    payments: list[MurabahaPaymentResponse] = []
    model_config = {"from_attributes": True}
