import { test, expect, Page } from '@playwright/test'

export class ChangeRequestPage {
  constructor(private page: Page) {}

  async gotoList() {
    await this.page.goto('/change/list')
  }

  async gotoCreate() {
    await this.page.goto('/change/create')
  }

  async gotoDetail(id: string) {
    await this.page.goto(`/change/${id}`)
  }

  async expectListVisible() {
    await expect(this.page.locator('[data-testid="page-change-list"]')).toBeVisible()
  }

  async expectCreateFormVisible() {
    await expect(this.page.locator('[data-testid="form-change-create"]')).toBeVisible()
  }

  async expectDetailVisible() {
    await expect(this.page.locator('[data-testid="page-change-detail"]')).toBeVisible()
  }

  async clickCreateButton() {
    await this.page.click('[data-testid="button-change-create"]')
  }

  async fillCreateForm(data: { title: string; ciId: string; changeType: string; description: string }) {
    await this.page.fill('[data-testid="input-change-title"]', data.title)
    await this.page.fill('[data-testid="input-change-ci"]', data.ciId)
    await this.page.click('[data-testid="select-change-type"]')
    await this.page.click(`text=${data.changeType}`)
    await this.page.fill('[data-testid="textarea-change-description"]', data.description)
  }

  async submitCreate() {
    await this.page.click('[data-testid="button-change-submit"]')
  }

  async expectCreateSuccess() {
    // 等待成功消息出现，然后验证URL跳转
    await this.page.waitForSelector('.ant-message-success', { timeout: 15000 })
    await this.page.waitForURL((url: URL) => url.pathname.includes('/change/list'), { timeout: 15000 })
  }

  async clickApproveButton() {
    await this.page.click('[data-testid="button-change-approve"]')
    await this.page.waitForTimeout(1000)
  }

  async expectStatusUpdated() {
    await expect(this.page.locator('text=已批准')).toBeVisible()
  }

  // 变更状态流转方法
  async clickRejectButton() {
    await this.page.click('[data-testid="button-change-reject"]')
    await this.page.waitForTimeout(1000)
  }

  async expectStatus(status: 'pending' | 'approved' | 'rejected' | 'completed') {
    const statusMap = {
      pending: '待审批',
      approved: '已批准',
      rejected: '已拒绝',
      completed: '已完成'
    }
    await expect(this.page.locator('[data-testid="change-detail-status"]')).toContainText(statusMap[status])
  }

  async filterByStatus(status: 'pending' | 'approved' | 'rejected' | 'completed') {
    await this.page.click('[data-testid="select-change-status-filter"]')
    const statusMap = {
      pending: '待审批',
      approved: '已批准',
      rejected: '已拒绝',
      completed: '已完成'
    }
    await this.page.click(`text=${statusMap[status]}`)
  }

  async expectChangeDataVisible(data: { title?: string; ciId?: string; changeType?: string; description?: string }) {
    if (data.title) {
      await expect(this.page.locator('[data-testid="change-detail-title"]')).toContainText(data.title)
    }
    if (data.ciId) {
      await expect(this.page.locator('[data-testid="change-detail-ci"]')).toContainText(data.ciId)
    }
    if (data.changeType) {
      await expect(this.page.locator('[data-testid="change-detail-type"]')).toContainText(data.changeType)
    }
    if (data.description) {
      await expect(this.page.locator('[data-testid="change-detail-description"]')).toContainText(data.description)
    }
  }

  async expectNoApproveButton() {
    await expect(this.page.locator('[data-testid="button-change-approve"]')).not.toBeVisible()
  }

  async expectNoRejectButton() {
    await expect(this.page.locator('[data-testid="button-change-reject"]')).not.toBeVisible()
  }
}