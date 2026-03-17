import pytest


@pytest.fixture
def test_user(client):
    """Create a test user"""
    response = client.post("/api/v1/users", json={"name": "TestUser"})
    return response.json()


@pytest.fixture
def test_account(client, test_user):
    """Create a test brokerage account"""
    response = client.post(
        "/api/v1/accounts",
        json={
            "user_id": test_user["id"],
            "name": "My Brokerage",
            "account_type": "taxable",
            "broker_name": "Fidelity"
        }
    )
    return response.json()


def test_create_account(client, test_user):
    """Test creating a brokerage account"""
    response = client.post(
        "/api/v1/accounts",
        json={
            "user_id": test_user["id"],
            "name": "Retirement IRA",
            "account_type": "IRA",
            "broker_name": "Vanguard"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Retirement IRA"
    assert data["account_type"] == "IRA"


def test_get_account(client, test_account):
    """Test getting an account"""
    response = client.get(f"/api/v1/accounts/{test_account['id']}")
    assert response.status_code == 200
    assert response.json()["id"] == test_account["id"]


def test_get_user_accounts(client, test_user):
    """Test getting all accounts for a user"""
    client.post(
        "/api/v1/accounts",
        json={"user_id": test_user["id"], "name": "Account1", "account_type": "taxable"}
    )
    client.post(
        "/api/v1/accounts",
        json={"user_id": test_user["id"], "name": "Account2", "account_type": "IRA"}
    )

    response = client.get(f"/api/v1/users/{test_user['id']}/accounts")
    assert response.status_code == 200
    assert len(response.json()) == 2


def test_delete_account(client, test_user, test_account):
    """Test deleting an account"""
    response = client.delete(f"/api/v1/accounts/{test_account['id']}?user_id={test_user['id']}")
    assert response.status_code == 204

    get_response = client.get(f"/api/v1/accounts/{test_account['id']}")
    assert get_response.status_code == 404


def test_log_buy_trade(client, test_user, test_account):
    """Test logging a buy trade (creating a holding)"""
    response = client.post(
        "/api/v1/holdings",
        json={
            "user_id": test_user["id"],
            "account_id": test_account["id"],
            "ticker": "AAPL",
            "quantity": 10.0,
            "entry_price": 150.0,
            "notes": "Buy 10 shares of Apple"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["ticker"] == "AAPL"
    assert data["quantity"] == 10.0
    assert data["entry_price"] == 150.0


def test_holding_validation(client, test_user, test_account):
    """Test that holdings validate quantity and price"""
    # Zero quantity should fail (now caught by Pydantic Field gt=0)
    response = client.post(
        "/api/v1/holdings",
        json={
            "user_id": test_user["id"],
            "account_id": test_account["id"],
            "ticker": "MSFT",
            "quantity": 0,
            "entry_price": 100.0
        }
    )
    assert response.status_code in [400, 422]

    # Zero price should fail (now caught by Pydantic Field gt=0)
    response = client.post(
        "/api/v1/holdings",
        json={
            "user_id": test_user["id"],
            "account_id": test_account["id"],
            "ticker": "MSFT",
            "quantity": 10.0,
            "entry_price": 0
        }
    )
    assert response.status_code in [400, 422]


def test_get_holding(client, test_user, test_account):
    """Test getting a specific holding"""
    create_response = client.post(
        "/api/v1/holdings",
        json={
            "user_id": test_user["id"],
            "account_id": test_account["id"],
            "ticker": "GOOGL",
            "quantity": 5.0,
            "entry_price": 2800.0
        }
    )
    holding_id = create_response.json()["id"]

    response = client.get(f"/api/v1/holdings/{holding_id}")
    assert response.status_code == 200
    assert response.json()["ticker"] == "GOOGL"


def test_get_user_holdings(client, test_user, test_account):
    """Test getting all holdings for a user"""
    client.post(
        "/api/v1/holdings",
        json={
            "user_id": test_user["id"],
            "account_id": test_account["id"],
            "ticker": "AAPL",
            "quantity": 10.0,
            "entry_price": 150.0
        }
    )
    client.post(
        "/api/v1/holdings",
        json={
            "user_id": test_user["id"],
            "account_id": test_account["id"],
            "ticker": "MSFT",
            "quantity": 5.0,
            "entry_price": 300.0
        }
    )

    response = client.get(f"/api/v1/users/{test_user['id']}/holdings")
    assert response.status_code == 200
    holdings = response.json()
    assert len(holdings) == 2


def test_update_holding(client, test_user, test_account):
    """Test updating a holding"""
    create_response = client.post(
        "/api/v1/holdings",
        json={
            "user_id": test_user["id"],
            "account_id": test_account["id"],
            "ticker": "TSLA",
            "quantity": 2.0,
            "entry_price": 800.0
        }
    )
    holding_id = create_response.json()["id"]

    response = client.put(
        f"/api/v1/holdings/{holding_id}?user_id={test_user['id']}",
        json={"quantity": 3.0}
    )
    assert response.status_code == 200
    assert response.json()["quantity"] == 3.0


def test_delete_holding(client, test_user, test_account):
    """Test deleting a holding (closing position)"""
    create_response = client.post(
        "/api/v1/holdings",
        json={
            "user_id": test_user["id"],
            "account_id": test_account["id"],
            "ticker": "META",
            "quantity": 7.0,
            "entry_price": 250.0
        }
    )
    holding_id = create_response.json()["id"]

    response = client.delete(f"/api/v1/holdings/{holding_id}?user_id={test_user['id']}")
    assert response.status_code == 204

    get_response = client.get(f"/api/v1/holdings/{holding_id}")
    assert get_response.status_code == 404
