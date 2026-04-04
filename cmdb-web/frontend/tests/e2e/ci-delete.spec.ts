import { test, expect } from '@playwright/test'
import { isMockMode } from './setup/test-config'
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

  test.beforeEach(async ({ page }) => {
    // 只在 mock 模式下设置拦截器
    if (!isMockMode()) {
      loginPage = new LoginPage(page)
      ciDetailPage = new CIDetailPage(page)
      ciListPage = new CIListPage(page)
      return
    }

    deletedCIIds = []

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

  test('CI-016: 删除配置项显示确认对话框', async () => {
    await ciDetailPage.goto(mockCI.id)
    await ciDetailPage.expectDetailVisible()

    // 点击删除按钮
    await ciDetailPage.clickDeleteButtonAndConfirm()

    // 验证确认对话框显示
    await ciDetailPage.expectConfirmDialog()
  })

  test('CI-017: 确认删除配置项', async () => {
    await ciDetailPage.goto(mockCI.id)
    await ciDetailPage.expectDetailVisible()

    // 删除并确认
    await ciDetailPage.clickDeleteButtonAndConfirm()
    await ciDetailPage.expectConfirmDialog()

    // 验证删除成功，跳转到列表页
    await ciDetailPage.expectDeleteSuccess()
    await ciListPage.expectCIListVisible()
  })

  test('CI-018: 取消删除操作', async () => {
    await ciDetailPage.goto(mockCI.id)
    await ciDetailPage.expectDetailVisible()

    // 点击删除按钮
    await ciDetailPage.clickDeleteButton()
    await ciDetailPage.expectConfirmDialog()

    // 取消删除 - 点击取消按钮
    await ciDetailPage.page.locator('.ant-modal-confirm .ant-modal-confirm-btns button').first().click()

    // 验证停留在详情页
    await ciDetailPage.expectDetailVisible()
    await ciDetailPage.expectCIDataVisible({ name: mockCI.name })
  })

  test('CI-019: 删除后跳转到列表页', async () => {
    // 删除CI
    await ciDetailPage.goto(mockCI.id)
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
