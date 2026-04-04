import { test, expect, Page } from '@playwright/test'

export class AppLayout {
  constructor(private page: Page) {}

  async expectLayoutVisible() {
    await expect(this.page.locator('[data-testid="layout-app"]')).toBeVisible()
    await expect(this.page.locator('[data-testid="header"]')).toBeVisible()
    await expect(this.page.locator('[data-testid="sidebar"]')).toBeVisible()
    await expect(this.page.locator('[data-testid="footer"]')).toBeVisible()
  }

  async expectUserLoggedIn(username: string) {
    await expect(this.page.locator('[data-testid="header-username"]')).toContainText(username)
  }

  async navigateTo(path: string) {
    await this.page.click(`[data-testid="menu-item-${path}"]`)
    await this.page.waitForURL(`**${path}`)
  }

  async toggleSidebar() {
    await this.page.click('[data-testid="button-toggle-sidebar"]')
  }

  async expectSidebarCollapsed() {
    await expect(this.page.locator('[data-testid="sidebar"]')).toHaveClass(/ant-layout-sider-collapsed/)
  }

  // 权限验证方法
  async expectRestrictedMenu() {
    // 普通用户应该只能看到有限的菜单项
    await expect(this.page.locator('[data-testid="menu-item-/ci/list"]')).toBeVisible()
    await expect(this.page.locator('[data-testid="menu-item-/change/list"]')).toBeVisible()
    // 不应该看到系统管理菜单
    await expect(this.page.locator('[data-testid="menu-item-/system/user"]')).not.toBeVisible()
    await expect(this.page.locator('[data-testid="menu-item-/system/role"]')).not.toBeVisible()
  }

  async expectReadOnlyMode() {
    // 验证只读模式下的界面状态
    await expect(this.page.locator('[data-testid="readonly-indicator"]')).toBeVisible()
  }

  async expectAdminMenu() {
    // 管理员应该看到完整的菜单
    await expect(this.page.locator('[data-testid="menu-item-/ci/list"]')).toBeVisible()
    await expect(this.page.locator('[data-testid="menu-item-/change/list"]')).toBeVisible()
    await expect(this.page.locator('[data-testid="menu-item-/system/user"]')).toBeVisible()
    await expect(this.page.locator('[data-testid="menu-item-/system/role"]')).toBeVisible()
  }
}
