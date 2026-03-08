# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Vue 3 financial application with a FastAPI backend. The frontend uses Vite as the build tool and the backend provides REST APIs for financial operations.

## Development Commands

### Frontend (Vue 3)

- **`npm install`** - Install frontend dependencies (run from root directory)
- **`npm run dev`** - Start development server on [localhost:5173](http://localhost:5173) (auto-opens browser)
- **`npm run build`** - Build for production (output in `dist/` directory)
- **`npm run preview`** - Preview production build locally
- **`npm run lint`** - Lint and auto-fix code style issues

### Backend (FastAPI with uv)

- **`cd backend && uv sync`** - Install Python dependencies (creates .venv automatically)
- **`cd backend && uv run uvicorn app.main:app --reload`** - Start development server on [localhost:8000](http://localhost:8000)
- **`cd backend && uv run uvicorn app.main:app --reload --host 0.0.0.0`** - Run on all interfaces
- **`cd backend && uv sync --extra dev`** - Install dev dependencies (includes pytest)
- **`cd backend && uv run pytest`** - Run tests
- **Visit [localhost:8000/docs](http://localhost:8000/docs)** - Interactive API documentation (Swagger UI)

## Project Structure

```
Frontend (Vue 3):
  src/
    main.js            - Vue app entry point, creates root instance
    App.vue            - Root component, main layout
    components/        - Reusable Vue components
  public/              - Static assets served as-is
  index.html           - HTML entry point
  vite.config.js       - Vite configuration
  package.json         - Frontend dependencies

Backend (FastAPI):
  backend/
    app/
      main.py          - FastAPI application and routes
      __init__.py
    pyproject.toml     - Python project config and dependencies (uv)
    .env.example       - Example environment variables
```

## Architecture Notes

**Vue 3 Setup:**

- Uses Composition API with `<script setup>` syntax for cleaner components
- Vite provides hot module replacement (HMR) for instant updates during development
- Component-based architecture: build UIs by composing reusable `.vue` files

**FastAPI Backend:**

- Provides REST API endpoints for financial operations
- CORS enabled for frontend communication (localhost:5173)
- Automatic interactive documentation at `/docs` endpoint
- Pydantic models for request/response validation

## Getting Started

**Prerequisites:** Install [uv](https://docs.astral.sh/uv/getting-started/) for Python package management.

1. Clone the repo and run `npm install` (frontend)
2. Set up backend: `cd backend && uv sync`
3. Run frontend: `npm run dev` (from root)
4. Run backend: `cd backend && uv run uvicorn app.main:app --reload`
5. Frontend runs on [localhost:5173](http://localhost:5173), backend on [localhost:8000](http://localhost:8000)

## Development Practices

### Test-First Development

To reduce bugs and unneeded code this app will be using TDD (Test Driven Design).

**All new functionality must have tests written first, then implementation.** This ensures:

- Features are testable by design
- Requirements are clarified before coding
- Regressions are caught early
- Code quality and coverage remain high

**Workflow:**

1. Write tests for the new feature (component, route, service, etc.)
2. Run tests to confirm they fail
3. Implement functionality to make tests pass
4. Refactor while keeping tests green

**Running Tests:**

- **Frontend:** `npm run test` (one-time run) or `npm run test:watch` (watch mode)
- **Backend:** `cd backend && uv run pytest` or `uv run pytest -v` for verbose output

## Design Philosophy & MVP Scope

### Core Principle: Investment Discipline Through Documentation

This app enforces **discipline through documented reasoning**, not automated trading or predictions. The core insight: emotional investing is the biggest risk to returns. By requiring users to write down their theses (why buy/sell) *before* purchasing, the app reduces guessing and encourages intentional decision-making.

### MVP Strategy

**MVP Focus:** Personal stock/ETF tracking with thesis + triggers.

- **Multi-user support** (local profiles only, no authentication in MVP)
- **Watchlists** to organize stocks by strategy/thesis
- **Investment Thesis** (buy reasons + sell conditions attached to each stock)
- **Price Triggers** (buy target, sell target, stop-loss)
- **Holdings tracking** (record actual trades, track P&L)
- **Real-time data** via Alpha Vantage (stock prices, fundamentals, history)

**NOT in MVP (Phase 2 features):**

- Advanced analytics (portfolio performance, win rate, thesis accuracy)
- Portfolio optimization, risk scoring, sector analysis
- Tax reporting, cost basis accounting
- Alerts/notifications

### Design Constraints

- **Local-first**: Data stored in browser (IndexedDB/localStorage), no backend database for MVP
- **User-scoped**: Each user has isolated data (watchlists, holdings, preferences)
- **API-first**: Frontend calls Alpha Vantage + backend HTTP routes
- **Simple navigation**: Single-page app with modals, no complex routing needed yet

## Data Model

### Core Entities (MVP)

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
  ├─ ticker, symbol
  ├─ quantity, entry_price, entry_date
  ├─ current_value, unrealized_gain_loss, return_pct
  ├─ account_id
  └─ user_id

BrokerageAccount
  ├─ name, account_type (taxable/IRA/Roth)
  ├─ broker_name
  └─ user_id

StockData (external, from Alpha Vantage)
  ├─ ticker, company_name
  ├─ current_price, daily_change_pct, volume
  ├─ p_e_ratio, market_cap, dividend_yield
  ├─ 52_week_high, 52_week_low
  └─ cached_timestamp (for rate-limit management)
```

### Data Flow (User Journey)

1. **Search** → User searches for stock → frontend calls Alpha Vantage (cached)
2. **Add to Watchlist** → User adds to watchlist with thesis (buy/sell reasons)
3. **Set Triggers** → User defines buy target, sell target, stop-loss %
4. **Track Holdings** → User logs buy trade → creates Holding, links to thesis
5. **Monitor** → Dashboard shows portfolio value, P&L, watchlist top movers
6. **Close Position** → User logs sell trade → calculates realized gain/loss

### Storage (MVP)

- **Frontend**: IndexedDB or localStorage for temporary data (profiles, watchlists, holdings, theses)
- **Backend**: SQLite database for persistent data (users, watchlists, holdings, theses, account data). Alpha Vantage API for market data (with server-side caching to minimize API calls)
- **Phase 2**: Migrate to PostgreSQL + cloud backend for multi-device sync, cloud backup, shared portfolios

## Key Dependencies

**Frontend:**

- **Vue 3.3.x** - Progressive JavaScript framework
- **Vite 4.4.x** - Next generation frontend tooling
- **ESLint** - Code linting with Vue 3 rules

**Backend:**

- **FastAPI 0.104.x** - Modern async web framework
- **Uvicorn 0.24.x** - ASGI server
- **Pydantic 2.5.x** - Data validation
