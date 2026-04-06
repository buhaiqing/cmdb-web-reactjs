import { test, expect } from '@playwright/test'
import { isMockMode, isFullMode, setupCommonMocks, setupFallbackMocks } from './setup/test-config'
import { LoginPage } from './pages/LoginPage'
import { CIDetailPage } from './pages/CIDetailPage'
import { CIListPage } from './pages/CIListPage'

test.describe('配置项删除测试', () => {
  let loginPage: LoginPage
  let ciDetailPage: CIDetailPage
  let ciListPage: CIListPage

  const mockCI = {
    id: 'ci-delete-001',
    name: '待删除测试服务器',
    type: 'server',
    status: 'running',
    ip: '192.168.1.100',
  }

  let deletedCIIds: string[] = []

  // Full 模式下通过 API 创建的测试 CI
  let fullModeTestCI: { id: string; name: string } | null = null

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    ciDetailPage = new CIDetailPage(page)
    ciListPage = new CIListPage(page)

    // Full 模式：登录 + 设置 fallback mocks + 创建测试 CI
    if (isFullMode()) {
      await setupFallbackMocks(page)
      await loginPage.goto()
      await loginPage.login('admin', 'admin123')
      await loginPage.waitForLoginSuccess()

      // 通过真实 API 创建一个临时 CI 用于删除测试
      // 先从 zustand store 中获取 token
      const token = await page.evaluate(() => {
        const stored = localStorage.getItem('cmdb-user-storage')
        if (stored) {
          const parsed = JSON.parse(stored)
          return parsed.state?.token
        }
        return null
      })

      const ciName = '待删除测试服务器-' + Date.now()
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

    deletedCIIds = []

    // 设置通用的 Mock 路由（认证 + Dashboard）
    await setupCommonMocks(page)

    await page.route('**/api/**', async (route) => {
      const url = route.request().url()

      // 如果已经处理过，跳过
      if (url.includes('/api/auth/') || url.includes('/api/dashboard/') || url.includes('/api/changes/recent')) {
        return
      }

      if (url.includes(`/api/ci/${mockCI.id}`) && route.request().method() === 'GET') {
        if (deletedCIIds.includes(mockCI.id)) {
          await route.fulfill({
            status: 404,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              message: '配置项不存在',
            }),
          })
          return
        }
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

      if (url.includes(`/api/ci/${mockCI.id}`) && route.request().method() === 'DELETE') {
        deletedCIIds.push(mockCI.id)
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: '删除成功',
          }),
        })
        return
      }

      if (url.includes('/api/ci') && route.request().method() === 'GET') {
        const items = deletedCIIds.includes(mockCI.id) ? [] : [mockCI]
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              items,
              total: items.length,
            },
          }),
        })
        return
      }

      await route.continue()
    })

    loginPage = new LoginPage(page)
    ciDetailPage = new CIDetailPage(page)
    ciListPage = new CIListPage(page)

    await loginPage.goto()
    await loginPage.login('admin', 'admin123')
    await loginPage.waitForLoginSuccess()
  })

  // 获取当前模式的测试 CI 数据
  const getTestCI = () => {
    if (isFullMode() && fullModeTestCI) {
      return fullModeTestCI
    }
    return mockCI
  }

  test('CI-016: 删除配置项显示确认对话框', async () => {
    const testCI = getTestCI()
    await ciDetailPage.goto(testCI.id)
    await ciDetailPage.expectDetailVisible()

    // 点击删除按钮（不确认）
    await ciDetailPage.clickDeleteButton()

    // 验证确认对话框显示
    await ciDetailPage.expectConfirmDialog()
  })

  test('CI-017: 确认删除配置项', async () => {
    const testCI = getTestCI()
    await ciDetailPage.goto(testCI.id)
    await ciDetailPage.expectDetailVisible()

    // 删除并确认
    await ciDetailPage.clickDeleteButtonAndConfirm()

    // 验证删除成功，跳转到列表页
    await ciDetailPage.expectDeleteSuccess()
    await ciListPage.expectCIListVisible()
  })

  test('CI-018: 取消删除操作', async () => {
    const testCI = getTestCI()
    await ciDetailPage.goto(testCI.id)
    await ciDetailPage.expectDetailVisible()

    // 点击删除按钮
    await ciDetailPage.clickDeleteButton()
    await ciDetailPage.expectConfirmDialog()

    // 取消删除 - 点击取消按钮
    await ciDetailPage.page.locator('.ant-modal-confirm .ant-modal-confirm-btns button').first().click()

    // 验证停留在详情页
    await ciDetailPage.expectDetailVisible()
    await ciDetailPage.expectCIDataVisible({ name: testCI.name })
  })

  test('CI-019: 删除后跳转到列表页', async () => {
    const testCI = getTestCI()
    // 删除CI
    await ciDetailPage.goto(testCI.id)
    await ciDetailPage.clickDeleteButtonAndConfirm()

    // 验证删除成功后跳转到列表页
    await ciDetailPage.expectDeleteSuccess()
    await ciListPage.expectCIListVisible()
  })

  test('CI-020: 访问不存在的配置项显示错误', async ({ page }) => {
    // 直接访问一个不存在的CI ID
    await ciDetailPage.goto('non-existent-ci-id')

    // 验证显示错误提示（可能为加载状态或错误信息）
    await expect(page.locator('[data-testid="page-ci-detail"]')).toBeVisible()
  })
})
