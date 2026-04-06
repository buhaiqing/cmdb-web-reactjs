'use client'

import React, { useEffect, useRef, useCallback, useState } from 'react'
import {
  RelationNode,
  RelationEdge,
  CIType,
  CINodeColors,
  CINodeSizes,
  CITypeLabels,
  relationTypeMap,
} from '@/stores/relation'

/**
 * 关系图组件 Props 接口
 */
export interface RelationGraphProps {
  /** 可选，指定 CI 时以该 CI 为中心 */
  ciId?: string
  /** 图表宽度 */
  width?: number
  /** 图表高度 */
  height?: number
  /** 节点数据 */
  nodes?: RelationNode[]
  /** 边数据 */
  edges?: RelationEdge[]
  /** 节点点击回调 */
  onNodeClick?: (nodeId: string, nodeData: RelationNode) => void
  /** 边点击回调 */
  onEdgeClick?: (edge: RelationEdge) => void
  /** 节点双击回调 */
  onNodeDoubleClick?: (nodeId: string, nodeData: RelationNode) => void
  /** 是否只读模式 */
  readonly?: boolean
  /** 布局类型 */
  layout?: 'force' | 'dagre' | 'circular'
  /** 加载状态 */
  loading?: boolean
  /** 自定义样式类名 */
  className?: string
}

// G6 类型声明
interface G6Graph {
  destroy: () => void
  read: (data: GraphData) => void
  changeData: (data: GraphData) => void
  changeSize: (width: number, height: number) => void
  layout: () => void
  setLayout: (layout: LayoutConfig) => void
  findById: (id: string) => G6Item | null
  focusItem: (item: G6Item, animate?: boolean, options?: { duration?: number; easing?: string }) => void
  getNodes: () => G6Item[]
  setItemState: (item: G6Item, state: string, value: boolean) => void
  on: (event: string, callback: (evt: G6Event) => void) => void
  off: (event: string, callback: (evt: G6Event) => void) => void
  zoom: (ratio: number, center?: { x: number; y: number }) => void
  getZoom: () => number
  fitView: () => void
}

interface G6Item {
  getID: () => string
  getModel: () => G6NodeModel | G6EdgeModel
}

interface G6NodeModel {
  id: string
  data?: RelationNode
  x?: number
  y?: number
  [key: string]: unknown
}

interface G6EdgeModel {
  id: string
  source: string
  target: string
  data?: RelationEdge
  [key: string]: unknown
}

interface G6Event {
  item?: G6Item
  target?: unknown
  [key: string]: unknown
}

interface GraphData {
  nodes: G6NodeData[]
  edges: G6EdgeData[]
}

interface G6NodeData {
  id: string
  data: RelationNode & { label: string }
  style: {
    fill: string
    stroke: string
    lineWidth: number
    size: number
    labelFill: string
    labelFontSize: number
    labelFontWeight: number
    labelOffsetY: number
    shadowColor: string
    shadowBlur: number
    shadowOffsetX: number
    shadowOffsetY: number
    cursor: string
    x?: number
    y?: number
  }
}

interface G6EdgeData {
  id: string
  source: string
  target: string
  data: RelationEdge & { label: string }
  style: {
    stroke: string
    lineWidth: number
    endArrow: boolean
    endArrowSize: number
    labelFill: string
    labelFontSize: number
    labelBackgroundFill: string
    labelBackgroundPadding: [number, number]
    labelBackgroundRadius: number
    cursor: string
  }
}

interface LayoutConfig {
  type: string
  [key: string]: unknown
}

// 动态导入 G6
let G6Module: typeof import('@antv/g6') | null = null

/**
 * 关系图可视化组件
 *
 * 基于 @antv/g6 的交互式关系图，支持：
 * - 力导向/层次/环形布局
 * - 节点拖拽、画布缩放
 * - 点击选中、双击查看详情
 * - 鼠标悬停显示 tooltip
 */
