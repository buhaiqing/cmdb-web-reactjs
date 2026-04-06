import { test, expect, Page } from '@playwright/test'

export class CICreatePage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/ci/create')
  }

  async fillForm(data: { name: string; type: string; ip?: string; project?: string; environment?: string; description?: string }) {
    await this.page.fill('[data-testid="input-ci-name"]', data.name)

    // 处理 Ant Design Select 组件
    await this.page.click('[data-testid="select-ci-type"]')
    await this.page.click(`text=${data.type}`)

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
    await this.page.click('[data-testid="button-ci-submit"]')
  }

  async expectFormVisible() {
    await expect(this.page.locator('[data-testid="form-ci-create"]')).toBeVisible()
  }

  async expectCreateSuccess() {
    // 等待成功消息出现，然后验证URL跳转
    await this.page.waitForSelector('.ant-message-success', { timeout: 15000 })
    await this.page.waitForURL((url: URL) => url.pathname.includes('/ci/list'), { timeout: 15000 })
  }

  async cancel() {
    await this.page.click('[data-testid="button-ci-cancel"]')
  }

  // 表单验证相关方法
  async expectValidationError(message: string) {
    await expect(this.page.locator('.ant-form-item-explain-error')).toContainText(message)
  }

  async expectFieldValidation(field: 'name' | 'type', message: string) {
    const selector = field === 'name' ? '[data-testid="input-ci-name"]' : '[data-testid="select-ci-type"]'
    const formItem = this.page.locator(selector).locator('..').locator('..')
    await expect(formItem.locator('.ant-form-item-explain-error')).toContainText(message)
  }

  async clearField(field: 'name' | 'type' | 'ip' | 'project') {
    const testIdMap = {
      name: 'input-ci-name',
      type: 'select-ci-type',
      ip: 'input-ci-ip',
      project: 'input-ci-project'
    }
    await this.page.fill(`[data-testid="${testIdMap[field]}"]`, '')
  }

  async triggerFieldValidation(field: 'name' | 'type') {
    const selector = field === 'name' ? '[data-testid="input-ci-name"]' : '[data-testid="select-ci-type"]'
    await this.page.click(selector)
    await this.page.click('body') // 点击外部触发失焦验证
  }
}
