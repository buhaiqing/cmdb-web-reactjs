import { test, expect } from '@playwright/test'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { CIListPage } from './pages/CIListPage'
import { CICreatePage } from './pages/CICreatePage'
import { CIDetailPage } from './pages/CIDetailPage'
import { CIEditPage } from './pages/CIEditPage'
import { ChangeRequestPage } from './pages/ChangeRequestPage'
import { AppLayout } from './pages/AppLayout'
import { isMockMode } from './setup/test-config'

test.describe('CMDB 端到端测试', () => {
  let loginPage: LoginPage
  let dashboardPage: DashboardPage
  let ciListPage: CIListPage
  let ciCreatePage: CICreatePage
  let ciDetailPage: CIDetailPage
  let ciEditPage: CIEditPage
  let changeRequestPage: ChangeRequestPage
  let appLayout: AppLayout

  test.beforeEach(async ({ page }) => {
    // 只在 mock 模式下设置拦截器
    if (!isMockMode()) {
      // full 模式：初始化页面对象
      loginPage = new LoginPage(page)
      dashboardPage = new DashboardPage(page)
      ciListPage = new CIListPage(page)
      ciCreatePage = new CICreatePage(page)
      ciDetailPage = new CIDetailPage(page)
      ciEditPage = new CIEditPage(page)
      changeRequestPage = new ChangeRequestPage(page)
      appLayout = new AppLayout(page)
      return
    }

    // mock 模式：设置 API 拦截
    await page.route('**/api/**', async (route) => {
      const url = route.request().url()

      if (url.includes('/api/auth/login')) {
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
        return
      }

      if (url.includes('/api/auth/me')) {
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
        return
      }

      // CI 列表 API
      if (url.includes('/api/ci') && route.request().method() === 'GET' && !url.includes('/api/ci/')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              items: [
                {
                  id: '1',
                  name: 'DB-主库-01',
                  type: 'database',
                  status: 'running',
                  ip: '10.0.1.101',
                  cpu: '16核',
                  memory: '64GB',
                  disk: '500GB SSD',
                  os: 'CentOS 7.9',
                  project: '订单系统',
                  environment: 'production',
                  createdAt: '2024-01-10 10:00',
                  updatedAt: '2024-01-15 10:00',
                },
                {
                  id: '2',
                  name: 'APP-订单服务',
                  type: 'application',
                  status: 'running',
                  ip: '10.0.1.102',
                  project: '订单系统',
                  environment: 'production',
                  createdAt: '2024-01-09 09:00',
                  updatedAt: '2024-01-14 16:00',
                },
                {
                  id: '3',
                  name: 'K8S-Node-01',
                  type: 'container',
                  status: 'running',
                  ip: '10.0.2.1',
                  project: '基础设施',
                  environment: 'production',
                  createdAt: '2024-01-08 08:00',
                  updatedAt: '2024-01-13 12:00',
                },
              ],
              total: 3,
            },
          }),
        })
        return
      }

      // CI 详情 API
      const ciDetailMatch = url.match(/\/api\/ci\/([^/]+)$/)
      if (ciDetailMatch && route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: ciDetailMatch[1],
              name: 'DB-主库-01',
              type: 'database',
              status: 'running',
              ip: '10.0.1.101',
              cpu: '16核',
              memory: '64GB',
              disk: '500GB SSD',
              os: 'CentOS 7.9',
              project: '订单系统',
              environment: 'production',
              createdAt: '2024-01-10 10:00:00',
              updatedAt: '2024-01-15 10:00:00',
            },
          }),
        })
        return
      }

      // 创建 CI API
      if (url.includes('/api/ci') && route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'new-ci-' + Date.now(),
              name: '新服务器',
              type: 'server',
              status: 'running',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          }),
        })
        return
      }

      // 更新 CI API
      if (ciDetailMatch && route.request().method() === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: ciDetailMatch[1],
              name: 'DB-主库-01-已编辑',
              type: 'database',
              status: 'running',
              updatedAt: new Date().toISOString(),
            },
          }),
        })
        return
      }

      // 删除 CI API
      if (ciDetailMatch && route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { deleted: true },
          }),
        })
        return
      }

      // 变更列表 API
      if (url.includes('/api/change') && route.request().method() === 'GET' && !url.match(/\/api\/change\/[^/]+/)) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              items: [
                {
                  id: '1',
                  ciName: 'DB-主库-01',
                  changeType: '更新配置',
                  description: '修改最大连接数',
                  operator: 'admin',
                  status: 'pending',
                  createdAt: '2024-01-15 10:30',
                },
                {
                  id: '2',
                  ciName: 'APP-订单服务',
                  changeType: '重启服务',
                  description: '重启应用服务',
                  operator: 'admin',
                  status: 'approved',
                  createdAt: '2024-01-15 09:15',
                  approvedBy: 'admin',
                },
                {
                  id: '3',
                  ciName: 'K8S-集群-01',
                  changeType: '扩缩容',
                  description: '扩容2个节点',
                  operator: 'admin',
                  status: 'completed',
                  createdAt: '2024-01-14 14:00',
                  approvedBy: 'admin',
                },
              ],
              total: 3,
            },
          }),
        })
        return
      }

      // 创建变更请求 API
      if (url.includes('/api/change') && route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'new-change-' + Date.now(),
              title: '新变更请求',
              status: 'pending',
              createdAt: new Date().toISOString(),
            },
          }),
        })
        return
      }

      // 变更详情 API
      const changeDetailMatch = url.match(/\/api\/change\/([^/]+)$/)
      if (changeDetailMatch && route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: changeDetailMatch[1],
              title: '测试变更请求',
              ciId: '1',
              ciName: 'DB-主库-01',
              changeType: '更新配置',
              description: '测试变更描述',
              status: 'pending',
              operator: 'admin',
              createdAt: '2024-01-15 10:30',
            },
          }),
        })
        return
      }

      // 批准变更 API
      if (changeDetailMatch && url.includes('/approve') && route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { approved: true },
          }),
        })
        return
      }

      // 拒绝变更 API
      if (changeDetailMatch && url.includes('/reject') && route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { rejected: true },
          }),
        })
        return
      }

      await route.continue()
    })

    loginPage = new LoginPage(page)
    dashboardPage = new DashboardPage(page)
    ciListPage = new CIListPage(page)
    ciCreatePage = new CICreatePage(page)
    ciDetailPage = new CIDetailPage(page)
    ciEditPage = new CIEditPage(page)
    changeRequestPage = new ChangeRequestPage(page)
    appLayout = new AppLayout(page)
  })

  test('登录 - 使用有效凭证成功登录', async ({ page }) => {
    await loginPage.goto()
    await loginPage.expectLoginFormVisible()
    await loginPage.login('admin', 'admin123')
    await loginPage.waitForLoginSuccess()
    await appLayout.expectUserLoggedIn('admin')
  })

  test('仪表盘 - 登录后成功加载', async ({ page }) => {
    await loginPage.goto()
    await loginPage.login('admin', 'admin123')
    await loginPage.waitForLoginSuccess()

    await dashboardPage.goto()
    await dashboardPage.expectDashboardVisible()
  })

  test('配置项管理 - 查看配置项列表', async ({ page }) => {
    await loginPage.goto()
    await loginPage.login('admin', 'admin123')
    await loginPage.waitForLoginSuccess()

    await ciListPage.goto()
    await ciListPage.expectCIListVisible()
  })

  test('导航 - 从仪表盘到配置项列表', async ({ page }) => {
    await loginPage.goto()
    await loginPage.login('admin', 'admin123')
    await loginPage.waitForLoginSuccess()

    await page.goto('/ci/list')
    await ciListPage.expectCIListVisible()
  })

  test('系统管理 - 用户列表页面', async ({ page }) => {
    await loginPage.goto()
    await loginPage.login('admin', 'admin123')
    await loginPage.waitForLoginSuccess()
    await page.waitForSelector('[data-testid="layout-app"]', { timeout: 10000 })

    await page.goto('/system/user')
    await page.waitForURL('**/system/user', { timeout: 10000 })

    await expect(page.locator('[data-testid="page-user-manage"]')).toBeVisible({ timeout: 15000 })
    await expect(page.locator('[data-testid="table-user-list"]')).toBeVisible({ timeout: 10000 })
  })

  test('系统管理 - 角色列表页面', async ({ page }) => {
    await loginPage.goto()
    await loginPage.login('admin', 'admin123')
    await loginPage.waitForLoginSuccess()
    await page.waitForSelector('[data-testid="layout-app"]', { timeout: 10000 })

    await page.goto('/system/role')
    await page.waitForURL('**/system/role', { timeout: 10000 })

    await expect(page.locator('[data-testid="page-role-manage"]')).toBeVisible({ timeout: 15000 })
    await expect(page.locator('[data-testid="table-role-list"]')).toBeVisible({ timeout: 10000 })
  })

  test('系统管理 - 审计日志页面', async ({ page }) => {
    await loginPage.goto()
    await loginPage.login('admin', 'admin123')
    await loginPage.waitForLoginSuccess()
    await page.waitForSelector('[data-testid="layout-app"]', { timeout: 10000 })

    await page.goto('/system/audit')
    await page.waitForURL('**/system/audit', { timeout: 10000 })

    await expect(page.locator('[data-testid="page-audit-log"]')).toBeVisible({ timeout: 15000 })
    await expect(page.locator('[data-testid="table-audit-list"]')).toBeVisible({ timeout: 10000 })
  })

  test('配置项管理 - 创建配置项', async ({ page }) => {
    await loginPage.goto()
    await loginPage.login('admin', 'admin123')
    await loginPage.waitForLoginSuccess()

    await ciCreatePage.goto()
    await ciCreatePage.expectFormVisible()
    await ciCreatePage.fillForm({
      name: '测试服务器-02',
      type: '服务器',
      ip: '192.168.1.101',
      project: '测试项目',
      environment: '生产环境'
    })
    await ciCreatePage.submit()
    await ciCreatePage.expectCreateSuccess()
  })

  test('配置项管理 - 搜索配置项', async ({ page }) => {
    await loginPage.goto()
    await loginPage.login('admin', 'admin123')
    await loginPage.waitForLoginSuccess()

    await ciListPage.goto()
    await ciListPage.searchCI('测试')
    await ciListPage.expectSearchResults()
  })

  test('配置项管理 - 从列表导航到创建页面', async ({ page }) => {
    await loginPage.goto()
    await loginPage.login('admin', 'admin123')
    await loginPage.waitForLoginSuccess()

    await ciListPage.goto()
    await ciListPage.clickCreateButton()
    await page.waitForURL('**/ci/create', { timeout: 10000 })
    await ciCreatePage.expectFormVisible()
  })

  test('变更管理 - 查看变更请求列表', async ({ page }) => {
    await loginPage.goto()
    await loginPage.login('admin', 'admin123')
    await loginPage.waitForLoginSuccess()
    await page.waitForSelector('[data-testid="layout-app"]', { timeout: 10000 })

    await page.goto('/change/list')
    await page.waitForURL('**/change/list', { timeout: 10000 })

    await expect(page.locator('[data-testid="page-change-list"]')).toBeVisible({ timeout: 15000 })
  })

  test('配置项管理 - 配置项详情测试', async ({ page }) => {
    await loginPage.goto()
    await loginPage.login('admin', 'admin123')
    await loginPage.waitForLoginSuccess()

    await ciDetailPage.goto('1')
    await ciDetailPage.expectDetailVisible()
    await ciDetailPage.expectRelationsVisible()
  })

  test('配置项管理 - 编辑配置项', async ({ page }) => {
    await loginPage.goto()
    await loginPage.login('admin', 'admin123')
    await loginPage.waitForLoginSuccess()

    await ciDetailPage.goto('1')
    await ciDetailPage.clickEditButton()
    await ciEditPage.expectFormVisible()
    await ciEditPage.fillForm({ name: '测试服务器-01-编辑' })
    await ciEditPage.submit()
    await ciEditPage.expectEditSuccess()
  })

  test('配置项管理 - 删除配置项', async ({ page }) => {
    await loginPage.goto()
    await loginPage.login('admin', 'admin123')
    await loginPage.waitForLoginSuccess()

    await ciDetailPage.goto('1')
    await ciDetailPage.clickDeleteButtonAndConfirm()
    await ciDetailPage.expectDeleteSuccess()
  })

  test('变更管理 - 创建变更请求', async ({ page }) => {
    await loginPage.goto()
    await loginPage.login('admin', 'admin123')
    await loginPage.waitForLoginSuccess()

    await changeRequestPage.gotoCreate()
    await changeRequestPage.expectCreateFormVisible()
    await changeRequestPage.fillCreateForm({
      title: '测试变更请求',
      ciId: '1',
      changeType: '更新配置',
      description: '测试变更请求描述'
    })
    await changeRequestPage.submitCreate()
    await changeRequestPage.expectCreateSuccess()
  })

  test('变更管理 - 查看变更请求详情', async ({ page }) => {
    await loginPage.goto()
    await loginPage.login('admin', 'admin123')
    await loginPage.waitForLoginSuccess()

    await changeRequestPage.gotoDetail('1')
    await changeRequestPage.expectDetailVisible()
  })

  test('权限控制测试 - 使用普通用户登录', async ({ page }) => {
    // 只在 mock 模式下设置普通用户 mock
    if (isMockMode()) {
      await page.route('**/api/auth/login', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              token: 'mock-user-token',
              user: {
                id: '2',
                username: 'user',
                email: 'user@example.com',
                role: 'user',
                permissions: ['read'],
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
              id: '2',
              username: 'user',
              email: 'user@example.com',
              role: 'user',
              permissions: ['read'],
            },
          }),
        })
      })
    }

    await loginPage.goto()
    await loginPage.login('user', 'user123')
    await loginPage.waitForLoginSuccess()
    await appLayout.expectUserLoggedIn('user')
  })
})
