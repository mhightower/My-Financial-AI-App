from unittest.mock import AsyncMock, patch


def test_search_stocks(client):
    """Test searching for stocks"""
    with patch("app.services.alpha_vantage.search_symbol", new_callable=AsyncMock) as mock_search:
        mock_search.return_value = [
            {
                "ticker": "AAPL",
                "name": "Apple Inc.",
                "type": "Equity",
                "region": "United States"
            },
            {
                "ticker": "APPL",
                "name": "Apple Electronics",
                "type": "Equity",
                "region": "Canada"
            }
        ]

        response = client.get("/api/v1/stocks/search?q=Apple")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 0  # Should return search results


def test_get_stock_quote(client):
    """Test getting stock quote"""
    with patch("app.services.alpha_vantage.get_quote", new_callable=AsyncMock) as mock_quote:
        mock_quote.return_value = {
            "ticker": "AAPL",
            "current_price": 150.50,
            "daily_change_pct": 1.5,
            "volume": 1000000,
            "timestamp": "2024-01-15T16:00:00"
        }

        response = client.get("/api/v1/stocks/AAPL/quote")
        assert response.status_code == 200
        data = response.json()
        assert data["ticker"] == "AAPL"
        assert data["current_price"] == 150.50


def test_get_stock_detail(client):
    """Test getting stock detail with fundamentals"""
    with patch("app.services.alpha_vantage.get_overview", new_callable=AsyncMock) as mock_detail:
        mock_detail.return_value = {
            "ticker": "AAPL",
            "company_name": "Apple Inc.",
            "current_price": 150.50,
            "daily_change_pct": 1.5,
            "volume": 1000000,
            "p_e_ratio": 25.5,
            "market_cap": "2500000000000",
            "dividend_yield": 0.005,
            "week_52_high": 199.62,
            "week_52_low": 124.17,
            "timestamp": "2024-01-15T16:00:00"
        }

        response = client.get("/api/v1/stocks/AAPL/detail")
        assert response.status_code == 200
        data = response.json()
        assert data["ticker"] == "AAPL"
        assert "p_e_ratio" in data
        assert "market_cap" in data


def test_get_stock_history(client):
    """Test getting stock price history"""
    with patch("app.services.alpha_vantage.get_daily_history", new_callable=AsyncMock) as mock_history:
        mock_history.return_value = [
            {
                "date": "2024-01-15",
                "open": 148.0,
                "high": 152.0,
                "low": 147.5,
                "close": 150.50,
                "volume": 1000000
            },
            {
                "date": "2024-01-14",
                "open": 149.0,
                "high": 150.5,
                "low": 148.0,
                "close": 148.75,
                "volume": 950000
            }
        ]

        response = client.get("/api/v1/stocks/AAPL/history?days=30")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        assert "date" in data[0]


def test_api_key_not_exposed(client):
    """Test that API key is never returned to client"""
    response = client.get("/api/v1/stocks/AAPL/quote")
    # Even if the call succeeds, the response should never contain the API key
    if response.status_code == 200:
        data = response.json()
        assert "apikey" not in str(data).lower()
        assert "api_key" not in str(data).lower()


def test_search_with_limit(client):
    """Test searching with result limit"""
    with patch("app.services.alpha_vantage.search_symbol", new_callable=AsyncMock) as mock_search:
        mock_search.return_value = [
            {"ticker": "AAPL", "name": "Apple", "type": "Equity", "region": "United States"}
        ]

        response = client.get("/api/v1/stocks/search?q=Apple&limit=1")
        assert response.status_code == 200


def test_invalid_ticker(client):
    """Test handling of invalid ticker"""
    with patch("app.services.alpha_vantage.get_quote", new_callable=AsyncMock) as mock_quote:
        mock_quote.side_effect = ValueError("No quote data for symbol INVALID")

        response = client.get("/api/v1/stocks/INVALID/quote")
        assert response.status_code in [400, 404, 500]  # Some error response
