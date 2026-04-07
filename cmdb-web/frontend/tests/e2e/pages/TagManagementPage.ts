import { test, expect } from '@playwright/test'

export class TagManagementPage {
  constructor(private page: any) {}

  async goto() {
    await this.page.goto('/ci/tags')
    await this.page.waitForURL('**/ci/tags')
    await this.page.waitForSelector('[data-testid="page-tag-management"]', { state: 'visible', timeout: 10000 })
  }

  async expectPageVisible() {
    await expect(this.page.locator('[data-testid="page-tag-management"]')).toBeVisible()
    await expect(this.page.locator('.page-title')).toContainText('标签管理')
  }

  async clickCreateButton() {
    await this.page.click('[data-testid="button-create-tag"]')
  }

  async expectCreateModalVisible() {
    await expect(this.page.locator('[data-testid="modal-tag-form"]')).toBeVisible()
  }

  async fillCreateForm(tagData: { name: string; color?: string; description?: string }) {
    await this.page.fill('[data-testid="input-tag-name"]', tagData.name)
    if (tagData.color) {
      await this.page.fill('[data-testid="input-tag-color"]', tagData.color)
    }
    if (tagData.description) {
      await this.page.fill('[data-testid="input-tag-description"]', tagData.description)
    }
  }

  async submitCreate() {
    await this.page.click('.ant-modal-footer .ant-btn-primary')
  }

  async expectCreateSuccess() {
    await expect(this.page.locator('.ant-message')).toContainText('成功', { timeout: 5000 })
  }

  async searchTag(keyword: string) {
    await this.page.fill('[data-testid="input-tag-search"]', keyword)
  }

  async clickRefreshButton() {
    await this.page.click('[data-testid="button-refresh-tags"]')
  }

  async expectTableVisible() {
    await expect(this.page.locator('[data-testid="table-tag-list"]')).toBeVisible()
  }

  async clickEditButton(tagId: string) {
    await this.page.click(`[data-testid="button-edit-tag-${tagId}"]`)
  }

  async clickDeleteButton(tagId: string) {
    await this.page.click(`[data-testid="button-delete-tag-${tagId}"]`)
  }

  async confirmDelete() {
    await this.page.click('.ant-popover .ant-btn-primary')
  }

  async expectTagInTable(tagName: string) {
    await expect(this.page.locator(`[data-testid="tag-${tagName}"]`)).toBeVisible()
  }
}
