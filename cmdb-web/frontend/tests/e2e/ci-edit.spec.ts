import { test, expect } from '@playwright/test'
import { isMockMode } from './setup/test-config'
import { LoginPage } from './pages/LoginPage'
import { CIDetailPage } from './pages/CIDetailPage'
import { CIEditPage } from './pages/CIEditPage'

test.describe('配置项编辑测试', () => {
  let loginPage: LoginPage
  let ciDetailPage: CIDetailPage
  let ciEditPage: CIEditPage

  // 使用可变对象，使编辑后的数据可以被记住
  let mockCI = {
    id: 'ci-001',
    name: '测试服务器-01',
    type: 'server',
    typeLabel: '服务器',
    status: 'running',
    ip: '192.168.1.100',
    cpu: '8 核',
    memory: '16GB',
    disk: '500GB',
    os: 'Ubuntu 20.04',
    project: '测试项目',
    environment: 'development',
    description: '原始描述信息',
  }

  test.beforeEach(async ({ page }) => {
    // 重置 mockCI 数据
    mockCI = {
      id: 'ci-001',
      name: '测试服务器-01',
      type: 'server',
      typeLabel: '服务器',
      status: 'running',
      ip: '192.168.1.100',
      cpu: '8 核',
      memory: '16GB',
      disk: '500GB',
      os: 'Ubuntu 20.04',
      project: '测试项目',
      environment: 'development',
      description: '原始描述信息',
    }
    // 只在 mock 模式下设置拦截器
    if (!isMockMode()) {
      loginPage = new LoginPage(page)
      ciDetailPage = new CIDetailPage(page)
      ciEditPage = new CIEditPage(page)
      return
    }

    await page.route('**/api/**', async (route) => {
      const url = route.request().url()

      if (url.includes('/api/auth/login')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              token: 'mock-jwt-token',
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

      if (url.includes(`/api/ci/${mockCI.id}`) && route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: mockCI,
          }),
        })
        return
      }

      if (url.includes(`/api/ci/${mockCI.id}`) && route.request().method() === 'PUT') {
        const requestBody = JSON.parse(route.request().postData() || '{}')
        // 更新 mockCI 对象，使编辑后的数据被记住
        Object.assign(mockCI, requestBody)
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: mockCI,
          }),
        })
        return
      }

      await route.continue()
    })

    loginPage = new LoginPage(page)
    ciDetailPage = new CIDetailPage(page)
    ciEditPage = new CIEditPage(page)

    await loginPage.goto()
    await loginPage.login('admin', 'admin123')
    await loginPage.waitForLoginSuccess()
  })

  test('CI-011: 编辑现有配置项名称', async () => {
    // 进入详情页
    await ciDetailPage.goto(mockCI.id)
    await ciDetailPage.expectDetailVisible()

    // 点击编辑按钮
    await ciDetailPage.clickEditButton()

    // 验证编辑表单可见且预填充
    await ciEditPage.expectFormVisible()
    await ciEditPage.expectFormPrefilled({ name: mockCI.name, type: mockCI.typeLabel })

    // 修改名称
    const newName = '测试服务器-01-已编辑'
    await ciEditPage.fillForm({ name: newName })
    await ciEditPage.submit()

    // 验证编辑成功，返回详情页
    await ciEditPage.expectEditSuccess()
    await ciDetailPage.expectDetailVisible()
    await ciDetailPage.expectCIDataVisible({ name: newName })
  })

  test('CI-012: 编辑多个字段', async () => {
    await ciDetailPage.goto(mockCI.id)
    await ciDetailPage.expectDetailVisible()

    // 点击编辑按钮
    await ciDetailPage.clickEditButton()
    await ciEditPage.expectFormVisible()

    // 修改多个字段
    const updatedData = {
      name: '测试服务器-多字段编辑',
      ip: '192.168.2.200',
      project: '更新后的项目',
      description: '更新后的描述信息'
    }

    await ciEditPage.fillForm(updatedData)
    await ciEditPage.submit()

    // 验证编辑成功
    await ciEditPage.expectEditSuccess()
    await ciDetailPage.expectDetailVisible()
    await ciDetailPage.expectCIDataVisible({
      name: updatedData.name,
      ip: updatedData.ip
    })
  })

  test('CI-013: 编辑后验证数据', async () => {
    await ciDetailPage.goto(mockCI.id)
    await ciDetailPage.clickEditButton()
    await ciEditPage.expectFormVisible()

    const newName = '验证编辑数据-' + Date.now()
    await ciEditPage.fillForm({ name: newName })
    await ciEditPage.submit()

    // 验证返回详情页并显示更新后的数据
    await ciDetailPage.expectDetailVisible()
    await ciDetailPage.expectCIDataVisible({ name: newName })
  })

  test('CI-014: 取消编辑操作', async () => {
    await ciDetailPage.goto(mockCI.id)
    await ciDetailPage.expectDetailVisible()

    // 点击编辑按钮
    await ciDetailPage.clickEditButton()
    await ciEditPage.expectFormVisible()

    // 修改表单但不提交
    await ciEditPage.fillForm({ name: '临时修改名称' })

    // 取消编辑
    await ciEditPage.cancel()

    // 验证返回详情页，数据未变更
    await ciEditPage.expectCancelSuccess(mockCI.id)
    await ciDetailPage.expectCIDataVisible({ name: mockCI.name })
  })

  test('CI-015: 验证必填字段在编辑时仍然有效', async () => {
    await ciDetailPage.goto(mockCI.id)
    await ciDetailPage.clickEditButton()
    await ciEditPage.expectFormVisible()

    // 清空名称字段
    await ciEditPage.page.fill('[data-testid="input-ci-name"]', '')
    await ciEditPage.submit()

    // 验证错误提示
    await expect(ciEditPage.page.locator('.ant-form-item-explain-error')).toContainText('请输入配置项名称')
  })
})
