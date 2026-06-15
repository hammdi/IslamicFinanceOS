from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.jwt import get_current_user
from app.database import get_db
from app.models.wallet import Wallet
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.wallet import WalletResponse, WalletDeposit, WalletWithdraw, WalletTransfer
from app.services.hashgraph import record_transaction_on_hashgraph
from app.services.notifications import notify

router = APIRouter(prefix="/wallet", tags=["Wallet"])


def get_or_create_wallet(db: Session, user_id: str) -> Wallet:
    wallet = db.query(Wallet).filter(Wallet.user_id == user_id).first()
    if not wallet:
        wallet = Wallet(user_id=user_id)
        db.add(wallet)
        db.flush()
    return wallet


@router.get("/", response_model=WalletResponse)
def get_wallet(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get current user's wallet balance."""
    wallet = get_or_create_wallet(db, current_user.id)
    db.commit()
    return wallet


@router.post("/deposit", response_model=WalletResponse)
def deposit(
    payload: WalletDeposit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Deposit funds into wallet."""
    if payload.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    wallet = get_or_create_wallet(db, current_user.id)
    wallet.balance = float(wallet.balance) + payload.amount
    wallet.total_deposited = float(wallet.total_deposited) + payload.amount

    tx = Transaction(
        from_user="external",
        to_user=current_user.id,
        amount=payload.amount,
        type="deposit",
        product_type="wallet",
        product_id=wallet.id,
    )
    tx.hashgraph_tx_id = record_transaction_on_hashgraph(
        tx.id, tx.from_user, tx.to_user, payload.amount,
        tx.type, tx.product_type, tx.product_id,
    )
    db.add(tx)

    notify(db, current_user.id, "Deposit Received",
           f"{payload.amount} USD deposited to your wallet.", "wallet")
    db.commit()
    db.refresh(wallet)
    return wallet


@router.post("/withdraw", response_model=WalletResponse)
def withdraw(
    payload: WalletWithdraw,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Withdraw funds from wallet."""
    if payload.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    wallet = get_or_create_wallet(db, current_user.id)
    if float(wallet.balance) < payload.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    wallet.balance = float(wallet.balance) - payload.amount
    wallet.total_withdrawn = float(wallet.total_withdrawn) + payload.amount

    tx = Transaction(
        from_user=current_user.id,
        to_user="external",
        amount=payload.amount,
        type="withdraw",
        product_type="wallet",
        product_id=wallet.id,
    )
    tx.hashgraph_tx_id = record_transaction_on_hashgraph(
        tx.id, tx.from_user, tx.to_user, payload.amount,
        tx.type, tx.product_type, tx.product_id,
    )
    db.add(tx)

    notify(db, current_user.id, "Withdrawal Processed",
           f"{payload.amount} USD withdrawn from your wallet.", "wallet")
    db.commit()
    db.refresh(wallet)
    return wallet


@router.post("/transfer", response_model=WalletResponse)
def transfer(
    payload: WalletTransfer,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Transfer funds to another user by email."""
    if payload.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    recipient = db.query(User).filter(User.email == payload.to_email).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")
    if recipient.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot transfer to yourself")

    sender_wallet = get_or_create_wallet(db, current_user.id)
    if float(sender_wallet.balance) < payload.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    recipient_wallet = get_or_create_wallet(db, recipient.id)

    sender_wallet.balance = float(sender_wallet.balance) - payload.amount
    recipient_wallet.balance = float(recipient_wallet.balance) + payload.amount

    tx = Transaction(
        from_user=current_user.id,
        to_user=recipient.id,
        amount=payload.amount,
        type="transfer",
        product_type="wallet",
        product_id=sender_wallet.id,
    )
    tx.hashgraph_tx_id = record_transaction_on_hashgraph(
        tx.id, tx.from_user, tx.to_user, payload.amount,
        tx.type, tx.product_type, tx.product_id,
    )
    db.add(tx)

    notify(db, current_user.id, "Transfer Sent",
           f"{payload.amount} USD sent to {recipient.name}.", "wallet")
    notify(db, recipient.id, "Transfer Received",
           f"{payload.amount} USD received from {current_user.name}.", "wallet")
    db.commit()
    db.refresh(sender_wallet)
    return sender_wallet