export const RelationGraph: React.FC<RelationGraphProps> = ({
  ciId,
  width = 800,
  height = 600,
  nodes = [],
  edges = [],
  onNodeClick,
  onEdgeClick,
  onNodeDoubleClick,
  readonly = false,
  layout = 'force',
  loading = false,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const graphRef = useRef<G6Graph | null>(null)
  const selectedNodeRef = useRef<string | null>(null)
  const [g6Loaded, setG6Loaded] = useState(false)

  // 动态加载 G6
  useEffect(() => {
    let mounted = true
    import('@antv/g6')
      .then((module) => {
        if (mounted) {
          G6Module = module
          setG6Loaded(true)
        }
      })
      .catch((err) => {
        console.error('Failed to load @antv/g6:', err)
      })
    return () => {
      mounted = false
    }
  }, [])

  // 获取节点样式
  const getNodeStyle = useCallback((nodeType: string, isSelected: boolean = false): G6NodeData['style'] => {
    const type = (nodeType as CIType) in CINodeColors ? (nodeType as CIType) : 'default'
    const color = CINodeColors[type]
    const size = CINodeSizes[type]

    return {
      fill: color,
      stroke: isSelected ? '#ff4d4f' : '#fff',
      lineWidth: isSelected ? 3 : 2,
      size: isSelected ? size + 8 : size,
      labelFill: '#262626',
      labelFontSize: 12,
      labelFontWeight: isSelected ? 600 : 400,
      labelOffsetY: size / 2 + 10,
      shadowColor: 'rgba(0, 0, 0, 0.15)',
      shadowBlur: isSelected ? 15 : 8,
      shadowOffsetX: 0,
      shadowOffsetY: 2,
      cursor: readonly ? 'default' : 'pointer',
    }
  }, [readonly])

  // 获取边样式
  const getEdgeStyle = useCallback((): G6EdgeData['style'] => {
    return {
      stroke: '#bfbfbf',
      lineWidth: 1.5,
      endArrow: true,
      endArrowSize: 10,
      labelFill: '#595959',
      labelFontSize: 11,
      labelBackgroundFill: 'rgba(255, 255, 255, 0.85)',
      labelBackgroundPadding: [4, 6],
      labelBackgroundRadius: 4,
      cursor: readonly ? 'default' : 'pointer',
    }
  }, [readonly])

  // 转换数据为 G6 格式
  const transformData = useCallback((): GraphData => {
    const nodeData: G6NodeData[] = nodes.map((node) => {
      const isSelected = node.id === selectedNodeRef.current
      const style = getNodeStyle(node.type, isSelected)

      return {
        id: node.id,
        data: {
          ...node,
          label: node.name,
        },
        style: {
          ...style,
          x: node.x,
          y: node.y,
        },
      }
    })

    const edgeData: G6EdgeData[] = edges.map((edge) => {
      const style = getEdgeStyle()
      const relationName = edge.relationName || relationTypeMap[edge.relationType as keyof typeof relationTypeMap] || edge.relationType

      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        data: {
          ...edge,
          label: relationName,
          relationName,
        },
        style,
      }
    })

    return { nodes: nodeData, edges: edgeData }
  }, [nodes, edges, getNodeStyle, getEdgeStyle])

  // 获取布局配置
  const getLayoutConfig = useCallback((): LayoutConfig => {
    const baseConfig = {
      preventOverlap: true,
      nodeSize: 60,
    }

    switch (layout) {
      case 'force':
        return {
          type: 'force',
          ...baseConfig,
          linkDistance: 150,
          nodeStrength: -100,
          edgeStrength: 0.5,
          collideStrength: 0.8,
          maxSpeed: 100,
          animation: true,
        }
      case 'dagre':
        return {
          type: 'dagre',
          ...baseConfig,
          rankdir: 'TB',
          align: 'UL',
          nodesep: 60,
          ranksep: 80,
          controlPoints: true,
        }
      case 'circular':
        return {
          type: 'circular',
          ...baseConfig,
          radius: Math.min(width, height) / 3,
          startAngle: 0,
          endAngle: 2 * Math.PI,
          divisions: 1,
          ordering: null,
        }
      default:
        return { type: 'force', ...baseConfig }
    }
  }, [layout, width, height])

  // 初始化图表
  useEffect(() => {
    if (!containerRef.current || graphRef.current || !G6Module || !g6Loaded) return

    const { Graph, ForceLayout, DagreLayout, CircularLayout } = G6Module

    // 注册布局
    const layoutConfig = getLayoutConfig()
    let layoutInstance
    if (layoutConfig.type === 'force') {
      layoutInstance = new ForceLayout(layoutConfig)
    } else if (layoutConfig.type === 'dagre') {
      layoutInstance = new DagreLayout(layoutConfig)
    } else if (layoutConfig.type === 'circular') {
      layoutInstance = new CircularLayout(layoutConfig)
    }

    const graph = new Graph({
      container: containerRef.current,
      width,
      height,
      layout: layoutInstance as unknown as import('@antv/g6').LayoutOptions,
      node: {
        type: 'circle',
        style: {
          labelText: ((d: { data?: { label?: string }; id: string }) => d.data?.label || d.id) as unknown as string,
        },
      },
      edge: {
        type: 'line',
        style: {
          labelText: ((d: { data?: { label?: string } }) => d.data?.label || '') as unknown as string,
          endArrow: true,
        } as Record<string, unknown>,
      },
      behaviors: [
        'drag-canvas',
        'zoom-canvas',
        ...(readonly ? [] : ['drag-node', 'click-select', 'hover-activate']),
      ],
      plugins: [
        {
          type: 'tooltip',
          getContent: (evt: { item: G6Item }) => {
            const item = evt.item
            const model = item.getModel()

            if ('data' in model && model.data) {
              if ('type' in model.data) {
                // Node
                const data = model.data as RelationNode
                const typeLabel = CITypeLabels[data.type as CIType] || data.type || '其他'
                const color = CINodeColors[data.type as CIType] || CINodeColors.default

                return `
                  <div style="padding: 8px 12px; max-width: 240px;">
                    <div style="font-weight: 600; font-size: 14px; margin-bottom: 6px; color: #262626;">
                      ${data.name}
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                      <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${color};"></span>
                      <span style="color: #595959; font-size: 12px;">类型: ${typeLabel}</span>
                    </div>
                    ${data.status ? `<div style="color: #8c8c8c; font-size: 12px;">状态: ${data.status}</div>` : ''}
                  </div>
                `
              } else {
                // Edge
                const data = model.data as RelationEdge
                const relationName = data.relationName || relationTypeMap[data.relationType as keyof typeof relationTypeMap] || data.relationType
                return `
                  <div style="padding: 8px 12px;">
                    <div style="font-weight: 600; font-size: 13px; color: #262626;">
                      ${relationName}
                    </div>
                    <div style="color: #8c8c8c; font-size: 11px; margin-top: 4px;">
                      ${data.source} → ${data.target}
                    </div>
                  </div>
                `
              }
            }
            return ''
          },
        },
      ],
      animation: true,
    }) as unknown as G6Graph

    graphRef.current = graph

    // 绑定事件
    if (!readonly) {
      // 节点点击事件
      graph.on('node:click', (evt: G6Event) => {
        const nodeId = evt.item?.getID()
        const model = evt.item?.getModel() as G6NodeModel
        if (nodeId && onNodeClick && model.data) {
          selectedNodeRef.current = nodeId
          onNodeClick(nodeId, model.data)
          graph.setItemState(evt.item as G6Item, 'selected', true)
        }
      })

      // 节点双击事件
      graph.on('node:dblclick', (evt: G6Event) => {
        const nodeId = evt.item?.getID()
        const model = evt.item?.getModel() as G6NodeModel
        if (nodeId && onNodeDoubleClick && model.data) {
          onNodeDoubleClick(nodeId, model.data)
        }
      })

      // 边点击事件
      graph.on('edge:click', (evt: G6Event) => {
        const model = evt.item?.getModel() as G6EdgeModel
        if (model.data && onEdgeClick) {
          onEdgeClick(model.data)
        }
      })
    }

    // 画布点击取消选中
    graph.on('canvas:click', () => {
      selectedNodeRef.current = null
      if (!readonly) {
        graph.getNodes().forEach((node) => {
          graph.setItemState(node, 'selected', false)
        })
      }
    })

    // 渲染图表
    const data = transformData()
    graph.read(data)

    // 如果有指定 ciId，高亮该节点并居中
    if (ciId) {
      const targetNode = graph.findById(ciId)
      if (targetNode) {
        graph.focusItem(targetNode, true, {
          duration: 500,
          easing: 'easeCubic',
        })
        graph.setItemState(targetNode, 'selected', true)
        selectedNodeRef.current = ciId
      }
    }

    return () => {
      graph.destroy()
      graphRef.current = null
    }
  }, [g6Loaded]) // 只在 G6 加载完成后初始化

  // 更新图表数据
  useEffect(() => {
    const graph = graphRef.current
    if (!graph) return

    const data = transformData()
    graph.changeData(data)

    // 重新布局
    if (layout === 'force') {
      graph.layout()
    }
  }, [nodes, edges, transformData, layout])

  // 更新尺寸
  useEffect(() => {
    const graph = graphRef.current
    if (!graph) return

    graph.changeSize(width, height)
  }, [width, height])

  // 更新布局
  useEffect(() => {
    const graph = graphRef.current
    if (!graph) return

    graph.setLayout(getLayoutConfig())
    graph.layout()
  }, [layout, getLayoutConfig])

  // 高亮指定 ciId
  useEffect(() => {
    const graph = graphRef.current
    if (!graph || !ciId) return

    const targetNode = graph.findById(ciId)
    if (targetNode) {
      // 清除之前的高亮
      graph.getNodes().forEach((node) => {
        graph.setItemState(node, 'selected', false)
      })

      // 高亮目标节点
      graph.setItemState(targetNode, 'selected', true)
      selectedNodeRef.current = ciId

      // 居中显示
      graph.focusItem(targetNode, true, {
        duration: 500,
        easing: 'easeCubic',
      })
    }
  }, [ciId])

  return (
    <div
      ref={containerRef}
      className={className}
      data-testid="relation-graph"
      style={{
        width,
        height,
        background: '#f5f5f5',
        borderRadius: 8,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {loading && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255, 255, 255, 0.8)',
            zIndex: 10,
          }}
        >
          <div style={{ color: '#1890ff', fontSize: 14 }}>加载中...</div>
        </div>
      )}
    </div>
  )
}

export default RelationGraph
