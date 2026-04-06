import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1,
  reporter: 'html',
  timeout: 60000,
  use: {
    baseURL: 'http://127.0.0.1:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 30000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: 'login',
      testMatch: '**/login.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'ci-management',
      testMatch: '**/ci-*.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'change-management',
      testMatch: '**/change-management.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'relation-management',
      testMatch: '**/relation-management.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'app-main',
      testMatch: '**/app.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
