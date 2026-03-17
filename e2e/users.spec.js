import { test, expect } from '@playwright/test'
import { setupBaseRoutes, seedCurrentUser, MOCK_USER_1, MOCK_USER_2 } from './helpers.js'

/**
 * E2E: User creation & switching
 *
 * Tests that a new user can be created via the UserSwitcherModal and that
 * switching between users updates the active badge and sidebar display name.
 */

test.describe('User management', () => {
  test.beforeEach(async ({ page }) => {
    // Start with no active user so the modal auto-opens on load
    await setupBaseRoutes(page)
    // Override users list: empty on first load so modal opens automatically
    await page.route('**/api/v1/users', (route) => {
      route.fulfill({ json: [] })
    })
  })

  test('modal auto-opens when no user is selected', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'User Management' })).toBeVisible()
  })

  test('creates a new user and sets them as active', async ({ page }) => {
    // After POST, subsequent GET /api/v1/users returns the new user
    let usersDb = []

    await page.route('**/api/v1/users', (route) => {
      if (route.request().method() === 'POST') {
        const newUser = { id: 1, name: 'Alice', avatar_color: '#D99D38', watchlists: [], accounts: [] }
        usersDb = [newUser]
        route.fulfill({ json: newUser })
      } else {
        route.fulfill({ json: usersDb })
      }
    })

    await page.goto('/')

    // Modal is open — fill in the name field and submit
    await page.getByLabel('Name *').fill('Alice')
    await page.getByRole('button', { name: 'Create User' }).click()

    // Sidebar should now show the new user's name
    await expect(page.locator('.user-display-name')).toHaveText('Alice')
  })

  test('switches between two users', async ({ page }) => {
    // Start with two users; Alice is active
    await page.route('**/api/v1/users', (route) => {
      route.fulfill({ json: [MOCK_USER_1, MOCK_USER_2] })
    })
    await page.route('**/api/v1/users/1', (route) => {
      route.fulfill({ json: MOCK_USER_1 })
    })
    await page.route('**/api/v1/users/2', (route) => {
      route.fulfill({ json: MOCK_USER_2 })
    })
    await page.route('**/api/v1/users/2/watchlists', (route) => {
      route.fulfill({ json: [] })
    })
    await page.route('**/api/v1/users/2/accounts', (route) => {
      route.fulfill({ json: [] })
    })
    await page.route('**/api/v1/users/2/holdings', (route) => {
      route.fulfill({ json: [] })
    })
    await page.route('**/api/v1/users/2/holdings-performance', (route) => {
      route.fulfill({ json: { holdings: [] } })
    })

    // Seed Alice as current user so the modal doesn't auto-open
    await seedCurrentUser(page, MOCK_USER_1)
    await page.goto('/')

    // Open modal via sidebar user button
    await page.locator('.sidebar-user').click()
    await expect(page.getByRole('heading', { name: 'User Management' })).toBeVisible()

    // Alice should show "Active" badge; Bob should show "Switch" button
    const aliceRow = page.locator('.user-row', { hasText: 'Alice' })
    const bobRow = page.locator('.user-row', { hasText: 'Bob' })

    await expect(aliceRow.locator('.active-badge')).toBeVisible()
    await expect(bobRow.getByRole('button', { name: 'Switch' })).toBeVisible()

    // Switch to Bob
    await bobRow.getByRole('button', { name: 'Switch' }).click()

    // Sidebar name should update
    await expect(page.locator('.user-display-name')).toHaveText('Bob')

    // Bob's row should now show "Active"
    await expect(bobRow.locator('.active-badge')).toBeVisible()
  })

  test('shows validation error when creating user with empty name', async ({ page }) => {
    await page.goto('/')
    // Try to submit with no name — the required attribute prevents native submit,
    // but we can check the HTML validity
    const input = page.getByLabel('Name *')
    await expect(input).toBeVisible()
    await expect(input).toHaveAttribute('required')
  })
})
