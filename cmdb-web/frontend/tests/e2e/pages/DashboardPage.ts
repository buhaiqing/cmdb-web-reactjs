import { expect } from '@playwright/test'

export class DashboardPage {
  constructor(private page: any) {}

  async goto() {
    await this.page.goto('/dashboard')
    // 等待 Zustand hydration 完成 - 检查主内容区域可见
    await this.page.waitForSelector('[data-testid="content-main"]', { timeout: 15000, state: 'visible' })
  }

  async expectDashboardVisible() {
    await expect(this.page.locator('[data-testid="page-dashboard"]')).toBeVisible()
    await expect(this.page.locator('[data-testid="card-stat-server"]')).toBeVisible()
    await expect(this.page.locator('[data-testid="card-stat-database"]')).toBeVisible()
  }

  async expectRecentChangesTable() {
    await expect(this.page.locator('[data-testid="table-recent-changes"]')).toBeVisible()
  }
}
