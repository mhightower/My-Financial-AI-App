import json
import os
from anthropic import AsyncAnthropic

client = AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
MODEL = "claude-haiku-4-5-20251001"

ANALYZE_THESIS_PROMPT = """\
You are a rigorous investment analyst reviewing an investor's thesis for {ticker}.

Company fundamentals:
- Current Price: ${current_price}
- P/E Ratio: {pe_ratio}
- Market Cap: {market_cap}
- 52-Week Range: ${week_52_low}–${week_52_high}
- Dividend Yield: {dividend_yield}
- Daily Change: {daily_change_pct}%

Investor's thesis:
BUY REASONS:
{buy_reasons}

SELL CONDITIONS:
{sell_conditions}

Analyze this thesis critically. Identify what is well-reasoned, what assumptions are \
unverified, and what the investor may be ignoring. Be specific and direct — no generic advice.

Respond with valid JSON only, no markdown fences:
{{"quality_score": <integer 1-10>, "conviction_level": "<Low|Medium|High>", \
"strengths": ["<specific strength>"], "blind_spots": ["<specific blind spot>"], \
"suggestions": ["<specific actionable suggestion>"]}}"""

DRAFT_THESIS_PROMPT = """\
You are helping an investor build an investment thesis for {ticker}.

Company fundamentals (use only what is available, skip N/A values):
- Company: {company_name}
- Current Price: {current_price}
- P/E Ratio: {pe_ratio}
- Market Cap: {market_cap}
- 52-Week Range: {week_52_low}–{week_52_high}
- Dividend Yield: {dividend_yield}

Draft a grounded investment thesis. Where data is N/A, use general knowledge about the \
company or sector. Be specific, practical, and actionable.

Respond with valid JSON only, no markdown fences:
{{"buy_reasons": "<2-4 sentences about why to buy>", \
"sell_conditions": "<2-3 specific conditions that would invalidate this thesis>"}}"""


def _parse_json(text: str) -> dict:
    """Parse JSON from Claude response, stripping markdown fences if present."""
    text = text.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
    return json.loads(text)


async def analyze_thesis(
    ticker: str,
    buy_reasons: str,
    sell_conditions: str,
    fundamentals,
) -> dict:
    prompt = ANALYZE_THESIS_PROMPT.format(
        ticker=ticker,
        current_price=fundamentals.current_price,
        pe_ratio=fundamentals.p_e_ratio or "N/A",
        market_cap=fundamentals.market_cap or "N/A",
        week_52_low=fundamentals.week_52_low or "N/A",
        week_52_high=fundamentals.week_52_high or "N/A",
        dividend_yield=fundamentals.dividend_yield or "0%",
        daily_change_pct=fundamentals.daily_change_pct,
        buy_reasons=buy_reasons,
        sell_conditions=sell_conditions,
    )
    message = await client.messages.create(
        model=MODEL,
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )
    return _parse_json(message.content[0].text)


async def draft_thesis(ticker: str, fundamentals) -> dict:
    prompt = DRAFT_THESIS_PROMPT.format(
        ticker=ticker,
        company_name=getattr(fundamentals, "company_name", None) or ticker,
        current_price=getattr(fundamentals, "current_price", None) or "N/A",
        pe_ratio=getattr(fundamentals, "p_e_ratio", None) or "N/A",
        market_cap=getattr(fundamentals, "market_cap", None) or "N/A",
        week_52_low=getattr(fundamentals, "week_52_low", None) or "N/A",
        week_52_high=getattr(fundamentals, "week_52_high", None) or "N/A",
        dividend_yield=getattr(fundamentals, "dividend_yield", None) or "N/A",
    )
    message = await client.messages.create(
        model=MODEL,
        max_tokens=512,
        messages=[{"role": "user", "content": prompt}],
    )
    return _parse_json(message.content[0].text)
