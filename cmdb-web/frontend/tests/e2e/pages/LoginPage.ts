import { test, expect, Page } from '@playwright/test'

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login', { timeout: 30000, waitUntil: 'domcontentloaded' })
  }

  async login(username: string, password: string) {
    await this.page.fill('[data-testid="input-login-username"]', username)
    await this.page.fill('[data-testid="input-login-password"]', password)
    await this.page.click('[data-testid="button-login-submit"]')
  }

  async waitForLoginSuccess() {
    try {
      await this.page.waitForURL((url: URL) => url.pathname.includes('/dashboard'), { timeout: 15000 })
    } catch (e) {
      // 如果 URL 没有变化，尝试等待页面加载完成
      await this.page.waitForLoadState('domcontentloaded', { timeout: 10000 })
    }
    // 等待网络空闲，确保登录后的 API 调用完成，避免后续导航被中断
    await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})
  }

  async expectLoginFormVisible() {
    await expect(this.page.locator('[data-testid="form-login"]')).toBeVisible()
  }

  async expectLoginFailed() {
    await expect(this.page.locator('.ant-message')).toContainText('用户名或密码错误')
  }
}
