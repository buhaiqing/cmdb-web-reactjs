import { test, expect } from '@playwright/test'

export class DashboardPage {
  constructor(private page: any) {}

  async goto() {
    await this.page.goto('/dashboard')
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
