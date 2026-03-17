/**
 * Shared helpers and mock data for E2E tests.
 * Every test file imports from here to keep stubs DRY.
 */

export const MOCK_USER_1 = {
  id: 1,
  name: 'Alice',
  avatar_color: '#D99D38',
  watchlists: [],
  accounts: [],
}

export const MOCK_USER_2 = {
  id: 2,
  name: 'Bob',
  avatar_color: '#1DB87A',
  watchlists: [],
  accounts: [],
}

export const MOCK_WATCHLIST = {
  id: 10,
  name: 'Tech Picks',
  description: 'High-growth tech stocks',
  owner_user_id: 1,
  stocks: [],
}

export const MOCK_WATCHLIST_WITH_STOCK = {
  ...MOCK_WATCHLIST,
  stocks: [
    {
      id: 100,
      ticker: 'AAPL',
      buy_reasons: 'Strong ecosystem and cash flow',
      sell_conditions: 'If P/E exceeds 35',
      buy_price: 170,
      sell_price: 220,
      stop_loss_pct: 0.1,
    },
  ],
}

export const MOCK_ACCOUNT = {
  id: 20,
  name: 'Fidelity Taxable',
  account_type: 'taxable',
  broker_name: 'Fidelity',
  user_id: 1,
}

export const MOCK_HOLDING = {
  id: 30,
  ticker: 'MSFT',
  quantity: 10,
  entry_price: 300,
  entry_date: '2024-01-15T00:00:00',
  account_id: 20,
  user_id: 1,
  notes: '',
}

/**
 * Sets up the minimal API stubs needed for the app to boot without a real
 * backend. Call this at the start of every test (or in beforeEach).
 *
 * Stubs:
 *  GET /api/v1/users          → [MOCK_USER_1]
 *  GET /api/v1/users/1        → MOCK_USER_1
 *  GET /api/v1/users/1/watchlists → []
 *  GET /api/v1/users/1/accounts   → []
 *  GET /api/v1/users/1/holdings   → []
 *
 * Individual tests add more specific stubs before they need them.
 */
export async function setupBaseRoutes(page) {
  // Users list (UserSwitcherModal.loadUsers + store.fetchUsers)
  await page.route('**/api/v1/users', (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({ json: [MOCK_USER_1] })
    } else {
      route.continue()
    }
  })

  // Single user fetch
  await page.route('**/api/v1/users/1', (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({ json: MOCK_USER_1 })
    } else {
      route.continue()
    }
  })

  // User watchlists (DashboardView + WatchlistsView)
  await page.route('**/api/v1/users/1/watchlists', (route) => {
    route.fulfill({ json: [] })
  })

  // User accounts
  await page.route('**/api/v1/users/1/accounts', (route) => {
    route.fulfill({ json: [] })
  })

  // User holdings
  await page.route('**/api/v1/users/1/holdings', (route) => {
    route.fulfill({ json: [] })
  })

  // Holdings performance (non-blocking, safe to return empty)
  await page.route('**/api/v1/users/1/holdings-performance', (route) => {
    route.fulfill({ json: { holdings: [], total_current_value: 0, total_cost_basis: 0, total_unrealized_gain_loss: 0 } })
  })
}

/**
 * Seeds localStorage so the app starts with MOCK_USER_1 already active
 * (skips the UserSwitcherModal auto-open on first load).
 */
export async function seedCurrentUser(page, user = MOCK_USER_1) {
  await page.addInitScript((u) => {
    localStorage.setItem('currentUser', JSON.stringify(u))
  }, user)
}
