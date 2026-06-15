from datetime import datetime

from pydantic import BaseModel


class TransactionResponse(BaseModel):
    id: str
    from_user: str
    to_user: str
    amount: float
    type: str
    product_type: str
    product_id: str
    hashgraph_tx_id: str | None
    timestamp: datetime

    model_config = {"from_attributes": True}
