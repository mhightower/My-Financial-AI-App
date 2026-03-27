"""
Tests for the alpha_vantage service demo mode.

All tests here exercise the _demo_* helpers and the _DEMO_MODE branch in each
public function directly, without making any HTTP calls.
"""
import pytest
from unittest.mock import patch

from app.services.alpha_vantage import (
    _demo_history,
    _demo_overview,
    _demo_quote,
    _demo_search,
    _FIXTURES,
    get_daily_history,
    get_overview,
    get_quote,
    search_symbol,
)
from app.schemas import StockDetailResponse, StockHistoryPoint, StockQuoteResponse, StockSearchResult


# ---------------------------------------------------------------------------
# _demo_search
# ---------------------------------------------------------------------------

def test_demo_search_by_exact_ticker():
    results = _demo_search("AAPL", limit=10)
    tickers = [r.ticker for r in results]
    assert "AAPL" in tickers


def test_demo_search_by_partial_ticker():
    results = _demo_search("MS", limit=10)
    tickers = [r.ticker for r in results]
    assert "MSFT" in tickers


def test_demo_search_by_name():
    results = _demo_search("cloud", limit=10)
    tickers = [r.ticker for r in results]
    assert "NET" in tickers


def test_demo_search_no_match_returns_empty():
    results = _demo_search("XYZNOTREAL", limit=10)
    assert results == []


def test_demo_search_respects_limit():
    # "a" appears in many fixture names/tickers
    results = _demo_search("A", limit=2)
    assert len(results) <= 2


def test_demo_search_returns_correct_type():
    results = _demo_search("AAPL", limit=10)
    assert all(isinstance(r, StockSearchResult) for r in results)


def test_demo_search_etf_included():
    results = _demo_search("ILF", limit=10)
    assert any(r.ticker == "ILF" and r.type == "ETF" for r in results)


# ---------------------------------------------------------------------------
# _demo_quote
# ---------------------------------------------------------------------------

def test_demo_quote_known_ticker():
    result = _demo_quote("AAPL")
    assert isinstance(result, StockQuoteResponse)
    assert result.ticker == "AAPL"
    assert result.current_price == _FIXTURES["AAPL"]["price"]
    assert result.daily_change_pct == _FIXTURES["AAPL"]["change_pct"]
    assert result.volume == _FIXTURES["AAPL"]["volume"]


def test_demo_quote_all_fixtures_resolve():
    for ticker in _FIXTURES:
        result = _demo_quote(ticker)
        assert result.ticker == ticker
        assert result.current_price > 0


def test_demo_quote_unknown_ticker_raises():
    with pytest.raises(ValueError, match="No demo data"):
        _demo_quote("ZZZFAKE")


def test_demo_quote_has_timestamp():
    result = _demo_quote("MSFT")
    assert result.timestamp is not None


# ---------------------------------------------------------------------------
# _demo_overview
# ---------------------------------------------------------------------------

def test_demo_overview_known_ticker():
    result = _demo_overview("MSFT")
    assert isinstance(result, StockDetailResponse)
    assert result.ticker == "MSFT"
    assert result.company_name == _FIXTURES["MSFT"]["name"]
    assert result.p_e_ratio == _FIXTURES["MSFT"]["pe"]
    assert result.week_52_high == _FIXTURES["MSFT"]["high_52"]
    assert result.week_52_low == _FIXTURES["MSFT"]["low_52"]


def test_demo_overview_etf_has_no_pe():
    result = _demo_overview("ILF")
    assert result.p_e_ratio is None


def test_demo_overview_etf_has_dividend():
    result = _demo_overview("ILF")
    assert result.dividend_yield is not None
    assert result.dividend_yield > 0


def test_demo_overview_no_dividend_is_none():
    # GOOGL pays no dividend
    result = _demo_overview("GOOGL")
    assert result.dividend_yield is None


def test_demo_overview_unknown_ticker_raises():
    with pytest.raises(ValueError, match="No demo data"):
        _demo_overview("ZZZFAKE")


def test_demo_overview_all_fixtures_resolve():
    for ticker in _FIXTURES:
        result = _demo_overview(ticker)
        assert result.ticker == ticker


