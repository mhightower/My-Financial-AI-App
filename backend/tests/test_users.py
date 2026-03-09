import pytest
from app.schemas import UserCreate, UserResponse


def test_create_user(client):
    """Test creating a new user"""
    response = client.post("/api/v1/users", json={"name": "John Doe"})
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "John Doe"
    assert "id" in data
    assert "created_at" in data


def test_get_user(client):
    """Test getting a user by ID"""
    # Create user first
    create_response = client.post("/api/v1/users", json={"name": "Jane Doe"})
    user_id = create_response.json()["id"]

    # Get user
    response = client.get(f"/api/v1/users/{user_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == user_id
    assert data["name"] == "Jane Doe"


def test_get_user_not_found(client):
    """Test getting a non-existent user"""
    response = client.get("/api/v1/users/999")
    assert response.status_code == 404


def test_get_all_users(client):
    """Test getting all users"""
    # Create multiple users
    client.post("/api/v1/users", json={"name": "User1"})
    client.post("/api/v1/users", json={"name": "User2"})

    response = client.get("/api/v1/users")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["name"] == "User1"
    assert data[1]["name"] == "User2"


def test_update_user(client):
    """Test updating a user"""
    # Create user
    create_response = client.post("/api/v1/users", json={"name": "Original Name"})
    user_id = create_response.json()["id"]

    # Update user
    response = client.put(f"/api/v1/users/{user_id}", json={"name": "Updated Name"})
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Name"

    # Verify update
    get_response = client.get(f"/api/v1/users/{user_id}")
    assert get_response.json()["name"] == "Updated Name"


def test_delete_user(client):
    """Test deleting a user"""
    # Create user
    create_response = client.post("/api/v1/users", json={"name": "To Delete"})
    user_id = create_response.json()["id"]

    # Delete user
    response = client.delete(f"/api/v1/users/{user_id}")
    assert response.status_code == 204

    # Verify deletion
    get_response = client.get(f"/api/v1/users/{user_id}")
    assert get_response.status_code == 404


def test_duplicate_user_name(client):
    """Test that duplicate user names are rejected"""
    client.post("/api/v1/users", json={"name": "Duplicate"})
    response = client.post("/api/v1/users", json={"name": "Duplicate"})
    assert response.status_code == 400


def test_create_user_with_avatar_color(client):
    """Test creating a user with an avatar color"""
    response = client.post("/api/v1/users", json={
        "name": "User With Color",
        "avatar_color": "#667eea"
    })
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "User With Color"
    assert data["avatar_color"] == "#667eea"


def test_create_user_without_avatar_color(client):
    """Test creating a user without avatar color (optional field)"""
    response = client.post("/api/v1/users", json={"name": "User No Color"})
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "User No Color"
    assert data["avatar_color"] is None


def test_update_user_avatar_color(client):
    """Test updating user's avatar color"""
    # Create user
    create_response = client.post("/api/v1/users", json={"name": "UpdateColor"})
    user_id = create_response.json()["id"]

    # Update avatar color
    response = client.put(f"/api/v1/users/{user_id}", json={
        "avatar_color": "#48bb78"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["avatar_color"] == "#48bb78"

    # Verify update persisted
    get_response = client.get(f"/api/v1/users/{user_id}")
    assert get_response.json()["avatar_color"] == "#48bb78"
