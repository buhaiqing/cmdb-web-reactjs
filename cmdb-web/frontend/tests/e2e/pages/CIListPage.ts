import { test, expect, Page } from '@playwright/test'

export class CIListPage {
  constructor(private page: Page) {}

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

  // 列表验证方法
  async expectCIExists(name: string) {
    await this.searchCI(name)
    await this.page.waitForTimeout(500) // 等待搜索结果
    const ciRow = this.page.locator(`text=${name}`).first()
    await expect(ciRow).toBeVisible()
  }

  async expectCINotExists(name: string) {
    await this.searchCI(name)
    await this.page.waitForTimeout(500) // 等待搜索结果
    // 检查空状态或表格中不包含该名称
    const emptyState = this.page.locator('.ant-empty')
    const noData = this.page.locator('.ant-table-tbody .ant-table-cell:has-text("暂无数据")')
    await expect(emptyState.or(noData)).toBeVisible()
  }

  async clearSearch() {
    await this.page.fill('[data-testid="input-ci-search"]', '')
    await this.page.click('[data-testid="button-ci-search"]')
  }

  async clickCIDetail(name: string) {
    await this.page.click(`text=${name}`)
  }

  // 权限控制方法
  async expectNoCreateButton() {
    await expect(this.page.locator('[data-testid="button-ci-create"]')).not.toBeVisible()
  }
}
