import { test, expect } from '@playwright/test'

test('Login page loads correctly', async ({ page }) => {
  await page.goto('/login')
  await expect(page.locator('[data-testid="page-login"]')).toBeVisible()
  await expect(page.locator('[data-testid="form-login"]')).toBeVisible()
  await expect(page.locator('[data-testid="input-login-username"]')).toBeVisible()
  await expect(page.locator('[data-testid="input-login-password"]')).toBeVisible()
  await expect(page.locator('[data-testid="button-login-submit"]')).toBeVisible()
})

test('Login page has correct title', async ({ page }) => {
  await page.goto('/login')
  await expect(page).toHaveTitle(/CMDB/)
})

test('Login form validation - empty fields', async ({ page }) => {
  await page.goto('/login')
  await page.click('[data-testid="button-login-submit"]')
  await expect(page.locator('.ant-form-item-explain-error').first()).toBeVisible()
})

test('Login form - password minimum length', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[data-testid="input-login-username"]', 'admin')
  await page.fill('[data-testid="input-login-password"]', '123')
  await page.click('[data-testid="button-login-submit"]')
  await expect(page.locator('text=密码长度至少 6 位')).toBeVisible()
})
