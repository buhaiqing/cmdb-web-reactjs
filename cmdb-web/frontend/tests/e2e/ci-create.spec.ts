import { test, expect } from '@playwright/test'
import { isMockMode, isFullMode, setupCommonMocks, setupFallbackMocks } from './setup/test-config'
import { LoginPage } from './pages/LoginPage'
import { CICreatePage } from './pages/CICreatePage'
import { CIListPage } from './pages/CIListPage'

test.describe('配置项创建测试', () => {
  let loginPage: LoginPage
  let ciCreatePage: CICreatePage
  let ciListPage: CIListPage

  test.beforeEach(async ({ page }) => {
    // 初始化页面对象
    loginPage = new LoginPage(page)
    ciCreatePage = new CICreatePage(page)
    ciListPage = new CIListPage(page)

    // 只在 mock 模式下设置拦截器
    if (isMockMode()) {
      // 设置通用的 Mock 路由（认证 + Dashboard）
      await setupCommonMocks(page)

      // 统一设置所有 API 请求的 Mock 处理
      await page.route('**/api/**', async (route) => {
        const url = route.request().url()
        const method = route.request().method()
        console.log('拦截到 API 请求:', url, method)
        
        // 处理认证请求
        if (url.includes('/api/auth/')) {
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
          console.log('处理认证请求成功')
          return
        }

        // 处理 CI 请求
        if (url.includes('/api/ci')) {
          if (method === 'POST') {
            const requestBody = JSON.parse(route.request().postData() || '{}')
            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({
                success: true,
                data: {
                  id: 'new-ci-' + Date.now(),
                  ...requestBody,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  status: 'active',
                },
              }),
            })
            console.log('处理 POST /api/ci 请求成功')
          } else if (method === 'GET') {
            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({
                success: true,
                data: {
                  items: [],
                  total: 0,
                },
              }),
            })
            console.log('处理 GET /api/ci 请求成功')
          } else {
            // 其他方法的处理
            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({
                success: true,
                data: null,
              }),
            })
            console.log('处理其他 CI 请求成功')
          }
          return
        }

        // 处理 Dashboard 请求
        if (url.includes('/api/dashboard/')) {
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
          console.log('处理 Dashboard 请求成功')
          return
        }

        // 处理 Changes 请求
        if (url.includes('/api/changes/')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: [],
            }),
          })
          console.log('处理 Changes 请求成功')
          return
        }

        // 其他请求继续
        console.log('继续处理其他请求:', url)
        await route.continue()
      })
    } else if (isFullMode()) {
      // 在 full 模式下设置 fallback mocks
      await setupFallbackMocks(page)
    }

    // 无论是否是 mock 模式，都执行登录操作
    await loginPage.goto()
    await loginPage.login('admin', 'admin123')
    await loginPage.waitForLoginSuccess()
  })

  test('CI-001: 创建配置项表单可见性', async () => {
    await ciCreatePage.goto()
    await ciCreatePage.expectFormVisible()
  })

  test('CI-002: 填写表单并提交创建配置项', async () => {
    await ciCreatePage.goto()
    await ciCreatePage.expectFormVisible()

    const testData = {
      name: '测试服务器-' + Date.now(),
      type: '服务器',
      ip: '192.168.1.100',
      project: '测试项目',
      environment: '生产环境'
    }

    await ciCreatePage.fillForm(testData)
    await ciCreatePage.submit()
    await ciCreatePage.expectCreateSuccess()
  })

  test('CI-003: 验证必填字段', async () => {
    await ciCreatePage.goto()
    await ciCreatePage.expectFormVisible()

    // 不填写任何字段直接提交
    await ciCreatePage.submit()

    // 验证错误提示
    await expect(ciCreatePage.page.locator('.ant-form-item-explain-error').first()).toBeVisible()
  })

  test('CI-004: 取消创建操作', async () => {
    await ciCreatePage.goto()
    await ciCreatePage.expectFormVisible()

    // 填写部分数据
    await ciCreatePage.fillForm({
      name: '临时测试服务器',
      type: '服务器'
    })

    // 点击取消
    await ciCreatePage.cancel()

    // 验证返回列表页
    await ciListPage.expectCIListVisible()
  })

  test('CI-005: 创建成功后跳转到列表页', async () => {
    await ciCreatePage.goto()
    await ciCreatePage.expectFormVisible()

    await ciCreatePage.fillForm({
      name: '测试跳转服务器-' + Date.now(),
      type: '服务器',
      ip: '192.168.1.200',
      project: '测试项目',
      environment: '开发环境'
    })

    await ciCreatePage.submit()
    await ciCreatePage.expectCreateSuccess()
    await ciListPage.expectCIListVisible()
  })
})
