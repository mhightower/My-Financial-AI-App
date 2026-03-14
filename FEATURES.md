# Features

## MVP (Minimum Viable Product)

### Summary

A personal stock & ETF tracker that enforces investment discipline through documented decision-making. Users define investment theses (buy reasons) and exit criteria (sell reasons) before purchasing, helping reduce emotional decisions and improve long-term returns. Track multiple watchlists, manage investment triggers, and maintain a clear audit trail of your investment logic.

### Project Architecture

- [ ] Add a DB migration tool

### Stock Data API

- [X] Install Alpha Vantage MCP
- [ ] Search stocks/ETFs by ticker symbol
- [ ] Search stocks/ETFs by company name
- [ ] Fetch current price and daily % change
- [ ] Fetch key metrics (P/E, market cap, 52-week high/low)
- [ ] Fetch dividend yield and payout info
- [ ] Fetch historical price data (30d, 90d, 1y intervals)
- [ ] Cache API responses to minimize rate limits

### User Management

- [ ] Create local user profile (name, avatar/color)
- [ ] Edit user profile
- [ ] Delete user profile (with confirmation)
- [ ] Switch between users (dropdown in header navigation)
- [ ] Persist user preferences and data separately

### Dashboard

- [ ] Portfolio summary card (total value, gain/loss, % return)
- [ ] Quick stock search bar (ticker symbol entry)
- [ ] List of watchlists with stock counts
- [ ] Recently added stocks with prices
- [ ] Top movers from watchlists (biggest daily % changes)
- [ ] Link to manage accounts and holdings

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

- [ ] Write buy thesis (why you should purchase this stock)
- [ ] Write sell thesis (why and when you should exit)
- [ ] Record thesis creation date
- [ ] Edit existing thesis
- [ ] View thesis update history (optional phase 2)

### Triggers

- [ ] Buy trigger: target price below which to purchase
- [ ] Sell trigger: target price to take profits
- [ ] Stop-loss trigger: maximum % drop before selling
- [ ] Visual badge indicator on watchlist if trigger is breached
- [ ] Dashboard notification when trigger price is hit

### Watchlists

- [ ] Create watchlist with name and description
- [ ] Edit watchlist name and description
- [ ] Delete watchlist
- [ ] Add stocks to watchlist
- [ ] Remove stocks from watchlist
- [ ] Move stock between watchlists
- [ ] Display stock price and daily % change inline
- [ ] Show thesis indicator badge (thesis exists or not)
- [ ] Show trigger indicator badge (triggers set or not)
- [ ] Enforce max of 15 stocks per watchlist
- [ ] Sort stocks by price, % change, or date added
- [ ] View watchlist overview (total value, top mover)

### Holdings & Portfolio

- [ ] Record buy order (ticker, shares, price paid, date, account)
- [ ] Record sell order (ticker, shares, price received, date, account)
- [ ] Display unrealized gain/loss per position
- [ ] Show cost basis vs current value
- [ ] Show % return per position
- [ ] Calculate weighted average cost basis
- [ ] Link holdings to investment thesis and triggers
- [ ] Support partial sells (reduce position size)

### Accounts

- [ ] Create brokerage account (name, type: taxable/IRA/Roth)
- [ ] Edit brokerage account details
- [ ] Delete brokerage account
- [ ] Associate holdings with specific account
- [ ] Account-level portfolio summary (total value, gain/loss)
- [ ] Account type displays (visual indicator for tax status)

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
