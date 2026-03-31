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
    // 设置 API 拦截
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
                  name: '测试服务器 -01',
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
      
      // 默认放行其他请求
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
    
    // 直接在浏览器中导航
    await page.goto('/ci/list')
    await ciListPage.expectCIListVisible()
  })
})
