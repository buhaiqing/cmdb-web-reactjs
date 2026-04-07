import { test, expect } from '@playwright/test'
import { isMockMode, isFullMode, setupFallbackMocks } from './setup/test-config'
import { CICreatePage } from './pages/CICreatePage'
import { CIListPage } from './pages/CIListPage'
import { setupMockRoutes } from './setup/mock-routes'

test.describe('配置项创建测试', () => {
  let ciCreatePage: CICreatePage
  let ciListPage: CIListPage

  test.beforeEach(async ({ page }) => {
    console.log('[ci-create.spec] beforeEach 开始')
    // 初始化页面对象
    ciCreatePage = new CICreatePage(page)
    ciListPage = new CIListPage(page)

    // 只在 mock 模式下设置特定的 Mock 路由
    if (isMockMode()) {
      console.log('[ci-create.spec] Mock 模式：设置 CI 相关路由')
      // 统一注册 API mock（包含 /api/ci 的创建与查询），避免创建后不跳转
      await setupMockRoutes(page)
    } else if (isFullMode()) {
      console.log('[ci-create.spec] Full 模式：设置 fallback mocks')
      await setupFallbackMocks(page)
    }

    // 认证由 project dependency 处理，无需重复登录
    console.log('[ci-create.spec] beforeEach 完成（认证由 setup 处理）')
  })

  test('CI-001: 创建配置项表单可见性', async () => {
    await ciCreatePage.goto()
    await ciCreatePage.expectFormVisible()
  })

  test('CI-002: 填写表单并提交创建配置项', async () => {
    await ciCreatePage.goto()
    await ciCreatePage.expectFormVisible()

    const testData = {
      name: '测试服务器-' + Date.now(),
      type: '服务器',
      ip: '192.168.1.100',
      project: '测试项目',
      environment: '生产环境'
    }

    await ciCreatePage.fillForm(testData)
    await ciCreatePage.submit()
    await ciCreatePage.expectCreateSuccess()
  })

  test('CI-003: 验证必填字段', async () => {
    await ciCreatePage.goto()
    await ciCreatePage.expectFormVisible()

    // 不填写任何字段直接提交
    await ciCreatePage.submit()

    // 验证错误提示
    await expect(ciCreatePage.page.locator('.ant-form-item-explain-error').first()).toBeVisible()
  })

  test('CI-004: 取消创建操作', async () => {
    await ciCreatePage.goto()
    await ciCreatePage.expectFormVisible()

    // 填写部分数据
    await ciCreatePage.fillForm({
      name: '临时测试服务器',
      type: '服务器'
    })

    // 点击取消
    await ciCreatePage.cancel()

    // 验证返回列表页
    await ciListPage.expectCIListVisible()
  })

  test('CI-005: 创建成功后跳转到列表页', async () => {
    await ciCreatePage.goto()
    await ciCreatePage.expectFormVisible()

    await ciCreatePage.fillForm({
      name: '测试跳转服务器-' + Date.now(),
      type: '服务器',
      ip: '192.168.1.200',
      project: '测试项目',
      environment: '开发环境'
    })

    await ciCreatePage.submit()
    await ciCreatePage.expectCreateSuccess()
    await ciListPage.expectCIListVisible()
  })
})
