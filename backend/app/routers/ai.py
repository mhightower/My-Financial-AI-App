import logging

import anthropic as anthropic_sdk
from fastapi import APIRouter, HTTPException, status

from ..schemas import (
    AnalyzeThesisRequest,
    AnalyzeThesisResponse,
    DraftThesisRequest,
    DraftThesisResponse,
)
from ..services import ai_service, alpha_vantage

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/ai", tags=["ai"])


@router.post("/analyze-thesis", response_model=AnalyzeThesisResponse)
async def analyze_thesis(body: AnalyzeThesisRequest):
    """Analyze an investment thesis using AI and return structured feedback"""
    if not body.buy_reasons.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="buy_reasons is required for thesis analysis"
        )
    if not body.sell_conditions.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="sell_conditions is required for thesis analysis"
        )

    try:
        fundamentals = await alpha_vantage.get_overview(body.ticker)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Could not fetch fundamentals for {body.ticker}"
        )

    try:
        result = await ai_service.analyze_thesis(
            ticker=body.ticker,
            buy_reasons=body.buy_reasons,
            sell_conditions=body.sell_conditions,
            fundamentals=fundamentals,
        )
        return AnalyzeThesisResponse(**result)
    except anthropic_sdk.APIError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI analysis temporarily unavailable"
        )


@router.post("/draft-thesis", response_model=DraftThesisResponse)
async def draft_thesis(body: DraftThesisRequest):
    """Generate a draft investment thesis from stock fundamentals using AI"""
    # Try full fundamentals first, fall back to quote, then minimal stub
    fundamentals = None
    try:
        fundamentals = await alpha_vantage.get_overview(body.ticker)
    except Exception:
        logger.exception("Could not fetch overview for %s, trying quote fallback", body.ticker)

    if fundamentals is None:
        # Fall back to basic quote data wrapped in a compatible object
        try:
            quote = await alpha_vantage.get_quote(body.ticker)
            fundamentals = type("Fundamentals", (), {
                "ticker": body.ticker,
                "company_name": body.ticker,
                "current_price": quote.current_price,
                "daily_change_pct": quote.daily_change_pct,
                "volume": quote.volume,
                "p_e_ratio": None,
                "market_cap": None,
                "dividend_yield": None,
                "week_52_high": None,
                "week_52_low": None,
            })()
        except Exception:
            logger.exception("Could not fetch quote for %s, using ticker stub", body.ticker)

    if fundamentals is None:
        # Last resort: stub with just the ticker — AI will write a general thesis
        fundamentals = type("Fundamentals", (), {
            "ticker": body.ticker,
            "company_name": body.ticker,
            "current_price": None,
            "daily_change_pct": None,
            "volume": None,
            "p_e_ratio": None,
            "market_cap": None,
            "dividend_yield": None,
            "week_52_high": None,
            "week_52_low": None,
        })()

    try:
        result = await ai_service.draft_thesis(
            ticker=body.ticker,
            fundamentals=fundamentals,
        )
        return DraftThesisResponse(**result)
    except anthropic_sdk.APIError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI service temporarily unavailable"
        )
