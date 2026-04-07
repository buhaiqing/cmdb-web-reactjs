import { test, expect } from '@playwright/test'
import { TagManagementPage } from './pages/TagManagementPage'
import { isMockMode, setupCommonMocks } from './setup/test-config'

test.describe('标签管理页面 E2E 测试', () => {
  let tagPage: TagManagementPage

  test.beforeEach(async ({ page }) => {
    tagPage = new TagManagementPage(page)

    if (isMockMode()) {
      await setupCommonMocks(page)
    }

    await tagPage.goto()
  })

  test('标签管理页面正确加载', async ({ page }) => {
    await expect(page.locator('[data-testid="page-tag-management"]')).toBeVisible()
    await expect(page.locator('.page-title')).toContainText('标签管理')
  })

  test('创建标签按钮可见', async ({ page }) => {
    await expect(page.locator('[data-testid="button-create-tag"]')).toBeVisible()
  })

  test('标签表格正确渲染', async ({ page }) => {
    await expect(page.locator('[data-testid="table-tag-list"]')).toBeVisible()
  })

  test('创建标签弹窗', async ({ page }) => {
    await page.waitForSelector('[data-testid="button-create-tag"]')
    await page.click('[data-testid="button-create-tag"]')
    await expect(page.locator('[data-testid="modal-tag-form"]')).toBeVisible()
    await expect(page.locator('[data-testid="input-tag-name"]')).toBeVisible()
  })

  test('创建标签表单验证 - 缺少名称', async ({ page }) => {
    await page.waitForSelector('[data-testid="button-create-tag"]')
    await page.click('[data-testid="button-create-tag"]')
    await expect(page.locator('[data-testid="modal-tag-form"]')).toBeVisible()
    // Ant Design Modal 的 OK 按钮在 .ant-modal-footer 中，不是 form submit
    const okBtn = page.locator('.ant-modal-footer .ant-btn-primary')
    await okBtn.click()
    await expect(page.locator('.ant-form-item-explain-error').first()).toBeVisible()
  })

  test('搜索标签功能', async ({ page }) => {
    await page.fill('[data-testid="input-tag-search"]', '测试')
    await expect(page.locator('[data-testid="table-tag-list"]')).toBeVisible()
  })

  test('刷新按钮功能', async ({ page }) => {
    await page.click('[data-testid="button-refresh-tags"]')
    await expect(page.locator('[data-testid="table-tag-list"]')).toBeVisible()
  })
})
