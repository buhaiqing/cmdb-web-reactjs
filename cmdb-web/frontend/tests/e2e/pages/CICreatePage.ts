import { expect, Page } from '@playwright/test'

/**
 * 配置项创建页面测试类
 * 提供配置项创建页面的所有测试操作和验证方法
 */
export class CICreatePage {
  private testId: string = ''
  
  constructor(private page: Page) {}
  
  /**
   * 设置当前测试用例序号
   * @param testId 测试用例序号（如 CI-001）
   */
  setTestId(testId: string) {
    this.testId = testId
  }
  
  /**
   * 获取带序号的日志前缀
   */
  private getLogPrefix(): string {
    return this.testId ? `[${this.testId}]` : ''
  }

  /**
   * 导航到配置项创建页面
   * @throws {Error} 页面加载超时
   */
  async goto() {
    console.log(`${this.getLogPrefix()}[CICreatePage.goto] 导航到配置项创建页面...`)
    try {
      // 直接导航到配置项创建页面
      await this.page.goto('/ci/create', { timeout: 30000, waitUntil: 'commit' })
      console.log(`${this.getLogPrefix()}[CICreatePage.goto] ✓ 成功导航到配置项创建页面，URL:`, this.page.url())

      // 等待页面加载完成
      await this.page.waitForLoadState('domcontentloaded', { timeout: 15000 })
      console.log(`${this.getLogPrefix()}[CICreatePage.goto] ✓ 页面加载完成`)

      // 等待 Zustand hydration 完成 - 使用更灵活的等待策略
      // 由于并发测试可能导致 hydration 延迟，增加重试机制
      let retries = 0
      const maxRetries = 3
      
      while (retries < maxRetries) {
        try {
          // 检查是否还在加载状态（显示 Spin）
          const isLoading = await this.page.locator('.ant-spin').isVisible({ timeout: 1000 }).catch(() => false)
          
          if (isLoading) {
            console.log(`${this.getLogPrefix()}[CICreatePage.goto] ⚠ 检测到加载状态，等待 hydration 完成...`)
            await this.page.waitForTimeout(2000)
            retries++
            continue
          }
          
          // 检查主内容区域是否可见
          await this.page.waitForSelector('[data-testid="content-main"]', { timeout: 5000, state: 'visible' })
          console.log(`${this.getLogPrefix()}[CICreatePage.goto] ✓ 应用布局加载完成（Zustand hydration 完成）`)
          break
        } catch (error) {
          retries++
          if (retries < maxRetries) {
            console.log(`${this.getLogPrefix()}[CICreatePage.goto] ⚠ 第 ${retries} 次重试等待 hydration...`)
            await this.page.waitForTimeout(3000)
          } else {
            // 最后一次尝试：直接等待表单元素，跳过 content-main 检查
            console.log(`${this.getLogPrefix()}[CICreatePage.goto] ⚠ 达到最大重试次数，直接等待表单元素`)
          }
        }
      }

      // 等待表单元素出现（最关键的验证）
      await this.page.waitForSelector('[data-testid="form-ci-create"]', { timeout: 20000, state: 'visible' })
      console.log(`${this.getLogPrefix()}[CICreatePage.goto] ✓ 表单元素可见`)
    } catch (error) {
      console.error(`${this.getLogPrefix()}[CICreatePage.goto] ❌ 导航到配置项创建页面失败:`, error)
      console.error(`${this.getLogPrefix()}[CICreatePage.goto] 当前 URL:`, this.page.url())
      throw error
    }
  }

