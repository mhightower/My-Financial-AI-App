import { test, expect } from '@playwright/test'
import { setupBaseRoutes, seedCurrentUser, MOCK_USER_1, MOCK_WATCHLIST } from './helpers.js'

/**
 * E2E: Watchlist CRUD
 *
 * - Creating a watchlist via the "+ New Watchlist" modal
 * - Editing a watchlist name
 * - Deleting a watchlist via the ConfirmModal
 * - Empty state when no watchlists exist
 */

test.describe('Watchlist CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await seedCurrentUser(page, MOCK_USER_1)
    await setupBaseRoutes(page)
  })

  test('shows empty state when no watchlists exist', async ({ page }) => {
    await page.goto('/watchlists')
    await expect(page.getByText('No watchlists yet.')).toBeVisible()
    await expect(page.getByRole('button', { name: '+ New Watchlist' })).toBeVisible()
  })

  test('creates a new watchlist and shows it in the grid', async ({ page }) => {
    // POST creates the watchlist; the store pushes the result into the reactive
    // array directly — no re-fetch occurs, so we only need the POST stub.
    // Trailing ** is needed because the URL includes ?user_id=1 query param.
    await page.route('**/api/v1/watchlists**', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({ json: MOCK_WATCHLIST })
      } else {
        route.continue()
      }
    })

    await page.goto('/watchlists')

    // Open the modal
    await page.getByRole('button', { name: '+ New Watchlist' }).click()
    await expect(page.getByRole('heading', { name: 'New Watchlist' })).toBeVisible()

    // Fill in name and description
    await page.getByLabel('Watchlist Name *').fill('Tech Picks')
    await page.getByLabel('Description').fill('High-growth tech stocks')

    // Submit
    await page.getByRole('button', { name: 'Save' }).click()

    // Store pushes the returned watchlist into the reactive array — card appears
    await expect(page.locator('.wl-card-name', { hasText: 'Tech Picks' })).toBeVisible()
  })

  test('edits an existing watchlist', async ({ page }) => {
    // Start with one watchlist
    await page.route('**/api/v1/users/1/watchlists', (route) => {
      route.fulfill({ json: [MOCK_WATCHLIST] })
    })

    const updatedWatchlist = { ...MOCK_WATCHLIST, name: 'Updated Tech Picks' }
    // Trailing ** is needed because the URL includes ?user_id=1 query param.
    await page.route('**/api/v1/watchlists/10**', (route) => {
      if (route.request().method() === 'PUT') {
        route.fulfill({ json: updatedWatchlist })
      } else {
        route.fulfill({ json: MOCK_WATCHLIST })
      }
    })

    await page.goto('/watchlists')
    await expect(page.locator('.wl-card-name', { hasText: 'Tech Picks' })).toBeVisible()

    // Click the edit icon button (aria-label="Edit watchlist")
    await page.getByRole('button', { name: 'Edit watchlist' }).first().click()
    await expect(page.getByRole('heading', { name: 'Edit Watchlist' })).toBeVisible()

    // Clear and retype name
    const nameInput = page.getByLabel('Watchlist Name *')
    await nameInput.clear()
    await nameInput.fill('Updated Tech Picks')
    await page.getByRole('button', { name: 'Save' }).click()

    // Store replaces the entry in-place with PUT response — updated name visible
    await expect(page.locator('.wl-card-name', { hasText: 'Updated Tech Picks' })).toBeVisible()
  })

  test('deletes a watchlist after confirming in the dialog', async ({ page }) => {
    await page.route('**/api/v1/users/1/watchlists', (route) => {
      route.fulfill({ json: [MOCK_WATCHLIST] })
    })

    await page.route('**/api/v1/watchlists/10**', (route) => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({ status: 200, json: { message: 'deleted' } })
      } else {
        route.fulfill({ json: MOCK_WATCHLIST })
      }
    })

    await page.goto('/watchlists')
    await expect(page.locator('.wl-card-name', { hasText: 'Tech Picks' })).toBeVisible()

    // Click delete icon
    await page.getByRole('button', { name: 'Delete watchlist' }).first().click()

    // ConfirmModal should appear
    await expect(page.getByRole('heading', { name: 'Delete Watchlist' })).toBeVisible()
    await expect(page.getByText('Delete this watchlist? This cannot be undone.')).toBeVisible()

    // Confirm deletion — use .last() because both the icon button and modal button
    // match name 'Delete'; the modal's confirm button is last in DOM order.
    await page.getByRole('button', { name: 'Delete' }).last().click()

    // Store filters the array locally — card is gone, empty state appears
    await expect(page.locator('.wl-card-name', { hasText: 'Tech Picks' })).not.toBeVisible()
    await expect(page.getByText('No watchlists yet.')).toBeVisible()
  })

  test('cancels deletion when clicking Cancel in the dialog', async ({ page }) => {
    await page.route('**/api/v1/users/1/watchlists', (route) => {
      route.fulfill({ json: [MOCK_WATCHLIST] })
    })

    await page.goto('/watchlists')
    await page.getByRole('button', { name: 'Delete watchlist' }).first().click()
    await expect(page.getByRole('heading', { name: 'Delete Watchlist' })).toBeVisible()

    // Cancel — watchlist stays
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.locator('.wl-card-name', { hasText: 'Tech Picks' })).toBeVisible()
  })
})
