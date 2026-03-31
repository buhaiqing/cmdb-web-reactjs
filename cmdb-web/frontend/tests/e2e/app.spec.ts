import { test, expect } from '@playwright/test'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { CIListPage } from './pages/CIListPage'
import { CICreatePage } from './pages/CICreatePage'
import { AppLayout } from './pages/AppLayout'

test.describe('CMDB E2E Tests', () => {
  let loginPage: LoginPage
  let dashboardPage: DashboardPage
  let ciListPage: CIListPage
  let ciCreatePage: CICreatePage
  let appLayout: AppLayout

  test.beforeEach(async ({ page }) => {
    await page.route('**/api/**', async (route) => {
      const url = route.request().url()

      if (url.includes('/api/auth/login')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              token: 'mock-jwt-token-' + Date.now(),
              user: {
                id: '1',
                username: 'admin',
                email: 'admin@example.com',
                role: 'admin',
                permissions: ['*'],
              },
            },
          }),
        })
        return
      }

      if (url.includes('/api/auth/me')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: '1',
              username: 'admin',
              email: 'admin@example.com',
              role: 'admin',
              permissions: ['*'],
            },
          }),
        })
        return
      }

      if (url.includes('/api/ci') && route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              items: [
                {
                  id: '1',
                  name: '测试服务器-01',
                  type: 'server',
                  status: 'running',
                  ip: '192.168.1.100',
                  cpu: '8 核',
                  memory: '16GB',
                  disk: '500GB',
                  os: 'Ubuntu 20.04',
                  project: '测试项目',
                  environment: 'development',
                  createdAt: '2024-01-01 10:00:00',
                  updatedAt: '2024-01-01 10:00:00',
                },
              ],
              total: 1,
            },
          }),
        })
        return
      }

      if (url.includes('/api/ci') && route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: '2',
              name: '新服务器',
              type: 'server',
            },
          }),
        })
        return
      }

      await route.continue()
    })

    loginPage = new LoginPage(page)
    dashboardPage = new DashboardPage(page)
    ciListPage = new CIListPage(page)
    ciCreatePage = new CICreatePage(page)
    appLayout = new AppLayout(page)
  })

  test('Login - Success with valid credentials', async ({ page }) => {
    await loginPage.goto()
    await loginPage.expectLoginFormVisible()
    await loginPage.login('admin', 'admin123')
    await loginPage.waitForLoginSuccess()
    await appLayout.expectUserLoggedIn('admin')
  })

  test('Dashboard - Load successfully after login', async ({ page }) => {
    await loginPage.goto()
    await loginPage.login('admin', 'admin123')
    await loginPage.waitForLoginSuccess()

    await dashboardPage.goto()
    await dashboardPage.expectDashboardVisible()
  })

  test('CI Management - View CI list', async ({ page }) => {
    await loginPage.goto()
    await loginPage.login('admin', 'admin123')
    await loginPage.waitForLoginSuccess()

    await ciListPage.goto()
    await ciListPage.expectCIListVisible()
  })

  test('Navigation - Dashboard to CI list', async ({ page }) => {
    await loginPage.goto()
    await loginPage.login('admin', 'admin123')
    await loginPage.waitForLoginSuccess()

    await page.goto('/ci/list')
    await ciListPage.expectCIListVisible()
  })

  test('System Management - User list page', async ({ page }) => {
    await loginPage.goto()
    await loginPage.login('admin', 'admin123')
    await loginPage.waitForLoginSuccess()
    await page.waitForSelector('[data-testid="layout-app"]', { timeout: 10000 })

    // 通过 URL 直接访问用户列表页面
    await page.goto('/system/user')
    await page.waitForURL('**/system/user', { timeout: 10000 })

    // 等待页面加载完成
    await page.waitForSelector('[data-testid="page-user-manage"]', { timeout: 15000 })
    await expect(page.locator('[data-testid="page-user-manage"]')).toBeVisible()
    await expect(page.locator('[data-testid="table-user-list"]')).toBeVisible({ timeout: 10000 })
  })

  test('System Management - Role list page', async ({ page }) => {
    await loginPage.goto()
    await loginPage.login('admin', 'admin123')
    await loginPage.waitForLoginSuccess()
    await page.waitForSelector('[data-testid="layout-app"]', { timeout: 10000 })

    // 通过 URL 直接访问角色列表页面
    await page.goto('/system/role')
    await page.waitForURL('**/system/role', { timeout: 10000 })

    // 等待页面加载完成
    await page.waitForSelector('[data-testid="page-role-manage"]', { timeout: 15000 })
    await expect(page.locator('[data-testid="page-role-manage"]')).toBeVisible()
    await expect(page.locator('[data-testid="table-role-list"]')).toBeVisible({ timeout: 10000 })
  })

  test('System Management - Audit log page', async ({ page }) => {
    await loginPage.goto()
    await loginPage.login('admin', 'admin123')
    await loginPage.waitForLoginSuccess()
    await page.waitForSelector('[data-testid="layout-app"]', { timeout: 10000 })

    // 通过 URL 直接访问审计日志页面
    await page.goto('/system/audit')
    await page.waitForURL('**/system/audit', { timeout: 10000 })

    // 等待页面加载完成
    await page.waitForSelector('[data-testid="page-audit-log"]', { timeout: 15000 })
    await expect(page.locator('[data-testid="page-audit-log"]')).toBeVisible()
    await expect(page.locator('[data-testid="table-audit-list"]')).toBeVisible({ timeout: 10000 })
  })
})
