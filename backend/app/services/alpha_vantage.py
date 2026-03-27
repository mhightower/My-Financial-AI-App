import os
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

import httpx

from ..schemas import StockDetailResponse, StockHistoryPoint, StockQuoteResponse, StockSearchResult

API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY", "demo")
BASE_URL = "https://www.alphavantage.co/query"

# When no real API key is configured, serve static fixture data so the app is
# fully navigable without any external dependencies.
_DEMO_MODE = API_KEY == "demo"

# price, daily_chg_pct, volume, pe, market_cap, div_yield, 52w_high, 52w_low, name, type, region
_FIXTURES: Dict[str, Dict] = {
    "AAPL": {
        "name": "Apple Inc", "type": "Equity", "region": "United States",
        "price": 213.18, "change_pct": 0.87, "volume": 52_341_200,
        "pe": 33.2, "market_cap": "3210000000000", "div_yield": 0.0051,
        "high_52": 237.23, "low_52": 164.08,
    },
    "MSFT": {
        "name": "Microsoft Corporation", "type": "Equity", "region": "United States",
        "price": 415.32, "change_pct": -0.43, "volume": 18_924_600,
        "pe": 35.1, "market_cap": "3090000000000", "div_yield": 0.0072,
        "high_52": 468.35, "low_52": 344.79,
    },
    "GOOGL": {
        "name": "Alphabet Inc", "type": "Equity", "region": "United States",
        "price": 172.63, "change_pct": 1.21, "volume": 22_187_400,
        "pe": 23.4, "market_cap": "2140000000000", "div_yield": None,
        "high_52": 207.05, "low_52": 140.53,
    },
    "AMZN": {
        "name": "Amazon.com Inc", "type": "Equity", "region": "United States",
        "price": 195.89, "change_pct": -1.02, "volume": 34_512_800,
        "pe": 44.7, "market_cap": "2070000000000", "div_yield": None,
        "high_52": 242.52, "low_52": 151.61,
    },
    "NVDA": {
        "name": "NVIDIA Corporation", "type": "Equity", "region": "United States",
        "price": 875.40, "change_pct": 2.34, "volume": 41_208_900,
        "pe": 60.3, "market_cap": "2150000000000", "div_yield": 0.0003,
        "high_52": 974.00, "low_52": 462.00,
    },
    "META": {
        "name": "Meta Platforms Inc", "type": "Equity", "region": "United States",
        "price": 541.23, "change_pct": 0.65, "volume": 12_340_100,
        "pe": 26.1, "market_cap": "1380000000000", "div_yield": None,
        "high_52": 638.40, "low_52": 414.50,
    },
    "TSLA": {
        "name": "Tesla Inc", "type": "Equity", "region": "United States",
        "price": 170.18, "change_pct": -2.11, "volume": 88_412_300,
        "pe": 55.4, "market_cap": "545000000000", "div_yield": None,
        "high_52": 358.64, "low_52": 138.80,
    },
    "NET": {
        "name": "Cloudflare Inc", "type": "Equity", "region": "United States",
        "price": 95.42, "change_pct": 1.58, "volume": 8_214_700,
        "pe": None, "market_cap": "31000000000", "div_yield": None,
        "high_52": 130.88, "low_52": 55.97,
    },
    "JPM": {
        "name": "JPMorgan Chase & Co", "type": "Equity", "region": "United States",
        "price": 221.45, "change_pct": 0.32, "volume": 9_874_100,
        "pe": 12.3, "market_cap": "633000000000", "div_yield": 0.0215,
        "high_52": 280.25, "low_52": 185.70,
    },
    "JNJ": {
        "name": "Johnson & Johnson", "type": "Equity", "region": "United States",
        "price": 155.74, "change_pct": -0.18, "volume": 7_123_400,
        "pe": 22.1, "market_cap": "374000000000", "div_yield": 0.031,
        "high_52": 168.85, "low_52": 143.13,
    },
    "ILF": {
        "name": "iShares Latin America 40 ETF", "type": "ETF", "region": "United States",
        "price": 26.14, "change_pct": -0.53, "volume": 1_842_300,
        "pe": None, "market_cap": None, "div_yield": 0.052,
        "high_52": 30.22, "low_52": 22.18,
    },
    "V": {
        "name": "Visa Inc", "type": "Equity", "region": "United States",
        "price": 280.31, "change_pct": 0.44, "volume": 6_341_200,
        "pe": 31.4, "market_cap": "572000000000", "div_yield": 0.0079,
        "high_52": 316.00, "low_52": 252.70,
    },
}

