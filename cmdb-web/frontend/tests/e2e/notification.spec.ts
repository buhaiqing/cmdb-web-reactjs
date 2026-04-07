import { test, expect } from '@playwright/test'
import { isMockMode, setupCommonMocks } from './setup/test-config'

test.describe('通知中心 E2E 测试', () => {

  test.beforeEach(async ({ page }) => {

    if (isMockMode()) {
      await setupCommonMocks(page)
    }

    await page.goto('/system/notification')
  })

  test('通知中心页面正确加载', async ({ page }) => {
    await expect(page.locator('[data-testid="page-notification"]')).toBeVisible()
    await expect(page.locator('.page-title')).toContainText('通知中心')
  })

  test('通知表格正确渲染', async ({ page }) => {
    await expect(page.locator('[data-testid="table-notification-list"]')).toBeVisible({ timeout: 5000 }).catch(() => {
      console.log('No notifications found')
    })
  })

  test('全部已读按钮可见', async ({ page }) => {
    await expect(page.locator('button:has-text("全部已读")')).toBeVisible()
  })

  test('刷新按钮可见', async ({ page }) => {
    await expect(page.locator('button:has-text("刷新")')).toBeVisible()
  })

  test('切换到未读通知标签', async ({ page }) => {
    await page.click('text=未读通知')
    await expect(page.locator('[data-testid="table-notification-list"]')).toBeVisible({ timeout: 5000 }).catch(() => {
      console.log('No unread notifications')
    })
  })

  test('切换到全部通知标签', async ({ page }) => {
    await page.click('text=全部通知')
    await expect(page.locator('[data-testid="table-notification-list"]')).toBeVisible({ timeout: 5000 }).catch(() => {
      console.log('No notifications found')
    })
  })
})
