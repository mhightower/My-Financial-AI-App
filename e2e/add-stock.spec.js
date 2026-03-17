import { test, expect } from '@playwright/test'
import { setupBaseRoutes, seedCurrentUser, MOCK_USER_1, MOCK_WATCHLIST, MOCK_WATCHLIST_WITH_STOCK } from './helpers.js'

/**
 * E2E: Add stock to watchlist
 *
 * - Opening the WatchlistDetailView for a watchlist
 * - Opening the Add Stock modal and entering a ticker
 * - Selecting a result from the search dropdown
 * - Filling in thesis fields and submitting
 * - Verifying the stock card appears with buy/sell reasons
 * - Removing a stock via the ConfirmModal
 */

test.describe('Watchlist detail — add & remove stock', () => {
  test.beforeEach(async ({ page }) => {
    await seedCurrentUser(page, MOCK_USER_1)
    await setupBaseRoutes(page)

    // Watchlists list (for sidebar/dashboard)
    await page.route('**/api/v1/users/1/watchlists', (route) => {
      route.fulfill({ json: [MOCK_WATCHLIST] })
    })

    // GET /api/v1/watchlists/10?user_id=1 — initially empty
    // Trailing ** needed because URL includes query params.
    await page.route('**/api/v1/watchlists/10**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({ json: MOCK_WATCHLIST })
      } else {
        route.continue()
      }
    })
  })

  test('shows empty state for a watchlist with no stocks', async ({ page }) => {
    await page.goto('/watchlist/10')
    await expect(page.getByText('No stocks in this watchlist yet.')).toBeVisible()
    await expect(page.getByRole('button', { name: '+ Add Stock' })).toBeVisible()
  })

  test('adds a stock via manual ticker entry', async ({ page }) => {
    const stockEntry = {
      id: 100,
      ticker: 'AAPL',
      buy_reasons: 'Strong ecosystem and cash flow',
      sell_conditions: 'If P/E exceeds 35',
      buy_price: 170,
      sell_price: 220,
      stop_loss_pct: 0.1,
    }

    // Stub the search endpoint (returns no results — user types ticker directly)
    await page.route('**/api/v1/stocks/search**', (route) => {
      route.fulfill({ json: [] })
    })

    // Register the /10 GET handler first (lower priority). The store's
    // addStockToWatchlist pushes in-place, so no re-fetch occurs after adding.
    await page.route('**/api/v1/watchlists/10**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({ json: MOCK_WATCHLIST })
      } else {
        route.continue()
      }
    })

    // POST stock — registered after /10** so it takes priority for the stocks path
    await page.route('**/api/v1/watchlists/10/stocks**', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({ json: stockEntry })
      } else {
        route.continue()
      }
    })

    await page.goto('/watchlist/10')

    // Open Add Stock modal
    await page.getByRole('button', { name: '+ Add Stock' }).click()
    await expect(page.getByRole('heading', { name: 'Add Stock to Watchlist' })).toBeVisible()

    // Type ticker
    await page.getByLabel('Ticker *').fill('AAPL')

    // Fill thesis
    await page.getByLabel('Buy Reasons').fill('Strong ecosystem and cash flow')
    await page.getByLabel('Sell Conditions').fill('If P/E exceeds 35')

    // Submit — use exact: true to target the modal submit, not '+ Add Stock' page button
    await page.getByRole('button', { name: 'Add Stock', exact: true }).click()

    // Stock card should be visible
    await expect(page.locator('.stock-ticker', { hasText: 'AAPL' })).toBeVisible()
    await expect(page.getByText('Strong ecosystem and cash flow')).toBeVisible()
    await expect(page.getByText('If P/E exceeds 35')).toBeVisible()
  })

  test('selects a stock from the search dropdown', async ({ page }) => {
    const searchResults = [
      { ticker: 'AAPL', name: 'Apple Inc.' },
      { ticker: 'AAPLX', name: 'Other Fund' },
    ]

    await page.route('**/api/v1/stocks/search**', (route) => {
      route.fulfill({ json: searchResults })
    })

    // Register /10 GET handler first (lower priority)
    await page.route('**/api/v1/watchlists/10**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({ json: MOCK_WATCHLIST })
      } else {
        route.continue()
      }
    })

    // POST stocks handler registered after (higher priority)
    await page.route('**/api/v1/watchlists/10/stocks**', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({ json: { id: 101, ticker: 'AAPL', buy_reasons: null, sell_conditions: null } })
      } else {
        route.continue()
      }
    })

    await page.goto('/watchlist/10')
    await page.getByRole('button', { name: '+ Add Stock' }).click()

    // Type partial ticker to trigger search
    await page.getByLabel('Ticker *').fill('AAP')

    // Dropdown should appear
    await expect(page.locator('.search-dropdown')).toBeVisible()
    // Use first() because 'AAPL' text appears in both AAPL and AAPLX rows
    await expect(page.locator('.search-result').first()).toBeVisible()

    // Click to select AAPL (first result)
    await page.locator('.search-result').first().click()

    // Ticker input should now be 'AAPL' and dropdown gone
    await expect(page.getByLabel('Ticker *')).toHaveValue('AAPL')
    await expect(page.locator('.search-dropdown')).not.toBeVisible()
  })

  test('removes a stock after confirming', async ({ page }) => {
    // Start with a stock already in the watchlist
    await page.route('**/api/v1/watchlists/10**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({ json: MOCK_WATCHLIST_WITH_STOCK })
      } else {
        route.continue()
      }
    })

    let deleted = false
    await page.route('**/api/v1/watchlists/10/stocks/100**', (route) => {
      if (route.request().method() === 'DELETE') {
        deleted = true
        route.fulfill({ status: 200, json: { message: 'removed' } })
      } else {
        route.continue()
      }
    })

    await page.goto('/watchlist/10')
    await expect(page.locator('.stock-ticker', { hasText: 'AAPL' })).toBeVisible()

    // Click remove button on the stock card
    await page.getByRole('button', { name: 'Remove stock from watchlist' }).first().click()

    // Confirm modal should appear
    await expect(page.getByRole('heading', { name: 'Remove Stock' })).toBeVisible()
    // Use .last() — both the icon button (aria-label="Remove stock from watchlist") and
    // the modal confirm button match 'Remove'; the modal button is last in DOM order.
    await page.getByRole('button', { name: 'Remove' }).last().click()

    // Stock card should be gone
    await expect(page.locator('.stock-ticker', { hasText: 'AAPL' })).not.toBeVisible()
  })
})
