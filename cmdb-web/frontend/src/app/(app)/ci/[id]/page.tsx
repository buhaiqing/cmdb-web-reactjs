'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, Descriptions, Tag, Button, Space, Spin, Row, Col, Table, Divider } from 'antd'
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

  const ciId = params.id as string

  useEffect(() => {
    if (ciId) {
      fetchCIDetail(ciId)
      setRelations([
        { id: '1', targetCI: 'DB-主库-01', relationType: '依赖', description: '数据库连接' },
        { id: '2', targetCI: 'APP-订单服务', relationType: '连接', description: '上游服务' },
      ])
    }
  }, [ciId, fetchCIDetail])

  const handleDelete = async () => {
    if (confirm('确定要删除此配置项吗？')) {
      const success = await useCIStore.getState().deleteCI(ciId)
      if (success) {
        router.push('/ci/list')
      }
    }
  }

  const relationColumns: ColumnsType<Relation> = [
    {
      title: '目标配置项',
      dataIndex: 'targetCI',
      key: 'targetCI',
      dataTestid: 'cell-relation-target',
    },
    {
      title: '关系类型',
      dataIndex: 'relationType',
      key: 'relationType',
      dataTestid: 'cell-relation-type',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      dataTestid: 'cell-relation-desc',
    },
  ]

  const mockCI: CI = {
    id: ciId || '1',
    name: 'DB-主库-01',
    type: 'database',
    status: 'running',
    ip: '10.0.1.101',
    cpu: '16核',
    memory: '64GB',
    disk: '500GB SSD',
    os: 'CentOS 7.9',
    project: '订单系统',
    environment: 'production',
    createdAt: '2024-01-10 10:00:00',
    updatedAt: '2024-01-15 10:00:00',
  }

  const ci = currentCI || mockCI

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
                <Descriptions.Item label="名称">{ci.name}</Descriptions.Item>
                <Descriptions.Item label="类型">
                  <Tag>{ciTypeOptions[ci.type] || ci.type}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={ciStatusOptions[ci.status]?.color}>
                    {ciStatusOptions[ci.status]?.label || ci.status}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="IP地址">{ci.ip || '-'}</Descriptions.Item>
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
