import { test, expect, Page } from '@playwright/test'

export class SystemUserPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/system/user')
    await this.page.waitForLoadState('networkidle')
    // 等待 Zustand hydration 完成 - 检查主内容区域可见
    await this.page.waitForSelector('[data-testid="content-main"]', { timeout: 15000, state: 'visible' })
  }

  async expectUserListVisible() {
    await expect(this.page.locator('[data-testid="page-user-manage"]')).toBeVisible()
    await expect(this.page.locator('[data-testid="table-user-list"]')).toBeVisible()
  }
}

export class SystemRolePage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/system/role')
    await this.page.waitForLoadState('networkidle')
    // 等待 Zustand hydration 完成 - 检查主内容区域可见
    await this.page.waitForSelector('[data-testid="content-main"]', { timeout: 15000, state: 'visible' })
  }

  async expectRoleListVisible() {
    await expect(this.page.locator('[data-testid="page-role-manage"]')).toBeVisible()
    await expect(this.page.locator('[data-testid="table-role-list"]')).toBeVisible()
  }
}

export class SystemAuditPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/system/audit')
    await this.page.waitForLoadState('networkidle')
    // 等待 Zustand hydration 完成 - 检查主内容区域可见
    await this.page.waitForSelector('[data-testid="content-main"]', { timeout: 15000, state: 'visible' })
  }

  async expectAuditLogVisible() {
    await expect(this.page.locator('[data-testid="page-audit-log"]')).toBeVisible()
    await expect(this.page.locator('[data-testid="table-audit-list"]')).toBeVisible()
  }
}
