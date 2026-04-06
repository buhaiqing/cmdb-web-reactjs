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

// 通用的 Dashboard Mock 设置
export const setupDashboardMocks = async (page: Page) => {
  if (isFullMode()) return

  await page.route('**/api/dashboard/stats', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          server: 128,
          database: 45,
          middleware: 32,
          container: 156,
          changePending: 7,
        },
      }),
    })
  })

  await page.route('**/api/changes/recent', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [
          { id: '1', ciName: 'DB-主库-01', changeType: '更新配置', operator: 'admin', createdAt: '2024-01-15 10:30', status: 'pending' },
          { id: '2', ciName: 'APP-订单服务', changeType: '重启服务', operator: 'admin', createdAt: '2024-01-15 09:15', status: 'approved' },
          { id: '3', ciName: 'K8S-集群-01', changeType: '扩缩容', operator: 'admin', createdAt: '2024-01-14 16:45', status: 'completed' },
        ],
      }),
    })
  })
}

// 设置所有常用的 Mock 路由（认证 + Dashboard）
export const setupCommonMocks = async (page: Page) => {
  await setupAuthMocks(page)
  await setupDashboardMocks(page)
}

// Full 模式下的 Fallback Mocks（用于缺失的 API 端点）
export const setupFallbackMocks = async (page: Page) => {
  if (!isFullMode()) return
  
  // Mock Dashboard Stats API（Go 后端路径不匹配）
  await page.route('**/api/dashboard/stats', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          server: 0,
          database: 0,
          middleware: 0,
          container: 0,
          changePending: 0,
        },
      }),
    })
  })
  
  // Mock Changes Recent API（Go 后端未实现）
  await page.route('**/api/changes/recent', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [],
      }),
    })
  })
}
