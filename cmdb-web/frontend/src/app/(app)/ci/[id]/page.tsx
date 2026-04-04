'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, Descriptions, Tag, Button, Space, Spin, Row, Col, Table, Modal } from 'antd'
import { EditOutlined, DeleteOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import Link from 'next/link'
import type { ColumnsType } from 'antd/es/table'
import { useCIStore, CI } from '@/stores/ci'

interface Relation {
  id: string
  targetCI: string
  relationType: string
  description: string
}

export default function CIDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { currentCI, isLoading, fetchCIDetail } = useCIStore()
  const [relations, setRelations] = useState<Relation[]>([])
  const [error, setError] = useState<string | null>(null)

  const ciId = params.id as string

  useEffect(() => {
    if (ciId) {
      setError(null)
      fetchCIDetail(ciId).catch(() => {
        setError('配置项不存在或已被删除')
      })
      setRelations([
        { id: '1', targetCI: 'DB-主库-01', relationType: '依赖', description: '数据库连接' },
        { id: '2', targetCI: 'APP-订单服务', relationType: '连接', description: '上游服务' },
      ])
    }
  }, [ciId, fetchCIDetail])

  const handleDelete = () => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除此配置项吗？此操作不可恢复。',
      okText: '确认',
      okType: 'danger',
      cancelText: '取消',
      async onOk() {
        const success = await useCIStore.getState().deleteCI(ciId)
        if (success) {
          router.push('/ci/list')
        }
      },
    })
  }

  const relationColumns: ColumnsType<Relation> = [
    {
      title: '目标配置项',
      dataIndex: 'targetCI',
      key: 'targetCI',
      render: (text: string) => <span data-testid="cell-relation-target">{text}</span>,
    },
    {
      title: '关系类型',
      dataIndex: 'relationType',
      key: 'relationType',
      render: (text: string) => <span data-testid="cell-relation-type">{text}</span>,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => <span data-testid="cell-relation-desc">{text}</span>,
    },
  ]

  const ci = currentCI

  if (error) {
    return (
      <div className="page-ci-detail" data-testid="page-ci-detail">
        <div className="page-header">
          <Space>
            <Link href="/ci/list">
              <Button icon={<ArrowLeftOutlined />} data-testid="button-ci-back">
                返回
              </Button>
            </Link>
            <h1 className="page-title">配置项详情</h1>
          </Space>
        </div>
        <Card>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: '#ff4d4f', fontSize: '16px' }}>{error}</p>
          </div>
        </Card>
      </div>
    )
  }

  if (!ci) {
    return (
      <div className="page-ci-detail" data-testid="page-ci-detail">
        <div className="page-header">
          <Space>
            <Link href="/ci/list">
              <Button icon={<ArrowLeftOutlined />} data-testid="button-ci-back">
                返回
              </Button>
            </Link>
            <h1 className="page-title">配置项详情</h1>
          </Space>
        </div>
        <Spin spinning={isLoading} tip="加载中...">
          <Card>
            <div style={{ textAlign: 'center', padding: '40px' }}>
              加载配置项信息...
            </div>
          </Card>
        </Spin>
      </div>
    )
  }

  const ciStatusOptions: Record<string, { color: string; label: string }> = {
    running: { color: 'green', label: '运行中' },
    stopped: { color: 'red', label: '已停止' },
    maintenance: { color: 'orange', label: '维护中' },
  }

  const ciTypeOptions: Record<string, string> = {
    server: '服务器',
    database: '数据库',
    middleware: '中间件',
    container: '容器',
    application: '应用程序',
    cloud: '云资源',
  }

  return (
    <div className="page-ci-detail" data-testid="page-ci-detail">
      <div className="page-header">
        <Space>
          <Link href="/ci/list">
            <Button icon={<ArrowLeftOutlined />} data-testid="button-ci-back">
              返回
            </Button>
          </Link>
          <h1 className="page-title">配置项详情</h1>
        </Space>
        <Space>
          <Link href={`/ci/${ciId}/edit`}>
            <Button type="primary" icon={<EditOutlined />} data-testid="button-ci-edit">
              编辑
            </Button>
          </Link>
          <Button danger icon={<DeleteOutlined />} onClick={handleDelete} data-testid="button-ci-delete">
            删除
          </Button>
        </Space>
      </div>

      <Spin spinning={isLoading}>
        <Row gutter={16}>
          <Col span={16}>
            <Card title="基本信息" data-testid="card-ci-basic">
              <Descriptions column={2} bordered>
                <Descriptions.Item label="名称"><span data-testid="ci-detail-name">{ci.name}</span></Descriptions.Item>
                <Descriptions.Item label="类型">
                  <span data-testid="ci-detail-type"><Tag>{ciTypeOptions[ci.type] || ci.type}</Tag></span>
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  <span data-testid="ci-detail-status"><Tag color={ciStatusOptions[ci.status]?.color}>
                    {ciStatusOptions[ci.status]?.label || ci.status}
                  </Tag></span>
                </Descriptions.Item>
                <Descriptions.Item label="IP地址"><span data-testid="ci-detail-ip">{ci.ip || '-'}</span></Descriptions.Item>
                <Descriptions.Item label="CPU">{ci.cpu || '-'}</Descriptions.Item>
                <Descriptions.Item label="内存">{ci.memory || '-'}</Descriptions.Item>
                <Descriptions.Item label="磁盘">{ci.disk || '-'}</Descriptions.Item>
                <Descriptions.Item label="操作系统">{ci.os || '-'}</Descriptions.Item>
                <Descriptions.Item label="项目">{ci.project || '-'}</Descriptions.Item>
                <Descriptions.Item label="环境">
                  {ci.environment && <Tag color={ci.environment === 'production' ? 'red' : ci.environment === 'staging' ? 'blue' : 'green'}>{ci.environment}</Tag>}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
          <Col span={8}>
            <Card title="变更信息" data-testid="card-ci-change">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="创建时间">{ci.createdAt}</Descriptions.Item>
                <Descriptions.Item label="更新时间">{ci.updatedAt}</Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        </Row>

        <Card title="关联关系" style={{ marginTop: 16 }} data-testid="card-ci-relations">
          <Table
            columns={relationColumns}
            dataSource={relations}
            rowKey="id"
            pagination={false}
            data-testid="table-ci-relations"
          />
        </Card>
      </Spin>
    </div>
  )
}
