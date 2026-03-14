import httpx
import os
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List
from ..schemas import StockQuoteResponse, StockDetailResponse, StockSearchResult, StockHistoryPoint

API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY", "demo")
BASE_URL = "https://www.alphavantage.co/query"

# In-memory cache: { cache_key: (timestamp, data) }
_cache: Dict[str, tuple] = {}
CACHE_TTL_QUOTE = 60  # 60 seconds for price quotes
CACHE_TTL_FUNDAMENTALS = 3600  # 1 hour for fundamentals


def _make_cache_key(function: str, symbol: str, params: Optional[Dict] = None) -> str:
    """Create a cache key from function, symbol, and params"""
    key = f"{function}:{symbol}"
    if params:
        for k, v in sorted(params.items()):
            key += f":{k}={v}"
    return key


def _get_cached(key: str, ttl: int) -> Optional[Any]:
    """Get value from cache if not expired"""
    if key not in _cache:
        return None
    timestamp, data = _cache[key]
    if datetime.now(timezone.utc) - timestamp > timedelta(seconds=ttl):
        del _cache[key]
        return None
    return data


def _set_cached(key: str, data: Any) -> None:
    """Store value in cache"""
    _cache[key] = (datetime.now(timezone.utc), data)


async def search_symbol(keywords: str, limit: int = 10) -> List[StockSearchResult]:
    """
    Search for symbols matching keywords
    Returns list of matching stocks/ETFs
    """
    cache_key = _make_cache_key("SYMBOL_SEARCH", keywords)
    cached = _get_cached(cache_key, CACHE_TTL_FUNDAMENTALS)
    if cached:
        return cached

    params = {
        "function": "SYMBOL_SEARCH",
        "keywords": keywords,
        "apikey": API_KEY,
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(BASE_URL, params=params)
        response.raise_for_status()
        data = response.json()

    results = []
    if "bestMatches" in data:
        for match in data["bestMatches"][:limit]:
            results.append(
                StockSearchResult(
                    ticker=match.get("1. symbol", ""),
                    name=match.get("2. name", ""),
                    type=match.get("3. type", ""),
                    region=match.get("4. region", ""),
                )
            )

    _set_cached(cache_key, results)
    return results


async def get_quote(symbol: str) -> StockQuoteResponse:
    """
    Get current quote for a symbol
    Returns price, change %, volume
    """
    cache_key = _make_cache_key("GLOBAL_QUOTE", symbol)
    cached = _get_cached(cache_key, CACHE_TTL_QUOTE)
    if cached:
        return cached

    params = {
        "function": "GLOBAL_QUOTE",
        "symbol": symbol,
        "apikey": API_KEY,
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(BASE_URL, params=params)
        response.raise_for_status()
        data = response.json()

    quote_data = data.get("Global Quote", {})
    if not quote_data:
        raise ValueError(f"No quote data for symbol {symbol}")

    result = StockQuoteResponse(
        ticker=symbol,
        current_price=float(quote_data.get("05. price", 0)),
        daily_change_pct=float(quote_data.get("10. change percent", "0").rstrip("%")),
        volume=int(quote_data.get("06. volume", 0)),
        timestamp=datetime.now(timezone.utc),
    )

    _set_cached(cache_key, result)
    return result


async def get_overview(symbol: str) -> StockDetailResponse:
    """
    Get company overview and fundamentals
    Returns fundamentals like P/E, market cap, dividend yield
    """
    cache_key = _make_cache_key("OVERVIEW", symbol)
    cached = _get_cached(cache_key, CACHE_TTL_FUNDAMENTALS)
    if cached:
        return cached

    # First get quote data
    quote = await get_quote(symbol)

    params = {
        "function": "OVERVIEW",
        "symbol": symbol,
        "apikey": API_KEY,
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(BASE_URL, params=params)
        response.raise_for_status()
        overview = response.json()

    result = StockDetailResponse(
        ticker=symbol,
        company_name=overview.get("Name", None),
        current_price=quote.current_price,
        daily_change_pct=quote.daily_change_pct,
        volume=quote.volume,
        p_e_ratio=float(overview.get("PERatio", 0)) if overview.get("PERatio") != "None" else None,
        market_cap=overview.get("MarketCapitalization", None),
        dividend_yield=float(overview.get("DividendYield", 0)) if overview.get("DividendYield") != "None" else None,
        week_52_high=float(overview.get("52WeekHigh", 0)) if overview.get("52WeekHigh") != "None" else None,
        week_52_low=float(overview.get("52WeekLow", 0)) if overview.get("52WeekLow") != "None" else None,
        timestamp=datetime.now(timezone.utc),
    )

    _set_cached(cache_key, result)
    return result


async def get_daily_history(symbol: str, days: int = 30) -> List[StockHistoryPoint]:
    """
    Get daily historical prices for a symbol
    Returns last N days of OHLCV data
    """
    cache_key = _make_cache_key("TIME_SERIES_DAILY", symbol, {"days": days})
    cached = _get_cached(cache_key, CACHE_TTL_FUNDAMENTALS)
    if cached:
        return cached

    params = {
        "function": "TIME_SERIES_DAILY",
        "symbol": symbol,
        "apikey": API_KEY,
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(BASE_URL, params=params)
        response.raise_for_status()
        data = response.json()

    results = []
    time_series = data.get("Time Series (Daily)", {})

    # Get last N days (reverse chronological order from API)
    for date_str, ohlcv in list(time_series.items())[:days]:
        results.append(
            StockHistoryPoint(
                date=date_str,
                open=float(ohlcv.get("1. open", 0)),
                high=float(ohlcv.get("2. high", 0)),
                low=float(ohlcv.get("3. low", 0)),
                close=float(ohlcv.get("4. close", 0)),
                volume=int(ohlcv.get("5. volume", 0)),
            )
        )

    _set_cached(cache_key, results)
    return results


def clear_cache() -> None:
    """Clear all cached data (for testing)"""
    global _cache
    _cache = {}
