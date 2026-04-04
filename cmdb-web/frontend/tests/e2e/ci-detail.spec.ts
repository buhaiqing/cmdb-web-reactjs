import { test, expect } from '@playwright/test'
import { isMockMode } from './setup/test-config'
import { LoginPage } from './pages/LoginPage'
import { CIDetailPage } from './pages/CIDetailPage'

test.describe('配置项详情测试', () => {
  let loginPage: LoginPage
  let ciDetailPage: CIDetailPage

  const mockCI = {
    id: 'ci-001',
    name: '测试服务器-01',
    type: 'server',
    typeLabel: '服务器',
    status: 'running',
    statusLabel: '运行中',
    ip: '192.168.1.100',
    cpu: '8 核',
    memory: '16GB',
    disk: '500GB',
    os: 'Ubuntu 20.04',
    project: '测试项目',
    environment: 'development',
    description: '这是一个测试服务器',
    createdAt: '2024-01-01 10:00:00',
    updatedAt: '2024-01-01 10:00:00',
  }

  test.beforeEach(async ({ page }) => {
    // 只在 mock 模式下设置拦截器
    if (!isMockMode()) {
      loginPage = new LoginPage(page)
      ciDetailPage = new CIDetailPage(page)
      return
    }

    await page.route('**/api/**', async (route) => {
      const url = route.request().url()

      if (url.includes('/api/auth/login')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              token: 'mock-jwt-token',
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

      if (url.includes(`/api/ci/${mockCI.id}`)) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: mockCI,
          }),
        })
        return
      }

      await route.continue()
    })

    loginPage = new LoginPage(page)
    ciDetailPage = new CIDetailPage(page)

    await loginPage.goto()
    await loginPage.login('admin', 'admin123')
    await loginPage.waitForLoginSuccess()
  })

  test('CI-006: 查看配置项详细信息', async () => {
    await ciDetailPage.goto(mockCI.id)
    await ciDetailPage.expectDetailVisible()
  })

  test('CI-007: 验证基本信息显示', async ({ page }) => {
    await ciDetailPage.goto(mockCI.id)
    await ciDetailPage.expectDetailVisible()

    // 验证各字段正确显示
    await ciDetailPage.expectCIDataVisible({
      name: mockCI.name,
      type: mockCI.typeLabel,
      ip: mockCI.ip,
      status: mockCI.statusLabel
    })
  })

  test('CI-008: 验证编辑和删除按钮可见', async ({ page }) => {
    await ciDetailPage.goto(mockCI.id)
    await ciDetailPage.expectDetailVisible()

    // 验证编辑按钮可见
    await expect(page.locator('[data-testid="button-ci-edit"]')).toBeVisible()

    // 验证删除按钮可见
    await expect(page.locator('[data-testid="button-ci-delete"]')).toBeVisible()
  })
})
