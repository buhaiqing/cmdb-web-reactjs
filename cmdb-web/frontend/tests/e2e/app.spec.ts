import { test } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage'
import { DashboardPage } from '../pages/DashboardPage'
import { CIListPage } from '../pages/CIListPage'
import { CICreatePage } from '../pages/CICreatePage'
import { AppLayout } from '../pages/AppLayout'

test.describe('CMDB E2E Tests', () => {
  let loginPage: LoginPage
  let dashboardPage: DashboardPage
  let ciListPage: CIListPage
  let ciCreatePage: CICreatePage
  let appLayout: AppLayout

  test.beforeEach(async ({ page }) => {
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

  test('Login - Show error with invalid credentials', async ({ page }) => {
    await loginPage.goto()
    await loginPage.expectLoginFormVisible()
    await loginPage.login('admin', 'wrongpassword')
    await loginPage.expectLoginFailed()
  })

  test('Dashboard - Display dashboard with statistics', async ({ page }) => {
    await page.route('**/api/auth/login', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            token: 'mock-token',
            user: { id: '1', username: 'admin', role: 'admin', permissions: [] },
          },
        }),
      })
    })

    await loginPage.goto()
    await loginPage.login('admin', 'admin123')
    await dashboardPage.goto()
    await dashboardPage.expectDashboardVisible()
    await dashboardPage.expectRecentChangesTable()
  })

  test('CI List - Display CI list with data', async ({ page }) => {
    await page.route('**/api/auth/login', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            token: 'mock-token',
            user: { id: '1', username: 'admin', role: 'admin', permissions: [] },
          },
        }),
      })
    })

    await loginPage.goto()
    await loginPage.login('admin', 'admin123')
    await ciListPage.goto()
    await ciListPage.expectCIListVisible()
  })

  test('CI Create - Navigate to create page', async ({ page }) => {
    await page.route('**/api/auth/login', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            token: 'mock-token',
            user: { id: '1', username: 'admin', role: 'admin', permissions: [] },
          },
        }),
      })
    })

    await loginPage.goto()
    await loginPage.login('admin', 'admin123')
    await ciListPage.goto()
    await ciListPage.clickCreateButton()
    await ciCreatePage.expectFormVisible()
  })

  test('Layout - Toggle sidebar collapse', async ({ page }) => {
    await page.route('**/api/auth/login', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            token: 'mock-token',
            user: { id: '1', username: 'admin', role: 'admin', permissions: [] },
          },
        }),
      })
    })

    await loginPage.goto()
    await loginPage.login('admin', 'admin123')
    await appLayout.expectLayoutVisible()
    await appLayout.toggleSidebar()
    await appLayout.expectSidebarCollapsed()
  })

  test('CI List - Search functionality', async ({ page }) => {
    await page.route('**/api/auth/login', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            token: 'mock-token',
            user: { id: '1', username: 'admin', role: 'admin', permissions: [] },
          },
        }),
      })
    })

    await loginPage.goto()
    await loginPage.login('admin', 'admin123')
    await ciListPage.goto()
    await ciListPage.searchCI('DB-主库')
    await ciListPage.expectSearchResults()
  })
})
