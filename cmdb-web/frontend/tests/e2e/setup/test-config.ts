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

  await page.route('**/api/dashboard/trend', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          period: '7',
          trend: [
            { date: '2024-01-09', server: 120, database: 42, middleware: 28, container: 145, total: 335 },
            { date: '2024-01-10', server: 122, database: 43, middleware: 29, container: 147, total: 341 },
            { date: '2024-01-11', server: 124, database: 43, middleware: 30, container: 148, total: 345 },
            { date: '2024-01-12', server: 125, database: 44, middleware: 30, container: 149, total: 348 },
            { date: '2024-01-13', server: 126, database: 44, middleware: 31, container: 150, total: 351 },
            { date: '2024-01-14', server: 127, database: 45, middleware: 31, container: 152, total: 355 },
            { date: '2024-01-15', server: 128, database: 45, middleware: 32, container: 156, total: 361 },
          ],
        },
      }),
    })
  })

  await page.route('**/api/dashboard/summary', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          ci: {
            total: 361,
            active: 340,
            inactive: 21,
            by_type: [
              { type: 'server', count: 128 },
              { type: 'database', count: 45 },
              { type: 'middleware', count: 32 },
              { type: 'container', count: 156 },
            ],
          },
          change: {
            total: 45,
            pending: 8,
            approved: 12,
            rejected: 5,
            completed: 20,
          },
          relation: 520,
          user: 25,
          tag: 15,
          ci_type: 8,
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

// 通用的 Tags Mock 设置
export const setupTagsMocks = async (page: Page) => {
  if (isFullMode()) return

  await page.route('**/api/tags', async (route) => {
    const method = route.request().method()
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            { id: '1', name: '生产环境', color: 'red', description: '生产环境资源', createdAt: '2024-01-10 10:00', updatedAt: '2024-01-10 10:00' },
            { id: '2', name: '测试环境', color: 'blue', description: '测试环境资源', createdAt: '2024-01-10 10:00', updatedAt: '2024-01-10 10:00' },
            { id: '3', name: '重要', color: 'gold', description: '重要标记', createdAt: '2024-01-10 10:00', updatedAt: '2024-01-10 10:00' },
          ],
        }),
      })
      return
    }
    if (method === 'POST') {
      const body = JSON.parse(route.request().postData() || '{}')
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { id: 'new-' + Date.now(), ...body, createdAt: new Date().toISOString() },
        }),
      })
      return
    }
    await route.continue()
  })

  await page.route(/\/api\/tags\/\w+/, async (route) => {
    const method = route.request().method()
    if (method === 'PUT' || method === 'DELETE') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { deleted: method === 'DELETE' } }),
      })
      return
    }
    await route.continue()
  })
}

// 通用的 CI Types Mock 设置
export const setupCITypesMocks = async (page: Page) => {
  if (isFullMode()) return

  await page.route('**/api/ci-types', async (route) => {
    const method = route.request().method()
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            { id: '1', name: '服务器', code: 'server', icon: 'desktop', description: '物理/虚拟服务器', isActive: true, sortOrder: 1, createdAt: '2024-01-01 00:00', updatedAt: '2024-01-01 00:00' },
            { id: '2', name: '数据库', code: 'database', icon: 'database', description: '数据库实例', isActive: true, sortOrder: 2, createdAt: '2024-01-01 00:00', updatedAt: '2024-01-01 00:00' },
            { id: '3', name: '中间件', code: 'middleware', icon: 'cloud', description: '中间件服务', isActive: true, sortOrder: 3, createdAt: '2024-01-01 00:00', updatedAt: '2024-01-01 00:00' },
          ],
        }),
      })
      return
    }
    if (method === 'POST') {
      const body = JSON.parse(route.request().postData() || '{}')
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { id: 'new-' + Date.now(), ...body, isActive: true, createdAt: new Date().toISOString() },
        }),
      })
      return
    }
    await route.continue()
  })

  await page.route(/\/api\/ci-types\/\w+/, async (route) => {
    const method = route.request().method()
    if (method === 'PUT' || method === 'DELETE') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { deleted: method === 'DELETE' } }),
      })
      return
    }
    await route.continue()
  })
}

// 通用的 Notifications Mock 设置
export const setupNotificationsMocks = async (page: Page) => {
  if (isFullMode()) return

  await page.route('**/api/notifications', async (route) => {
    const method = route.request().method()
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            items: [
              { id: '1', userId: '1', type: 'change_pending', title: '待审批变更', content: '您有一个待审批的变更请求', isRead: false, createdAt: '2024-01-15 10:30' },
              { id: '2', userId: '1', type: 'ci_updated', title: '配置项更新', content: 'DB-主库-01 已更新', isRead: true, createdAt: '2024-01-15 09:00' },
              { id: '3', userId: '1', type: 'change_approved', title: '变更已批准', content: '您的变更请求已批准', isRead: true, createdAt: '2024-01-14 16:00' },
            ],
            total: 3,
          },
        }),
      })
      return
    }
    if (method === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { marked: true } }),
      })
      return
    }
    if (method === 'DELETE') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { deleted: true } }),
      })
      return
    }
    await route.continue()
  })

  await page.route('**/api/notifications/unread-count', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: { unread_count: 1 },
      }),
    })
  })

  await page.route(/\/api\/notifications\/\w+\/read/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { marked: true } }),
    })
  })
}

// 通用的 Audit Mock 设置
export const setupAuditMocks = async (page: Page) => {
  if (isFullMode()) return

  await page.route('**/api/audit*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          items: [
            { id: '1', action: 'create', resourceType: 'ci', resourceName: 'DB-主库-01', username: 'admin', createdAt: '2024-01-15 10:30' },
            { id: '2', action: 'update', resourceType: 'ci', resourceName: 'APP-订单服务', username: 'admin', createdAt: '2024-01-15 09:15' },
          ],
          total: 2,
        },
      }),
    })
  })
}

// 设置所有常用的 Mock 路由（认证 + Dashboard + Tags + CI Types + Notifications）
export const setupCommonMocks = async (page: Page) => {
  await setupAuthMocks(page)
  await setupDashboardMocks(page)
  await setupTagsMocks(page)
  await setupCITypesMocks(page)
  await setupNotificationsMocks(page)
  await setupAuditMocks(page)
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
