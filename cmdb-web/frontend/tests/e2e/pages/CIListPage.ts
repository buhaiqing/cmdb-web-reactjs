import { test, expect, Page } from '@playwright/test'

/**
 * 配置项列表页面测试类
 * 提供配置项列表页面的所有测试操作和验证方法
 */
export class CIListPage {
  constructor(private page: Page) {}

  /**
   * 导航到配置项列表页面
   * @throws {Error} 页面加载超时
   */
  async goto() {
    console.log('[CIListPage.goto] 导航到配置项列表页面...')
    try {
      await this.page.goto('/ci/list', { timeout: 30000, waitUntil: 'domcontentloaded' })
      console.log('[CIListPage.goto] ✓ 成功导航到配置项列表页面，URL:', this.page.url())
    } catch (error) {
      console.error('[CIListPage.goto] ❌ 导航到配置项列表页面失败:', error)
      throw error
    }
  }

  /**
   * 验证配置项列表页面可见
   * 1. 等待页面跳转完成
   * 2. 等待页面加载完成
   * 3. 验证页面容器元素可见
   * 4. 验证表格元素可见
   * @throws {Error} 页面不可见
   */
  async expectCIListVisible() {
    console.log('开始验证配置项列表页面可见...')
    
    try {
      // 等待页面跳转完成
      await this.page.waitForURL((url: URL) => url.pathname.includes('/ci/list'), { timeout: 30000 })
      console.log('✓ 页面跳转到配置项列表页')
      console.log('当前URL:', this.page.url())
      
      // 增加超时时间，确保页面有足够时间加载
      await this.page.waitForLoadState('domcontentloaded', { timeout: 20000 })
      console.log('✓ 页面加载完成')
      
      // 验证页面元素可见
      // 先等待页面容器元素出现
      await this.page.waitForSelector('[data-testid="page-ci-list"]', { timeout: 20000 })
      console.log('✓ 配置项列表页面容器可见')
      
      // 再等待表格元素出现
      await this.page.waitForSelector('[data-testid="table-ci-list"]', { timeout: 20000 })
      console.log('✓ 配置项列表表格可见')
      
      // 验证元素可见
      await expect(this.page.locator('[data-testid="page-ci-list"]')).toBeVisible()
      await expect(this.page.locator('[data-testid="table-ci-list"]')).toBeVisible()
    } catch (error) {
      console.error('❌ 配置项列表页面元素不可见:', error)
      console.log('当前URL:', this.page.url())
      throw error
    }
    
    console.log('✓ 配置项列表页面可见验证完成')
  }

  /**
   * 搜索配置项
   * @param keyword 搜索关键词
   * @throws {Error} 搜索失败
   */
  async searchCI(keyword: string) {
    console.log(`搜索配置项: ${keyword}...`)
    try {
      await this.page.fill('[data-testid="input-ci-search"]', keyword)
      console.log('✓ 填写搜索关键词')
      
      await this.page.click('[data-testid="button-ci-search"]')
      console.log('✓ 点击搜索按钮')
      
      // 等待搜索结果加载
      await this.page.waitForLoadState('domcontentloaded', { timeout: 15000 })
      console.log('✓ 搜索结果加载完成')
    } catch (error) {
      console.error('❌ 搜索配置项失败:', error)
      throw error
    }
  }

  /**
   * 点击创建配置项按钮
   * @throws {Error} 点击失败
   */
  async clickCreateButton() {
    console.log('点击创建配置项按钮...')
    try {
      await this.page.waitForSelector('[data-testid="button-ci-create"]', { timeout: 15000, state: 'visible' })
      console.log('✓ 创建配置项按钮可见')
      
      await this.page.click('[data-testid="button-ci-create"]')
      console.log('✓ 点击创建配置项按钮')
    } catch (error) {
      console.error('❌ 点击创建配置项按钮失败:', error)
      throw error
    }
  }

  /**
   * 验证搜索结果可见
   * @throws {Error} 搜索结果不可见
   */
  async expectSearchResults() {
    console.log('验证搜索结果可见...')
    try {
      await expect(this.page.locator('[data-testid="table-ci-list"]')).toBeVisible({ timeout: 15000 })
      console.log('✓ 搜索结果可见')
    } catch (error) {
      console.error('❌ 搜索结果不可见:', error)
      throw error
    }
  }

  /**
   * 验证配置项存在
   * @param name 配置项名称
   * @throws {Error} 配置项不存在
   */
  async expectCIExists(name: string) {
    console.log(`验证配置项存在: ${name}...`)
    try {
      await this.searchCI(name)
      
      // 等待搜索结果
      await this.page.waitForTimeout(1000)
      
      const ciRow = this.page.locator(`text=${name}`).first()
      await expect(ciRow).toBeVisible({ timeout: 15000 })
      console.log(`✓ 配置项 ${name} 存在`)
    } catch (error) {
      console.error(`❌ 配置项 ${name} 不存在:`, error)
      throw error
    }
  }

  /**
   * 验证配置项不存在
   * @param name 配置项名称
   * @throws {Error} 配置项存在
   */
  async expectCINotExists(name: string) {
    console.log(`验证配置项不存在: ${name}...`)
    try {
      await this.searchCI(name)
      
      // 等待搜索结果
      await this.page.waitForTimeout(1000)
      
      // 检查空状态或表格中不包含该名称
      const emptyState = this.page.locator('.ant-empty')
      const noData = this.page.locator('.ant-table-tbody .ant-table-cell:has-text("暂无数据")')
      await expect(emptyState.or(noData)).toBeVisible({ timeout: 15000 })
      console.log(`✓ 配置项 ${name} 不存在`)
    } catch (error) {
      console.error(`❌ 配置项 ${name} 存在:`, error)
      throw error
    }
  }

  /**
   * 清空搜索
   * @throws {Error} 清空搜索失败
   */
  async clearSearch() {
    console.log('清空搜索...')
    try {
      await this.page.fill('[data-testid="input-ci-search"]', '')
      console.log('✓ 清空搜索输入框')
      
      await this.page.click('[data-testid="button-ci-search"]')
      console.log('✓ 点击搜索按钮')
      
      // 等待结果加载
      await this.page.waitForLoadState('domcontentloaded', { timeout: 15000 })
      console.log('✓ 清空搜索完成')
    } catch (error) {
      console.error('❌ 清空搜索失败:', error)
      throw error
    }
  }

  /**
   * 点击配置项详情
   * @param name 配置项名称
   * @throws {Error} 点击失败
   */
  async clickCIDetail(name: string) {
    console.log(`点击配置项详情: ${name}...`)
    try {
      await this.page.click(`text=${name}`)
      console.log(`✓ 点击配置项 ${name} 的详情链接`)
    } catch (error) {
      console.error(`❌ 点击配置项 ${name} 的详情链接失败:`, error)
      throw error
    }
  }

  /**
   * 验证无创建按钮（权限控制）
   * @throws {Error} 创建按钮可见
   */
  async expectNoCreateButton() {
    console.log('验证无创建按钮...')
    try {
      await expect(this.page.locator('[data-testid="button-ci-create"]')).not.toBeVisible({ timeout: 15000 })
      console.log('✓ 无创建按钮，权限控制生效')
    } catch (error) {
      console.error('❌ 创建按钮可见，权限控制未生效:', error)
      throw error
    }
  }
}
