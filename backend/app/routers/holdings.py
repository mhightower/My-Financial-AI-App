from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import User, BrokerageAccount, Holding
from ..schemas import (
    BrokerageAccountCreate,
    BrokerageAccountUpdate,
    BrokerageAccountResponse,
    HoldingCreate,
    HoldingUpdate,
    HoldingResponse,
)

router = APIRouter(tags=["accounts and holdings"])


# Brokerage Account Routes
@router.post("/api/v1/accounts", response_model=BrokerageAccountResponse, status_code=status.HTTP_201_CREATED)
def create_account(
    account: BrokerageAccountCreate,
    db: Session = Depends(get_db)
):
    """Create a new brokerage account"""
    user = db.query(User).filter(User.id == account.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {account.user_id} not found"
        )

    db_account = BrokerageAccount(
        user_id=account.user_id,
        name=account.name,
        account_type=account.account_type,
        broker_name=account.broker_name
    )
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account


@router.get("/api/v1/accounts/{account_id}", response_model=BrokerageAccountResponse)
def get_account(account_id: int, db: Session = Depends(get_db)):
    """Get a specific brokerage account"""
    account = db.query(BrokerageAccount).filter(BrokerageAccount.id == account_id).first()
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Account with id {account_id} not found"
        )
    return account


@router.put("/api/v1/accounts/{account_id}", response_model=BrokerageAccountResponse)
def update_account(
    account_id: int,
    account_update: BrokerageAccountUpdate,
    db: Session = Depends(get_db)
):
    """Update a brokerage account"""
    account = db.query(BrokerageAccount).filter(BrokerageAccount.id == account_id).first()
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Account with id {account_id} not found"
        )

    if account_update.name:
        account.name = account_update.name
    if account_update.account_type:
        account.account_type = account_update.account_type
    if account_update.broker_name is not None:
        account.broker_name = account_update.broker_name

    db.commit()
    db.refresh(account)
    return account


@router.delete("/api/v1/accounts/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(account_id: int, db: Session = Depends(get_db)):
    """Delete a brokerage account"""
    account = db.query(BrokerageAccount).filter(BrokerageAccount.id == account_id).first()
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Account with id {account_id} not found"
        )
    db.delete(account)
    db.commit()
    return None


@router.get("/api/v1/users/{user_id}/accounts", response_model=List[BrokerageAccountResponse])
def get_user_accounts(user_id: int, db: Session = Depends(get_db)):
    """Get all accounts for a user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found"
        )
    accounts = db.query(BrokerageAccount).filter(BrokerageAccount.user_id == user_id).all()
    return accounts


# Holding Routes
@router.post("/api/v1/holdings", response_model=HoldingResponse, status_code=status.HTTP_201_CREATED)
def create_holding(
    holding: HoldingCreate,
    db: Session = Depends(get_db)
):
    """Create a new holding (log a trade)"""
    # Validate user exists
    user = db.query(User).filter(User.id == holding.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {holding.user_id} not found"
        )

    # Validate account exists and belongs to user
    account = db.query(BrokerageAccount).filter(
        BrokerageAccount.id == holding.account_id,
        BrokerageAccount.user_id == holding.user_id
    ).first()
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Account with id {holding.account_id} not found"
        )

    # Validate quantity and price
    if holding.quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quantity must be greater than 0"
        )
    if holding.entry_price <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Entry price must be greater than 0"
        )

    db_holding = Holding(
        user_id=holding.user_id,
        account_id=holding.account_id,
        ticker=holding.ticker,
        quantity=holding.quantity,
        entry_price=holding.entry_price,
        notes=holding.notes
    )
    db.add(db_holding)
    db.commit()
    db.refresh(db_holding)
    return db_holding


@router.get("/api/v1/holdings/{holding_id}", response_model=HoldingResponse)
def get_holding(holding_id: int, db: Session = Depends(get_db)):
    """Get a specific holding"""
    holding = db.query(Holding).filter(Holding.id == holding_id).first()
    if not holding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Holding with id {holding_id} not found"
        )
    return holding


@router.put("/api/v1/holdings/{holding_id}", response_model=HoldingResponse)
def update_holding(
    holding_id: int,
    holding_update: HoldingUpdate,
    db: Session = Depends(get_db)
):
    """Update a holding"""
    holding = db.query(Holding).filter(Holding.id == holding_id).first()
    if not holding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Holding with id {holding_id} not found"
        )

    if holding_update.quantity is not None:
        if holding_update.quantity <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Quantity must be greater than 0"
            )
        holding.quantity = holding_update.quantity

    if holding_update.entry_price is not None:
        if holding_update.entry_price <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Entry price must be greater than 0"
            )
        holding.entry_price = holding_update.entry_price

    if holding_update.notes is not None:
        holding.notes = holding_update.notes

    db.commit()
    db.refresh(holding)
    return holding


@router.delete("/api/v1/holdings/{holding_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_holding(holding_id: int, db: Session = Depends(get_db)):
    """Delete a holding (close position)"""
    holding = db.query(Holding).filter(Holding.id == holding_id).first()
    if not holding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Holding with id {holding_id} not found"
        )
    db.delete(holding)
    db.commit()
    return None


@router.get("/api/v1/users/{user_id}/holdings", response_model=List[HoldingResponse])
def get_user_holdings(user_id: int, db: Session = Depends(get_db)):
    """Get all holdings for a user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found"
        )
    holdings = db.query(Holding).filter(Holding.user_id == user_id).all()
    return holdings
