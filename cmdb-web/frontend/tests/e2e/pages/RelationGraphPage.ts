import { test, expect, Page } from '@playwright/test'

export class RelationGraphPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/relation/graph')
  }

  async expectGraphVisible() {
    await expect(this.page.locator('[data-testid="relation-graph"]')).toBeVisible({ timeout: 30000 })
  }

  async expectNodeCount(count: number) {
    const nodeTag = await this.page.locator('text=节点:')
    await expect(nodeTag).toBeVisible()
    const tagText = await nodeTag.textContent()
    expect(tagText).toContain(`节点: ${count}`)
  }

  async clickNode(nodeId: string) {
    // 通过evaluate调用store的setSelectedNode
    await this.page.evaluate((id) => {
      // 查找并点击图谱中的节点元素
      const graphContainer = document.querySelector('[data-testid="relation-graph"]')
      if (graphContainer) {
        // 触发一个自定义事件，让页面处理
        window.dispatchEvent(new CustomEvent('test-node-click', { detail: { nodeId: id } }))
      }
    }, nodeId)
    
    // 等待详情面板出现
    await this.page.waitForTimeout(500)
  }

  async expectNodeSelected(nodeId: string) {
    await expect(this.page.locator('[data-testid="card-node-detail"]')).toBeVisible()
  }

  async searchNode(searchText: string) {
    await this.page.fill('[data-testid="search-node-input"]', searchText)
    await this.page.press('[data-testid="search-node-input"]', 'Enter')
  }

  async filterByCIType(ciType: string) {
    await this.page.click('[data-testid="filter-ci-type"]')
    await this.page.click(`text=${ciType}`)
  }

  async zoomIn() {
    await this.page.click('[data-testid="button-zoom-in"]')
  }

  async zoomOut() {
    await this.page.click('[data-testid="button-zoom-out"]')
  }

  async resetView() {
    await this.page.click('[data-testid="button-reset-view"]')
  }

  async toggleFullscreen() {
    await this.page.click('[data-testid="button-fullscreen"]')
  }

  async expectImpactAnalysisVisible() {
    await expect(this.page.locator('[data-testid="button-impact-analysis"]')).toBeVisible()
  }

  async getUpstreamNodes() {
    const nodes = await this.page.locator('[data-testid="upstream-node"]').all()
    return nodes
  }

  async getDownstreamNodes() {
    const nodes = await this.page.locator('[data-testid="downstream-node"]').all()
    return nodes
  }

  async createRelation(sourceCI: string, targetCI: string, relationType: string) {
    await this.page.click('[data-testid="create-relation-button"]')
    await this.page.fill('[data-testid="source-ci-input"]', sourceCI)
    await this.page.fill('[data-testid="target-ci-input"]', targetCI)
    await this.page.click('[data-testid="relation-type-select"]')
    await this.page.click(`text=${relationType}`)
    await this.page.click('[data-testid="submit-relation-button"]')
  }

  async deleteRelation(relationId: string) {
    await this.page.click(`[data-testid="delete-relation-${relationId}"]`)
    await this.page.click('[data-testid="confirm-delete-button"]')
  }
}