# ---------------------------------------------------------------------------
# _demo_history
# ---------------------------------------------------------------------------

def test_demo_history_returns_correct_count():
    result = _demo_history("AAPL", days=30)
    assert len(result) == 30


def test_demo_history_custom_days():
    result = _demo_history("NVDA", days=10)
    assert len(result) == 10


def test_demo_history_max_days():
    result = _demo_history("TSLA", days=90)
    assert len(result) == 90


def test_demo_history_returns_correct_type():
    result = _demo_history("AAPL", days=5)
    assert all(isinstance(p, StockHistoryPoint) for p in result)


def test_demo_history_ohlcv_structure():
    points = _demo_history("AAPL", days=5)
    for p in points:
        assert p.date
        assert p.open > 0
        assert p.high > 0
        assert p.low > 0
        assert p.close > 0
        assert p.volume > 0


def test_demo_history_high_gte_low():
    points = _demo_history("MSFT", days=30)
    for p in points:
        assert p.high >= p.low, f"high {p.high} < low {p.low} on {p.date}"


def test_demo_history_unknown_ticker_raises():
    with pytest.raises(ValueError, match="No demo data"):
        _demo_history("ZZZFAKE", days=30)


def test_demo_history_dates_are_strings():
    points = _demo_history("AAPL", days=5)
    for p in points:
        assert isinstance(p.date, str)


# ---------------------------------------------------------------------------
# Public function _DEMO_MODE branching
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_search_symbol_uses_demo_when_flag_set():
    with patch("app.services.alpha_vantage._DEMO_MODE", True):
        results = await search_symbol("AAPL", limit=10)
        assert any(r.ticker == "AAPL" for r in results)


@pytest.mark.asyncio
async def test_get_quote_uses_demo_when_flag_set():
    with patch("app.services.alpha_vantage._DEMO_MODE", True):
        result = await get_quote("NVDA")
        assert result.ticker == "NVDA"
        assert result.current_price > 0


@pytest.mark.asyncio
async def test_get_overview_uses_demo_when_flag_set():
    with patch("app.services.alpha_vantage._DEMO_MODE", True):
        result = await get_overview("JPM")
        assert result.ticker == "JPM"
        assert result.p_e_ratio is not None


@pytest.mark.asyncio
async def test_get_daily_history_uses_demo_when_flag_set():
    with patch("app.services.alpha_vantage._DEMO_MODE", True):
        result = await get_daily_history("V", days=15)
        assert len(result) == 15


@pytest.mark.asyncio
async def test_unknown_ticker_in_demo_mode_raises_value_error():
    with patch("app.services.alpha_vantage._DEMO_MODE", True):
        with pytest.raises(ValueError, match="No demo data"):
            await get_quote("ZZZFAKE")


# ---------------------------------------------------------------------------
# Router-level: unknown ticker in demo mode surfaces as 404
# ---------------------------------------------------------------------------

def test_router_unknown_ticker_demo_returns_404(client):
    with patch("app.services.alpha_vantage._DEMO_MODE", True):
        response = client.get("/api/v1/stocks/ZZZFAKE/quote")
        assert response.status_code == 404


def test_router_known_ticker_demo_returns_200(client):
    with patch("app.services.alpha_vantage._DEMO_MODE", True):
        response = client.get("/api/v1/stocks/AAPL/quote")
        assert response.status_code == 200
        data = response.json()
        assert data["ticker"] == "AAPL"
        assert data["current_price"] == _FIXTURES["AAPL"]["price"]


def test_router_detail_demo_returns_fundamentals(client):
    with patch("app.services.alpha_vantage._DEMO_MODE", True):
        response = client.get("/api/v1/stocks/MSFT/detail")
        assert response.status_code == 200
        data = response.json()
        assert data["p_e_ratio"] == _FIXTURES["MSFT"]["pe"]
        assert data["week_52_high"] == _FIXTURES["MSFT"]["high_52"]


def test_router_history_demo_returns_correct_count(client):
    with patch("app.services.alpha_vantage._DEMO_MODE", True):
        response = client.get("/api/v1/stocks/AAPL/history?days=14")
        assert response.status_code == 200
        assert len(response.json()) == 14
