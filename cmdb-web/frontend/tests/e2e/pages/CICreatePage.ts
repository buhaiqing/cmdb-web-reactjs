import { test, expect, Page } from '@playwright/test'

/**
 * 配置项创建页面测试类
 * 提供配置项创建页面的所有测试操作和验证方法
 */
export class CICreatePage {
  constructor(private page: Page) {}

  /**
   * 导航到配置项创建页面
   * @throws {Error} 页面加载超时
   */
  async goto() {
    console.log('导航到配置项创建页面...')
    try {
      // 先导航到根路径，确保页面状态干净
      await this.page.goto('/', { timeout: 30000, waitUntil: 'domcontentloaded' })
      console.log('✓ 成功导航到根路径')
      
      // 然后导航到配置项创建页面
      await this.page.goto('/ci/create', { timeout: 60000, waitUntil: 'domcontentloaded' })
      console.log('✓ 成功导航到配置项创建页面')
      
      // 等待页面加载完成
      await this.page.waitForLoadState('load', { timeout: 30000 })
      console.log('✓ 页面加载完成')
      
      // 等待表单元素出现
      await this.page.waitForSelector('[data-testid="form-ci-create"]', { timeout: 30000, state: 'visible' })
      console.log('✓ 表单元素可见')
    } catch (error) {
      console.error('❌ 导航到配置项创建页面失败:', error)
      throw error
    }
  }

  /**
   * 填写配置项创建表单
   * @param data 表单数据
   * @throws {Error} 表单填写失败
   */
  async fillForm(data: { name: string; type: string; ip?: string; project?: string; environment?: string; description?: string }) {
    console.log('填写配置项创建表单...')
    try {
      // 填写名称
      await this.page.fill('[data-testid="input-ci-name"]', data.name)
      console.log('✓ 填写名称:', data.name)

      // 选择类型
      await this.page.click('[data-testid="select-ci-type"]')
      await this.page.click(`text=${data.type}`)
      console.log('✓ 选择类型:', data.type)

      // 填写IP地址（可选）
      if (data.ip) {
        await this.page.fill('[data-testid="input-ci-ip"]', data.ip)
        console.log('✓ 填写IP地址:', data.ip)
      }

      // 填写项目（可选）
      if (data.project) {
        await this.page.fill('[data-testid="input-ci-project"]', data.project)
        console.log('✓ 填写项目:', data.project)
      }

      // 选择环境（可选）
      if (data.environment) {
        await this.page.click('[data-testid="select-ci-environment"]')
        await this.page.click(`text=${data.environment}`)
        console.log('✓ 选择环境:', data.environment)
      }

      // 填写描述（可选）
      if (data.description) {
        await this.page.fill('[data-testid="textarea-ci-description"]', data.description)
        console.log('✓ 填写描述')
      }

      console.log('✓ 表单填写完成')
    } catch (error) {
      console.error('❌ 表单填写失败:', error)
      throw error
    }
  }

  /**
   * 提交表单
   * @throws {Error} 提交失败
   */
  async submit() {
    console.log('提交配置项创建表单...')
    try {
      // 确保提交按钮可见后再点击
      await this.page.waitForSelector('[data-testid="button-ci-submit"]', { timeout: 15000, state: 'visible' })
      console.log('✓ 提交按钮可见')
      
      await this.page.click('[data-testid="button-ci-submit"]')
      console.log('✓ 点击提交按钮')
    } catch (error) {
      console.error('❌ 提交表单失败:', error)
      throw error
    }
  }

  /**
   * 验证表单可见
   * @throws {Error} 表单不可见
   */
  async expectFormVisible() {
    console.log('验证配置项创建表单可见...')
    try {
      await expect(this.page.locator('[data-testid="form-ci-create"]')).toBeVisible({ timeout: 15000 })
      console.log('✓ 配置项创建表单可见')
    } catch (error) {
      console.error('❌ 配置项创建表单不可见:', error)
      throw error
    }
  }

