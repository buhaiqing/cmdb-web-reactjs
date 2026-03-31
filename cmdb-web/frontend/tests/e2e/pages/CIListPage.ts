import { test, expect } from '@playwright/test'

export class CIListPage {
  constructor(private page: any) {}

  async goto() {
    await this.page.goto('/ci/list')
  }

  async expectCIListVisible() {
    await expect(this.page.locator('[data-testid="page-ci-list"]')).toBeVisible()
    await expect(this.page.locator('[data-testid="table-ci-list"]')).toBeVisible()
  }

  async searchCI(keyword: string) {
    await this.page.fill('[data-testid="input-ci-search"]', keyword)
    await this.page.click('[data-testid="button-ci-search"]')
  }

  async clickCreateButton() {
    await this.page.click('[data-testid="button-ci-create"]')
  }

  async expectSearchResults() {
    await expect(this.page.locator('[data-testid="table-ci-list"]')).toBeVisible()
  }
}
