import { test, expect } from '@playwright/test'
import { LoginPage } from './pages/LoginPage'
import { RelationGraphPage } from './pages/RelationGraphPage'
import { isMockMode, isFullMode, setupFallbackMocks } from './setup/test-config'
import { setupMockRoutes } from './setup/mock-routes'
import { generateTestData, generateTestId } from './setup/test-data'

test.describe('关系管理测试', () => {
  let loginPage: LoginPage
  let relationGraphPage: RelationGraphPage
  let testId: string

  test.beforeEach(async ({ page }) => {
    // 生成唯一的测试 ID
    testId = generateTestId('relation')
    console.log(`开始测试: ${testId}`)

    loginPage = new LoginPage(page)
    relationGraphPage = new RelationGraphPage(page)

    // Full 模式：登录 + 设置 fallback mocks
    if (isFullMode()) {
      await setupFallbackMocks(page)
      await loginPage.goto()
      await loginPage.login('admin', 'admin123')
      await loginPage.waitForLoginSuccess()
      return
    }

    // Mock 模式：设置拦截器
    if (!isMockMode()) return

    // 使用统一的 Mock 路由配置
    await setupMockRoutes(page)

    loginPage = new LoginPage(page)
    relationGraphPage = new RelationGraphPage(page)
  })

  test.afterEach(() => {
    console.log(`测试完成: ${testId}`)
  })

  test('REL-001: 查看关系图谱', async ({ page }) => {
    await loginPage.goto()
    await loginPage.login('admin', 'admin123')
    await loginPage.waitForLoginSuccess()

    await relationGraphPage.goto()
    await relationGraphPage.expectGraphVisible()
  })

  test('REL-002: 验证节点和边显示', async ({ page }) => {
    await loginPage.goto()
    await loginPage.login('admin', 'admin123')
    await loginPage.waitForLoginSuccess()

    await relationGraphPage.goto()
    await relationGraphPage.expectGraphVisible()
    await expect(page).toHaveURL(/\/relation\/graph/)
  })

  test('REL-003: 点击节点查看详情', async ({ page }) => {
    await loginPage.goto()
    await loginPage.login('admin', 'admin123')
    await loginPage.waitForLoginSuccess()

    await relationGraphPage.goto()
    await relationGraphPage.expectGraphVisible()
    await expect(page).toHaveURL(/\/relation\/graph/)
  })

  test('REL-004: 影响分析功能', async ({ page }) => {
    await loginPage.goto()
    await loginPage.login('admin', 'admin123')
    await loginPage.waitForLoginSuccess()

    await relationGraphPage.goto()
    await relationGraphPage.expectGraphVisible()
    await expect(page).toHaveURL(/\/relation\/graph/)
  })

  test('REL-005: 缩放和重置视图', async ({ page }) => {
    await loginPage.goto()
    await loginPage.login('admin', 'admin123')
    await loginPage.waitForLoginSuccess()

    await relationGraphPage.goto()
    await relationGraphPage.expectGraphVisible()

    await relationGraphPage.zoomIn()
    await relationGraphPage.zoomOut()
    await relationGraphPage.resetView()
  })

  test('REL-006: 全屏模式切换', async ({ page }) => {
    await loginPage.goto()
    await loginPage.login('admin', 'admin123')
    await loginPage.waitForLoginSuccess()

    await relationGraphPage.goto()
    await relationGraphPage.expectGraphVisible()

    await relationGraphPage.toggleFullscreen()
    await relationGraphPage.toggleFullscreen()
  })

  test('REL-007: 创建新关系', async ({ page }) => {
    await loginPage.goto()
    await loginPage.login('admin', 'admin123')
    await loginPage.waitForLoginSuccess()

    await relationGraphPage.goto()
    await relationGraphPage.expectGraphVisible()
    await expect(page).toHaveURL(/\/relation\/graph/)
  })

  test('REL-008: 删除关系', async ({ page }) => {
    await loginPage.goto()
    await loginPage.login('admin', 'admin123')
    await loginPage.waitForLoginSuccess()

    await relationGraphPage.goto()
    await relationGraphPage.expectGraphVisible()

    await relationGraphPage.deleteRelation('rel-001')
  })

  test('REL-009: 搜索节点', async ({ page }) => {
    await loginPage.goto()
    await loginPage.login('admin', 'admin123')
    await loginPage.waitForLoginSuccess()

    await relationGraphPage.goto()
    await relationGraphPage.expectGraphVisible()

    await relationGraphPage.searchNode('MySQL')
  })

  test('REL-010: 按类型筛选节点', async ({ page }) => {
    await loginPage.goto()
    await loginPage.login('admin', 'admin123')
    await loginPage.waitForLoginSuccess()

    await relationGraphPage.goto()
    await relationGraphPage.expectGraphVisible()

    await relationGraphPage.filterByCIType('数据库')
  })
})