  /**
   * 填写配置项创建表单
   * @param data 表单数据
   * @throws {Error} 表单填写失败
   */
  async fillForm(data: { name: string; type: string; ip?: string; project?: string; environment?: string; description?: string }) {
    console.log(`${this.getLogPrefix()} 填写配置项创建表单...`)
    try {
      // 填写名称
      await this.page.fill('[data-testid="input-ci-name"]', data.name)
      console.log(`${this.getLogPrefix()} ✓ 填写名称:`, data.name)

      // 选择类型
      await this.page.click('[data-testid="select-ci-type"]')
      await this.page.click(`text=${data.type}`)
      console.log(`${this.getLogPrefix()} ✓ 选择类型:`, data.type)

      // 填写IP地址（可选）
      if (data.ip) {
        await this.page.fill('[data-testid="input-ci-ip"]', data.ip)
        console.log(`${this.getLogPrefix()} ✓ 填写IP地址:`, data.ip)
      }

      // 填写项目（可选）
      if (data.project) {
        await this.page.fill('[data-testid="input-ci-project"]', data.project)
        console.log(`${this.getLogPrefix()} ✓ 填写项目:`, data.project)
      }

      // 选择环境（可选）
      if (data.environment) {
        await this.page.click('[data-testid="select-ci-environment"]')
        await this.page.click(`text=${data.environment}`)
        console.log(`${this.getLogPrefix()} ✓ 选择环境:`, data.environment)
      }

      // 填写描述（可选）
      if (data.description) {
        await this.page.fill('[data-testid="textarea-ci-description"]', data.description)
        console.log(`${this.getLogPrefix()} ✓ 填写描述`)
      }

      console.log(`${this.getLogPrefix()} ✓ 表单填写完成`)
    } catch (error) {
      console.error(`${this.getLogPrefix()} ❌ 表单填写失败:`, error)
      throw error
    }
  }

  /**
   * 提交表单
   * @throws {Error} 提交失败
   */
  async submit() {
    console.log(`${this.getLogPrefix()} 提交配置项创建表单...`)
    try {
      // 确保提交按钮可见后再点击
      await this.page.waitForSelector('[data-testid="button-ci-submit"]', { timeout: 15000, state: 'visible' })
      console.log(`${this.getLogPrefix()} ✓ 提交按钮可见`)
      
      await this.page.click('[data-testid="button-ci-submit"]')
      console.log(`${this.getLogPrefix()} ✓ 点击提交按钮`)
    } catch (error) {
      console.error(`${this.getLogPrefix()} ❌ 提交表单失败:`, error)
      throw error
    }
  }

  /**
   * 验证表单可见
   * @throws {Error} 表单不可见
   */
  async expectFormVisible() {
    console.log(`${this.getLogPrefix()} 验证配置项创建表单可见...`)
    try {
      await expect(this.page.locator('[data-testid="form-ci-create"]')).toBeVisible({ timeout: 15000 })
      console.log(`${this.getLogPrefix()} ✓ 配置项创建表单可见`)
    } catch (error) {
      console.error(`${this.getLogPrefix()} ❌ 配置项创建表单不可见:`, error)
      throw error
    }
  }

