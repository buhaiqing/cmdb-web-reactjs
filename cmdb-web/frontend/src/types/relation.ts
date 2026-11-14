export type RelationType = 'depends_on' | 'connected_to' | 'runs_on' | 'contains' | 'belongs_to'

export interface Relation {
  id: string
  sourceCI: string
  targetCI: string
  relationType: RelationType
  description?: string
  createdAt: string
  updatedAt: string
}

// CI 类型枚举
export type CIType =
  | 'server'
  | 'database'
  | 'application'
  | 'middleware'
  | 'container'
  | 'cloud'
  | 'default'

export interface RelationNode {
  id: string
  name: string
  type: string | CIType
  status: string
  x?: number
  y?: number
  ip?: string
  project?: string
  environment?: string
  description?: string
  properties?: Record<string, unknown>
}

export interface RelationEdge {
  id: string
  source: string
  target: string
  relationType: RelationType | string
  relationName?: string
  description?: string
  properties?: Record<string, unknown>
}

// 关系图数据
export interface RelationGraphData {
  nodes: RelationNode[]
  edges: RelationEdge[]
}

export interface ImpactAnalysisResult {
  upstream: RelationNode[]
  downstream: RelationNode[]
  directRelations: Relation[]
}
