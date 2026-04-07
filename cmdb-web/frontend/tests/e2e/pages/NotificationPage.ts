import { expect, Page } from '@playwright/test'

export class NotificationPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/system/notification')
  }

  async expectPageVisible() {
    await expect(this.page.locator('[data-testid="page-notification"]')).toBeVisible()
    await expect(this.page.locator('.page-title')).toContainText('通知中心')
  }

  async clickMarkAllAsRead() {
    await this.page.click('button:has-text("全部已读")')
  }

  async expectMarkAllSuccess() {
    await expect(this.page.locator('.ant-message')).toContainText('成功', { timeout: 5000 })
  }

  async clickRefreshButton() {
    await this.page.click('button:has-text("刷新")')
  }

  async expectTableVisible() {
    await expect(this.page.locator('[data-testid="table-notification-list"]')).toBeVisible()
  }

  async switchToUnreadTab() {
    await this.page.click('text=未读通知')
  }

  async switchToAllTab() {
    await this.page.click('text=全部通知')
  }

  async clickNotificationTitle(index: number = 0) {
    await this.page.locator('[data-testid="table-notification-list"] a').nth(index).click()
  }

  async expectDetailModalVisible() {
    await expect(this.page.locator('[data-testid="modal-notification-detail"]')).toBeVisible()
  }

  async closeDetailModal() {
    await this.page.click('[data-testid="modal-notification-detail"] button:has-text("关闭")')
  }

  async clickMarkAsReadButton(index: number = 0) {
    await this.page.locator('[data-testid="table-notification-list"] button:has-text("标记已读")').nth(index).click()
  }

  async clickDeleteButton(index: number = 0) {
    await this.page.locator('[data-testid="table-notification-list"] button:has-text("删除")').nth(index).click()
  }

  async confirmDelete() {
    await this.page.click('.ant-popover .ant-btn-primary')
  }

  async expectEmptyState() {
    await expect(this.page.locator('.ant-empty-description')).toContainText('暂无通知')
  }
}
