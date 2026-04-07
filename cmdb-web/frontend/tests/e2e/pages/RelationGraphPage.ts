import { test, expect, Page } from '@playwright/test'

export class RelationGraphPage {
  constructor(private page: Page) {}

  async goto() {
    try {
      console.log('开始导航到关系图谱页面...')
      // 先导航到根路径，确保页面状态干净
      await this.page.goto('/', { timeout: 30000, waitUntil: 'domcontentloaded' })
      console.log('✓ 成功导航到根路径')
      
      // 然后导航到关系图谱页面
      await this.page.goto('/relation/graph', { timeout: 60000, waitUntil: 'domcontentloaded' })
      console.log('✓ 成功导航到关系图谱页面')
      
      // 等待页面加载完成
      await this.page.waitForLoadState('load', { timeout: 30000 })
      console.log('✓ 页面加载完成')
    } catch (error) {
      console.error('❌ 导航到关系图谱页面失败:', error)
      throw error
    }
  }

  async expectGraphVisible() {
    try {
      console.log('验证关系图谱可见...')
      // 等待关系图谱容器可见
      await this.page.waitForSelector('[data-testid="card-graph-container"]', { timeout: 30000, state: 'visible' })
      console.log('✓ 关系图谱容器可见')
      
      // 等待加载完成（如果有加载状态）
      try {
        await this.page.waitForSelector('.ant-spin', { timeout: 10000, state: 'hidden' })
        console.log('✓ 加载状态已消失')
      } catch (error) {
        // 加载状态可能不存在，继续执行
        console.log('⚠ 未找到加载状态，继续执行')
      }
      
      // 验证图谱容器可见
      const graphContainer = this.page.locator('[data-testid="card-graph-container"]')
      await expect(graphContainer).toBeVisible({ timeout: 30000 })
      console.log('✓ 关系图谱可见')
    } catch (error) {
      console.error('❌ 关系图谱不可见:', error)
      throw error
    }
  }

  async expectNodeCount(count: number) {
    try {
      console.log(`验证节点数量: ${count}...`)
      const nodeTag = this.page.locator('text=节点:')
      await nodeTag.waitFor({ timeout: 15000 })
      console.log('✓ 节点标签可见')
      const tagText = await nodeTag.textContent()
      expect(tagText).toContain(`节点: ${count}`)
      console.log(`✓ 节点数量正确: ${count}`)
    } catch (error) {
      console.error('❌ 验证节点数量失败:', error)
      throw error
    }
  }

  async clickNode(nodeId: string) {
    console.log(`点击节点: ${nodeId}...`)
    // 通过evaluate调用store的setSelectedNode
    await this.page.evaluate((id) => {
      // 触发一个自定义事件，让页面处理
      window.dispatchEvent(new CustomEvent('test-node-click', { detail: { nodeId: id } }))
    }, nodeId)
    
    // 等待节点详情卡片可见，避免固定睡眠
    await this.page.waitForSelector('[data-testid="card-node-detail"]', { timeout: 15000, state: 'visible' })
    console.log('✓ 节点详情卡片可见')
  }

  async expectNodeSelected(nodeId: string) {
    console.log(`验证节点 ${nodeId} 被选中...`)
    // 增加超时时间，确保节点详情卡片有足够时间加载
    await this.page.waitForSelector('[data-testid="card-node-detail"]', { timeout: 15000, state: 'visible' })
    console.log('✓ 节点详情卡片可见')
    await expect(this.page.locator('[data-testid="card-node-detail"]')).toBeVisible({ timeout: 15000 })
  }

  async searchNode(searchText: string) {
    try {
      console.log(`搜索节点: ${searchText}...`)
      // 使用正确的搜索框 ID
      await this.page.waitForSelector('[data-testid="input-search"]', { timeout: 15000, state: 'visible' })
      console.log('✓ 搜索框可见')
      await this.page.fill('[data-testid="input-search"]', searchText)
      console.log('✓ 填写搜索关键词')
      await this.page.click('[data-testid="button-apply-filter"]', { timeout: 15000 })
      console.log('✓ 点击搜索按钮')
      // 等待搜索结果加载
      await this.page.waitForLoadState('domcontentloaded', { timeout: 15000 })
      console.log('✓ 搜索结果加载完成')
    } catch (error) {
      console.error('❌ 搜索节点失败:', error)
      throw error
    }
  }

