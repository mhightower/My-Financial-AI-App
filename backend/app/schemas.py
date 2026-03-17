from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


# User Schemas
class UserCreate(BaseModel):
    name: str
    avatar_color: Optional[str] = None


class UserUpdate(BaseModel):
    name: Optional[str] = None
    avatar_color: Optional[str] = None


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    avatar_color: Optional[str] = None
    created_at: datetime


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
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    name: str
    account_type: str
    broker_name: Optional[str] = None
    created_at: datetime


# Holding Schemas
class HoldingCreate(BaseModel):
    user_id: int
    account_id: int
    ticker: str
    quantity: float = Field(..., gt=0)
    entry_price: float = Field(..., gt=0)
    notes: Optional[str] = None

    @field_validator("ticker")
    @classmethod
    def uppercase_ticker(cls, v: str) -> str:
        return v.upper().strip()


class HoldingUpdate(BaseModel):
    quantity: Optional[float] = Field(None, gt=0)
    entry_price: Optional[float] = Field(None, gt=0)
    notes: Optional[str] = None


class HoldingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    account_id: int
    ticker: str
    quantity: float
    entry_price: float
    entry_date: datetime
    notes: Optional[str] = None


# Stock In Watchlist Schemas
class StockInWatchlistCreate(BaseModel):
    ticker: str
    buy_reasons: Optional[str] = None
    sell_conditions: Optional[str] = None
    buy_price: Optional[float] = Field(None, gt=0)
    sell_price: Optional[float] = Field(None, gt=0)
    stop_loss_pct: Optional[float] = Field(None, ge=0, le=1)

    @field_validator("ticker")
    @classmethod
    def uppercase_ticker(cls, v: str) -> str:
        return v.upper().strip()


class StockInWatchlistUpdate(BaseModel):
    buy_reasons: Optional[str] = None
    sell_conditions: Optional[str] = None
    buy_price: Optional[float] = Field(None, gt=0)
    sell_price: Optional[float] = Field(None, gt=0)
    stop_loss_pct: Optional[float] = Field(None, ge=0, le=1)


class StockInWatchlistResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    watchlist_id: int
    ticker: str
    buy_reasons: Optional[str] = None
    sell_conditions: Optional[str] = None
    buy_price: Optional[float] = None
    sell_price: Optional[float] = None
    stop_loss_pct: Optional[float] = None
    added_date: datetime


# Watchlist Schemas
class WatchlistCreate(BaseModel):
    name: str
    description: Optional[str] = None


class WatchlistUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class WatchlistResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: Optional[str] = None
    owner_user_id: int
    created_date: datetime


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
    shares_sold: float = Field(..., gt=0)
    price_received: float = Field(..., gt=0)
    sell_date: Optional[datetime] = None
    notes: Optional[str] = None


class SellTransactionUpdate(BaseModel):
    shares_sold: Optional[float] = None
    price_received: Optional[float] = None
    sell_date: Optional[datetime] = None
    notes: Optional[str] = None


class SellTransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    account_id: int
    ticker: str
    shares_sold: float
    price_received: float
    sell_date: datetime
    notes: Optional[str] = None
    created_at: datetime


# Holdings Performance Schemas
class HoldingPerformanceItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    account_id: int
    ticker: str
    quantity: float
    entry_price: float
    entry_date: datetime
    notes: Optional[str] = None
    current_price: Optional[float] = None
    current_value: Optional[float] = None
    unrealized_gain_loss: Optional[float] = None
    return_pct: Optional[float] = None
    price_error: Optional[str] = None


class HoldingPerformanceResponse(BaseModel):
    holdings: List[HoldingPerformanceItem]
    total_cost_basis: float
    total_current_value: Optional[float] = None
    total_unrealized_gain_loss: Optional[float] = None
    as_of: datetime


# AI Schemas
class AnalyzeThesisRequest(BaseModel):
    ticker: str
    buy_reasons: str
    sell_conditions: str


class AnalyzeThesisResponse(BaseModel):
    quality_score: int
    conviction_level: str
    strengths: List[str]
    blind_spots: List[str]
    suggestions: List[str]


class DraftThesisRequest(BaseModel):
    ticker: str


class DraftThesisResponse(BaseModel):
    buy_reasons: str
    sell_conditions: str


# Update forward references
UserDetailResponse.model_rebuild()
WatchlistDetailResponse.model_rebuild()
