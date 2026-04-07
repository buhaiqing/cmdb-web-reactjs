import { test, expect } from '@playwright/test'
import { isMockMode, setupCommonMocks } from './setup/test-config'

test.describe('配置项类型管理页面 E2E 测试', () => {

  test.beforeEach(async ({ page }) => {

    if (isMockMode()) {
      await setupCommonMocks(page)
    }

    await page.goto('/ci/types')
  })

  test('类型管理页面正确加载', async ({ page }) => {
    await expect(page.locator('[data-testid="page-ci-type-management"]')).toBeVisible()
    await expect(page.locator('.page-title')).toContainText('配置项类型管理')
  })

  test('创建类型按钮可见', async ({ page }) => {
    await expect(page.locator('[data-testid="button-create-type"]')).toBeVisible()
  })

  test('类型表格正确渲染', async ({ page }) => {
    await expect(page.locator('[data-testid="table-type-list"]')).toBeVisible()
  })

  test('创建类型弹窗', async ({ page }) => {
    await page.click('[data-testid="button-create-type"]')
    await expect(page.getByRole('dialog', { name: '创建类型' })).toBeVisible()
    await expect(page.locator('[data-testid="input-type-name"]')).toBeVisible()
    await expect(page.locator('[data-testid="input-type-code"]')).toBeVisible()
  })

  test('创建类型表单验证 - 缺少必填字段', async ({ page }) => {
    await page.click('[data-testid="button-create-type"]')
    await expect(page.getByRole('dialog', { name: '创建类型' })).toBeVisible()
    await page.getByRole('button', { name: '创 建' }).click()
    await expect(page.locator('.ant-form-item-explain-error').first()).toBeVisible()
  })

  test('搜索类型功能', async ({ page }) => {
    await page.fill('[data-testid="input-type-search"]', '服务器')
    await expect(page.locator('[data-testid="table-type-list"]')).toBeVisible()
  })

  test('刷新按钮功能', async ({ page }) => {
    await page.click('[data-testid="button-refresh-types"]')
    await expect(page.locator('[data-testid="table-type-list"]')).toBeVisible()
  })
})
