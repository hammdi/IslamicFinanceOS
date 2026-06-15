from datetime import datetime

from pydantic import BaseModel


class WalletResponse(BaseModel):
    id: str
    user_id: str
    balance: float
    total_deposited: float
    total_withdrawn: float
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class WalletDeposit(BaseModel):
    amount: float


class WalletWithdraw(BaseModel):
    amount: float


class WalletTransfer(BaseModel):
    to_email: str
    amount: float
    note: str = ""
