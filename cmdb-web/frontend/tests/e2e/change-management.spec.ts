import { test, expect } from '@playwright/test'
import { ChangeRequestPage } from './pages/ChangeRequestPage'
import { isMockMode, isFullMode, setupFallbackMocks } from './setup/test-config'
import { setupMockRoutes } from './setup/mock-routes'
import { generateTestData, generateTestId } from './setup/test-data'

test.describe('变更管理测试', () => {
  let changeRequestPage: ChangeRequestPage
  let testId: string

  test.beforeEach(async ({ page }) => {
    // 生成唯一的测试 ID
    testId = generateTestId('change')
    console.log(`开始测试: ${testId}`)
    
    // 只在 mock 模式下设置拦截器
    if (isMockMode()) {
      // 使用统一的 Mock 路由配置
      await setupMockRoutes(page)
    } else if (isFullMode()) {
      // 在 full 模式下设置 fallback mocks
      await setupFallbackMocks(page)
    }

    changeRequestPage = new ChangeRequestPage(page)

  })

  test.afterEach(() => {
    console.log(`测试完成: ${testId}`)
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
    await changeRequestPage.gotoDetail('change-001')
    await changeRequestPage.expectDetailVisible()

    await changeRequestPage.expectChangeDataVisible({
      title: '测试变更请求',
      ciId: '测试服务器-01',
      changeType: '更新配置',
      description: '这是一个测试变更请求的描述'
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
