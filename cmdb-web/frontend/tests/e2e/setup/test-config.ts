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

// Full 模式下的 Fallback Mocks（仅用于前后端字段不匹配的 API 端点）
export const setupFallbackMocks = async (page: Page) => {
  if (!isFullMode()) return

  // Mock 变更请求创建 API（前端字段名与 Go 后端不匹配：
  //   前端发送 ciId/changeType/description，Go 后端要求 ci_id/reason/plan）
  await page.route('**/api/changes', async (route) => {
    // 放行 GET 请求（列表、recent）和 /changes/:id 路径，让它们走真实后端
    const url = route.request().url()
    const method = route.request().method()

    if (method === 'GET') {
      await route.continue()
      return
    }

    // 只拦截 POST 创建请求
    if (method === 'POST') {
      const requestBody = JSON.parse(route.request().postData() || '{}')
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'change-' + Date.now(),
            ...requestBody,
            status: 'pending',
            operator: 'admin',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        }),
      })
      return
    }

    await route.continue()
  })
}
