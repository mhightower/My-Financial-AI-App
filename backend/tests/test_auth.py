"""Cross-user authorization tests: verify that user B cannot access user A's resources."""
import pytest


@pytest.fixture
def two_users(client):
    user_a = client.post("/api/v1/users", json={"name": "UserA"}).json()
    user_b = client.post("/api/v1/users", json={"name": "UserB"}).json()
    return user_a, user_b


@pytest.fixture
def user_a_watchlist(client, two_users):
    user_a, _ = two_users
    return client.post(
        f"/api/v1/watchlists?user_id={user_a['id']}",
        json={"name": "User A Watchlist"}
    ).json()


@pytest.fixture
def user_a_account(client, two_users):
    user_a, _ = two_users
    return client.post(
        "/api/v1/accounts",
        json={"user_id": user_a["id"], "name": "User A Account", "account_type": "taxable"}
    ).json()


@pytest.fixture
def user_a_holding(client, two_users, user_a_account):
    user_a, _ = two_users
    return client.post(
        "/api/v1/holdings",
        json={
            "user_id": user_a["id"],
            "account_id": user_a_account["id"],
            "ticker": "AAPL",
            "quantity": 10.0,
            "entry_price": 150.0
        }
    ).json()


# Watchlist tests

def test_other_user_cannot_read_watchlist(client, two_users, user_a_watchlist):
    _, user_b = two_users
    response = client.get(f"/api/v1/watchlists/{user_a_watchlist['id']}?user_id={user_b['id']}")
    assert response.status_code == 403


def test_other_user_cannot_update_watchlist(client, two_users, user_a_watchlist):
    _, user_b = two_users
    response = client.put(
        f"/api/v1/watchlists/{user_a_watchlist['id']}?user_id={user_b['id']}",
        json={"name": "Hacked"}
    )
    assert response.status_code == 403


def test_other_user_cannot_delete_watchlist(client, two_users, user_a_watchlist):
    _, user_b = two_users
    response = client.delete(f"/api/v1/watchlists/{user_a_watchlist['id']}?user_id={user_b['id']}")
    assert response.status_code == 403


def test_other_user_cannot_add_stock_to_watchlist(client, two_users, user_a_watchlist):
    _, user_b = two_users
    response = client.post(
        f"/api/v1/watchlists/{user_a_watchlist['id']}/stocks?user_id={user_b['id']}",
        json={"ticker": "TSLA"}
    )
    assert response.status_code == 403


# Account tests

def test_other_user_cannot_read_account(client, two_users, user_a_account):
    _, user_b = two_users
    response = client.get(f"/api/v1/accounts/{user_a_account['id']}?user_id={user_b['id']}")
    assert response.status_code == 403


def test_other_user_cannot_delete_account(client, two_users, user_a_account):
    _, user_b = two_users
    response = client.delete(f"/api/v1/accounts/{user_a_account['id']}?user_id={user_b['id']}")
    assert response.status_code == 403


# Holding tests

def test_other_user_cannot_read_holding(client, two_users, user_a_holding):
    _, user_b = two_users
    response = client.get(f"/api/v1/holdings/{user_a_holding['id']}?user_id={user_b['id']}")
    assert response.status_code == 403


def test_other_user_cannot_update_holding(client, two_users, user_a_holding):
    _, user_b = two_users
    response = client.put(
        f"/api/v1/holdings/{user_a_holding['id']}?user_id={user_b['id']}",
        json={"quantity": 999.0}
    )
    assert response.status_code == 403


def test_other_user_cannot_delete_holding(client, two_users, user_a_holding):
    _, user_b = two_users
    response = client.delete(f"/api/v1/holdings/{user_a_holding['id']}?user_id={user_b['id']}")
    assert response.status_code == 403
