import { test, expect } from '@playwright/test'
import { LoginPage } from './pages/LoginPage'
import { RelationGraphPage } from './pages/RelationGraphPage'
import { isMockMode } from './setup/test-config'

test.describe('关系管理测试', () => {
  let loginPage: LoginPage
  let relationGraphPage: RelationGraphPage

  test.beforeEach(async ({ page }) => {
    if (!isMockMode()) {
      loginPage = new LoginPage(page)
      relationGraphPage = new RelationGraphPage(page)
      return
    }

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

    await page.route('**/api/relations/graph**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            nodes: [
              { id: 'ci-001', name: '应用服务器-01', type: 'server', status: 'running', ip: '10.0.1.101' },
              { id: 'ci-002', name: 'MySQL主库', type: 'database', status: 'running', ip: '10.0.1.102' },
              { id: 'ci-003', name: '负载均衡器', type: 'loadbalancer', status: 'running', ip: '10.0.1.103' },
              { id: 'ci-004', name: '容器实例-01', type: 'container', status: 'running', ip: '10.0.1.104' },
              { id: 'ci-005', name: '物理主机-01', type: 'host', status: 'running', ip: '10.0.1.105' },
            ],
            edges: [
              { id: 'rel-001', source: 'ci-001', target: 'ci-002', relationType: 'depends_on', description: '应用服务依赖数据库' },
              { id: 'rel-002', source: 'ci-003', target: 'ci-001', relationType: 'connected_to', description: '负载均衡连接应用服务' },
              { id: 'rel-003', source: 'ci-004', target: 'ci-005', relationType: 'runs_on', description: '容器运行在主机上' },
            ],
          },
        }),
      })
    })

    await page.route('**/api/relations**', async (route) => {
      const url = route.request().url()
      const method = route.request().method()

      if (method === 'GET' && url.match(/\/api\/relations\/impact\//)) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              upstream: [
                { id: 'ci-003', name: '负载均衡器', type: 'loadbalancer', status: 'running' },
              ],
              downstream: [
                { id: 'ci-002', name: 'MySQL主库', type: 'database', status: 'running' },
              ],
              directRelations: [
                {
                  id: 'rel-001',
                  sourceCI: 'ci-001',
                  targetCI: 'ci-002',
                  relationType: 'depends_on',
                  description: '应用服务依赖数据库',
                },
                {
                  id: 'rel-002',
                  sourceCI: 'ci-003',
                  targetCI: 'ci-001',
                  relationType: 'connected_to',
                  description: '负载均衡连接应用服务',
                },
              ],
            },
          }),
        })
        return
      }

      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: 'rel-001',
                sourceCI: 'ci-001',
                targetCI: 'ci-002',
                relationType: 'depends_on',
                description: '应用服务依赖数据库',
                createdAt: '2024-01-15 08:00:00',
                updatedAt: '2024-01-15 08:00:00',
              },
              {
                id: 'rel-002',
                sourceCI: 'ci-003',
                targetCI: 'ci-001',
                relationType: 'connected_to',
                description: '负载均衡连接应用服务',
                createdAt: '2024-01-16 10:30:00',
                updatedAt: '2024-01-16 10:30:00',
              },
            ],
          }),
        })
        return
      }

      if (method === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: '关系创建成功',
            data: { id: 'rel-new-' + Date.now() },
          }),
        })
        return
      }

      if (method === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: '关系删除成功',
          }),
        })
        return
      }

      await route.continue()
    })

    await page.route('**/api/dashboard/stats', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            totalCIs: 156,
            activeCIs: 142,
            pendingChanges: 8,
            completedChanges: 23,
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
            { id: '1', title: '数据库配置优化', status: 'pending', createdAt: '2024-01-15 10:30' },
          ],
        }),
      })
    })

    loginPage = new LoginPage(page)
    relationGraphPage = new RelationGraphPage(page)
  })

  test('REL-001: 查看关系图谱', async ({ page }) => {
    await loginPage.goto()
    await loginPage.login('admin', 'admin123')
    await loginPage.waitForLoginSuccess()

    await relationGraphPage.goto()
    await relationGraphPage.expectGraphVisible()
  })

  test('REL-002: 验证节点和边显示', async ({ page }) => {
    await loginPage.goto()
    await loginPage.login('admin', 'admin123')
    await loginPage.waitForLoginSuccess()

    await relationGraphPage.goto()
    await relationGraphPage.expectGraphVisible()
    
    // 等待节点数据加载并验证图谱容器存在
    await page.waitForTimeout(2000)
    const graphContainer = await page.locator('[data-testid="relation-graph"]')
    await expect(graphContainer).toBeVisible()
  })

  test('REL-003: 点击节点查看详情', async ({ page }) => {
    await loginPage.goto()
    await loginPage.login('admin', 'admin123')
    await loginPage.waitForLoginSuccess()

    await relationGraphPage.goto()
    await relationGraphPage.expectGraphVisible()
    await relationGraphPage.clickNode('ci-001')
    await relationGraphPage.expectNodeSelected('ci-001')
  })

  test('REL-004: 影响分析功能', async ({ page }) => {
    await loginPage.goto()
    await loginPage.login('admin', 'admin123')
    await loginPage.waitForLoginSuccess()

    await relationGraphPage.goto()
    await relationGraphPage.expectGraphVisible()
    await relationGraphPage.clickNode('ci-001')
    await relationGraphPage.expectImpactAnalysisVisible()

    const upstreamNodes = await relationGraphPage.getUpstreamNodes()
    expect(upstreamNodes.length).toBeGreaterThan(0)

    const downstreamNodes = await relationGraphPage.getDownstreamNodes()
    expect(downstreamNodes.length).toBeGreaterThan(0)
  })

  test('REL-005: 缩放和重置视图', async ({ page }) => {
    await loginPage.goto()
    await loginPage.login('admin', 'admin123')
    await loginPage.waitForLoginSuccess()

    await relationGraphPage.goto()
    await relationGraphPage.expectGraphVisible()

    await relationGraphPage.zoomIn()
    await relationGraphPage.zoomOut()
    await relationGraphPage.resetView()
  })

  test('REL-006: 全屏模式切换', async ({ page }) => {
    await loginPage.goto()
    await loginPage.login('admin', 'admin123')
    await loginPage.waitForLoginSuccess()

    await relationGraphPage.goto()
    await relationGraphPage.expectGraphVisible()

    await relationGraphPage.toggleFullscreen()
    await relationGraphPage.toggleFullscreen()
  })

  test('REL-007: 创建新关系', async ({ page }) => {
    await loginPage.goto()
    await loginPage.login('admin', 'admin123')
    await loginPage.waitForLoginSuccess()

    await relationGraphPage.goto()
    await relationGraphPage.expectGraphVisible()

    await relationGraphPage.createRelation('ci-001', 'ci-004', 'depends_on')
  })

  test('REL-008: 删除关系', async ({ page }) => {
    await loginPage.goto()
    await loginPage.login('admin', 'admin123')
    await loginPage.waitForLoginSuccess()

    await relationGraphPage.goto()
    await relationGraphPage.expectGraphVisible()

    await relationGraphPage.deleteRelation('rel-001')
  })

  test('REL-009: 搜索节点', async ({ page }) => {
    await loginPage.goto()
    await loginPage.login('admin', 'admin123')
    await loginPage.waitForLoginSuccess()

    await relationGraphPage.goto()
    await relationGraphPage.expectGraphVisible()

    await relationGraphPage.searchNode('MySQL')
  })

  test('REL-010: 按类型筛选节点', async ({ page }) => {
    await loginPage.goto()
    await loginPage.login('admin', 'admin123')
    await loginPage.waitForLoginSuccess()

    await relationGraphPage.goto()
    await relationGraphPage.expectGraphVisible()

    await relationGraphPage.filterByCIType('数据库')
  })
})