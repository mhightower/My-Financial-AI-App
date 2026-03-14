import pytest
from unittest.mock import patch, AsyncMock


MOCK_FUNDAMENTALS = type("F", (), {
    "ticker": "NVDA", "company_name": "NVIDIA", "current_price": 800.0,
    "daily_change_pct": 2.5, "volume": 5000000, "p_e_ratio": 60.0,
    "market_cap": "2T", "dividend_yield": 0.01, "week_52_high": 950.0,
    "week_52_low": 400.0, "timestamp": None
})()

MOCK_ANALYSIS = {
    "quality_score": 7,
    "conviction_level": "High",
    "strengths": ["Strong AI chip dominance"],
    "blind_spots": ["Customer concentration risk"],
    "suggestions": ["Add a P/E ceiling as a sell trigger"]
}

MOCK_DRAFT = {
    "buy_reasons": "NVDA trades at a premium P/E of 60x reflecting AI tailwinds.",
    "sell_conditions": "Sell if P/E exceeds 80x or revenue growth falls below 20% YoY."
}


def test_analyze_thesis_returns_structured_response(client):
    """analyze-thesis returns quality_score, conviction_level, strengths, blind_spots, suggestions"""
    with patch("app.services.alpha_vantage.get_overview", AsyncMock(return_value=MOCK_FUNDAMENTALS)), \
         patch("app.services.ai_service.analyze_thesis", AsyncMock(return_value=MOCK_ANALYSIS)):
        response = client.post("/api/v1/ai/analyze-thesis", json={
            "ticker": "NVDA",
            "buy_reasons": "AI chip dominance with CUDA moat.",
            "sell_conditions": "Sell if AMD closes the GPU gap."
        })

    assert response.status_code == 200
    data = response.json()
    assert "quality_score" in data
    assert "conviction_level" in data
    assert "strengths" in data
    assert "blind_spots" in data
    assert "suggestions" in data
    assert data["quality_score"] == 7


def test_analyze_thesis_requires_buy_reasons(client):
    """analyze-thesis returns 422 when buy_reasons is empty"""
    with patch("app.services.alpha_vantage.get_overview", AsyncMock(return_value=MOCK_FUNDAMENTALS)):
        response = client.post("/api/v1/ai/analyze-thesis", json={
            "ticker": "NVDA",
            "buy_reasons": "",
            "sell_conditions": "Sell if margins compress."
        })
    assert response.status_code == 422


def test_analyze_thesis_requires_sell_conditions(client):
    """analyze-thesis returns 422 when sell_conditions is empty"""
    with patch("app.services.alpha_vantage.get_overview", AsyncMock(return_value=MOCK_FUNDAMENTALS)):
        response = client.post("/api/v1/ai/analyze-thesis", json={
            "ticker": "NVDA",
            "buy_reasons": "Strong AI chip business.",
            "sell_conditions": ""
        })
    assert response.status_code == 422


def test_analyze_thesis_404_on_bad_ticker(client):
    """analyze-thesis returns 404 when ticker fundamentals cannot be fetched"""
    with patch("app.services.alpha_vantage.get_overview", AsyncMock(side_effect=ValueError("No data"))):
        response = client.post("/api/v1/ai/analyze-thesis", json={
            "ticker": "XXXX",
            "buy_reasons": "Some reason.",
            "sell_conditions": "Some condition."
        })
    assert response.status_code == 404


def test_draft_thesis_returns_buy_and_sell(client):
    """draft-thesis returns buy_reasons and sell_conditions"""
    with patch("app.services.alpha_vantage.get_overview", AsyncMock(return_value=MOCK_FUNDAMENTALS)), \
         patch("app.services.ai_service.draft_thesis", AsyncMock(return_value=MOCK_DRAFT)):
        response = client.post("/api/v1/ai/draft-thesis", json={"ticker": "NVDA"})

    assert response.status_code == 200
    data = response.json()
    assert "buy_reasons" in data
    assert "sell_conditions" in data
    assert len(data["buy_reasons"]) > 0
    assert len(data["sell_conditions"]) > 0


def test_draft_thesis_falls_back_when_fundamentals_unavailable(client):
    """draft-thesis still generates even when fundamentals cannot be fetched (uses ticker stub)"""
    with patch("app.services.alpha_vantage.get_overview", AsyncMock(side_effect=ValueError("No data"))), \
         patch("app.services.alpha_vantage.get_quote", AsyncMock(side_effect=ValueError("No data"))), \
         patch("app.services.ai_service.draft_thesis", AsyncMock(return_value=MOCK_DRAFT)):
        response = client.post("/api/v1/ai/draft-thesis", json={"ticker": "NOMD"})
    assert response.status_code == 200
    data = response.json()
    assert "buy_reasons" in data
    assert "sell_conditions" in data


def test_analyze_thesis_502_on_ai_failure(client):
    """analyze-thesis returns 502 when AI service raises an exception"""
    from unittest.mock import MagicMock
    import anthropic
    fake_request = MagicMock()
    with patch("app.services.alpha_vantage.get_overview", AsyncMock(return_value=MOCK_FUNDAMENTALS)), \
         patch("app.services.ai_service.analyze_thesis",
               AsyncMock(side_effect=anthropic.APIConnectionError(request=fake_request))):
        response = client.post("/api/v1/ai/analyze-thesis", json={
            "ticker": "NVDA",
            "buy_reasons": "Strong AI chip business.",
            "sell_conditions": "Sell if margins compress."
        })
    assert response.status_code == 502


def test_draft_thesis_502_on_ai_failure(client):
    """draft-thesis returns 502 when AI service raises an exception"""
    from unittest.mock import MagicMock
    import anthropic
    fake_request = MagicMock()
    with patch("app.services.alpha_vantage.get_overview", AsyncMock(return_value=MOCK_FUNDAMENTALS)), \
         patch("app.services.ai_service.draft_thesis",
               AsyncMock(side_effect=anthropic.APIConnectionError(request=fake_request))):
        response = client.post("/api/v1/ai/draft-thesis", json={"ticker": "NVDA"})
    assert response.status_code == 502
