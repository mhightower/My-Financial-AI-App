from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import User, BrokerageAccount, SellTransaction
from ..schemas import (
    SellTransactionCreate,
    SellTransactionUpdate,
    SellTransactionResponse,
)

router = APIRouter(prefix="/api/v1/sell-transactions", tags=["sell-transactions"])


@router.post("", response_model=SellTransactionResponse, status_code=status.HTTP_201_CREATED)
def create_sell_transaction(
    transaction: SellTransactionCreate,
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Create a new sell transaction"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found"
        )

    account = db.query(BrokerageAccount).filter(BrokerageAccount.id == transaction.account_id).first()
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Account with id {transaction.account_id} not found"
        )

    db_transaction = SellTransaction(
        user_id=user_id,
        account_id=transaction.account_id,
        ticker=transaction.ticker.upper(),
        shares_sold=transaction.shares_sold,
        price_received=transaction.price_received,
        sell_date=transaction.sell_date,
        notes=transaction.notes
    )
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction


@router.get("/{transaction_id}", response_model=SellTransactionResponse)
def get_sell_transaction(transaction_id: int, db: Session = Depends(get_db)):
    """Get a specific sell transaction"""
    transaction = db.query(SellTransaction).filter(SellTransaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sell transaction with id {transaction_id} not found"
        )
    return transaction


@router.put("/{transaction_id}", response_model=SellTransactionResponse)
def update_sell_transaction(
    transaction_id: int,
    transaction_update: SellTransactionUpdate,
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Update a sell transaction"""
    transaction = db.query(SellTransaction).filter(SellTransaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sell transaction with id {transaction_id} not found"
        )
    if transaction.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this transaction"
        )

    if transaction_update.shares_sold is not None:
        transaction.shares_sold = transaction_update.shares_sold
    if transaction_update.price_received is not None:
        transaction.price_received = transaction_update.price_received
    if transaction_update.sell_date is not None:
        transaction.sell_date = transaction_update.sell_date
    if transaction_update.notes is not None:
        transaction.notes = transaction_update.notes

    db.commit()
    db.refresh(transaction)
    return transaction


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_sell_transaction(transaction_id: int, user_id: int = Query(...), db: Session = Depends(get_db)):
    """Delete a sell transaction"""
    transaction = db.query(SellTransaction).filter(SellTransaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sell transaction with id {transaction_id} not found"
        )
    if transaction.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this transaction"
        )
    db.delete(transaction)
    db.commit()
    return None


@router.get("/users/{user_id}/transactions", response_model=List[SellTransactionResponse])
def get_user_sell_transactions(user_id: int, db: Session = Depends(get_db)):
    """Get all sell transactions for a user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found"
        )

    transactions = db.query(SellTransaction).filter(SellTransaction.user_id == user_id).all()
    return transactions
