/**
 * Standalone Playwright script to capture portfolio screenshots.
 * Run with: node scripts/take-screenshots.js
 * Requires: app running at localhost:5173 + localhost:8000
 */

import { chromium } from 'playwright'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.join(__dirname, '..', 'screenshots')
const BASE_URL = 'http://localhost:5173'

const USER = { id: 1, name: 'Jay', avatar_color: '#1DB87A' }

async function screenshot(page, name, waitFor) {
  if (waitFor) await page.waitForSelector(waitFor, { timeout: 8000 }).catch(() => {})
  // Let animations settle
  await page.waitForTimeout(800)
  await page.screenshot({ path: path.join(OUT_DIR, `${name}.png`), fullPage: false })
  console.log(`  ✓ ${name}.png`)
}

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  })

  // Seed the active user into localStorage before any navigation
  await context.addInitScript((user) => {
    localStorage.setItem('currentUser', JSON.stringify(user))
  }, USER)

  const page = await context.newPage()

  console.log('Taking screenshots...')

  // Dashboard
  await page.goto(`${BASE_URL}/`)
  await screenshot(page, '01-dashboard', '.dashboard, main')

  // Watchlists
  await page.goto(`${BASE_URL}/watchlists`)
  await screenshot(page, '02-watchlists', '.watchlist-card, [class*="watchlist"]')

  // Watchlist detail (id 1 = "Value" watchlist)
  await page.goto(`${BASE_URL}/watchlist/1`)
  await screenshot(page, '03-watchlist-detail', '[class*="stock"], [class*="thesis"], main')

  // Holdings
  await page.goto(`${BASE_URL}/holdings`)
  await screenshot(page, '04-holdings', 'main')

  // Accounts
  await page.goto(`${BASE_URL}/accounts`)
  await screenshot(page, '05-accounts', 'main')

  await browser.close()
  console.log(`\nAll screenshots saved to screenshots/`)
})()
