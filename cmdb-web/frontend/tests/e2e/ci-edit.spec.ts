import { test, expect } from '@playwright/test'
import { isMockMode, isFullMode, setupFallbackMocks } from './setup/test-config'
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

  // Full 模式下通过 API 创建的测试 CI
  let fullModeTestCI: { id: string; name: string } | null = null

  // 获取当前模式的测试 CI 数据
  const getTestCI = () => {
    if (isFullMode() && fullModeTestCI) {
      return fullModeTestCI
    }
    return mockCI
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

    loginPage = new LoginPage(page)
    ciDetailPage = new CIDetailPage(page)
    ciEditPage = new CIEditPage(page)

    // Full 模式：登录 + 设置 fallback mocks + 创建测试 CI
    if (isFullMode()) {
      await setupFallbackMocks(page)
      await loginPage.goto()
      await loginPage.login('admin', 'admin123')
      await loginPage.waitForLoginSuccess()

      // 通过真实 API 创建一个临时 CI 用于编辑测试
      const token = await page.evaluate(() => {
        const stored = localStorage.getItem('cmdb-user-storage')
        if (stored) {
          const parsed = JSON.parse(stored)
          return parsed.state?.token
        }
        return null
      })

      const ciName = '编辑测试服务器-' + Date.now()
      const apiResponse = await page.request.post('http://127.0.0.1:8000/api/ci', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        data: {
          name: ciName,
          type: 'server',
          ip: '192.168.1.100',
          project: '测试项目',
          environment: 'production',
        },
      })
      const apiData = await apiResponse.json()
      fullModeTestCI = { id: apiData.data.id, name: ciName }
      console.log(`Full 模式：创建测试 CI, id=${fullModeTestCI.id}`)
      return
    }

    // Mock 模式：设置拦截器
    if (!isMockMode()) return

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
    const testCI = getTestCI()
    // 进入详情页
    await ciDetailPage.goto(testCI.id)
    await ciDetailPage.expectDetailVisible()

    // 点击编辑按钮
    await ciDetailPage.clickEditButton()

    // 验证编辑表单可见且预填充
    await ciEditPage.expectFormVisible()
    await ciEditPage.expectFormPrefilled({ name: testCI.name, type: isFullMode() ? '服务器' : testCI.typeLabel })

    // 修改名称
    const newName = '编辑后名称-' + Date.now()
    await ciEditPage.fillForm({ name: newName })
    await ciEditPage.submit()

    // 验证编辑成功，返回详情页
    await ciEditPage.expectEditSuccess()
    await ciDetailPage.expectDetailVisible()
    await ciDetailPage.expectCIDataVisible({ name: newName })
  })

  test('CI-012: 编辑多个字段', async () => {
    const testCI = getTestCI()
    await ciDetailPage.goto(testCI.id)
    await ciDetailPage.expectDetailVisible()

    // 点击编辑按钮
    await ciDetailPage.clickEditButton()
    await ciEditPage.expectFormVisible()

    // 修改多个字段
    const updatedData = {
      name: '多字段编辑-' + Date.now(),
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
    const testCI = getTestCI()
    await ciDetailPage.goto(testCI.id)
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
    const testCI = getTestCI()
    await ciDetailPage.goto(testCI.id)
    await ciDetailPage.expectDetailVisible()

    // 记录当前页面上显示的 CI 名称（full 模式下可能已被前面的测试修改）
    const currentName = await ciDetailPage.page.locator('[data-testid="ci-detail-name"]').textContent() || testCI.name

    // 点击编辑按钮
    await ciDetailPage.clickEditButton()
    await ciEditPage.expectFormVisible()

    // 修改表单但不提交
    await ciEditPage.fillForm({ name: '临时修改名称' })

    // 取消编辑
    await ciEditPage.cancel()

    // 验证返回详情页，数据未变更
    await ciEditPage.expectCancelSuccess(testCI.id)
    await ciDetailPage.expectCIDataVisible({ name: currentName })
  })

  test('CI-015: 验证必填字段在编辑时仍然有效', async () => {
    const testCI = getTestCI()
    await ciDetailPage.goto(testCI.id)
    await ciDetailPage.clickEditButton()
    await ciEditPage.expectFormVisible()

    // 清空名称字段
    await ciEditPage.page.fill('[data-testid="input-ci-name"]', '')
    await ciEditPage.submit()

    // 验证错误提示
    await expect(ciEditPage.page.locator('.ant-form-item-explain-error')).toContainText('请输入配置项名称')
  })
})
