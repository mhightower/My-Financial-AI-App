import pytest
from unittest.mock import patch, AsyncMock


@pytest.fixture
def test_user(client):
    response = client.post("/api/v1/users", json={"name": "PerfUser"})
    return response.json()


@pytest.fixture
def test_account(client, test_user):
    response = client.post(
        "/api/v1/accounts",
        json={"user_id": test_user["id"], "name": "Fidelity", "account_type": "taxable"}
    )
    return response.json()


def test_performance_404_unknown_user(client):
    """Returns 404 when user does not exist"""
    response = client.get("/api/v1/users/99999/holdings-performance")
    assert response.status_code == 404


def test_performance_empty_holdings(client, test_user):
    """Returns zero totals and empty array when user has no holdings"""
    response = client.get(f"/api/v1/users/{test_user['id']}/holdings-performance")
    assert response.status_code == 200
    data = response.json()
    assert data["holdings"] == []
    assert data["total_cost_basis"] == 0.0
    assert data["total_current_value"] is None
    assert data["total_unrealized_gain_loss"] is None


def test_performance_computes_pnl(client, test_user, test_account):
    """Computes current_value, unrealized_gain_loss, and return_pct correctly"""
    client.post(
        "/api/v1/holdings",
        json={
            "user_id": test_user["id"],
            "account_id": test_account["id"],
            "ticker": "AAPL",
            "quantity": 10.0,
            "entry_price": 150.0,
        }
    )

    mock_quote = AsyncMock(return_value=type("Q", (), {
        "current_price": 200.0, "daily_change_pct": 1.5, "volume": 1000000,
        "ticker": "AAPL", "company_name": "Apple", "timestamp": None
    })())

    with patch("app.services.alpha_vantage.get_quote", mock_quote):
        response = client.get(f"/api/v1/users/{test_user['id']}/holdings-performance")

    assert response.status_code == 200
    data = response.json()
    assert len(data["holdings"]) == 1
    h = data["holdings"][0]
    assert h["ticker"] == "AAPL"
    assert h["current_price"] == pytest.approx(200.0)
    assert h["current_value"] == pytest.approx(2000.0)
    assert h["unrealized_gain_loss"] == pytest.approx(500.0)
    assert h["return_pct"] == pytest.approx(33.333, abs=0.01)
    assert h["price_error"] is None
    assert data["total_cost_basis"] == pytest.approx(1500.0)
    assert data["total_current_value"] == pytest.approx(2000.0)
    assert data["total_unrealized_gain_loss"] == pytest.approx(500.0)


def test_performance_price_error_on_failure(client, test_user, test_account):
    """Sets price_error when quote fetch fails; still returns holding"""
    client.post(
        "/api/v1/holdings",
        json={
            "user_id": test_user["id"],
            "account_id": test_account["id"],
            "ticker": "FAKE",
            "quantity": 5.0,
            "entry_price": 100.0,
        }
    )

    mock_quote = AsyncMock(side_effect=ValueError("No data for FAKE"))

    with patch("app.services.alpha_vantage.get_quote", mock_quote):
        response = client.get(f"/api/v1/users/{test_user['id']}/holdings-performance")

    assert response.status_code == 200
    data = response.json()
    h = data["holdings"][0]
    assert h["current_price"] is None
    assert h["current_value"] is None
    assert h["price_error"] == "unavailable"
    assert data["total_current_value"] is None
    assert data["total_unrealized_gain_loss"] is None


def test_performance_deduplicates_tickers(client, test_user, test_account):
    """Fetches each unique ticker only once even with multiple holdings"""
    for _ in range(2):
        client.post(
            "/api/v1/holdings",
            json={
                "user_id": test_user["id"],
                "account_id": test_account["id"],
                "ticker": "MSFT",
                "quantity": 3.0,
                "entry_price": 300.0,
            }
        )

    mock_quote = AsyncMock(return_value=type("Q", (), {
        "current_price": 350.0, "daily_change_pct": 0.5, "volume": 500000,
        "ticker": "MSFT", "company_name": "Microsoft", "timestamp": None
    })())

    with patch("app.services.alpha_vantage.get_quote", mock_quote):
        response = client.get(f"/api/v1/users/{test_user['id']}/holdings-performance")

    assert response.status_code == 200
    # Only 1 call despite 2 MSFT holdings
    assert mock_quote.call_count == 1


def test_performance_partial_failure(client, test_user, test_account):
    """Aggregates totals only for holdings with valid prices"""
    client.post(
        "/api/v1/holdings",
        json={"user_id": test_user["id"], "account_id": test_account["id"],
              "ticker": "AAPL", "quantity": 10.0, "entry_price": 150.0}
    )
    client.post(
        "/api/v1/holdings",
        json={"user_id": test_user["id"], "account_id": test_account["id"],
              "ticker": "FAKE", "quantity": 5.0, "entry_price": 100.0}
    )

    async def mock_quote(ticker):
        if ticker == "AAPL":
            return type("Q", (), {"current_price": 200.0, "daily_change_pct": 1.0,
                                   "volume": 1000000, "ticker": "AAPL",
                                   "company_name": "Apple", "timestamp": None})()
        raise ValueError("No data")

    with patch("app.services.alpha_vantage.get_quote", mock_quote):
        response = client.get(f"/api/v1/users/{test_user['id']}/holdings-performance")

    assert response.status_code == 200
    data = response.json()
    assert data["total_cost_basis"] == pytest.approx(2000.0)
    assert data["total_current_value"] == pytest.approx(2000.0)
    holdings_by_ticker = {h["ticker"]: h for h in data["holdings"]}
    assert holdings_by_ticker["AAPL"]["current_price"] == 200.0
    assert holdings_by_ticker["FAKE"]["price_error"] == "unavailable"
