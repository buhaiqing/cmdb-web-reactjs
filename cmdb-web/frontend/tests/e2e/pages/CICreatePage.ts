import { test, expect, Page } from '@playwright/test'

export class CICreatePage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/ci/create')
  }

  async fillForm(data: { name: string; type: string; ip?: string; project?: string; environment?: string }) {
    await this.page.fill('[data-testid="input-ci-name"]', data.name)
    await this.page.selectOption('[data-testid="select-ci-type"]', data.type)
    if (data.ip) {
      await this.page.fill('[data-testid="input-ci-ip"]', data.ip)
    }
    if (data.project) {
      await this.page.fill('[data-testid="input-ci-project"]', data.project)
    }
    if (data.environment) {
      await this.page.selectOption('[data-testid="select-ci-environment"]', data.environment)
    }
  }

  async submit() {
    await this.page.click('[data-testid="button-ci-submit"]')
  }

  async expectFormVisible() {
    await expect(this.page.locator('[data-testid="form-ci-create"]')).toBeVisible()
  }

  async expectCreateSuccess() {
    await this.page.waitForURL((url: URL) => url.pathname.includes('/ci/list'), { timeout: 10000 })
  }
}
