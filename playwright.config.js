import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  workers: 4,
  retries: 0,
  reporter: 'list',

  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    viewport: { width: 1280, height: 720 },
    // Intercept all /api calls — no real backend required
    // (each test file sets up its own route mocks)
  },

  webServer: {
    command: 'npm run dev -- --open false',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
