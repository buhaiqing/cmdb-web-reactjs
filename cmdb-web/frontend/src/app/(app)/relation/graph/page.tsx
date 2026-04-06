'use client'

import React, { useEffect, useState } from 'react'
import {
  Card,
  Row,
  Col,
  Select,
  Input,
  Button,
  Space,
  Tag,
  Descriptions,
  Divider,
  Tooltip,
  Badge,
  Empty,
} from 'antd'
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  FullscreenOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  ExpandOutlined,
  DownloadOutlined,
  UploadOutlined,
  EyeOutlined,
  ApartmentOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import Link from 'next/link'
import { useRelationStore, RelationNode } from '@/stores/relation'
import RelationGraph from '@/components/relation/RelationGraph'

const { Option } = Select

const ciTypeOptions = [
  { value: 'server', label: '服务器', color: 'blue' },
  { value: 'database', label: '数据库', color: 'purple' },
  { value: 'middleware', label: '中间件', color: 'orange' },
  { value: 'container', label: '容器', color: 'cyan' },
  { value: 'application', label: '应用', color: 'green' },
  { value: 'cloud', label: '云资源', color: 'geekblue' },
]

const relationTypeOptions = [
  { value: 'depends_on', label: '依赖', color: 'red' },
  { value: 'connects_to', label: '连接', color: 'blue' },
  { value: 'runs_on', label: '运行于', color: 'green' },
  { value: 'contains', label: '包含', color: 'orange' },
  { value: 'belongs_to', label: '属于', color: 'purple' },
]

const statusOptions = [
  { value: 'running', label: '运行中', color: 'success' },
  { value: 'stopped', label: '已停止', color: 'error' },
  { value: 'maintenance', label: '维护中', color: 'warning' },
  { value: 'unknown', label: '未知', color: 'default' },
]

