def test_get_root(client):
    """Test GET / endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()
    assert response.json()["docs"] == "/docs"


def test_get_health(client):
    """Test GET /health endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "Financial app backend is running" in data["message"]


def test_cors_headers(client):
    """Test CORS headers are present for allowed origins"""
    response = client.get("/", headers={"Origin": "http://localhost:5173"})
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"