  /**
   * 验证配置项创建成功
   * 1. 等待成功消息出现（可选）
   * 2. 等待URL跳转到配置项列表页
   * 3. 等待页面加载完成
   * 4. 验证列表页面元素可见
   * @throws {Error} 创建成功验证失败
   */
  async expectCreateSuccess() {
    console.log('开始验证配置项创建成功...')
    
    try {
      // 等待成功消息出现
      try {
        await this.page.waitForSelector('.ant-message-success', { timeout: 15000 })
        console.log('✓ 成功消息出现')
      } catch (error) {
        // 即使没有成功消息，也要继续等待URL跳转
        console.log('⚠ 未找到成功消息，继续等待URL跳转')
      }
      
      // 等待URL跳转，增加超时时间
      try {
        await this.page.waitForURL((url: URL) => url.pathname.includes('/ci/list'), { timeout: 30000 })
        console.log('✓ URL跳转到配置项列表页')
        console.log('当前URL:', this.page.url())
      } catch (error) {
        console.error('❌ URL跳转失败:', error)
        console.log('当前URL:', this.page.url())
        throw error
      }
      
      // 等待页面加载完成
      await this.page.waitForLoadState('domcontentloaded', { timeout: 20000 })
      console.log('✓ 页面加载完成')
      
      // 验证列表页面可见
      try {
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
        throw error
      }
      
      console.log('✓ 配置项创建成功验证完成')
    } catch (error) {
      console.error('❌ 配置项创建成功验证失败:', error)
      throw error
    }
  }

  /**
   * 取消创建操作
   * 1. 确保取消按钮可见
   * 2. 点击取消按钮
   * @throws {Error} 取消操作失败
   */
  async cancel() {
    console.log('取消配置项创建操作...')
    try {
      // 确保取消按钮可见后再点击
      await this.page.waitForSelector('[data-testid="button-ci-cancel"]', { timeout: 15000, state: 'visible' })
      console.log('✓ 取消按钮可见')
      
      await this.page.click('[data-testid="button-ci-cancel"]')
      console.log('✓ 点击取消按钮')
    } catch (error) {
      console.error('❌ 取消操作失败:', error)
      throw error
    }
  }

  /**
   * 验证表单验证错误
   * @param message 错误消息
   * @throws {Error} 验证错误不可见
   */
  async expectValidationError(message: string) {
    console.log('验证表单验证错误...')
    try {
      await expect(this.page.locator('.ant-form-item-explain-error')).toContainText(message, { timeout: 15000 })
      console.log('✓ 验证错误可见:', message)
    } catch (error) {
      console.error('❌ 验证错误不可见:', error)
      throw error
    }
  }

  /**
   * 验证字段验证错误
   * @param field 字段名称
   * @param message 错误消息
   * @throws {Error} 字段验证错误不可见
   */
  async expectFieldValidation(field: 'name' | 'type', message: string) {
    console.log(`验证${field === 'name' ? '名称' : '类型'}字段验证错误...`)
    try {
      const selector = field === 'name' ? '[data-testid="input-ci-name"]' : '[data-testid="select-ci-type"]'
      const formItem = this.page.locator(selector).locator('..').locator('..')
      await expect(formItem.locator('.ant-form-item-explain-error')).toContainText(message, { timeout: 15000 })
      console.log('✓ 字段验证错误可见:', message)
    } catch (error) {
      console.error('❌ 字段验证错误不可见:', error)
      throw error
    }
  }

  /**
   * 清空字段
   * @param field 字段名称
   * @throws {Error} 清空字段失败
   */
  async clearField(field: 'name' | 'type' | 'ip' | 'project') {
    console.log(`清空${field}字段...`)
    try {
      const testIdMap = {
        name: 'input-ci-name',
        type: 'select-ci-type',
        ip: 'input-ci-ip',
        project: 'input-ci-project'
      }
      await this.page.fill(`[data-testid="${testIdMap[field]}"]`, '')
      console.log(`✓ 清空${field}字段成功`)
    } catch (error) {
      console.error(`❌ 清空${field}字段失败:`, error)
      throw error
    }
  }

  /**
   * 触发字段验证
   * @param field 字段名称
   * @throws {Error} 触发验证失败
   */
  async triggerFieldValidation(field: 'name' | 'type') {
    console.log(`触发${field === 'name' ? '名称' : '类型'}字段验证...`)
    try {
      const selector = field === 'name' ? '[data-testid="input-ci-name"]' : '[data-testid="select-ci-type"]'
      await this.page.click(selector)
      await this.page.click('body') // 点击外部触发失焦验证
      console.log(`✓ 触发${field === 'name' ? '名称' : '类型'}字段验证成功`)
    } catch (error) {
      console.error(`❌ 触发${field === 'name' ? '名称' : '类型'}字段验证失败:`, error)
      throw error
    }
  }
}
