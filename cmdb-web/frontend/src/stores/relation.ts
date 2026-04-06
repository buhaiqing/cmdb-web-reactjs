import { create } from 'zustand'
import { api } from './user'

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

// 节点样式配置 - 颜色映射
export const CINodeColors: Record<CIType, string> = {
  server: '#1890ff',      // 蓝色
  database: '#52c41a',    // 绿色
  application: '#faad14', // 橙色
  middleware: '#722ed1',  // 紫色
  container: '#13c2c2',   // 青色
  cloud: '#eb2f96',       // 粉色
  default: '#999999',     // 灰色
}

// 节点大小配置
export const CINodeSizes: Record<CIType, number> = {
  server: 50,
  database: 50,
  application: 45,
  middleware: 45,
  container: 40,
  cloud: 55,
  default: 45,
}

// 节点标签映射
export const CITypeLabels: Record<CIType, string> = {
  server: '服务器',
  database: '数据库',
  application: '应用',
  middleware: '中间件',
  container: '容器',
  cloud: '云服务',
  default: '其他',
}

export interface ImpactAnalysisResult {
  upstream: RelationNode[]
  downstream: RelationNode[]
  directRelations: Relation[]
}

export const relationTypeMap: Record<RelationType, string> = {
  depends_on: '依赖',
  connected_to: '连接',
  runs_on: '运行于',
  contains: '包含',
  belongs_to: '属于',
}

interface RelationState {
  relations: Relation[]
  nodes: RelationNode[]
  edges: RelationEdge[]
  relationGraph: { nodes: RelationNode[]; edges: RelationEdge[] }
  impactAnalysis: ImpactAnalysisResult | null
  isLoading: boolean
  selectedNode: RelationNode | null

