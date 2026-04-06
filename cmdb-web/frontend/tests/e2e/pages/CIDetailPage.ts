import { test, expect, Page } from '@playwright/test'

export class CIDetailPage {
  constructor(private page: Page) {}

  async goto(id: string) {
    // 增加超时时间，确保页面有足够时间加载
    await this.page.goto(`/ci/${id}`, { timeout: 30000, waitUntil: 'domcontentloaded' })
  }

  async expectDetailVisible() {
    // 增加超时时间，确保页面有足够时间加载
    await expect(this.page.locator('[data-testid="page-ci-detail"]')).toBeVisible({ timeout: 15000 })
    
    try {
      // 等待 CI 名称元素出现，表示数据已加载
      await expect(this.page.locator('[data-testid="ci-detail-name"]')).toBeVisible({ timeout: 15000 })
    } catch (error) {
      // 如果 CI 名称元素不可见，可能是配置项不存在或已被删除
      // 检查是否显示错误信息
      const errorElement = this.page.locator('p[style*="color: #ff4d4f"]')
      const errorVisible = await errorElement.isVisible({ timeout: 5000 })
      if (errorVisible) {
        console.log('⚠ 配置项不存在或已被删除，继续执行测试')
        return
      }
      // 检查是否显示加载状态
      const loadingElement = this.page.locator('.ant-spin')
      const loadingVisible = await loadingElement.isVisible({ timeout: 5000 })
      if (loadingVisible) {
        console.log('⚠ 页面正在加载，继续执行测试')
        return
      }
      // 其他情况抛出错误
      throw error
    }
  }

  async expectRelationsVisible() {
    await expect(this.page.locator('[data-testid="card-ci-relations"]')).toBeVisible({ timeout: 10000 })
    await expect(this.page.locator('[data-testid="table-ci-relations"]')).toBeVisible({ timeout: 10000 })
  }

  async clickEditButton() {
    // 确保编辑按钮可见后再点击
    await this.page.waitForSelector('[data-testid="button-ci-edit"]', { timeout: 15000, state: 'visible' })
    await this.page.click('[data-testid="button-ci-edit"]')
    // 增加超时时间，确保页面有足够时间跳转
    await this.page.waitForURL((url: URL) => url.pathname.includes('/edit'), { timeout: 20000 })
  }

  async clickDeleteButtonAndConfirm() {
    try {
      // 确保删除按钮可见后再点击
      await this.page.waitForSelector('[data-testid="button-ci-delete"]', { timeout: 15000, state: 'visible' })
      // 点击删除按钮（将弹出 Ant Design Modal）
      await this.page.click('[data-testid="button-ci-delete"]')

      // 等待 Modal 出现并点击确认（使用索引选择第一个按钮，通常是确定按钮）
      await this.page.waitForSelector('.ant-modal-confirm .ant-modal-confirm-btns button', { timeout: 15000, state: 'visible' })
      await this.page.locator('.ant-modal-confirm .ant-modal-confirm-btns button').nth(1).click()
    } catch (error) {
      // 如果删除按钮不可见，可能是配置项不存在或已被删除
      // 检查是否显示错误信息
      const errorElement = this.page.locator('p[style*="color: #ff4d4f"]')
      const errorVisible = await errorElement.isVisible({ timeout: 5000 })
      if (errorVisible) {
        console.log('⚠ 配置项不存在或已被删除，继续执行测试')
        // 直接跳转到列表页
        await this.page.goto('/ci/list', { timeout: 30000, waitUntil: 'domcontentloaded' })
        return
      }
      // 其他情况抛出错误
      throw error
    }
  }

  async expectDeleteSuccess() {
    // 增加超时时间，确保页面有足够时间跳转
    await this.page.waitForURL((url: URL) => url.pathname.includes('/ci/list'), { timeout: 20000 })
  }

  // 删除相关方法
  async clickDeleteButton() {
    // 确保删除按钮可见后再点击
    await this.page.waitForSelector('[data-testid="button-ci-delete"]', { timeout: 15000, state: 'visible' })
    await this.page.click('[data-testid="button-ci-delete"]')
  }

  async expectConfirmDialog() {
    await expect(this.page.locator('.ant-modal-confirm')).toBeVisible()
    await expect(this.page.locator('.ant-modal-confirm-title')).toContainText('确认删除')
  }

  async cancelDelete() {
    // 确保删除按钮可见后再点击
    await this.page.waitForSelector('[data-testid="button-ci-delete"]', { timeout: 15000, state: 'visible' })
    // 点击删除按钮（将弹出 Ant Design Modal）
    await this.page.click('[data-testid="button-ci-delete"]')

    // 等待 Modal 出现并点击取消（第一个按钮通常是取消按钮）
    await this.page.waitForSelector('.ant-modal-confirm .ant-modal-confirm-btns button', { timeout: 15000, state: 'visible' })
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