  async filterByCIType(ciType: string) {
    try {
      console.log(`按类型过滤: ${ciType}...`)
      // 使用正确的 CI 类型选择器 ID
      await this.page.waitForSelector('[data-testid="select-ci-types"]', { timeout: 15000, state: 'visible' })
      console.log('✓ 类型选择器可见')
      await this.page.click('[data-testid="select-ci-types"]')
      console.log('✓ 点击类型选择器')
      await this.page.click(`text=${ciType}`, { timeout: 15000 })
      console.log(`✓ 选择类型: ${ciType}`)
      await this.page.click('[data-testid="button-apply-filter"]', { timeout: 15000 })
      console.log('✓ 点击过滤按钮')
      // 等待筛选结果加载
      await this.page.waitForLoadState('domcontentloaded', { timeout: 15000 })
      console.log('✓ 筛选结果加载完成')
    } catch (error) {
      console.error('❌ 按类型过滤失败:', error)
      throw error
    }
  }

  async zoomIn() {
    console.log('放大视图...')
    await this.page.waitForSelector('[data-testid="button-zoom-in"]', { timeout: 15000, state: 'visible' })
    console.log('✓ 放大按钮可见')
    await this.page.click('[data-testid="button-zoom-in"]', { timeout: 30000 })
    console.log('✓ 点击放大按钮')
  }

  async zoomOut() {
    console.log('缩小视图...')
    await this.page.waitForSelector('[data-testid="button-zoom-out"]', { timeout: 15000, state: 'visible' })
    console.log('✓ 缩小按钮可见')
    await this.page.click('[data-testid="button-zoom-out"]', { timeout: 30000 })
    console.log('✓ 点击缩小按钮')
  }

  async resetView() {
    console.log('重置视图...')
    await this.page.waitForSelector('[data-testid="button-reset-view"]', { timeout: 15000, state: 'visible' })
    console.log('✓ 重置视图按钮可见')
    await this.page.click('[data-testid="button-reset-view"]', { timeout: 30000 })
    console.log('✓ 点击重置视图按钮')
  }

  async toggleFullscreen() {
    console.log('切换全屏...')
    await this.page.waitForSelector('[data-testid="button-fullscreen"]', { timeout: 15000, state: 'visible' })
    console.log('✓ 全屏按钮可见')
    await this.page.click('[data-testid="button-fullscreen"]', { timeout: 30000 })
    console.log('✓ 点击全屏按钮')
  }

  async expectImpactAnalysisVisible() {
    try {
      console.log('验证影响分析按钮可见...')
      // 增加超时时间，确保影响分析按钮有足够时间加载
      await this.page.waitForSelector('[data-testid="button-impact-analysis"]', { timeout: 15000, state: 'visible' })
      console.log('✓ 影响分析按钮可见')
      await expect(this.page.locator('[data-testid="button-impact-analysis"]')).toBeVisible({ timeout: 15000 })
    } catch (error) {
      console.error('❌ 影响分析按钮不可见:', error)
      throw error
    }
  }

  async getUpstreamNodes() {
    // 暂时返回空数组，实际实现需要根据前端代码调整
    return []
  }

  async getDownstreamNodes() {
    // 暂时返回空数组，实际实现需要根据前端代码调整
    return []
  }

  async createRelation(sourceCI: string, targetCI: string, relationType: string) {
    try {
      console.log(`创建关系: ${sourceCI} -> ${targetCI} (${relationType})...`)
      // 这里需要根据实际的创建关系按钮 ID 进行调整
      // 暂时跳过，因为页面上可能没有直接的创建关系按钮
      console.log('⚠ 跳过创建关系操作，页面上可能没有直接的创建关系按钮')
    } catch (error) {
      console.error('❌ 创建关系失败:', error)
      throw error
    }
  }

  async deleteRelation(relationId: string) {
    // 暂时跳过删除操作，实际实现需要根据前端代码调整
  }
}