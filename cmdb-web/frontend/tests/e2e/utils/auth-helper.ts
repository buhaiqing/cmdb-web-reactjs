import { Page } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage'

/**
 * 检查是否需要登录，如果被重定向到登录页则重新登录
 * @param page Playwright Page 对象
 * @param username 用户名，默认为 'admin'
 * @param password 密码，默认为 'admin123'
 */
export async function ensureLoggedIn(page: Page, username = 'admin', password = 'admin123'): Promise<void> {
  const currentUrl = page.url()
  if (currentUrl.includes('/login')) {
    console.log('⚠️ 被重定向到登录页，需要重新登录')
    const loginPage = new LoginPage(page)
    await loginPage.login(username, password)
    await loginPage.waitForLoginSuccess()
    console.log('✓ 重新登录成功')
  }
}

/**
 * 导航到指定路径，如果被重定向到登录页则重新登录后再次导航
 * @param page Playwright Page 对象
 * @param path 目标路径
 * @param options 导航选项
 */
export async function navigateWithAuth(
  page: Page,
  path: string,
  options?: { timeout?: number; waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' | 'commit' }
): Promise<void> {
  const timeout = options?.timeout ?? 30000
  const waitUntil = options?.waitUntil ?? 'domcontentloaded'

  // 尝试导航
  await page.goto(path, { timeout, waitUntil })

  // 检查是否需要重新登录
  await ensureLoggedIn(page)

  // 如果被重定向到登录页，重新登录后再次导航
  const currentUrl = page.url()
  if (currentUrl.includes(path)) {
    // 已经在目标页面
    return
  }
  if (!currentUrl.includes('/login')) {
    // 在其他页面，需要导航
    await page.goto(path, { timeout, waitUntil })
  }
}