  fetchRelations: (ciId?: string) => Promise<void>
  createRelation: (data: Omit<Relation, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>
  updateRelation: (id: string, data: Partial<Relation>) => Promise<boolean>
  deleteRelation: (id: string) => Promise<boolean>

  fetchRelationGraph: (ciId?: string) => Promise<void>
  fetchRelationData: (params?: { ciTypes?: string[]; relationTypes?: string[]; search?: string }) => Promise<void>

  analyzeImpact: (ciId: string) => Promise<void>
  setSelectedNode: (node: RelationNode | null) => void
  zoomIn: () => void
  zoomOut: () => void
  resetView: () => void
  toggleFullscreen: () => void
}

const mockRelations: Relation[] = [
  {
    id: '1',
    sourceCI: 'ci-001',
    targetCI: 'ci-002',
    relationType: 'depends_on',
    description: '应用服务依赖数据库',
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-01-15T08:00:00Z',
  },
  {
    id: '2',
    sourceCI: 'ci-003',
    targetCI: 'ci-001',
    relationType: 'connected_to',
    description: '负载均衡连接应用服务',
    createdAt: '2024-01-16T10:30:00Z',
    updatedAt: '2024-01-16T10:30:00Z',
  },
  {
    id: '3',
    sourceCI: 'ci-004',
    targetCI: 'ci-005',
    relationType: 'runs_on',
    description: '容器运行在主机上',
    createdAt: '2024-01-17T14:20:00Z',
    updatedAt: '2024-01-17T14:20:00Z',
  },
  {
    id: '4',
    sourceCI: 'ci-006',
    targetCI: 'ci-007',
    relationType: 'contains',
    description: '集群包含节点',
    createdAt: '2024-01-18T09:15:00Z',
    updatedAt: '2024-01-18T09:15:00Z',
  },
]

const mockRelationGraph = {
  nodes: [
    { id: 'ci-001', name: '应用服务器-01', type: 'server', status: 'running' },
    { id: 'ci-002', name: 'MySQL主库', type: 'database', status: 'running' },
    { id: 'ci-003', name: '负载均衡器', type: 'loadbalancer', status: 'running' },
    { id: 'ci-004', name: '容器实例-01', type: 'container', status: 'running' },
    { id: 'ci-005', name: '物理主机-01', type: 'host', status: 'running' },
  ],
  edges: [
    { id: '1', source: 'ci-001', target: 'ci-002', relationType: 'depends_on' as RelationType, description: '应用服务依赖数据库' },
    { id: '2', source: 'ci-003', target: 'ci-001', relationType: 'connected_to' as RelationType, description: '负载均衡连接应用服务' },
    { id: '3', source: 'ci-004', target: 'ci-005', relationType: 'runs_on' as RelationType, description: '容器运行在主机上' },
  ],
}

const mockImpactAnalysis: ImpactAnalysisResult = {
  upstream: [
    { id: 'ci-003', name: '负载均衡器', type: 'loadbalancer', status: 'running' },
  ],
  downstream: [
    { id: 'ci-002', name: 'MySQL主库', type: 'database', status: 'running' },
  ],
  directRelations: [
    {
      id: '1',
      sourceCI: 'ci-001',
      targetCI: 'ci-002',
      relationType: 'depends_on',
      description: '应用服务依赖数据库',
      createdAt: '2024-01-15T08:00:00Z',
      updatedAt: '2024-01-15T08:00:00Z',
    },
    {
      id: '2',
      sourceCI: 'ci-003',
      targetCI: 'ci-001',
      relationType: 'connected_to',
      description: '负载均衡连接应用服务',
      createdAt: '2024-01-16T10:30:00Z',
      updatedAt: '2024-01-16T10:30:00Z',
    },
  ],
}

export const useRelationStore = create<RelationState>((set, get) => ({
  relations: [],
  nodes: [],
  edges: [],
  relationGraph: { nodes: [], edges: [] },
  impactAnalysis: null,
  isLoading: false,
  selectedNode: null,

  fetchRelations: async (ciId?: string) => {
    set({ isLoading: true })
    try {
      const response = await api.get('/relations', {
        params: ciId ? { ciId } : undefined,
      })
      const items = response.data?.data || mockRelations
      set({ relations: items, isLoading: false })
    } catch (error) {
      console.warn('Using mock data for relations:', error)
      set({ relations: mockRelations, isLoading: false })
    }
  },

  createRelation: async (data: Omit<Relation, 'id' | 'createdAt' | 'updatedAt'>) => {
    set({ isLoading: true })
    try {
      await api.post('/relations', data)
      set({ isLoading: false })
      await get().fetchRelations()
      return true
    } catch (error) {
      console.warn('Mock create relation:', error)
      const newRelation: Relation = {
        ...data,
        id: `rel-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      set((state) => ({
        relations: [...state.relations, newRelation],
        isLoading: false,
      }))
      return true
    }
  },

  updateRelation: async (id: string, data: Partial<Relation>) => {
    set({ isLoading: true })
    try {
      await api.put(`/relations/${id}`, data)
      set({ isLoading: false })
      await get().fetchRelations()
      return true
    } catch (error) {
      console.warn('Mock update relation:', error)
      set((state) => ({
        relations: state.relations.map((rel) =>
          rel.id === id ? { ...rel, ...data, updatedAt: new Date().toISOString() } : rel
        ),
        isLoading: false,
      }))
      return true
    }
  },

  deleteRelation: async (id: string) => {
    set({ isLoading: true })
    try {
      await api.delete(`/relations/${id}`)
      set({ isLoading: false })
      await get().fetchRelations()
      return true
    } catch (error) {
      console.warn('Mock delete relation:', error)
      set((state) => ({
        relations: state.relations.filter((rel) => rel.id !== id),
        isLoading: false,
      }))
      return true
    }
  },

  fetchRelationGraph: async (ciId?: string) => {
    set({ isLoading: true })
    try {
      const response = await api.get('/relations/graph', {
        params: ciId ? { ciId } : undefined,
      })
      const graphData = response.data?.data || mockRelationGraph
      set({ relationGraph: graphData, isLoading: false })
    } catch (error) {
      console.warn('Using mock data for relation graph:', error)
      set({ relationGraph: mockRelationGraph, isLoading: false })
    }
  },

  analyzeImpact: async (ciId: string) => {
    set({ isLoading: true })
    try {
      const response = await api.get(`/relations/impact/${ciId}`)
      const impactData = response.data?.data || mockImpactAnalysis
      set({ impactAnalysis: impactData, isLoading: false })
    } catch (error) {
      console.warn('Using mock data for impact analysis:', error)
      set({ impactAnalysis: mockImpactAnalysis, isLoading: false })
    }
  },

  fetchRelationData: async (params) => {
    set({ isLoading: true })
    try {
      const response = await api.get('/relations/graph', {
        params: {
          ciTypes: params?.ciTypes?.join(','),
          relationTypes: params?.relationTypes?.join(','),
          search: params?.search,
        },
      })
      const graphData = response.data?.data || mockRelationGraph
      set({
        nodes: graphData.nodes || [],
        edges: graphData.edges || [],
        relationGraph: graphData,
        isLoading: false,
      })
    } catch (error) {
      console.warn('Using mock data for relation graph:', error)
      set({
        nodes: mockRelationGraph.nodes,
        edges: mockRelationGraph.edges,
        relationGraph: mockRelationGraph,
        isLoading: false,
      })
    }
  },

  setSelectedNode: (node: RelationNode | null) => {
    set({ selectedNode: node })
  },

  zoomIn: () => {
    // Placeholder for zoom functionality
    console.log('Zoom in')
  },

  zoomOut: () => {
    // Placeholder for zoom functionality
    console.log('Zoom out')
  },

  resetView: () => {
    // Placeholder for reset view functionality
    console.log('Reset view')
  },

  toggleFullscreen: () => {
    // Placeholder for fullscreen toggle
    console.log('Toggle fullscreen')
  },
}))