export default function RelationGraphPage() {
  const {
    nodes,
    edges,
    selectedNode,
    isLoading,
    fetchRelationData,
    setSelectedNode,
    zoomIn,
    zoomOut,
    resetView,
    toggleFullscreen,
  } = useRelationStore()

  const [selectedCITypes, setSelectedCITypes] = useState<string[]>([])
  const [selectedRelationTypes, setSelectedRelationTypes] = useState<string[]>([])
  const [searchText, setSearchText] = useState('')

  useEffect(() => {
    fetchRelationData()
  }, [fetchRelationData])

  const handleRefresh = () => {
    fetchRelationData({
      ciTypes: selectedCITypes,
      relationTypes: selectedRelationTypes,
      search: searchText,
    })
  }

  const handleReset = () => {
    setSelectedCITypes([])
    setSelectedRelationTypes([])
    setSearchText('')
    fetchRelationData()
  }

  const handleNodeClick = (_nodeId: string, nodeData: RelationNode) => {
    setSelectedNode(nodeData)
  }

  const handleCloseDetail = () => {
    setSelectedNode(null)
  }

  const getCITypeLabel = (type: string) => {
    const option = ciTypeOptions.find((opt) => opt.value === type)
    return option?.label || type
  }

  const getCITypeColor = (type: string) => {
    const option = ciTypeOptions.find((opt) => opt.value === type)
    return option?.color || 'default'
  }

  const getStatusLabel = (status: string) => {
    const option = statusOptions.find((opt) => opt.value === status)
    return option?.label || status
  }

  const getStatusColor = (status: string) => {
    const option = statusOptions.find((opt) => opt.value === status)
    return option?.color || 'default'
  }

  return (
    <div className="page-relation-graph" data-testid="page-relation-graph">
      <div className="page-header">
        <h1 className="page-title">关系拓扑图</h1>
        <Space>
          <Button icon={<UploadOutlined />} data-testid="button-relation-import">
            导入
          </Button>
          <Button icon={<DownloadOutlined />} data-testid="button-relation-export">
            导出
          </Button>
          <Button type="primary" icon={<PlusOutlined />} data-testid="button-relation-create">
            添加关系
          </Button>
        </Space>
      </div>

      <Row gutter={16} style={{ height: 'calc(100vh - 200px)' }}>
        {/* 左侧筛选面板 */}
        <Col span={5}>
          <Card
            title="筛选条件"
            size="small"
            extra={
              <Button
                type="link"
                size="small"
                onClick={handleReset}
                data-testid="button-filter-reset"
              >
                重置
              </Button>
            }
            style={{ height: '100%' }}
            data-testid="card-filter-panel"
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                  CI 类型
                </label>
                <Select
                  mode="multiple"
                  placeholder="选择 CI 类型"
                  value={selectedCITypes}
                  onChange={setSelectedCITypes}
                  style={{ width: '100%' }}
                  options={ciTypeOptions}
                  data-testid="select-ci-types"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                  关系类型
                </label>
                <Select
                  mode="multiple"
                  placeholder="选择关系类型"
                  value={selectedRelationTypes}
                  onChange={setSelectedRelationTypes}
                  style={{ width: '100%' }}
                  options={relationTypeOptions}
                  data-testid="select-relation-types"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                  搜索
                </label>
                <Input
                  placeholder="按 CI 名称搜索"
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                  data-testid="input-search"
                />
              </div>

              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleRefresh}
                block
                data-testid="button-apply-filter"
              >
                应用筛选
              </Button>

              <Button
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                block
                data-testid="button-refresh"
              >
                刷新数据
              </Button>

              <Divider style={{ margin: '12px 0' }} />

              {/* 图例 */}
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                  图例 - CI 类型
                </label>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  {ciTypeOptions.map((opt) => (
                    <div key={opt.value} style={{ display: 'flex', alignItems: 'center' }}>
                      <Badge color={opt.color} style={{ marginRight: 8 }} />
                      <span>{opt.label}</span>
                    </div>
                  ))}
                </Space>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                  图例 - 关系类型
                </label>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  {relationTypeOptions.map((opt) => (
                    <div key={opt.value} style={{ display: 'flex', alignItems: 'center' }}>
                      <div
                        style={{
                          width: 20,
                          height: 2,
                          backgroundColor: opt.color,
                          marginRight: 8,
                        }}
                      />
                      <span>{opt.label}</span>
                    </div>
                  ))}
                </Space>
              </div>
            </Space>
          </Card>
        </Col>

        {/* 右侧关系图区域 */}
        <Col span={selectedNode ? 14 : 19}>
          <Card
            style={{ height: '100%' }}
            bodyStyle={{ height: '100%', padding: 0 }}
            data-testid="card-graph-container"
          >
            {/* 工具栏 */}
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid #f0f0f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Space>
                <Tag icon={<ApartmentOutlined />}>
                  节点: {nodes.length}
                </Tag>
                <Tag>关系: {edges.length}</Tag>
              </Space>
              <Space>
                <Tooltip title="放大">
                  <Button
                    icon={<ZoomInOutlined />}
                    onClick={zoomIn}
                    data-testid="button-zoom-in"
                  />
                </Tooltip>
                <Tooltip title="缩小">
                  <Button
                    icon={<ZoomOutOutlined />}
                    onClick={zoomOut}
                    data-testid="button-zoom-out"
                  />
                </Tooltip>
                <Tooltip title="重置视图">
                  <Button
                    icon={<ExpandOutlined />}
                    onClick={resetView}
                    data-testid="button-reset-view"
                  />
                </Tooltip>
                <Tooltip title="全屏">
                  <Button
                    icon={<FullscreenOutlined />}
                    onClick={toggleFullscreen}
                    data-testid="button-fullscreen"
                  />
                </Tooltip>
              </Space>
            </div>

            {/* 关系图 */}
            <div style={{ height: 'calc(100% - 57px)', position: 'relative' }}>
              <RelationGraph
                nodes={nodes}
                edges={edges}
                onNodeClick={handleNodeClick}
                loading={isLoading}
              />
            </div>
          </Card>
        </Col>

        {/* 右侧详情面板 */}
        {selectedNode && (
          <Col span={5}>
            <Card
              title="CI 详情"
              size="small"
              extra={
                <Button
                  type="link"
                  size="small"
                  onClick={handleCloseDetail}
                  data-testid="button-close-detail"
                >
                  关闭
                </Button>
              }
              style={{ height: '100%' }}
              data-testid="card-node-detail"
            >
              {selectedNode ? (
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="名称">
                      <strong>{selectedNode.name}</strong>
                    </Descriptions.Item>
                    <Descriptions.Item label="类型">
                      <Tag color={getCITypeColor(selectedNode.type)}>
                        {getCITypeLabel(selectedNode.type)}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="状态">
                      <Badge
                        status={getStatusColor(selectedNode.status) as any}
                        text={getStatusLabel(selectedNode.status)}
                      />
                    </Descriptions.Item>
                    {selectedNode.ip && (
                      <Descriptions.Item label="IP 地址">
                        {selectedNode.ip}
                      </Descriptions.Item>
                    )}
                    {selectedNode.project && (
                      <Descriptions.Item label="项目">
                        {selectedNode.project}
                      </Descriptions.Item>
                    )}
                    {selectedNode.environment && (
                      <Descriptions.Item label="环境">
                        <Tag
                          color={
                            selectedNode.environment === 'production'
                              ? 'red'
                              : selectedNode.environment === 'staging'
                              ? 'blue'
                              : 'green'
                          }
                        >
                          {selectedNode.environment}
                        </Tag>
                      </Descriptions.Item>
                    )}
                    {selectedNode.description && (
                      <Descriptions.Item label="描述">
                        {selectedNode.description}
                      </Descriptions.Item>
                    )}
                  </Descriptions>

                  <Divider style={{ margin: '12px 0' }} />

                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Link href={`/ci/${selectedNode.id}`}>
                      <Button
                        type="primary"
                        icon={<EyeOutlined />}
                        block
                        data-testid="button-view-detail"
                      >
                        查看详情
                      </Button>
                    </Link>
                    <Button
                      icon={<ApartmentOutlined />}
                      block
                      data-testid="button-impact-analysis"
                    >
                      查看影响分析
                    </Button>
                  </Space>

                  <Divider style={{ margin: '12px 0' }} />

                  <div>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                      <InfoCircleOutlined style={{ marginRight: 4 }} />
                      关系统计
                    </label>
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>上游依赖:</span>
                        <Tag>
                          {
                            edges.filter((e) => e.target === selectedNode.id).length
                          }
                        </Tag>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>下游依赖:</span>
                        <Tag>
                          {
                            edges.filter((e) => e.source === selectedNode.id).length
                          }
                        </Tag>
                      </div>
                    </Space>
                  </div>
                </Space>
              ) : (
                <Empty description="点击节点查看详情" />
              )}
            </Card>
          </Col>
        )}
      </Row>
    </div>
  )
}
