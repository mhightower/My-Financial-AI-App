from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship

from .database import Base


def _utc_now():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False, index=True)
    avatar_color = Column(String(7), nullable=True)  # Hex color (e.g. "#667eea")
    created_at = Column(DateTime, default=_utc_now, nullable=False)

    watchlists = relationship("Watchlist", back_populates="owner", cascade="all, delete-orphan")
    accounts = relationship("BrokerageAccount", back_populates="user", cascade="all, delete-orphan")
    holdings = relationship("Holding", back_populates="user", cascade="all, delete-orphan")
    sell_transactions = relationship("SellTransaction", back_populates="user", cascade="all, delete-orphan")


class Watchlist(Base):
    __tablename__ = "watchlists"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    owner_user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    created_date = Column(DateTime, default=_utc_now, nullable=False)

    owner = relationship("User", back_populates="watchlists")
    stocks = relationship("StockInWatchlist", back_populates="watchlist", cascade="all, delete-orphan")


class StockInWatchlist(Base):
    __tablename__ = "stocks_in_watchlist"

    id = Column(Integer, primary_key=True, index=True)
    watchlist_id = Column(Integer, ForeignKey("watchlists.id"), nullable=False, index=True)
    ticker = Column(String(10), nullable=False, index=True)
    buy_reasons = Column(Text, nullable=True)
    sell_conditions = Column(Text, nullable=True)
    buy_price = Column(Float, nullable=True)  # Target buy price
    sell_price = Column(Float, nullable=True)  # Target sell price
    stop_loss_pct = Column(Float, nullable=True)  # Stop loss percentage
    added_date = Column(DateTime, default=_utc_now, nullable=False)

    __table_args__ = (UniqueConstraint("watchlist_id", "ticker", name="uq_watchlist_ticker"),)

    watchlist = relationship("Watchlist", back_populates="stocks")


class BrokerageAccount(Base):
    __tablename__ = "brokerage_accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    account_type = Column(String(50), nullable=False)  # 'taxable', 'IRA', 'Roth', etc.
    broker_name = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=_utc_now, nullable=False)

    user = relationship("User", back_populates="accounts")
    holdings = relationship("Holding", back_populates="account", cascade="all, delete-orphan")


class Holding(Base):
    __tablename__ = "holdings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    account_id = Column(Integer, ForeignKey("brokerage_accounts.id"), nullable=False, index=True)
    ticker = Column(String(10), nullable=False, index=True)
    quantity = Column(Float, nullable=False)  # Can be fractional for ETFs
    entry_price = Column(Float, nullable=False)
    entry_date = Column(DateTime, default=_utc_now, nullable=False)
    notes = Column(Text, nullable=True)

    user = relationship("User", back_populates="holdings")
    account = relationship("BrokerageAccount", back_populates="holdings")


class SellTransaction(Base):
    __tablename__ = "sell_transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    account_id = Column(Integer, ForeignKey("brokerage_accounts.id"), nullable=False, index=True)
    ticker = Column(String(10), nullable=False, index=True)
    shares_sold = Column(Float, nullable=False)
    price_received = Column(Float, nullable=False)
    sell_date = Column(DateTime, default=_utc_now, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=_utc_now, nullable=False)

    user = relationship("User", back_populates="sell_transactions")
    account = relationship("BrokerageAccount")
