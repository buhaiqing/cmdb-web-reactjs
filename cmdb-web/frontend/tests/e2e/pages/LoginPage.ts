import { test, expect } from '@playwright/test'

export class LoginPage {
  constructor(private page: any) {}

  async goto() {
    await this.page.goto('/login')
  }

  async login(username: string, password: string) {
    await this.page.fill('[data-testid="input-login-username"]', username)
    await this.page.fill('[data-testid="input-login-password"]', password)
    await this.page.click('[data-testid="button-login-submit"]')
  }

  async waitForLoginSuccess() {
    await this.page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 10000 })
    await this.page.waitForLoadState('networkidle', { timeout: 10000 })
    await this.page.waitForSelector('[data-testid="header-username"]', { timeout: 10000 })
  }

  async expectLoginFormVisible() {
    await expect(this.page.locator('[data-testid="form-login"]')).toBeVisible()
  }

  async expectLoginFailed() {
    await expect(this.page.locator('.ant-message')).toContainText('用户名或密码错误')
  }
}
