from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


# User Schemas
class UserCreate(BaseModel):
    name: str
    avatar_color: Optional[str] = None


class UserUpdate(BaseModel):
    name: Optional[str] = None
    avatar_color: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    name: str
    avatar_color: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class UserDetailResponse(UserResponse):
    watchlists: List["WatchlistResponse"] = []
    accounts: List["BrokerageAccountResponse"] = []


# Brokerage Account Schemas
class BrokerageAccountCreate(BaseModel):
    user_id: int
    name: str
    account_type: str
    broker_name: Optional[str] = None


class BrokerageAccountUpdate(BaseModel):
    name: Optional[str] = None
    account_type: Optional[str] = None
    broker_name: Optional[str] = None


class BrokerageAccountResponse(BaseModel):
    id: int
    user_id: int
    name: str
    account_type: str
    broker_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Holding Schemas
class HoldingCreate(BaseModel):
    user_id: int
    account_id: int
    ticker: str
    quantity: float
    entry_price: float
    notes: Optional[str] = None


class HoldingUpdate(BaseModel):
    quantity: Optional[float] = None
    entry_price: Optional[float] = None
    notes: Optional[str] = None


class HoldingResponse(BaseModel):
    id: int
    user_id: int
    account_id: int
    ticker: str
    quantity: float
    entry_price: float
    entry_date: datetime
    notes: Optional[str] = None

    class Config:
        from_attributes = True


# Stock In Watchlist Schemas
class StockInWatchlistCreate(BaseModel):
    ticker: str
    buy_reasons: Optional[str] = None
    sell_conditions: Optional[str] = None
    buy_price: Optional[float] = None
    sell_price: Optional[float] = None
    stop_loss_pct: Optional[float] = None


class StockInWatchlistUpdate(BaseModel):
    buy_reasons: Optional[str] = None
    sell_conditions: Optional[str] = None
    buy_price: Optional[float] = None
    sell_price: Optional[float] = None
    stop_loss_pct: Optional[float] = None


class StockInWatchlistResponse(BaseModel):
    id: int
    watchlist_id: int
    ticker: str
    buy_reasons: Optional[str] = None
    sell_conditions: Optional[str] = None
    buy_price: Optional[float] = None
    sell_price: Optional[float] = None
    stop_loss_pct: Optional[float] = None
    added_date: datetime

    class Config:
        from_attributes = True


# Watchlist Schemas
class WatchlistCreate(BaseModel):
    name: str
    description: Optional[str] = None


class WatchlistUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class WatchlistResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    owner_user_id: int
    created_date: datetime

    class Config:
        from_attributes = True


class WatchlistDetailResponse(WatchlistResponse):
    stocks: List[StockInWatchlistResponse] = []


# Stock Data Schemas (from Alpha Vantage)
class StockQuoteResponse(BaseModel):
    ticker: str
    company_name: Optional[str] = None
    current_price: float
    daily_change_pct: float
    volume: int
    timestamp: datetime


class StockDetailResponse(BaseModel):
    ticker: str
    company_name: Optional[str] = None
    current_price: float
    daily_change_pct: float
    volume: int
    p_e_ratio: Optional[float] = None
    market_cap: Optional[str] = None
    dividend_yield: Optional[float] = None
    week_52_high: Optional[float] = None
    week_52_low: Optional[float] = None
    timestamp: datetime


class StockHistoryPoint(BaseModel):
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: int


# Search Results
class StockSearchResult(BaseModel):
    ticker: str
    name: str
    type: str
    region: str


# Sell Transaction Schemas
class SellTransactionCreate(BaseModel):
    account_id: int
    ticker: str
    shares_sold: float
    price_received: float
    sell_date: Optional[datetime] = None
    notes: Optional[str] = None


class SellTransactionUpdate(BaseModel):
    shares_sold: Optional[float] = None
    price_received: Optional[float] = None
    sell_date: Optional[datetime] = None
    notes: Optional[str] = None


class SellTransactionResponse(BaseModel):
    id: int
    user_id: int
    account_id: int
    ticker: str
    shares_sold: float
    price_received: float
    sell_date: datetime
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Update forward references
UserDetailResponse.model_rebuild()
WatchlistDetailResponse.model_rebuild()
