import logging

import httpx
from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
from ..services import alpha_vantage
from ..schemas import (
    StockSearchResult,
    StockQuoteResponse,
    StockDetailResponse,
    StockHistoryPoint,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/stocks", tags=["stocks"])


def _handle_alpha_vantage_errors(
    exc: Exception, context: str, value_error_status: int = status.HTTP_429_TOO_MANY_REQUESTS
) -> None:
    """Re-raise Alpha Vantage errors as appropriate HTTP exceptions."""
    if isinstance(exc, ValueError):
        raise HTTPException(status_code=value_error_status, detail=str(exc))
    if isinstance(exc, httpx.HTTPStatusError):
        logger.error("Alpha Vantage HTTP error on %s: %s", context, exc)
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"{context} is temporarily unavailable")
    if isinstance(exc, httpx.RequestError):
        logger.error("Alpha Vantage connection error on %s: %s", context, exc)
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Unable to connect to stock data provider")
    logger.exception("Unexpected error during %s: %s", context, exc)
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred")


@router.get("/search", response_model=List[StockSearchResult])
async def search_stocks(q: str, limit: int = 10):
    """
    Search for stocks by keyword
    Returns matching stocks/ETFs from Alpha Vantage
    """
    if not q or len(q) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Search query must be at least 2 characters"
        )

    if limit < 1 or limit > 20:
        limit = 10

    try:
        return await alpha_vantage.search_symbol(q, limit)
    except Exception as e:
        _handle_alpha_vantage_errors(e, "Stock search")


@router.get("/{ticker}/quote", response_model=StockQuoteResponse)
async def get_stock_quote(ticker: str):
    """
    Get current stock quote (price, change %, volume)
    """
    ticker = ticker.upper()

    try:
        return await alpha_vantage.get_quote(ticker)
    except Exception as e:
        _handle_alpha_vantage_errors(e, f"Quote for {ticker}", status.HTTP_404_NOT_FOUND)


@router.get("/{ticker}/detail", response_model=StockDetailResponse)
async def get_stock_detail(ticker: str):
    """
    Get stock detail with fundamentals (P/E, market cap, dividend, 52-week high/low)
    """
    ticker = ticker.upper()

    try:
        return await alpha_vantage.get_overview(ticker)
    except Exception as e:
        _handle_alpha_vantage_errors(e, f"Detail for {ticker}", status.HTTP_404_NOT_FOUND)


@router.get("/{ticker}/history", response_model=List[StockHistoryPoint])
async def get_stock_history(ticker: str, days: int = 30):
    """
    Get historical daily prices (OHLCV)
    """
    ticker = ticker.upper()

    if days < 1 or days > 365:
        days = 30

    try:
        return await alpha_vantage.get_daily_history(ticker, days)
    except Exception as e:
        _handle_alpha_vantage_errors(e, f"History for {ticker}", status.HTTP_404_NOT_FOUND)


@router.get("/health", response_model=dict)
async def stocks_health():
    """Health check for stocks API"""
    return {"status": "healthy", "service": "stocks"}
