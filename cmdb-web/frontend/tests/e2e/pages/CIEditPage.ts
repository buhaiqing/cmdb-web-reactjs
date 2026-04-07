import { test, expect, Page } from '@playwright/test'

export class CIEditPage {
  constructor(private page: Page) {}

  async goto(id: string) {
    console.log(`[CIEditPage.goto] 导航到编辑页，id=${id}`)
    await this.page.goto(`/ci/${id}/edit`, { timeout: 30000, waitUntil: 'domcontentloaded' })
    console.log(`[CIEditPage.goto] ✓ 导航完成，URL: ${this.page.url()}`)
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

  // 表单预填充验证方法
  async expectFormPrefilled(data: { name?: string; type?: string; ip?: string; project?: string; environment?: string }) {
    if (data.name) {
      const nameValue = await this.page.inputValue('[data-testid="input-ci-name"]')
      expect(nameValue).toBe(data.name)
    }
    if (data.type) {
      const typeText = await this.page.locator('[data-testid="select-ci-type"] .ant-select-selection-item').textContent()
      expect(typeText).toContain(data.type)
    }
    if (data.ip) {
      const ipValue = await this.page.inputValue('[data-testid="input-ci-ip"]')
      expect(ipValue).toBe(data.ip)
    }
    if (data.project) {
      const projectValue = await this.page.inputValue('[data-testid="input-ci-project"]')
      expect(projectValue).toBe(data.project)
    }
    if (data.environment) {
      const envText = await this.page.locator('[data-testid="select-ci-environment"] .ant-select-selection-item').textContent()
      expect(envText).toContain(data.environment)
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