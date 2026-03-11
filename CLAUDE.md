# CLAUDE.md

Vue 3 (Vite) frontend + FastAPI (uv) backend financial tracking app. Frontend on localhost:5173, backend on localhost:8000.

## CRITICAL RULES

- **TDD**: Write tests first, then implementation. Run tests to confirm failure before writing code.
- **No external API calls from frontend**: Frontend calls backend only. Backend is the sole gateway to Alpha Vantage (with server-side caching).
- **Vue 3 `<script setup>`**: Use Composition API for all components.
- **Dark mode only**: UI is dark theme.
- **Thesis-first**: Every stock view must show its investment thesis prominently.
- **API-first**: Never bypass the backend. All data flows through REST endpoints.
- **User-scoped data**: All watchlists, holdings, and theses are isolated per user.
- **No Phase 2 features**: No analytics, tax reporting, alerts, or portfolio optimization — keep scope to MVP.

## Dev Commands

**Frontend:**

- `npm install` — install dependencies
- `npm run dev` — start dev server (localhost:5173)
- `npm run lint` — lint and fix
- `npm run test` — run tests (one-time)
- `npm run test:watch` — run tests (watch mode)

**Backend:**

- `cd backend && uv sync` — install dependencies
- `cd backend && uv run uvicorn app.main:app --reload` — start dev server (localhost:8000)
- `cd backend && uv sync --extra dev` — install dev deps (pytest)
- `cd backend && uv run pytest` — run tests
- API docs: localhost:8000/docs

## Project Structure

```text
src/
  main.js          - app entry point
  App.vue          - root component, main layout
  components/      - reusable components
  views/           - page-level views
  stores/          - Pinia stores
  services/        - API service calls

backend/app/
  main.py          - FastAPI app, routes, CORS
  pyproject.toml   - Python deps (uv)
```

## Data Model

```text
User
  ├─ profiles (multiple local users, browser-stored)
  ├─ watchlists[]
  └─ holdings[]

Watchlist
  ├─ name, description, created_date
  ├─ stocks[] (max 15)
  └─ owner_user_id

StockInWatchlist
  ├─ ticker, symbol
  ├─ thesis: { buy_reasons, sell_conditions }
  ├─ triggers: { buy_price, sell_price, stop_loss_pct }
  ├─ added_date
  └─ watchlist_id

Holding
  ├─ ticker, quantity, entry_price, entry_date
  ├─ current_value, unrealized_gain_loss, return_pct
  ├─ account_id, user_id

BrokerageAccount
  ├─ name, account_type (taxable/IRA/Roth)
  ├─ broker_name, user_id

StockData (Alpha Vantage, backend-cached)
  ├─ ticker, company_name, current_price, daily_change_pct
  ├─ p_e_ratio, market_cap, dividend_yield
  ├─ 52_week_high, 52_week_low, cached_timestamp
```

**Storage**: User profiles in localStorage; watchlists/holdings/theses in backend SQLite.

## MVP Scope

**In scope**: Multi-user local profiles, watchlists, investment thesis + sell conditions, price triggers, holdings tracking, P&L, Alpha Vantage market data.

**Out of scope**: Analytics, portfolio optimization, risk scoring, tax reporting, alerts/notifications, cloud sync.

## UI Guidelines

- Dark mode, card-based layout (watchlists, holdings, accounts)
- Information hierarchy: Thesis > Current Price > Triggers > Historical Data
- Scan-friendly: color coding, icons, no walls of text
- Mobile-responsive (users check on phone)
