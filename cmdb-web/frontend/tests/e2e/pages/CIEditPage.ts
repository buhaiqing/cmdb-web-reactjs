import { expect, Page } from '@playwright/test'

export class CIEditPage {
  constructor(private page: Page) {}

  async goto(id: string) {
    console.log(`[CIEditPage.goto] 导航到编辑页，id=${id}`)
    await this.page.goto(`/ci/${id}/edit`, { timeout: 30000, waitUntil: 'domcontentloaded' })
    console.log(`[CIEditPage.goto] ✓ 导航完成，URL: ${this.page.url()}`)
    // 等待 Zustand hydration 完成 - 检查主内容区域可见
    await this.page.waitForSelector('[data-testid="content-main"]', { timeout: 15000, state: 'visible' })
    console.log(`[CIEditPage.goto] ✓ 应用布局加载完成（Zustand hydration 完成）`)
  }

  async expectFormVisible() {
    await expect(this.page.locator('[data-testid="form-ci-edit"]')).toBeVisible()
  }

  async fillForm(data: { name?: string; type?: string; ip?: string; project?: string; environment?: string; description?: string }) {
    if (data.name) {
      await this.page.fill('[data-testid="input-ci-name"]', data.name)
    }
    if (data.type) {
      await this.page.click('[data-testid="select-ci-type"]')
      await this.page.click(`text=${data.type}`)
    }
    if (data.ip) {
      await this.page.fill('[data-testid="input-ci-ip"]', data.ip)
    }
    if (data.project) {
      await this.page.fill('[data-testid="input-ci-project"]', data.project)
    }
    if (data.environment) {
      await this.page.click('[data-testid="select-ci-environment"]')
      await this.page.click(`text=${data.environment}`)
    }
    if (data.description) {
      await this.page.fill('[data-testid="textarea-ci-description"]', data.description)
    }
  }

  async submit() {
    // 确保提交按钮可见后再点击
    await this.page.waitForSelector('[data-testid="button-ci-submit"]', { timeout: 15000, state: 'visible' })
    await this.page.click('[data-testid="button-ci-submit"]')
  }

  async expectEditSuccess() {
    await this.page.waitForURL((url: URL) => url.pathname.includes('/ci/'), { timeout: 15000 })
  }

  // 辅助方法：验证 Select 组件的选中值（通过展开下拉菜单验证）
  private async expectSelectValue(dataTestId: string, expectedValue: string) {
    const selectLocator = this.page.locator(`[data-testid="${dataTestId}"]`)
    
    // 点击 Select 展开下拉菜单
    await selectLocator.click()
    
    // 等待下拉菜单出现（Ant Design 下拉菜单使用 portal 渲染到 body）
    const dropdown = this.page.locator('.ant-select-dropdown').first()
    await expect(dropdown).toBeVisible({ timeout: 5000 })
    
    // 查找选中的选项（带有 ant-select-item-option-selected 类）
    const selectedOption = dropdown.locator('.ant-select-item-option-selected')
    const optionText = await selectedOption.textContent()
    expect(optionText).toContain(expectedValue)
    
    // 按 Escape 键关闭下拉菜单（更稳定，不会触发页面点击）
    await this.page.keyboard.press('Escape')
  }

  // 表单预填充验证方法 - 使用更稳定的交互式验证
  async expectFormPrefilled(data: { name?: string; type?: string; ip?: string; project?: string; environment?: string }) {
    // 验证 Input 类型字段（直接获取值，最稳定）
    if (data.name) {
      const nameValue = await this.page.inputValue('[data-testid="input-ci-name"]')
      expect(nameValue).toBe(data.name)
    }
    if (data.ip) {
      const ipValue = await this.page.inputValue('[data-testid="input-ci-ip"]')
      expect(ipValue).toBe(data.ip)
    }
    if (data.project) {
      const projectValue = await this.page.inputValue('[data-testid="input-ci-project"]')
      expect(projectValue).toBe(data.project)
    }
    
    // 验证 Select 类型字段（通过展开下拉菜单验证，更稳定）
    if (data.type) {
      await this.expectSelectValue('select-ci-type', data.type)
    }
    if (data.environment) {
      await this.expectSelectValue('select-ci-environment', data.environment)
    }
  }

  // 取消编辑方法
  async cancel() {
    // 确保取消按钮可见后再点击
    await this.page.waitForSelector('[data-testid="button-ci-cancel"]', { timeout: 15000, state: 'visible' })
    await this.page.click('[data-testid="button-ci-cancel"]')
  }

  async expectCancelSuccess(ciId: string) {
    // 取消后应返回详情页
    await this.page.waitForURL((url: URL) => url.pathname === `/ci/${ciId}`, { timeout: 10000 })
    await expect(this.page.locator('[data-testid="page-ci-detail"]')).toBeVisible()
  }
}