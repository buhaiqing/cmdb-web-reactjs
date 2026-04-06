import { test, expect } from '@playwright/test'
import { isMockMode, isFullMode, setupFallbackMocks } from './setup/test-config'
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

  // Full 模式下通过 API 创建的测试 CI
  let fullModeTestCI: { id: string; name: string } | null = null

  // 获取当前模式的测试 CI 数据
  const getTestCI = () => {
    if (isFullMode() && fullModeTestCI) {
      return fullModeTestCI
    }
    return mockCI
  }

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    ciDetailPage = new CIDetailPage(page)

    // Full 模式：登录 + 设置 fallback mocks + 创建测试 CI
    if (isFullMode()) {
      await setupFallbackMocks(page)
      await loginPage.goto()
      await loginPage.login('admin', 'admin123')
      await loginPage.waitForLoginSuccess()

      // 通过真实 API 创建一个临时 CI 用于详情测试
      const token = await page.evaluate(() => {
        const stored = localStorage.getItem('cmdb-user-storage')
        if (stored) {
          const parsed = JSON.parse(stored)
          return parsed.state?.token
        }
        return null
      })

      const ciName = '详情测试服务器-' + Date.now()
      const apiResponse = await page.request.post('http://127.0.0.1:8000/api/ci', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        data: {
          name: ciName,
          type: 'server',
          ip: '192.168.1.100',
          project: '测试项目',
          environment: 'production',
        },
      })
      const apiData = await apiResponse.json()
      fullModeTestCI = { id: apiData.data.id, name: ciName }
      console.log(`Full 模式：创建测试 CI, id=${fullModeTestCI.id}`)
      return
    }

    // Mock 模式：设置拦截器
    if (!isMockMode()) return

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
    const testCI = getTestCI()
    await ciDetailPage.goto(testCI.id)
    await ciDetailPage.expectDetailVisible()
  })

  test('CI-007: 验证基本信息显示', async ({ page }) => {
    const testCI = getTestCI()
    await ciDetailPage.goto(testCI.id)
    await ciDetailPage.expectDetailVisible()

    // 验证名称显示（full 模式下使用实际创建的名称）
    if (isFullMode()) {
      await ciDetailPage.expectCIDataVisible({ name: testCI.name })
    } else {
      await ciDetailPage.expectCIDataVisible({
        name: testCI.name,
        type: testCI.typeLabel,
        ip: testCI.ip,
        status: testCI.statusLabel
      })
    }
  })

  test('CI-008: 验证编辑和删除按钮可见', async ({ page }) => {
    const testCI = getTestCI()
    await ciDetailPage.goto(testCI.id)
    await ciDetailPage.expectDetailVisible()

    // 验证编辑按钮可见
    await expect(page.locator('[data-testid="button-ci-edit"]')).toBeVisible()

    // 验证删除按钮可见
    await expect(page.locator('[data-testid="button-ci-delete"]')).toBeVisible()
  })
})
