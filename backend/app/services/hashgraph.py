"""
Hashgraph Audit Service

Records transaction hashes on Hedera Hashgraph for immutable audit trails.
In production, this would use the Hedera SDK to submit consensus messages.
For the prototype, we generate a deterministic hash as a placeholder.
"""

import hashlib
import json
from datetime import datetime

from app.config import settings


def record_transaction_on_hashgraph(
    tx_id: str,
    from_user: str,
    to_user: str,
    amount: float,
    tx_type: str,
    product_type: str,
    product_id: str,
) -> str | None:
    """
    Record a transaction on Hashgraph for immutable auditing.

    Returns the Hashgraph transaction ID, or a local hash if
    Hashgraph credentials are not configured.
    """
    payload = json.dumps(
        {
            "tx_id": tx_id,
            "from": from_user,
            "to": to_user,
            "amount": str(amount),
            "type": tx_type,
            "product_type": product_type,
            "product_id": product_id,
            "timestamp": datetime.utcnow().isoformat(),
        },
        sort_keys=True,
    )

    if settings.HASHGRAPH_ACCOUNT_ID and settings.HASHGRAPH_PRIVATE_KEY:
        # Production: submit to Hedera Consensus Service
        # from hedera import Client, TopicMessageSubmitTransaction
        # client = Client.for_testnet()
        # client.set_operator(settings.HASHGRAPH_ACCOUNT_ID, settings.HASHGRAPH_PRIVATE_KEY)
        # tx = TopicMessageSubmitTransaction().set_message(payload)
        # response = tx.execute(client)
        # return str(response.transaction_id)
        pass

    # Development fallback: generate a deterministic hash
    tx_hash = hashlib.sha256(payload.encode()).hexdigest()
    return f"local:{tx_hash[:16]}"
