# Features

## MVP (Minimum Viable Product)

### Summary

A personal stock & ETF tracker that enforces investment discipline through documented decision-making. Users define investment theses (buy reasons) and exit criteria (sell reasons) before purchasing, helping reduce emotional decisions and improve long-term returns. Track multiple watchlists, manage investment triggers, and maintain a clear audit trail of your investment logic.

### Project Architecture

- [X] Add a DB migration tool
- [X] Add some E2E tests
- [ ] Add Docker setup
- [X] Add Global error handling

### Stock Data API

- [X] Install Alpha Vantage MCP
- [X] Search stocks/ETFs by ticker symbol
- [X] Search stocks/ETFs by company name
- [X] Fetch current price and daily % change
- [X] Fetch key metrics (P/E, market cap, 52-week high/low)
- [X] Fetch dividend yield and payout info
- [X] Fetch historical price data (30d, 90d, 1y intervals)
- [X] Cache API responses to minimize rate limits

### User Management

- [X] Create local user profile (name, avatar/color)
- [X] Edit user profile
- [X] Delete user profile (with confirmation)
- [X] Switch between users (dropdown in header navigation)
- [X] Persist user preferences and data separately

### Dashboard

- [ ] Portfolio summary card (total value, gain/loss, % return)
- [ ] Quick stock search bar (ticker symbol entry)
- [X] List of watchlists with stock counts
- [ ] Recently added stocks with prices
- [ ] Top movers from watchlists (biggest daily % changes)
- [X] Link to manage accounts and holdings

### Stock Detail View

- [ ] Display current price, open, close, volume
- [ ] Show daily % change and color-coded indicator
- [ ] Display 30-day sparkline chart
- [ ] Show key fundamentals (P/E ratio, market cap, 52-week range)
- [ ] Display dividend yield (if applicable)
- [ ] Show attached thesis and triggers
- [ ] Add to Watchlist button
- [ ] Quick share count and buy/sell price inputs

### Thesis

- [X] Write buy thesis (why you should purchase this stock)
- [X] Write sell thesis (why and when you should exit)
- [X] Record thesis creation date
- [X] Edit existing thesis
- [X] AI-powered thesis analysis (quality score, blind spots, suggestions via Claude API)
- [ ] View thesis update history (optional phase 2)

### Triggers

- [X] Buy trigger: target price below which to purchase
- [X] Sell trigger: target price to take profits
- [X] Stop-loss trigger: maximum % drop before selling
- [ ] Visual badge indicator on watchlist if trigger is breached
- [ ] Dashboard notification when trigger price is hit

### Watchlists

- [X] Create watchlist with name and description
- [X] Edit watchlist name and description
- [X] Delete watchlist
- [X] Add stocks to watchlist
- [X] Remove stocks from watchlist
- [ ] Move stock between watchlists
- [ ] Display stock price and daily % change inline
- [X] Show thesis indicator badge (thesis exists or not)
- [X] Show trigger indicator badge (triggers set or not)
- [X] Enforce max of 15 stocks per watchlist
- [ ] Sort stocks by price, % change, or date added
- [ ] View watchlist overview (total value, top mover)
- [X] Fix Delete icon

### Holdings & Portfolio

- [X] Record buy order (ticker, shares, price paid, date, account)
- [X] Record sell order (ticker, shares, price received, date, account)
- [X] Display unrealized gain/loss per position
- [X] Show cost basis vs current value
- [X] Show % return per position
- [ ] Calculate weighted average cost basis
- [ ] Link holdings to investment thesis and triggers
- [X] Support partial sells (reduce position size)

### Accounts

- [X] Create brokerage account (name, type: taxable/IRA/Roth)
- [X] Edit brokerage account details
- [X] Delete brokerage account
- [X] Associate holdings with specific account
- [X] Account-level portfolio summary (total value, gain/loss)
- [X] Account type displays (visual indicator for tax status)

## Phase 2

### Analytics & Reporting

- [ ] Portfolio performance chart (vs S&P 500 benchmark)
- [ ] Win rate tracking (% of closed positions that were profitable)
- [ ] Thesis accuracy reporting (how often triggers hit target vs stop-loss)
- [ ] Position sizing analysis (allocation by watchlist and sector)
- [ ] Tax lot tracking (FIFO/LIFO accounting)
- [ ] Monthly performance summary
- [ ] Realized vs unrealized gains report
- [ ] Individual thesis performance review

### Advanced Features

- [ ] Price alerts via email or in-app notifications
- [ ] Export portfolio data (CSV/PDF)
- [ ] Multi-currency support
- [ ] Sector and industry classification
- [ ] Correlation analysis between holdings
- [ ] Risk assessment (portfolio volatility, beta)