  /**
   * 验证配置项创建成功
   * 1. 等待成功消息出现（主要验证）
   * 2. 等待URL跳转到配置项列表页
   * 3. 等待页面加载完成
   * 4. 验证列表页面元素可见
   * @throws {Error} 创建成功验证失败
   */
  async expectCreateSuccess() {
    console.log(`${this.getLogPrefix()} 开始验证配置项创建成功...`)
    
    try {
      // 首先等待成功消息出现（最可靠的验证指标）
      const successMessage = this.page.locator('.ant-message-success')
      await expect(successMessage).toBeVisible({ timeout: 15000 })
      console.log(`${this.getLogPrefix()} ✓ 成功消息出现`)
      
      // 等待一小段时间确保 router.push 已执行
      await this.page.waitForTimeout(500)
      
      // 等待URL跳转（使用更宽松的匹配）
      try {
        await this.page.waitForURL((url: URL) => url.pathname.includes('/ci'), { timeout: 30000 })
        console.log(`${this.getLogPrefix()} ✓ URL跳转到配置项页面:`, this.page.url())
      } catch (error) {
        // 如果URL没有跳转，检查当前URL并尝试继续
        const currentUrl = this.page.url()
        console.log(`${this.getLogPrefix()} ⚠ URL跳转超时，当前URL:`, currentUrl)
        // 如果已经在 CI 页面，继续验证
        if (!currentUrl.includes('/ci')) {
          console.error(`${this.getLogPrefix()} ❌ URL未跳转到CI页面:`, currentUrl)
          throw error
        }
      }
      
      // 等待页面加载完成
      await this.page.waitForLoadState('domcontentloaded', { timeout: 20000 })
      console.log(`${this.getLogPrefix()} ✓ 页面加载完成`)
      
      // 验证列表页面可见
      try {
        // 先等待页面容器元素出现
        await this.page.waitForSelector('[data-testid="page-ci-list"]', { timeout: 20000 })
        console.log(`${this.getLogPrefix()} ✓ 配置项列表页面容器可见`)
        
        // 再等待表格元素出现
        await this.page.waitForSelector('[data-testid="table-ci-list"]', { timeout: 20000 })
        console.log(`${this.getLogPrefix()} ✓ 配置项列表表格可见`)
        
        // 验证元素可见
        await expect(this.page.locator('[data-testid="page-ci-list"]')).toBeVisible()
        await expect(this.page.locator('[data-testid="table-ci-list"]')).toBeVisible()
      } catch (error) {
        console.error(`${this.getLogPrefix()} ❌ 配置项列表页面元素不可见:`, error)
        throw error
      }
      
      console.log(`${this.getLogPrefix()} ✓ 配置项创建成功验证完成`)
    } catch (error) {
      console.error(`${this.getLogPrefix()} ❌ 配置项创建成功验证失败:`, error)
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
    console.log(`${this.getLogPrefix()} 取消配置项创建操作...`)
    try {
      // 确保取消按钮可见后再点击
      await this.page.waitForSelector('[data-testid="button-ci-cancel"]', { timeout: 15000, state: 'visible' })
      console.log(`${this.getLogPrefix()} ✓ 取消按钮可见`)
      
      await this.page.click('[data-testid="button-ci-cancel"]')
      console.log(`${this.getLogPrefix()} ✓ 点击取消按钮`)
    } catch (error) {
      console.error(`${this.getLogPrefix()} ❌ 取消操作失败:`, error)
      throw error
    }
  }

  /**
   * 验证表单验证错误
   * @param message 错误消息
   * @throws {Error} 验证错误不可见
   */
  async expectValidationError(message: string) {
    console.log(`${this.getLogPrefix()} 验证表单验证错误...`)
    try {
      await expect(this.page.locator('.ant-form-item-explain-error')).toContainText(message, { timeout: 15000 })
      console.log(`${this.getLogPrefix()} ✓ 验证错误可见:`, message)
    } catch (error) {
      console.error(`${this.getLogPrefix()} ❌ 验证错误不可见:`, error)
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
    console.log(`${this.getLogPrefix()} 验证${field === 'name' ? '名称' : '类型'}字段验证错误...`)
    try {
      const selector = field === 'name' ? '[data-testid="input-ci-name"]' : '[data-testid="select-ci-type"]'
      const formItem = this.page.locator(selector).locator('..').locator('..')
      await expect(formItem.locator('.ant-form-item-explain-error')).toContainText(message, { timeout: 15000 })
      console.log(`${this.getLogPrefix()} ✓ 字段验证错误可见:`, message)
    } catch (error) {
      console.error(`${this.getLogPrefix()} ❌ 字段验证错误不可见:`, error)
      throw error
    }
  }

  /**
   * 清空字段
   * @param field 字段名称
   * @throws {Error} 清空字段失败
   */
  async clearField(field: 'name' | 'type' | 'ip' | 'project') {
    console.log(`${this.getLogPrefix()} 清空${field}字段...`)
    try {
      const testIdMap = {
        name: 'input-ci-name',
        type: 'select-ci-type',
        ip: 'input-ci-ip',
        project: 'input-ci-project'
      }
      await this.page.fill(`[data-testid="${testIdMap[field]}"]`, '')
      console.log(`${this.getLogPrefix()} ✓ 清空${field}字段成功`)
    } catch (error) {
      console.error(`${this.getLogPrefix()} ❌ 清空${field}字段失败:`, error)
      throw error
    }
  }

  /**
   * 触发字段验证
   * @param field 字段名称
   * @throws {Error} 触发验证失败
   */
  async triggerFieldValidation(field: 'name' | 'type') {
    console.log(`${this.getLogPrefix()} 触发${field === 'name' ? '名称' : '类型'}字段验证...`)
    try {
      const selector = field === 'name' ? '[data-testid="input-ci-name"]' : '[data-testid="select-ci-type"]'
      await this.page.click(selector)
      await this.page.click('body') // 点击外部触发失焦验证
      console.log(`${this.getLogPrefix()} ✓ 触发${field === 'name' ? '名称' : '类型'}字段验证成功`)
    } catch (error) {
      console.error(`${this.getLogPrefix()} ❌ 触发${field === 'name' ? '名称' : '类型'}字段验证失败:`, error)
      throw error
    }
  }
}
