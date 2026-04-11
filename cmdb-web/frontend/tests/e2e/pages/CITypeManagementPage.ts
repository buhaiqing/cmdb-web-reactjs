import { expect } from '@playwright/test'

export class CITypeManagementPage {
  constructor(private page: any) {}

  async goto() {
    await this.page.goto('/ci/types')
    // 等待 Zustand hydration 完成 - 检查主内容区域可见
    await this.page.waitForSelector('[data-testid="content-main"]', { timeout: 15000, state: 'visible' })
  }

  async expectPageVisible() {
    await expect(this.page.locator('[data-testid="page-ci-type-management"]')).toBeVisible()
    await expect(this.page.locator('.page-title')).toContainText('配置项类型管理')
  }

  async clickCreateButton() {
    await this.page.click('[data-testid="button-create-type"]')
  }

  async expectCreateModalVisible() {
    await expect(this.page.locator('[data-testid="modal-type-form"]')).toBeVisible()
  }

  async fillCreateForm(typeData: { name: string; code: string; description?: string; icon?: string }) {
    await this.page.fill('[data-testid="input-type-name"]', typeData.name)
    await this.page.fill('[data-testid="input-type-code"]', typeData.code)
    if (typeData.description) {
      await this.page.fill('[data-testid="input-type-description"]', typeData.description)
    }
    if (typeData.icon) {
      await this.page.fill('[data-testid="input-type-icon"]', typeData.icon)
    }
  }

  async submitCreate() {
    await this.page.click('[data-testid="modal-type-form"] button[type="submit"]')
  }

  async expectCreateSuccess() {
    await expect(this.page.locator('.ant-message')).toContainText('成功', { timeout: 5000 })
  }

  async searchType(keyword: string) {
    await this.page.fill('[data-testid="input-type-search"]', keyword)
  }

  async clickRefreshButton() {
    await this.page.click('[data-testid="button-refresh-types"]')
  }

  async expectTableVisible() {
    await expect(this.page.locator('[data-testid="table-type-list"]')).toBeVisible()
  }

  async clickEditButton(typeId: string) {
    await this.page.click(`[data-testid="button-edit-type-${typeId}"]`)
  }

  async clickDeleteButton(typeId: string) {
    await this.page.click(`[data-testid="button-delete-type-${typeId}"]`)
  }

  async confirmDelete() {
    await this.page.click('.ant-popover .ant-btn-primary')
  }

  async expectTypeInTable(typeName: string) {
    await expect(this.page.locator(`text=${typeName}`).first()).toBeVisible()
  }
}
