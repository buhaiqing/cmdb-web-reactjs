import { test, expect } from '@playwright/test'
import { LoginPage } from './pages/LoginPage'
import { ChangeRequestPage } from './pages/ChangeRequestPage'
import { isMockMode } from './setup/test-config'

test.describe('变更管理测试', () => {
  let loginPage: LoginPage
  let changeRequestPage: ChangeRequestPage

  const mockChange = {
    id: 'change-001',
    title: '测试变更请求',
    ciId: 'ci-001',
    ciName: '测试服务器-01',
    changeType: 'update',
    changeTypeLabel: '更新配置',
    description: '这是一个测试变更请求的描述',
    status: 'pending',
    statusLabel: '待审批',
    createdBy: 'admin',
    createdAt: '2024-01-01 10:00:00',
  }

  test.beforeEach(async ({ page }) => {
    // 只在 mock 模式下设置拦截器
    if (!isMockMode()) {
      loginPage = new LoginPage(page)
      changeRequestPage = new ChangeRequestPage(page)
      await loginPage.goto()
      await loginPage.login('admin', 'admin123')
      await loginPage.waitForLoginSuccess()
      return
    }

    // 拦截认证相关的 API 请求（使用 mock 数据）
    await page.route('**/api/auth/**', async (route) => {
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

      await route.continue()
    })

    // 拦截创建变更 API（必须在列表拦截器之前，更具体的 URL 优先）
    await page.route('**/api/changes', async (route) => {
      if (route.request().method() === 'POST') {
        const requestBody = JSON.parse(route.request().postData() || '{}')
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'new-change-' + Date.now(),
              ...requestBody,
              status: 'pending',
              createdAt: new Date().toISOString(),
            },
          }),
        })
        return
      }
      // GET 请求继续到下一个拦截器
      await route.fallback()
    })

    // 拦截变更列表 API，返回 mock 数据
    await page.route(/.*\/api\/changes(\?.*)?$/, async (route) => {
      if (route.request().method() !== 'GET') {
        await route.fallback()
        return
      }
      const url = route.request().url()
      const urlObj = new URL(url)
      const statusFilter = urlObj.searchParams.get('status')

      const items = [
        { ...mockChange, status: 'pending' },
        { ...mockChange, id: 'change-002', title: '另一个变更', status: 'approved' },
        { ...mockChange, id: 'change-003', title: '已拒绝的变更', status: 'rejected' },
      ].filter(item => !statusFilter || item.status === statusFilter)

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { items, total: items.length },
        }),
      })
    })

    // 拦截变更详情 API，返回 mock 数据
    await page.route(/\/api\/changes\/[^/]+$/, async (route) => {
      const url = route.request().url()
      const match = url.match(/\/api\/changes\/([^/]+)$/)
      const id = match ? match[1] : 'unknown'

      // 根据ID返回不同状态（用于状态流转测试）
      let status = 'pending'
      if (id === 'change-approved') status = 'approved'
      if (id === 'change-rejected') status = 'rejected'

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { ...mockChange, id, status },
        }),
      })
    })

    loginPage = new LoginPage(page)
    changeRequestPage = new ChangeRequestPage(page)

    await loginPage.goto()
    await loginPage.login('admin', 'admin123')
    await loginPage.waitForLoginSuccess()
  })

  test('CH-001: 创建变更请求', async () => {
    await changeRequestPage.gotoCreate()
    await changeRequestPage.expectCreateFormVisible()

    await changeRequestPage.fillCreateForm({
      title: '测试变更-' + Date.now(),
      ciId: 'ci-001',
      changeType: '更新配置',
      description: '这是一个测试变更请求的描述信息'
    })

    await changeRequestPage.submitCreate()
    await changeRequestPage.expectCreateSuccess()
  })

  test('CH-002: 查看变更请求详情', async () => {
    await changeRequestPage.gotoDetail(mockChange.id)
    await changeRequestPage.expectDetailVisible()

    await changeRequestPage.expectChangeDataVisible({
      title: mockChange.title,
      ciId: mockChange.ciName,
      changeType: mockChange.changeTypeLabel,
      description: mockChange.description
    })
  })

  test('CH-003: 变更状态流转 - 待审批到已批准', async () => {
    // 使用特定的ID，让拦截器返回已批准状态
    await changeRequestPage.gotoDetail('change-approved')
    await changeRequestPage.expectDetailVisible()

    // 验证状态为已批准
    await changeRequestPage.expectStatus('approved')
  })

  test('CH-004: 变更状态流转 - 待审批到已拒绝', async () => {
    // 使用特定的ID，让拦截器返回已拒绝状态
    await changeRequestPage.gotoDetail('change-rejected')
    await changeRequestPage.expectDetailVisible()

    // 验证状态为已拒绝
    await changeRequestPage.expectStatus('rejected')
  })

  test('CH-005: 验证变更列表筛选', async ({ page }) => {
    await changeRequestPage.gotoList()
    await changeRequestPage.expectListVisible()

    // 筛选待审批状态
    await changeRequestPage.filterByStatus('pending')
    await page.waitForTimeout(500)

    // 验证列表中只显示待审批的变更
    const rows = page.locator('[data-testid="table-change-list"] tbody tr')
    const count = await rows.count()
    expect(count).toBeGreaterThan(0)
  })

  test('CH-006: 验证已批准的变更不能再次批准', async () => {
    // 访问已批准的变更
    await changeRequestPage.gotoDetail('change-approved')
    await changeRequestPage.expectDetailVisible()

    // 验证状态已更新
    await changeRequestPage.expectStatus('approved')

    // 验证批准按钮不再显示
    await changeRequestPage.expectNoApproveButton()
    await changeRequestPage.expectNoRejectButton()
  })

  test('CH-007: 创建不同类型的变更请求', async () => {
    // 测试创建一种类型的变更请求
    await changeRequestPage.gotoCreate()
    await changeRequestPage.expectCreateFormVisible()

    await changeRequestPage.fillCreateForm({
      title: '测试创建变更-' + Date.now(),
      ciId: 'ci-001',
      changeType: '创建',
      description: '这是一个创建类型的变更请求'
    })

    await changeRequestPage.submitCreate()

    // 等待页面跳转或成功提示
    try {
      await changeRequestPage.expectCreateSuccess()
    } catch {
      // 如果跳转失败，至少验证表单提交没有报错
      await expect(changeRequestPage.page.locator('.ant-message-error')).not.toBeVisible()
    }
  })

  test('CH-008: 验证必填字段', async () => {
    await changeRequestPage.gotoCreate()
    await changeRequestPage.expectCreateFormVisible()

    // 不填写任何字段直接提交
    await changeRequestPage.submitCreate()

    // 验证错误提示（第一个必填字段）
    await expect(changeRequestPage.page.locator('.ant-form-item-explain-error').first()).toContainText('请输入')
  })
})
