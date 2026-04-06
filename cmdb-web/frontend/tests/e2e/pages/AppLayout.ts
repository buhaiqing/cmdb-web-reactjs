import { test, expect, Page } from '@playwright/test'

export class AppLayout {
  constructor(private page: Page) {}

  async expectLayoutVisible() {
    await expect(this.page.locator('[data-testid="layout-app"]')).toBeVisible()
    await expect(this.page.locator('[data-testid="header-main"]')).toBeVisible()
    await expect(this.page.locator('[data-testid="sidebar-main"]')).toBeVisible()
    await expect(this.page.locator('[data-testid="footer"]')).toBeVisible()
  }

  async expectUserLoggedIn(username: string) {
    await expect(this.page.locator('[data-testid="header-username"]')).toContainText(username)
  }

  async navigateTo(path: string) {
    // 确保菜单项可见后再点击 (Ant Design Menu items use data-menu-id or li elements)
    await this.page.waitForSelector(`.ant-menu-item[data-menu-id*="${path}"]`, { timeout: 15000, state: 'visible' })
    await this.page.click(`.ant-menu-item[data-menu-id*="${path}"]`)
    await this.page.waitForURL(`**${path}`)
  }

  async toggleSidebar() {
    // 确保切换按钮可见后再点击
    await this.page.waitForSelector('[data-testid="button-toggle-sidebar"]', { timeout: 15000, state: 'visible' })
    await this.page.click('[data-testid="button-toggle-sidebar"]')
  }

  async expectSidebarCollapsed() {
    await expect(this.page.locator('[data-testid="sidebar-main"]')).toHaveClass(/ant-layout-sider-collapsed/)
  }

  // 权限验证方法
  async expectRestrictedMenu() {
    // 普通用户应该只能看到有限的菜单项
    await expect(this.page.locator('.ant-menu-item[data-menu-id*="/ci/list"]')).toBeVisible()
    await expect(this.page.locator('.ant-menu-item[data-menu-id*="/change/list"]')).toBeVisible()
    // 不应该看到系统管理菜单
    await expect(this.page.locator('.ant-menu-item[data-menu-id*="/system/user"]')).not.toBeVisible()
    await expect(this.page.locator('.ant-menu-item[data-menu-id*="/system/role"]')).not.toBeVisible()
  }

  async expectReadOnlyMode() {
    // 验证只读模式下的界面状态
    await expect(this.page.locator('[data-testid="readonly-indicator"]')).toBeVisible()
  }

  async expectAdminMenu() {
    // 管理员应该看到完整的菜单
    await expect(this.page.locator('.ant-menu-item[data-menu-id*="/ci/list"]')).toBeVisible()
    await expect(this.page.locator('.ant-menu-item[data-menu-id*="/change/list"]')).toBeVisible()
    await expect(this.page.locator('.ant-menu-item[data-menu-id*="/system/user"]')).toBeVisible()
    await expect(this.page.locator('.ant-menu-item[data-menu-id*="/system/role"]')).toBeVisible()
  }
}
