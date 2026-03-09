from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
from ..services import alpha_vantage
from ..schemas import (
    StockSearchResult,
    StockQuoteResponse,
    StockDetailResponse,
    StockHistoryPoint,
)
import asyncio

router = APIRouter(prefix="/api/v1/stocks", tags=["stocks"])


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
        results = await alpha_vantage.search_symbol(q, limit)
        return results
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Error calling Alpha Vantage: {str(e)}"
        )


@router.get("/{ticker}/quote", response_model=StockQuoteResponse)
async def get_stock_quote(ticker: str):
    """
    Get current stock quote (price, change %, volume)
    """
    ticker = ticker.upper()

    try:
        quote = await alpha_vantage.get_quote(ticker)
        return quote
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Error calling Alpha Vantage: {str(e)}"
        )


@router.get("/{ticker}/detail", response_model=StockDetailResponse)
async def get_stock_detail(ticker: str):
    """
    Get stock detail with fundamentals (P/E, market cap, dividend, 52-week high/low)
    """
    ticker = ticker.upper()

    try:
        detail = await alpha_vantage.get_overview(ticker)
        return detail
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Error calling Alpha Vantage: {str(e)}"
        )


@router.get("/{ticker}/history", response_model=List[StockHistoryPoint])
async def get_stock_history(ticker: str, days: int = 30):
    """
    Get historical daily prices (OHLCV)
    """
    ticker = ticker.upper()

    if days < 1 or days > 365:
        days = 30

    try:
        history = await alpha_vantage.get_daily_history(ticker, days)
        return history
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Error calling Alpha Vantage: {str(e)}"
        )


@router.get("/health", response_model=dict)
async def stocks_health():
    """Health check for stocks API"""
    return {"status": "healthy", "service": "stocks"}
