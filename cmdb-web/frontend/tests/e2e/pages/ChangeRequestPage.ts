import { test, expect, Page } from '@playwright/test'

export class ChangeRequestPage {
  constructor(private page: Page) {}

  async gotoList() {
    await this.page.goto('/change/list', { timeout: 60000, waitUntil: 'domcontentloaded' })
  }

  async gotoCreate() {
    console.log('开始导航到变更创建页面...')
    // 先导航到根路径，确保页面状态干净
    await this.page.goto('/', { timeout: 30000, waitUntil: 'domcontentloaded' })
    console.log('✓ 成功导航到根路径')
    
    // 然后导航到变更创建页面
    await this.page.goto('/change/create', { timeout: 60000, waitUntil: 'domcontentloaded' })
    console.log('✓ 成功导航到变更创建页面')
    
    // 等待页面加载完成
    await this.page.waitForLoadState('load', { timeout: 30000 })
    console.log('✓ 页面加载完成')
  }

  async gotoDetail(id: string) {
    // 增加超时时间，确保页面有足够时间加载
    await this.page.goto(`/change/${id}`, { timeout: 60000, waitUntil: 'domcontentloaded' })
  }

  async expectListVisible() {
    // 增加超时时间，确保页面有足够时间加载
    await expect(this.page.locator('[data-testid="page-change-list"]')).toBeVisible({ timeout: 15000 })
  }

  async expectCreateFormVisible() {
    // 增加超时时间，确保页面有足够时间加载
    await expect(this.page.locator('[data-testid="form-change-create"]')).toBeVisible({ timeout: 15000 })
  }

  async expectDetailVisible() {
    // 增加超时时间，确保页面有足够时间加载
    await expect(this.page.locator('[data-testid="page-change-detail"]')).toBeVisible({ timeout: 15000 })
  }

  async clickCreateButton() {
    await this.page.click('[data-testid="button-change-create"]', { timeout: 30000 })
  }

  async fillCreateForm(data: { title: string; ciId: string; changeType: string; description: string }) {
    await this.page.fill('[data-testid="input-change-title"]', data.title, { timeout: 30000 })
    await this.page.fill('[data-testid="input-change-ci"]', data.ciId, { timeout: 30000 })
    await this.page.click('[data-testid="select-change-type"]', { timeout: 30000 })
    await this.page.click(`text=${data.changeType}`, { timeout: 30000 })
    await this.page.fill('[data-testid="textarea-change-description"]', data.description, { timeout: 30000 })
  }

  async submitCreate() {
    // 确保提交按钮可见后再点击
    await this.page.waitForSelector('[data-testid="button-change-submit"]', { timeout: 15000, state: 'visible' })
    await this.page.click('[data-testid="button-change-submit"]', { timeout: 30000 })
  }

  async expectCreateSuccess() {
    try {
      // 等待成功消息出现
      await this.page.waitForSelector('.ant-message-success', { timeout: 15000 })
    } catch (error) {
      // 即使没有成功消息，也要继续等待URL跳转
      console.log('未找到成功消息，继续等待URL跳转')
    }
    // 等待URL跳转，增加超时时间
    await this.page.waitForURL((url: URL) => url.pathname.includes('/change/list'), { timeout: 20000 })
    // 等待页面加载完成
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15000 })
    // 验证列表页面可见
    await expect(this.page.locator('[data-testid="page-change-list"]')).toBeVisible({ timeout: 15000 })
  }

  async clickApproveButton() {
    await this.page.click('[data-testid="button-change-approve"]', { timeout: 30000 })
  }

  async expectStatusUpdated() {
    await expect(this.page.locator('text=已批准')).toBeVisible({ timeout: 15000 })
  }

  // 变更状态流转方法
  async clickRejectButton() {
    await this.page.click('[data-testid="button-change-reject"]', { timeout: 30000 })
  }

  async expectStatus(status: 'pending' | 'approved' | 'rejected' | 'completed') {
    const statusMap = {
      pending: '待审批',
      approved: '已批准',
      rejected: '已拒绝',
      completed: '已完成'
    }
    await expect(this.page.locator('[data-testid="change-detail-status"]')).toContainText(statusMap[status], { timeout: 15000 })
  }

  async filterByStatus(status: 'pending' | 'approved' | 'rejected' | 'completed') {
    await this.page.click('[data-testid="select-change-status-filter"]', { timeout: 30000 })
    const statusMap = {
      pending: '待审批',
      approved: '已批准',
      rejected: '已拒绝',
      completed: '已完成'
    }
    await this.page.click(`text=${statusMap[status]}`, { timeout: 30000 })
  }

  async expectChangeDataVisible(data: { title?: string; ciId?: string; changeType?: string; description?: string }) {
    if (data.title) {
      await expect(this.page.locator('[data-testid="change-detail-title"]')).toContainText(data.title, { timeout: 15000 })
    }
    if (data.ciId) {
      await expect(this.page.locator('[data-testid="change-detail-ci"]')).toContainText(data.ciId, { timeout: 15000 })
    }
    if (data.changeType) {
      await expect(this.page.locator('[data-testid="change-detail-type"]')).toContainText(data.changeType, { timeout: 15000 })
    }
    if (data.description) {
      await expect(this.page.locator('[data-testid="change-detail-description"]')).toContainText(data.description, { timeout: 15000 })
    }
  }

  async expectNoApproveButton() {
    await expect(this.page.locator('[data-testid="button-change-approve"]')).not.toBeVisible({ timeout: 15000 })
  }

  async expectNoRejectButton() {
    await expect(this.page.locator('[data-testid="button-change-reject"]')).not.toBeVisible({ timeout: 15000 })
  }
}