import { test, expect } from '@playwright/test'
import { isMockMode, isFullMode } from './test-config'

const authFile = 'tests/e2e/.auth/user.json'

test('authenticate', async ({ page }) => {
  console.log('[auth.setup] 开始认证，TEST_MODE:', process.env.TEST_MODE || 'mock')
  console.log('[auth.setup] isMockMode:', isMockMode(), 'isFullMode:', isFullMode())

  // 设置 Mock 路由（如果是 mock 模式）
  if (isMockMode()) {
    console.log('[auth.setup] 设置 mock 认证路由')
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            token: 'mock-jwt-token-' + Date.now(),
            user: {
              id: '1',
              username: 'admin',
              email: 'admin@example.com',
              role: 'admin',
              permissions: ['*'],
            },
          },
        }),
      })
    })

    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: '1',
            username: 'admin',
            email: 'admin@example.com',
            role: 'admin',
            permissions: ['*'],
          },
        }),
      })
    })
  }

  // 导航到登录页
  console.log('[auth.setup] 导航到登录页')
  await page.goto('/login')
  await expect(page).toHaveURL(/\/login/)
  console.log('[auth.setup] 登录页加载成功')

  // 填写登录表单
  console.log('[auth.setup] 填写登录表单')
  await page.fill('[data-testid="input-login-username"]', 'admin')
  await page.fill('[data-testid="input-login-password"]', 'admin123')

  // 提交登录
  console.log('[auth.setup] 提交登录')
  await page.click('[data-testid="button-login-submit"]')

  // 等待登录成功 - 检查 URL 跳转到 dashboard 或 /ci
  console.log('[auth.setup] 等待登录成功，检查 URL 跳转')
  await page.waitForURL((url) => {
    const path = url.pathname
    return path.includes('/dashboard') || path === '/ci' || path === '/'
  }, { timeout: 15000 })

  const currentUrl = page.url()
  console.log('[auth.setup] 登录成功，当前 URL:', currentUrl)

  // 等待页面加载完成
  await page.waitForLoadState('domcontentloaded')
  console.log('[auth.setup] 页面加载完成')

  // 保存认证状态到文件
  console.log('[auth.setup] 保存认证状态到:', authFile)
  await page.context().storageState({ path: authFile })
  console.log('[auth.setup] 认证状态保存成功')
})
