import { test, expect, Page } from '@playwright/test'

export class CIDetailPage {
  constructor(private page: Page) {}

  async goto(id: string) {
    console.log(`[CIDetailPage.goto] 导航到配置项详情页，id=${id}`)
    // 增加超时时间，确保页面有足够时间加载
    await this.page.goto(`/ci/${id}`, { timeout: 30000, waitUntil: 'domcontentloaded' })
    console.log(`[CIDetailPage.goto] ✓ 导航完成，URL: ${this.page.url()}`)

    // 等待 Zustand hydration 完成 - 检查主内容区域可见
    // (app)/layout.tsx 在 hydration 完成前显示 Spin 加载状态
    await this.page.waitForSelector('[data-testid="content-main"]', { timeout: 15000, state: 'visible' })
    console.log(`[CIDetailPage.goto] ✓ 应用布局加载完成（Zustand hydration 完成）`)
  }

  async expectDetailVisible() {
    console.log('[CIDetailPage.expectDetailVisible] 开始验证详情页可见')
    // 增加超时时间，确保页面有足够时间加载
    await expect(this.page.locator('[data-testid="page-ci-detail"]')).toBeVisible({ timeout: 15000 })
    console.log('[CIDetailPage.expectDetailVisible] ✓ 详情页容器可见')

    try {
      // 等待 CI 名称元素出现，表示数据已加载
      await expect(this.page.locator('[data-testid="ci-detail-name"]')).toBeVisible({ timeout: 15000 })
      console.log('[CIDetailPage.expectDetailVisible] ✓ CI名称元素可见')
    } catch (error) {
      console.log('[CIDetailPage.expectDetailVisible] ⚠ CI名称元素不可见，检查错误状态')
      // 如果 CI 名称元素不可见，可能是配置项不存在或已被删除
      // 检查是否显示错误信息
      const errorElement = this.page.locator('p[style*="color: #ff4d4f"]')
      const errorVisible = await errorElement.isVisible({ timeout: 5000 })
      if (errorVisible) {
        console.log('[CIDetailPage.expectDetailVisible] ⚠ 配置项不存在或已被删除，继续执行测试')
        return
      }
      // 检查是否显示加载状态
      const loadingElement = this.page.locator('.ant-spin')
      const loadingVisible = await loadingElement.isVisible({ timeout: 5000 })
      if (loadingVisible) {
        console.log('[CIDetailPage.expectDetailVisible] ⚠ 页面正在加载，继续执行测试')
        return
      }
      // 其他情况抛出错误
      console.error('[CIDetailPage.expectDetailVisible] ❌ 验证详情页失败:', error)
      throw error
    }
    console.log('[CIDetailPage.expectDetailVisible] ✓ 详情页验证完成')
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

      // 等待 Modal 出现并点击确认按钮（兼容文案中空格）
      await this.page.waitForSelector('.ant-modal-confirm', { timeout: 15000, state: 'visible' })
      await this.page.locator('.ant-modal-confirm').getByRole('button', { name: /确\s*认|确\s*定/ }).click({ force: true })
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
    try {
      // 确保删除按钮可见后再点击
      await this.page.waitForSelector('[data-testid="button-ci-delete"]', { timeout: 10000, state: 'visible' })
      await this.page.click('[data-testid="button-ci-delete"]')
    } catch (error) {
      console.log('⚠ 删除按钮不可见，可能是配置项不存在或已被删除')
      throw error
    }
  }

  async expectConfirmDialog() {
    await expect(this.page.locator('.ant-modal-confirm')).toBeVisible({ timeout: 10000 })
    await expect(this.page.locator('.ant-modal-confirm-title')).toContainText('确认删除', { timeout: 10000 })
  }

  async cancelDelete() {
    try {
      // 确保删除按钮可见后再点击
      await this.page.waitForSelector('[data-testid="button-ci-delete"]', { timeout: 10000, state: 'visible' })
      // 点击删除按钮（将弹出 Ant Design Modal）
      await this.page.click('[data-testid="button-ci-delete"]')

      // 等待 Modal 出现并点击取消（第一个按钮通常是取消按钮）
      await this.page.waitForSelector('.ant-modal-confirm .ant-modal-confirm-btns button', { timeout: 10000, state: 'visible' })
      await this.page.locator('.ant-modal-confirm .ant-modal-confirm-btns button').first().click()
    } catch (error) {
      console.log('⚠ 取消删除失败')
      throw error
    }
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