import { Page } from '@playwright/test'

// 测试模式配置
export const TEST_MODE = process.env.TEST_MODE || 'mock'

export const isMockMode = () => TEST_MODE === 'mock'
export const isFullMode = () => TEST_MODE === 'full'

// 只在 mock 模式下执行路由拦截
export const setupMockRoutes = async (page: Page, setupFn: () => Promise<void>) => {
  if (isMockMode()) {
    await setupFn()
  }
}

// 通用的认证 mock 设置
export const setupAuthMocks = async (page: Page) => {
  if (isFullMode()) return

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
