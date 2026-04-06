'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Spin,
  Row,
  Col,
  Table,
  Modal,
  Form,
  Input,
  Select,
  message,
  Tabs,
  List,
  Typography,
  Divider,
} from 'antd'
import {
  EditOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  ReloadOutlined,
  PlusOutlined,
  ApartmentOutlined,
  BranchesOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons'
import Link from 'next/link'
import type { ColumnsType } from 'antd/es/table'
import { useCIStore, CI } from '@/stores/ci'
import {
  RelationNode,
  RelationEdge,
  RelationGraphData,
  CITypeLabels,
  CINodeColors,
  CIType,
} from '@/stores/relation'

const { Option } = Select
const { TextArea } = Input
const { Title, Text } = Typography
const { TabPane } = Tabs

// 关系类型选项
const relationTypeOptions = [
  { value: 'depends_on', label: '依赖于', direction: 'outgoing' },
  { value: 'depended_by', label: '被依赖', direction: 'incoming' },
  { value: 'connects_to', label: '连接到', direction: 'bidirectional' },
  { value: 'contains', label: '包含', direction: 'outgoing' },
  { value: 'belongs_to', label: '属于', direction: 'incoming' },
  { value: 'deploys_on', label: '部署于', direction: 'outgoing' },
  { value: 'runs_on', label: '运行于', direction: 'outgoing' },
]

// 模拟关系数据
const mockRelations: RelationEdge[] = [
  { id: '1', source: 'ci-1', target: 'ci-2', relationType: 'depends_on', relationName: '依赖于' },
  { id: '2', source: 'ci-3', target: 'ci-1', relationType: 'connects_to', relationName: '连接到' },
  { id: '3', source: 'ci-1', target: 'ci-4', relationType: 'deploys_on', relationName: '部署于' },
]

// 模拟节点数据
const mockNodes: RelationNode[] = [
  { id: 'ci-1', name: 'APP-订单服务', type: 'application', status: 'running' },
  { id: 'ci-2', name: 'DB-主库-01', type: 'database', status: 'running' },
  { id: 'ci-3', name: 'Web-前端服务', type: 'application', status: 'running' },
  { id: 'ci-4', name: 'K8S-Node-01', type: 'container', status: 'running' },
]

// 模拟所有CI列表（用于添加关系时选择）
const mockCIList: CI[] = [
  { id: 'ci-2', name: 'DB-主库-01', type: 'database', status: 'running', createdAt: '2024-01-10', updatedAt: '2024-01-15' },
  { id: 'ci-3', name: 'Web-前端服务', type: 'application', status: 'running', createdAt: '2024-01-09', updatedAt: '2024-01-14' },
  { id: 'ci-4', name: 'K8S-Node-01', type: 'container', status: 'running', createdAt: '2024-01-08', updatedAt: '2024-01-13' },
  { id: 'ci-5', name: 'Redis-缓存-01', type: 'middleware', status: 'running', createdAt: '2024-01-07', updatedAt: '2024-01-12' },
  { id: 'ci-6', name: 'Nginx-网关', type: 'middleware', status: 'running', createdAt: '2024-01-06', updatedAt: '2024-01-11' },
]

// CI类型映射
const ciTypeOptions: Record<string, string> = {
  server: '服务器',
  database: '数据库',
  middleware: '中间件',
  container: '容器',
  application: '应用程序',
  cloud: '云资源',
}

// CI状态映射
const ciStatusOptions: Record<string, { color: string; label: string }> = {
  running: { color: 'green', label: '运行中' },
  stopped: { color: 'red', label: '已停止' },
  maintenance: { color: 'orange', label: '维护中' },
}

export default function CIRelationsPage() {
  const params = useParams()
  const router = useRouter()
  const { currentCI, isLoading, fetchCIDetail } = useCIStore()

  const ciId = params.id as string

  // 状态管理
  const [relations, setRelations] = useState<RelationEdge[]>(mockRelations)
  const [nodes] = useState<RelationNode[]>(mockNodes)
  const [isAddModalVisible, setIsAddModalVisible] = useState(false)
  const [isImpactModalVisible, setIsImpactModalVisible] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form] = Form.useForm()
  const [relationDirection, setRelationDirection] = useState<'source' | 'target'>('source')

  // 获取当前CI的关联关系
  const currentCIRelations = relations.filter(
    (rel) => rel.source === ciId || rel.target === ciId
  )

  // 上游关系（当前CI作为目标）
  const upstreamRelations = currentCIRelations.filter((rel) => rel.target === ciId)

  // 下游关系（当前CI作为源）
  const downstreamRelations = currentCIRelations.filter((rel) => rel.source === ciId)

  // 加载CI详情
  useEffect(() => {
    if (ciId) {
      fetchCIDetail(ciId)
    }
  }, [ciId, fetchCIDetail])

  // 刷新关系数据
  const handleRefresh = useCallback(() => {
    message.success('关系数据已刷新')
    // 这里应该调用API重新获取关系数据
  }, [])

  // 删除关系
  const handleDeleteRelation = useCallback((relationId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除此关系吗？此操作不可恢复。',
      okText: '确认',
      okType: 'danger',
      cancelText: '取消',
      onOk() {
        setRelations((prev) => prev.filter((rel) => rel.id !== relationId))
        message.success('关系已删除')
      },
    })
  }, [])

  // 打开添加关系弹窗
  const handleOpenAddModal = useCallback(() => {
    form.resetFields()
    setRelationDirection('source')
    setIsAddModalVisible(true)
  }, [form])

  // 提交添加关系
  const handleAddRelation = useCallback(async () => {
    try {
      const values = await form.validateFields()
      setIsSubmitting(true)

      const relationType = relationTypeOptions.find((opt) => opt.value === values.relationType)
      const newRelation: RelationEdge = {
        id: `rel-${Date.now()}`,
        source: relationDirection === 'source' ? ciId : values.targetCI,
        target: relationDirection === 'source' ? values.targetCI : ciId,
        relationType: values.relationType,
        relationName: relationType?.label || values.relationType,
        properties: {
          description: values.description,
        },
      }

      setRelations((prev) => [...prev, newRelation])
      message.success('关系添加成功')
      setIsAddModalVisible(false)
      form.resetFields()
    } catch (error) {
      console.error('Form validation failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [ciId, form, relationDirection])

  // 打开影响分析弹窗
  const handleOpenImpactModal = useCallback(() => {
    setIsImpactModalVisible(true)
  }, [])

  // 关系列表表格列定义
  const relationColumns: ColumnsType<RelationEdge> = [
    {
      title: '目标配置项',
      key: 'target',
      render: (_, record) => {
        const isSource = record.source === ciId
        const targetId = isSource ? record.target : record.source
        const targetNode = nodes.find((n) => n.id === targetId) || mockCIList.find((ci) => ci.id === targetId)
        return (
          <Space>
            {isSource ? (
              <ArrowDownOutlined style={{ color: '#52c41a' }} />
            ) : (
              <ArrowUpOutlined style={{ color: '#1890ff' }} />
            )}
            <span>{targetNode?.name || targetId}</span>
            {targetNode && 'type' in targetNode && (
              <Tag color={CINodeColors[targetNode.type as keyof typeof CINodeColors] || 'default'}>
                {CITypeLabels[targetNode.type as keyof typeof CITypeLabels] || targetNode.type}
              </Tag>
            )}
          </Space>
        )
      },
    },
    {
      title: '关系类型',
      dataIndex: 'relationName',
      key: 'relationName',
      width: 120,
      render: (text: string, record) => {
        const isSource = record.source === ciId
        return (
          <Tag color={isSource ? 'blue' : 'green'}>
            {isSource ? '→ ' : '← '}
            {text}
          </Tag>
        )
      },
    },
    {
      title: '描述',
      key: 'description',
      render: (_, record) => {
        const desc = record.properties?.description as string
        return <Text ellipsis style={{ maxWidth: 200 }}>{desc || '-'}</Text>
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDeleteRelation(record.id)}
        >
          删除
        </Button>
      ),
    },
  ]

  // 影响分析列表项渲染
  const renderImpactItem = (item: RelationEdge, direction: 'upstream' | 'downstream') => {
    const isSource = direction === 'downstream'
    const targetId = isSource ? item.target : item.source
    const targetNode = nodes.find((n) => n.id === targetId) || mockCIList.find((ci) => ci.id === targetId)

    return (
      <List.Item>
        <List.Item.Meta
          avatar={
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: targetNode?.type ? CINodeColors[targetNode.type as CIType] || '#999' : '#999',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 12,
              }}
            >
              {targetNode?.type ? CITypeLabels[targetNode.type as CIType]?.charAt(0) : 'CI'}
            </div>
          }
          title={
            <Space>
              <Text strong>{targetNode?.name || targetId}</Text>
              <Tag color={direction === 'upstream' ? 'blue' : 'green'}>
                {direction === 'upstream' ? '上游' : '下游'}
              </Tag>
            </Space>
          }
          description={
            <Space direction="vertical" size={0}>
              <Text type="secondary">
                关系: {item.relationName}
              </Text>
              {targetNode?.status && (
                <Tag color={ciStatusOptions[targetNode.status]?.color || 'default'}>
                  {ciStatusOptions[targetNode.status]?.label || targetNode.status}
                </Tag>
              )}
            </Space>
          }
        />
      </List.Item>
    )
  }

  // 获取当前CI作为中心节点的关系图数据
  const getGraphData = (): RelationGraphData => {
    const currentNode: RelationNode = {
      id: ciId,
      name: currentCI?.name || '当前CI',
      type: (currentCI?.type as RelationNode['type']) || 'default',
      status: currentCI?.status || 'unknown',
    }

    const relatedNodes: RelationNode[] = currentCIRelations.map((rel) => {
      const nodeId = rel.source === ciId ? rel.target : rel.source
      const node = nodes.find((n) => n.id === nodeId) || mockNodes.find((n) => n.id === nodeId)
      return (
        node || {
          id: nodeId,
          name: nodeId,
          type: 'default' as const,
          status: 'unknown',
        }
      )
    })

    return {
      nodes: [currentNode, ...relatedNodes],
      edges: currentCIRelations,
    }
  }

  if (!currentCI && isLoading) {
    return (
      <div className="page-ci-relations" data-testid="page-ci-relations">
        <Spin spinning={true} tip="加载中...">
          <div style={{ minHeight: '400px' }} />
        </Spin>
      </div>
    )
  }

  const ci = currentCI || {
    id: ciId,
    name: 'APP-订单服务',
    type: 'application',
    status: 'running',
    createdAt: '2024-01-10',
    updatedAt: '2024-01-15',
  }

  const graphData = getGraphData()

  return (
    <div className="page-ci-relations" data-testid="page-ci-relations">
      {/* 顶部信息卡片 */}
      <Card style={{ marginBottom: 16 }} data-testid="card-ci-info">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Space direction="vertical" size="small" style={{ flex: 1 }}>
            <Space>
              <Link href={`/ci/${ciId}`}>
                <Button icon={<ArrowLeftOutlined />} data-testid="button-back">
                  返回
                </Button>
              </Link>
              <Title level={4} style={{ margin: 0 }}>
                {ci.name}
              </Title>
              <Tag color={ciStatusOptions[ci.status]?.color || 'default'}>
                {ciStatusOptions[ci.status]?.label || ci.status}
              </Tag>
            </Space>
            <Space size="large">
              <Text type="secondary">
                类型: <Tag>{ciTypeOptions[ci.type] || ci.type}</Tag>
              </Text>
              <Text type="secondary">ID: {ci.id}</Text>
            </Space>
          </Space>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh} data-testid="button-refresh">
              刷新
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleOpenAddModal}
              data-testid="button-add-relation"
            >
              添加关系
            </Button>
            <Button
              icon={<ApartmentOutlined />}
              onClick={handleOpenImpactModal}
              data-testid="button-impact-analysis"
            >
              影响分析
            </Button>
          </Space>
        </div>
      </Card>

      {/* 左右两栏布局 */}
      <Row gutter={16}>
        {/* 左侧关系图区域 */}
        <Col span={14}>
          <Card
            title={
              <Space>
                <BranchesOutlined />
                <span>关系拓扑图</span>
              </Space>
            }
            style={{ height: '600px' }}
            data-testid="card-relation-graph"
          >
            {/* 简化的关系图展示 */}
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* 中心节点 */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginBottom: 32,
                }}
              >
                <div
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    backgroundColor: CINodeColors[ci.type as keyof typeof CINodeColors] || '#1890ff',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    border: '4px solid #fff',
                  }}
                >
                  <div style={{ fontSize: 24, fontWeight: 'bold' }}>
                    {CITypeLabels[ci.type as keyof typeof CITypeLabels]?.charAt(0) || 'CI'}
                  </div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>当前CI</div>
                </div>
              </div>

              {/* 上下游关系 */}
              <Row gutter={16} style={{ flex: 1 }}>
                <Col span={12}>
                  <Card
                    type="inner"
                    title={<Text strong style={{ color: '#1890ff' }}>上游依赖 ({upstreamRelations.length})</Text>}
                    size="small"
                  >
                    <List
                      dataSource={upstreamRelations}
                      renderItem={(item) => {
                        const sourceNode = nodes.find((n) => n.id === item.source)
                        return (
                          <List.Item>
                            <Space>
                              <ArrowUpOutlined style={{ color: '#1890ff' }} />
                              <span>{sourceNode?.name || item.source}</span>
                              <Tag>{item.relationName}</Tag>
                            </Space>
                          </List.Item>
                        )
                      }}
                      locale={{ emptyText: '暂无上游依赖' }}
                    />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card
                    type="inner"
                    title={<Text strong style={{ color: '#52c41a' }}>下游影响 ({downstreamRelations.length})</Text>}
                    size="small"
                  >
                    <List
                      dataSource={downstreamRelations}
                      renderItem={(item) => {
                        const targetNode = nodes.find((n) => n.id === item.target)
                        return (
                          <List.Item>
                            <Space>
                              <ArrowDownOutlined style={{ color: '#52c41a' }} />
                              <span>{targetNode?.name || item.target}</span>
                              <Tag>{item.relationName}</Tag>
                            </Space>
                          </List.Item>
                        )
                      }}
                      locale={{ emptyText: '暂无下游影响' }}
                    />
                  </Card>
                </Col>
              </Row>
            </div>
          </Card>
        </Col>

        {/* 右侧关系列表 */}
        <Col span={10}>
          <Card
            title={
              <Space>
                <BranchesOutlined />
                <span>关系列表</span>
                <Tag>{currentCIRelations.length}</Tag>
              </Space>
            }
            style={{ height: '600px' }}
            data-testid="card-relation-list"
          >
            <Table
              columns={relationColumns}
              dataSource={currentCIRelations}
              rowKey="id"
              pagination={false}
              scroll={{ y: 450 }}
              size="small"
              data-testid="table-relations"
            />
          </Card>
        </Col>
      </Row>

      {/* 添加关系弹窗 */}
      <Modal
        title="添加关系"
        open={isAddModalVisible}
        onOk={handleAddRelation}
        onCancel={() => setIsAddModalVisible(false)}
        confirmLoading={isSubmitting}
        okText="添加"
        cancelText="取消"
        width={500}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="关系方向" required>
            <Select
              value={relationDirection}
              onChange={setRelationDirection}
              style={{ width: '100%' }}
            >
              <Option value="source">
                <Space>
                  <span>当前CI</span>
                  <ArrowDownOutlined />
                  <span>目标CI</span>
                  <Text type="secondary">(当前作为源)</Text>
                </Space>
              </Option>
              <Option value="target">
                <Space>
                  <span>源CI</span>
                  <ArrowDownOutlined />
                  <span>当前CI</span>
                  <Text type="secondary">(当前作为目标)</Text>
                </Space>
              </Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="targetCI"
            label={relationDirection === 'source' ? '目标配置项' : '源配置项'}
            rules={[{ required: true, message: '请选择配置项' }]}
          >
            <Select
              placeholder="请选择配置项"
              showSearch
              optionFilterProp="children"
              style={{ width: '100%' }}
            >
              {mockCIList
                .filter((ci) => ci.id !== ciId)
                .map((ci) => (
                  <Option key={ci.id} value={ci.id}>
                    <Space>
                      <span>{ci.name}</span>
                      <Tag>{ciTypeOptions[ci.type] || ci.type}</Tag>
                    </Space>
                  </Option>
                ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="relationType"
            label="关系类型"
            rules={[{ required: true, message: '请选择关系类型' }]}
          >
            <Select placeholder="请选择关系类型" style={{ width: '100%' }}>
              {relationTypeOptions.map((opt) => (
                <Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="description" label="描述">
            <TextArea
              placeholder="请输入关系描述（可选）"
              rows={3}
              maxLength={200}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 影响分析弹窗 */}
      <Modal
        title={
          <Space>
            <ApartmentOutlined />
            <span>影响分析</span>
          </Space>
        }
        open={isImpactModalVisible}
        onCancel={() => setIsImpactModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsImpactModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={700}
      >
        <Tabs defaultActiveKey="upstream">
          <TabPane
            tab={
              <Space>
                <ArrowUpOutlined style={{ color: '#1890ff' }} />
                <span>上游影响 ({upstreamRelations.length})</span>
              </Space>
            }
            key="upstream"
          >
            <List
              dataSource={upstreamRelations}
              renderItem={(item) => renderImpactItem(item, 'upstream')}
              locale={{ emptyText: '暂无上游依赖' }}
              bordered
            />
          </TabPane>
          <TabPane
            tab={
              <Space>
                <ArrowDownOutlined style={{ color: '#52c41a' }} />
                <span>下游影响 ({downstreamRelations.length})</span>
              </Space>
            }
            key="downstream"
          >
            <List
              dataSource={downstreamRelations}
              renderItem={(item) => renderImpactItem(item, 'downstream')}
              locale={{ emptyText: '暂无下游影响' }}
              bordered
            />
          </TabPane>
          <TabPane
            tab={<span>完整拓扑</span>}
            key="topology"
          >
            <div style={{ padding: 16, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
              <Title level={5}>当前CI: {ci.name}</Title>
              <Divider />
              <Row gutter={16}>
                <Col span={12}>
                  <Text strong style={{ color: '#1890ff' }}>
                    上游依赖链: {upstreamRelations.length} 个
                  </Text>
                </Col>
                <Col span={12}>
                  <Text strong style={{ color: '#52c41a' }}>
                    下游影响链: {downstreamRelations.length} 个
                  </Text>
                </Col>
              </Row>
              <Divider />
              <Text type="secondary">
                总关系数: {currentCIRelations.length} |
                直接影响范围: {new Set([...upstreamRelations, ...downstreamRelations].map(r => r.source === ciId ? r.target : r.source)).size} 个配置项
              </Text>
            </div>
          </TabPane>
        </Tabs>
      </Modal>
    </div>
  )
}
