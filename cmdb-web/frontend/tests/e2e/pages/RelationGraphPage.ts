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
    expect(tagText).toContain(`节点：${count}`)
  }

  async clickNode(nodeId: string) {
    await this.page.evaluate((id) => {
      window.dispatchEvent(new CustomEvent('test-node-click', { detail: { nodeId: id } }))
    }, nodeId)
  }

  async expectNodeSelected(nodeId: string) {
    await expect(this.page.locator('[data-testid="ci-detail-panel"]')).toBeVisible()
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
    await this.page.click('[data-testid="zoom-in-button"]')
  }

  async zoomOut() {
    await this.page.click('[data-testid="zoom-out-button"]')
  }

  async resetView() {
    await this.page.click('[data-testid="reset-view-button"]')
  }

  async toggleFullscreen() {
    await this.page.click('[data-testid="fullscreen-button"]')
  }

  async expectImpactAnalysisVisible() {
    await expect(this.page.locator('[data-testid="impact-analysis-panel"]')).toBeVisible()
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