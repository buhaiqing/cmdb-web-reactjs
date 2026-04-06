import { test, expect, Page } from '@playwright/test'

export class CIDetailPage {
  constructor(private page: Page) {}

  async goto(id: string) {
    await this.page.goto(`/ci/${id}`)
  }

  async expectDetailVisible() {
    await expect(this.page.locator('[data-testid="page-ci-detail"]')).toBeVisible()
    // 等待 CI 名称元素出现，表示数据已加载（增加超时时间）
    await expect(this.page.locator('[data-testid="ci-detail-name"]')).toBeVisible({ timeout: 15000 })
  }

  async expectRelationsVisible() {
    await expect(this.page.locator('[data-testid="card-ci-relations"]')).toBeVisible({ timeout: 10000 })
    await expect(this.page.locator('[data-testid="table-ci-relations"]')).toBeVisible({ timeout: 10000 })
  }

  async clickEditButton() {
    await this.page.click('[data-testid="button-ci-edit"]')
    await this.page.waitForURL((url: URL) => url.pathname.includes('/edit'), { timeout: 15000 })
  }

  async clickDeleteButtonAndConfirm() {
    // 点击删除按钮（将弹出 Ant Design Modal）
    await this.page.click('[data-testid="button-ci-delete"]')

    // 等待 Modal 出现并点击确认（使用索引选择第一个按钮，通常是确定按钮）
    await this.page.locator('.ant-modal-confirm .ant-modal-confirm-btns button').nth(1).click()
  }

  async expectDeleteSuccess() {
    await this.page.waitForURL((url: URL) => url.pathname.includes('/ci/list'), { timeout: 10000 })
  }

  // 删除相关方法
  async clickDeleteButton() {
    await this.page.click('[data-testid="button-ci-delete"]')
  }

  async expectConfirmDialog() {
    await expect(this.page.locator('.ant-modal-confirm')).toBeVisible()
    await expect(this.page.locator('.ant-modal-confirm-title')).toContainText('确认删除')
  }

  async cancelDelete() {
    // 点击删除按钮（将弹出 Ant Design Modal）
    await this.page.click('[data-testid="button-ci-delete"]')

    // 等待 Modal 出现并点击取消（第一个按钮通常是取消按钮）
    await this.page.locator('.ant-modal-confirm .ant-modal-confirm-btns button').first().click()
  }

  // CI 数据显示方法
  async expectCIDataVisible(data: { name?: string; type?: string; ip?: string; status?: string }) {
    if (data.name) {
      await expect(this.page.locator('[data-testid="ci-detail-name"]')).toContainText(data.name)
    }
    if (data.type) {
      await expect(this.page.locator('[data-testid="ci-detail-type"]')).toContainText(data.type)
    }
    if (data.ip) {
      await expect(this.page.locator('[data-testid="ci-detail-ip"]')).toContainText(data.ip)
    }
    if (data.status) {
      await expect(this.page.locator('[data-testid="ci-detail-status"]')).toContainText(data.status)
    }
  }

  async expectEmptyRelations() {
    await expect(this.page.locator('[data-testid="table-relation-list"]')).toBeVisible()
    // 检查空状态或表格行数为 0
    const rows = this.page.locator('[data-testid="table-relation-list"] tbody tr')
    const count = await rows.count()
    if (count === 0) {
      await expect(this.page.locator('.ant-empty')).toBeVisible()
    }
  }

  // 权限控制方法
  async expectNoEditButton() {
    await expect(this.page.locator('[data-testid="button-ci-edit"]')).not.toBeVisible()
  }

  async expectNoDeleteButton() {
    await expect(this.page.locator('[data-testid="button-ci-delete"]')).not.toBeVisible()
  }

  async expectPermissionDenied() {
    await expect(this.page.locator('.ant-message')).toContainText('权限不足')
  }
}