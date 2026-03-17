import { test, expect } from '@playwright/test'
import { setupBaseRoutes, seedCurrentUser, MOCK_USER_1, MOCK_ACCOUNT, MOCK_HOLDING } from './helpers.js'

/**
 * E2E: Holdings & Accounts
 *
 * - Creating a brokerage account
 * - Adding a holding against that account
 * - Closing a position (creating a sell transaction + deleting the holding)
 * - Deleting an account
 */

test.describe('Accounts', () => {
  test.beforeEach(async ({ page }) => {
    await seedCurrentUser(page, MOCK_USER_1)
    await setupBaseRoutes(page)
  })

  test('shows empty state when no accounts exist', async ({ page }) => {
    await page.goto('/accounts')
    await expect(page.getByText('No accounts yet.')).toBeVisible()
    await expect(page.getByRole('button', { name: '+ Add Account' })).toBeVisible()
  })

  test('creates a new brokerage account', async ({ page }) => {
    // POST creates the account; the store pushes the result into the reactive array
    await page.route('**/api/v1/accounts**', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({ json: MOCK_ACCOUNT })
      } else {
        route.continue()
      }
    })

    await page.goto('/accounts')
    await page.getByRole('button', { name: '+ Add Account' }).click()

    // Inline form should appear
    await expect(page.getByText('New Account')).toBeVisible()

    // Fill in account details
    await page.locator('input[placeholder="e.g. My Fidelity Taxable"]').fill('Fidelity Taxable')
    await page.locator('select').first().selectOption('taxable')
    await page.locator('input[placeholder="e.g. Fidelity"]').fill('Fidelity')

    await page.getByRole('button', { name: 'Save' }).click()

    // Account card should appear (store pushed the returned account into the array)
    await expect(page.locator('.account-name', { hasText: 'Fidelity Taxable' })).toBeVisible()
    await expect(page.locator('.account-type-badge', { hasText: 'taxable' })).toBeVisible()
  })

  test('deletes an account after confirming', async ({ page }) => {
    await page.route('**/api/v1/users/1/accounts', (route) => {
      route.fulfill({ json: [MOCK_ACCOUNT] })
    })

    await page.route('**/api/v1/accounts/20**', (route) => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({ status: 200, json: { message: 'deleted' } })
      } else {
        route.fulfill({ json: MOCK_ACCOUNT })
      }
    })

    await page.goto('/accounts')
    await expect(page.locator('.account-name', { hasText: 'Fidelity Taxable' })).toBeVisible()

    await page.getByRole('button', { name: 'Delete' }).first().click()

    // ConfirmModal — default confirmLabel is "Delete"
    await expect(page.getByRole('heading', { name: 'Delete Account' })).toBeVisible()
    await page.getByRole('button', { name: 'Delete' }).last().click()

    await expect(page.locator('.account-name', { hasText: 'Fidelity Taxable' })).not.toBeVisible()
    await expect(page.getByText('No accounts yet.')).toBeVisible()
  })
})

test.describe('Holdings', () => {
  test.beforeEach(async ({ page }) => {
    await seedCurrentUser(page, MOCK_USER_1)
    await setupBaseRoutes(page)

    // Accounts available for the Add Holding select
    await page.route('**/api/v1/users/1/accounts', (route) => {
      route.fulfill({ json: [MOCK_ACCOUNT] })
    })
  })

  test('shows empty state when no holdings exist', async ({ page }) => {
    await page.goto('/holdings')
    await expect(page.getByText('No holdings yet.')).toBeVisible()
    await expect(page.getByRole('button', { name: '+ Add Holding' })).toBeVisible()
  })

  test('adds a new holding', async ({ page }) => {
    // Override performance to omit holdings array so the table falls back to
    // holdings.value (which gets the created holding pushed into it by the store)
    await page.route('**/api/v1/users/1/holdings-performance', (route) => {
      route.fulfill({ json: { total_current_value: 0, total_cost_basis: 0, total_unrealized_gain_loss: 0 } })
    })

    // Store pushes the created holding directly — no re-fetch needed
    await page.route('**/api/v1/holdings**', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({ json: MOCK_HOLDING })
      } else {
        route.continue()
      }
    })

    await page.goto('/holdings')
    await page.getByRole('button', { name: '+ Add Holding' }).click()

    // Modal
    await expect(page.getByRole('heading', { name: 'Add Holding' })).toBeVisible()

    await page.getByLabel('Ticker *').fill('MSFT')
    await page.getByLabel('Account *').selectOption({ label: 'Fidelity Taxable' })
    await page.getByLabel('Quantity *').fill('10')
    await page.getByLabel('Entry Price *').fill('300')

    // Use exact: true to target only the modal submit button, not '+ Add Holding'
    await page.getByRole('button', { name: 'Add', exact: true }).click()

    // Store pushed the returned holding — row appears in the table
    await expect(page.locator('td .mono-amber', { hasText: 'MSFT' })).toBeVisible()
  })

  test('closes a position via the sell modal', async ({ page }) => {
    let holdings = [MOCK_HOLDING]

    await page.route('**/api/v1/users/1/holdings', (route) => {
      route.fulfill({ json: holdings })
    })

    // Omit 'holdings' from performance so the table falls back to holdings.value,
    // which gets filtered when deleteHolding is called (performance.holdings does NOT
    // get updated by deleteHolding, so we must rely on holdings.value instead).
    await page.route('**/api/v1/users/1/holdings-performance', (route) => {
      route.fulfill({
        json: {
          total_current_value: 3500,
          total_cost_basis: 3000,
          total_unrealized_gain_loss: 500,
        }
      })
    })

    // sell-transactions URL includes ?user_id=1 — trailing ** required
    await page.route('**/api/v1/sell-transactions**', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({ json: { id: 50, ticker: 'MSFT', shares_sold: 10, price_received: 350 } })
      } else {
        route.continue()
      }
    })

    // holdings/30 URL includes ?user_id=1 — trailing ** required
    await page.route('**/api/v1/holdings/30**', (route) => {
      if (route.request().method() === 'DELETE') {
        holdings = []
        route.fulfill({ status: 200, json: { message: 'deleted' } })
      } else {
        route.fulfill({ json: MOCK_HOLDING })
      }
    })

    await page.goto('/holdings')
    await expect(page.locator('td .mono-amber', { hasText: 'MSFT' })).toBeVisible()

    // Click "Close" on the holding row
    await page.getByRole('button', { name: 'Close' }).first().click()

    // Close Position modal — use the heading to confirm ticker, avoid ambiguity
    await expect(page.getByRole('heading', { name: /Close Position/ })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Close Position — MSFT' })).toBeVisible()

    // Set price received
    await page.getByLabel('Price Received *').fill('350')

    await page.getByRole('button', { name: 'Record Sale' }).click()

    // Holding should no longer be in the table
    await expect(page.locator('td .mono-amber', { hasText: 'MSFT' })).not.toBeVisible()
  })
})
