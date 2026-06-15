from datetime import datetime

from pydantic import BaseModel


class ZakatCalculateRequest(BaseModel):
    cash_and_savings: float = 0
    investments: float = 0
    gold_silver_value: float = 0
    business_assets: float = 0
    debts_owed_to_you: float = 0
    debts_you_owe: float = 0
    expenses: float = 0


class ZakatCalculationResponse(BaseModel):
    id: str
    user_id: str
    cash_and_savings: float
    investments: float
    gold_silver_value: float
    business_assets: float
    debts_owed_to_you: float
    debts_you_owe: float
    expenses: float
    total_eligible: float
    nisab_value: float
    zakat_due: float
    is_above_nisab: bool
    calculated_at: datetime

    model_config = {"from_attributes": True}


class ZakatDistributeRequest(BaseModel):
    calculation_id: str
    amount: float
    category: str  # poor, needy, zakat_workers, new_muslims, debtors, fi_sabilillah, travelers
    recipient_id: str | None = None
    description: str = ""


class ZakatDistributionResponse(BaseModel):
    id: str
    calculation_id: str
    donor_id: str
    recipient_id: str | None
    amount: float
    category: str
    description: str | None
    distributed_at: datetime

    model_config = {"from_attributes": True}
