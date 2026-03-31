import { test, expect } from '@playwright/test'

test('登录页面正确加载', async ({ page }) => {
  await page.goto('/login')
  await expect(page.locator('[data-testid="page-login"]')).toBeVisible()
  await expect(page.locator('[data-testid="form-login"]')).toBeVisible()
  await expect(page.locator('[data-testid="input-login-username"]')).toBeVisible()
  await expect(page.locator('[data-testid="input-login-password"]')).toBeVisible()
  await expect(page.locator('[data-testid="button-login-submit"]')).toBeVisible()
})

test('登录页面标题正确', async ({ page }) => {
  await page.goto('/login')
  await expect(page).toHaveTitle(/CMDB/)
})

test('登录表单验证 - 空字段', async ({ page }) => {
  await page.goto('/login')
  await page.click('[data-testid="button-login-submit"]')
  await expect(page.locator('.ant-form-item-explain-error').first()).toBeVisible()
})

test('登录表单 - 密码最小长度', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[data-testid="input-login-username"]', 'admin')
  await page.fill('[data-testid="input-login-password"]', '123')
  await page.click('[data-testid="button-login-submit"]')
  await expect(page.locator('text=密码长度至少 6 位')).toBeVisible()
})
