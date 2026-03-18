
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..database import get_db
from ..logger import logger
from ..models import StockInWatchlist, User, Watchlist
from ..schemas import (
    StockInWatchlistCreate,
    StockInWatchlistResponse,
    StockInWatchlistUpdate,
    WatchlistCreate,
    WatchlistDetailResponse,
    WatchlistResponse,
    WatchlistUpdate,
)

router = APIRouter(prefix="/api/v1/watchlists", tags=["watchlists"])


@router.post("", response_model=WatchlistResponse, status_code=status.HTTP_201_CREATED)
def create_watchlist(
    watchlist: WatchlistCreate,
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Create a new watchlist for a user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found"
        )

    db_watchlist = Watchlist(
        name=watchlist.name,
        description=watchlist.description,
        owner_user_id=user_id
    )
    db.add(db_watchlist)
    db.commit()
    db.refresh(db_watchlist)
    return db_watchlist


@router.get("/{watchlist_id}", response_model=WatchlistDetailResponse)
def get_watchlist(watchlist_id: int, user_id: int = Query(...), db: Session = Depends(get_db)):
    """Get a watchlist with all its stocks"""
    watchlist = db.query(Watchlist).filter(Watchlist.id == watchlist_id).first()
    if not watchlist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Watchlist with id {watchlist_id} not found"
        )
    if watchlist.owner_user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this watchlist"
        )
    return watchlist


@router.put("/{watchlist_id}", response_model=WatchlistResponse)
def update_watchlist(
    watchlist_id: int,
    watchlist_update: WatchlistUpdate,
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Update a watchlist"""
    watchlist = db.query(Watchlist).filter(Watchlist.id == watchlist_id).first()
    if not watchlist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Watchlist with id {watchlist_id} not found"
        )
    if watchlist.owner_user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this watchlist"
        )

    if watchlist_update.name:
        watchlist.name = watchlist_update.name
    if watchlist_update.description is not None:
        watchlist.description = watchlist_update.description

    db.commit()
    db.refresh(watchlist)
    return watchlist


@router.delete("/{watchlist_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_watchlist(watchlist_id: int, user_id: int = Query(...), db: Session = Depends(get_db)):
    """Delete a watchlist"""
    watchlist = db.query(Watchlist).filter(Watchlist.id == watchlist_id).first()
    if not watchlist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Watchlist with id {watchlist_id} not found"
        )
    if watchlist.owner_user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this watchlist"
        )
    db.delete(watchlist)
    db.commit()
    return None


@router.post("/{watchlist_id}/stocks", response_model=StockInWatchlistResponse, status_code=status.HTTP_201_CREATED)
def add_stock_to_watchlist(
    watchlist_id: int,
    stock: StockInWatchlistCreate,
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Add a stock to a watchlist"""
    watchlist = db.query(Watchlist).filter(Watchlist.id == watchlist_id).first()
    if not watchlist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Watchlist with id {watchlist_id} not found"
        )
    if watchlist.owner_user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this watchlist"
        )

    # Check if watchlist already has 15 stocks
    stock_count = db.query(StockInWatchlist).filter(
        StockInWatchlist.watchlist_id == watchlist_id
    ).count()
    if stock_count >= 15:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Watchlist cannot contain more than 15 stocks"
        )

    db_stock = StockInWatchlist(
        watchlist_id=watchlist_id,
        ticker=stock.ticker,
        buy_reasons=stock.buy_reasons,
        sell_conditions=stock.sell_conditions,
        buy_price=stock.buy_price,
        sell_price=stock.sell_price,
        stop_loss_pct=stock.stop_loss_pct,
    )
    try:
        db.add(db_stock)
        db.commit()
        db.refresh(db_stock)
    except IntegrityError as exc:
        db.rollback()
        logger.warning("IntegrityError adding {ticker} to watchlist id={watchlist_id}: {exc}", ticker=stock.ticker, watchlist_id=watchlist_id, exc=exc)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"{stock.ticker} is already in this watchlist"
        )
    return db_stock


@router.get("/{watchlist_id}/stocks/{stock_id}", response_model=StockInWatchlistResponse)
def get_stock_in_watchlist(
    watchlist_id: int,
    stock_id: int,
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Get a specific stock from a watchlist"""
    watchlist = db.query(Watchlist).filter(Watchlist.id == watchlist_id).first()
    if not watchlist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Watchlist with id {watchlist_id} not found"
        )
    if watchlist.owner_user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this watchlist"
        )
    stock = db.query(StockInWatchlist).filter(
        StockInWatchlist.id == stock_id,
        StockInWatchlist.watchlist_id == watchlist_id
    ).first()
    if not stock:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stock not found in watchlist"
        )
    return stock


@router.put("/{watchlist_id}/stocks/{stock_id}", response_model=StockInWatchlistResponse)
def update_stock_in_watchlist(
    watchlist_id: int,
    stock_id: int,
    stock_update: StockInWatchlistUpdate,
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Update a stock in a watchlist"""
    watchlist = db.query(Watchlist).filter(Watchlist.id == watchlist_id).first()
    if not watchlist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Watchlist with id {watchlist_id} not found"
        )
    if watchlist.owner_user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this watchlist"
        )
    stock = db.query(StockInWatchlist).filter(
        StockInWatchlist.id == stock_id,
        StockInWatchlist.watchlist_id == watchlist_id
    ).first()
    if not stock:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stock not found in watchlist"
        )

    if stock_update.buy_reasons is not None:
        stock.buy_reasons = stock_update.buy_reasons
    if stock_update.sell_conditions is not None:
        stock.sell_conditions = stock_update.sell_conditions
    if stock_update.buy_price is not None:
        stock.buy_price = stock_update.buy_price
    if stock_update.sell_price is not None:
        stock.sell_price = stock_update.sell_price
    if stock_update.stop_loss_pct is not None:
        stock.stop_loss_pct = stock_update.stop_loss_pct

    db.commit()
    db.refresh(stock)
    return stock


@router.delete("/{watchlist_id}/stocks/{stock_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_stock_from_watchlist(
    watchlist_id: int,
    stock_id: int,
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Remove a stock from a watchlist"""
    watchlist = db.query(Watchlist).filter(Watchlist.id == watchlist_id).first()
    if not watchlist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Watchlist with id {watchlist_id} not found"
        )
    if watchlist.owner_user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this watchlist"
        )
    stock = db.query(StockInWatchlist).filter(
        StockInWatchlist.id == stock_id,
        StockInWatchlist.watchlist_id == watchlist_id
    ).first()
    if not stock:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stock not found in watchlist"
        )
    db.delete(stock)
    db.commit()
    return None
