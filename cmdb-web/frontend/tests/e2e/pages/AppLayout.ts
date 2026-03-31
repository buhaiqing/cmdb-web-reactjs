import { test, expect } from '@playwright/test'

export class AppLayout {
  constructor(private page: any) {}

  async expectLayoutVisible() {
    await expect(this.page.locator('[data-testid="layout-app"]')).toBeVisible()
    await expect(this.page.locator('[data-testid="header"]')).toBeVisible()
    await expect(this.page.locator('[data-testid="sidebar"]')).toBeVisible()
    await expect(this.page.locator('[data-testid="footer"]')).toBeVisible()
  }

  async expectUserLoggedIn(username: string) {
    await expect(this.page.locator('[data-testid="header-username"]')).toContainText(username)
  }

  async toggleSidebar() {
    await this.page.click('[data-testid="button-toggle-sidebar"]')
  }

  async expectSidebarCollapsed() {
    await expect(this.page.locator('[data-testid="sidebar"]')).toHaveClass(/ant-layout-sider-collapsed/)
  }
}
