import pytest


@pytest.fixture
def test_user(client):
    """Create a test user for watchlist tests"""
    response = client.post("/api/v1/users", json={"name": "TestUser"})
    return response.json()


def test_create_watchlist(client, test_user):
    """Test creating a watchlist"""
    response = client.post(
        f"/api/v1/watchlists?user_id={test_user['id']}",
        json={
            "name": "Tech Stocks",
            "description": "High-growth tech companies"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Tech Stocks"
    assert data["description"] == "High-growth tech companies"
    assert "id" in data
    assert "created_date" in data


def test_get_watchlist(client, test_user):
    """Test getting a watchlist"""
    # Create watchlist
    create_response = client.post(
        f"/api/v1/watchlists?user_id={test_user['id']}",
        json={"name": "My Watchlist"}
    )
    watchlist_id = create_response.json()["id"]

    # Get watchlist
    response = client.get(f"/api/v1/watchlists/{watchlist_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == watchlist_id
    assert data["name"] == "My Watchlist"


def test_get_user_watchlists(client, test_user):
    """Test getting all watchlists for a user"""
    # Create multiple watchlists
    client.post(f"/api/v1/watchlists?user_id={test_user['id']}", json={"name": "List1"})
    client.post(f"/api/v1/watchlists?user_id={test_user['id']}", json={"name": "List2"})

    response = client.get(f"/api/v1/users/{test_user['id']}/watchlists")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2


def test_add_stock_to_watchlist(client, test_user):
    """Test adding a stock to watchlist"""
    # Create watchlist
    create_response = client.post(
        f"/api/v1/watchlists?user_id={test_user['id']}",
        json={"name": "Tech"}
    )
    watchlist_id = create_response.json()["id"]

    # Add stock
    response = client.post(
        f"/api/v1/watchlists/{watchlist_id}/stocks?user_id={test_user['id']}",
        json={
            "ticker": "AAPL",
            "buy_reasons": "Strong ecosystem, recurring revenue",
            "sell_conditions": "Growth slows below 15%",
            "buy_price": 150.0,
            "sell_price": 200.0,
            "stop_loss_pct": 10.0
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["ticker"] == "AAPL"
    assert "buy_reasons" in data


def test_max_15_stocks_per_watchlist(client, test_user):
    """Test that watchlist cannot exceed 15 stocks"""
    # Create watchlist
    create_response = client.post(
        f"/api/v1/watchlists?user_id={test_user['id']}",
        json={"name": "Full"}
    )
    watchlist_id = create_response.json()["id"]

    # Add 15 stocks (should succeed)
    for i in range(15):
        response = client.post(
            f"/api/v1/watchlists/{watchlist_id}/stocks?user_id={test_user['id']}",
            json={"ticker": f"TICK{i}"}
        )
        assert response.status_code == 201

    # Try to add 16th stock (should fail)
    response = client.post(
        f"/api/v1/watchlists/{watchlist_id}/stocks?user_id={test_user['id']}",
        json={"ticker": "TICK16"}
    )
    assert response.status_code == 400
    assert "15 stocks" in response.json()["detail"].lower()


def test_remove_stock_from_watchlist(client, test_user):
    """Test removing a stock from watchlist"""
    # Create watchlist and add stock
    create_response = client.post(
        f"/api/v1/watchlists?user_id={test_user['id']}",
        json={"name": "Tech"}
    )
    watchlist_id = create_response.json()["id"]

    add_response = client.post(
        f"/api/v1/watchlists/{watchlist_id}/stocks?user_id={test_user['id']}",
        json={"ticker": "MSFT"}
    )
    stock_id = add_response.json()["id"]

    # Remove stock
    response = client.delete(f"/api/v1/watchlists/{watchlist_id}/stocks/{stock_id}?user_id={test_user['id']}")
    assert response.status_code == 204

    # Verify removal
    get_response = client.get(f"/api/v1/watchlists/{watchlist_id}")
    assert len(get_response.json()["stocks"]) == 0


def test_update_stock_thesis(client, test_user):
    """Test updating stock thesis in watchlist"""
    # Create watchlist and add stock
    create_response = client.post(
        f"/api/v1/watchlists?user_id={test_user['id']}",
        json={"name": "Tech"}
    )
    watchlist_id = create_response.json()["id"]

    add_response = client.post(
        f"/api/v1/watchlists/{watchlist_id}/stocks?user_id={test_user['id']}",
        json={"ticker": "GOOGL", "buy_reasons": "Original reason"}
    )
    stock_id = add_response.json()["id"]

    # Update thesis
    response = client.put(
        f"/api/v1/watchlists/{watchlist_id}/stocks/{stock_id}?user_id={test_user['id']}",
        json={"buy_reasons": "Updated reason"}
    )
    assert response.status_code == 200
    assert response.json()["buy_reasons"] == "Updated reason"


def test_delete_watchlist(client, test_user):
    """Test deleting a watchlist"""
    # Create watchlist
    create_response = client.post(
        f"/api/v1/watchlists?user_id={test_user['id']}",
        json={"name": "ToDelete"}
    )
    watchlist_id = create_response.json()["id"]

    # Delete
    response = client.delete(f"/api/v1/watchlists/{watchlist_id}?user_id={test_user['id']}")
    assert response.status_code == 204

    # Verify deletion
    get_response = client.get(f"/api/v1/watchlists/{watchlist_id}")
    assert get_response.status_code == 404


def test_add_stock_with_price_targets_and_stop_loss(client, test_user):
    """Test adding stock with all thesis and trigger fields"""
    # Create watchlist
    create_response = client.post(
        f"/api/v1/watchlists?user_id={test_user['id']}",
        json={"name": "Targets"}
    )
    watchlist_id = create_response.json()["id"]

    # Add stock with full details
    response = client.post(
        f"/api/v1/watchlists/{watchlist_id}/stocks?user_id={test_user['id']}",
        json={
            "ticker": "NVDA",
            "buy_reasons": "AI leader, strong growth",
            "sell_conditions": "Revenue growth < 10%",
            "buy_price": 450.00,
            "sell_price": 600.00,
            "stop_loss_pct": 0.15  # 15% stop loss
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["ticker"] == "NVDA"
    assert data["buy_reasons"] == "AI leader, strong growth"
    assert data["sell_conditions"] == "Revenue growth < 10%"
    assert data["buy_price"] == 450.00
    assert data["sell_price"] == 600.00
    assert data["stop_loss_pct"] == 0.15


def test_add_stock_with_optional_fields_omitted(client, test_user):
    """Test adding stock with only required ticker field"""
    # Create watchlist
    create_response = client.post(
        f"/api/v1/watchlists?user_id={test_user['id']}",
        json={"name": "Minimal"}
    )
    watchlist_id = create_response.json()["id"]

    # Add stock with only ticker
    response = client.post(
        f"/api/v1/watchlists/{watchlist_id}/stocks?user_id={test_user['id']}",
        json={"ticker": "TSLA"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["ticker"] == "TSLA"
    assert data["buy_reasons"] is None
    assert data["sell_conditions"] is None
    assert data["buy_price"] is None
    assert data["sell_price"] is None
    assert data["stop_loss_pct"] is None