# 30-day price movement pattern (daily % deltas), deterministic across runs
_HISTORY_DELTAS = [
    0.8, -0.4, 1.2, -0.9, 0.3, 1.5, -0.6, 0.7, -1.1, 0.4,
    -0.2, 0.9, 1.3, -0.8, 0.5, -0.3, 1.1, -1.4, 0.6, -0.5,
    1.8, -0.7, 0.2, 0.9, -1.2, 0.6, -0.4, 1.0, -0.8, 0.3,
]


def _demo_search(keywords: str, limit: int) -> List[StockSearchResult]:
    kw = keywords.upper()
    results = []
    for ticker, f in _FIXTURES.items():
        if kw in ticker or kw in f["name"].upper():
            results.append(StockSearchResult(
                ticker=ticker, name=f["name"], type=f["type"], region=f["region"]
            ))
    return results[:limit]


def _demo_quote(symbol: str) -> StockQuoteResponse:
    f = _FIXTURES.get(symbol)
    if not f:
        raise ValueError(f"No demo data for {symbol} — add a real API key for full coverage")
    return StockQuoteResponse(
        ticker=symbol,
        company_name=f["name"],
        current_price=f["price"],
        daily_change_pct=f["change_pct"],
        volume=f["volume"],
        timestamp=datetime.now(timezone.utc),
    )


def _demo_overview(symbol: str) -> StockDetailResponse:
    f = _FIXTURES.get(symbol)
    if not f:
        raise ValueError(f"No demo data for {symbol} — add a real API key for full coverage")
    return StockDetailResponse(
        ticker=symbol,
        company_name=f["name"],
        current_price=f["price"],
        daily_change_pct=f["change_pct"],
        volume=f["volume"],
        p_e_ratio=f["pe"],
        market_cap=str(f["market_cap"]) if f["market_cap"] else None,
        dividend_yield=f["div_yield"],
        week_52_high=f["high_52"],
        week_52_low=f["low_52"],
        timestamp=datetime.now(timezone.utc),
    )


def _demo_history(symbol: str, days: int) -> List[StockHistoryPoint]:
    f = _FIXTURES.get(symbol)
    if not f:
        raise ValueError(f"No demo data for {symbol} — add a real API key for full coverage")
    points = []
    price = f["price"]
    today = datetime.now(timezone.utc).date()
    deltas = (_HISTORY_DELTAS * ((days // len(_HISTORY_DELTAS)) + 1))[:days]
    for i, delta in enumerate(reversed(deltas)):
        date = today - timedelta(days=i)
        close = round(price * (1 - delta / 100), 2)
        points.append(StockHistoryPoint(
            date=str(date),
            open=round(close * 0.998, 2),
            high=round(close * 1.012, 2),
            low=round(close * 0.989, 2),
            close=close,
            volume=int(f["volume"] * (0.85 + (i % 5) * 0.08)),
        ))
        price = close
    return points

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
    if _DEMO_MODE:
        return _demo_search(keywords, limit)

    cache_key = _make_cache_key("SYMBOL_SEARCH", keywords)
    cached = _get_cached(cache_key, CACHE_TTL_FUNDAMENTALS)
    if cached:
        return cached

    params = {
        "function": "SYMBOL_SEARCH",
        "keywords": keywords,
        "apikey": API_KEY,
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(BASE_URL, params=params)
        response.raise_for_status()
        data = response.json()

    if "Information" in data or "Note" in data:
        raise ValueError("Alpha Vantage rate limit reached — type the ticker directly")

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
    if _DEMO_MODE:
        return _demo_quote(symbol)

    cache_key = _make_cache_key("GLOBAL_QUOTE", symbol)
    cached = _get_cached(cache_key, CACHE_TTL_QUOTE)
    if cached:
        return cached

    params = {
        "function": "GLOBAL_QUOTE",
        "symbol": symbol,
        "apikey": API_KEY,
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
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
    if _DEMO_MODE:
        return _demo_overview(symbol)

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

    async with httpx.AsyncClient(timeout=10.0) as client:
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
    if _DEMO_MODE:
        return _demo_history(symbol, days)

    cache_key = _make_cache_key("TIME_SERIES_DAILY", symbol, {"days": days})
    cached = _get_cached(cache_key, CACHE_TTL_FUNDAMENTALS)
    if cached:
        return cached

    params = {
        "function": "TIME_SERIES_DAILY",
        "symbol": symbol,
        "apikey": API_KEY,
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
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
