'use client'

import React, { useEffect, useState } from 'react'
import { Row, Col, Card, Statistic, Table, Tag, Space } from 'antd'
import {
  DesktopOutlined,
  CloudServerOutlined,
  DatabaseOutlined,
  ContainerOutlined,
  RiseOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { api } from '@/stores/user'

interface RecentChange {
  id: string
  ciName: string
  changeType: string
  operator: string
  createdAt: string
  status: string
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    server: 0,
    database: 0,
    middleware: 0,
    container: 0,
    changePending: 0,
  })
  const [recentChanges, setRecentChanges] = useState<RecentChange[]>([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const [statsRes, changesRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/changes/recent'),
      ])
      setStats(statsRes.data.data || { server: 128, database: 45, middleware: 32, container: 156, changePending: 7 })
      setRecentChanges(changesRes.data.data || [
        { id: '1', ciName: 'DB-主库-01', changeType: '更新配置', operator: 'admin', createdAt: '2024-01-15 10:30', status: 'pending' },
        { id: '2', ciName: 'APP-订单服务', changeType: '重启服务', operator: 'admin', createdAt: '2024-01-15 09:15', status: 'approved' },
        { id: '3', ciName: 'K8S-集群-01', changeType: '扩缩容', operator: 'admin', createdAt: '2024-01-14 16:45', status: 'completed' },
      ])
    } catch {
      setStats({ server: 128, database: 45, middleware: 32, container: 156, changePending: 7 })
      setRecentChanges([
        { id: '1', ciName: 'DB-主库-01', changeType: '更新配置', operator: 'admin', createdAt: '2024-01-15 10:30', status: 'pending' },
        { id: '2', ciName: 'APP-订单服务', changeType: '重启服务', operator: 'admin', createdAt: '2024-01-15 09:15', status: 'approved' },
        { id: '3', ciName: 'K8S-集群-01', changeType: '扩缩容', operator: 'admin', createdAt: '2024-01-14 16:45', status: 'completed' },
      ])
    }
    setLoading(false)
  }

  const columns: ColumnsType<RecentChange> = [
    {
      title: '配置项',
      dataIndex: 'ciName',
      key: 'ciName',
      render: (text: string) => <span data-testid="cell-change-ciName">{text}</span>,
    },
    {
      title: '变更类型',
      dataIndex: 'changeType',
      key: 'changeType',
      render: (text: string) => <span data-testid="cell-change-type">{text}</span>,
    },
    {
      title: '操作人',
      dataIndex: 'operator',
      key: 'operator',
      render: (text: string) => <span data-testid="cell-change-operator">{text}</span>,
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text: string) => <span data-testid="cell-change-time">{text}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          pending: 'orange',
          approved: 'blue',
          completed: 'green',
          rejected: 'red',
        }
        const labelMap: Record<string, string> = {
          pending: '待审批',
          approved: '已批准',
          completed: '已完成',
          rejected: '已拒绝',
        }
        return <Tag color={colorMap[status]} data-testid={`cell-change-status-${status}`}>{labelMap[status]}</Tag>
      },
    },
  ]

  return (
    <div className="page-dashboard" data-testid="page-dashboard">
      <div className="page-header">
        <h1 className="page-title">仪表盘</h1>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card loading={loading} data-testid="card-stat-server">
            <Statistic
              title="服务器"
              value={stats.server}
              prefix={<DesktopOutlined />}
              valueStyle={{ color: '#1677ff' }}
              data-testid="statistic-server"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading} data-testid="card-stat-database">
            <Statistic
              title="数据库"
              value={stats.database}
              prefix={<DatabaseOutlined />}
              valueStyle={{ color: '#52c41a' }}
              data-testid="statistic-database"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading} data-testid="card-stat-middleware">
            <Statistic
              title="中间件"
              value={stats.middleware}
              prefix={<CloudServerOutlined />}
              valueStyle={{ color: '#722ed1' }}
              data-testid="statistic-middleware"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading} data-testid="card-stat-container">
            <Statistic
              title="容器"
              value={stats.container}
              prefix={<ContainerOutlined />}
              valueStyle={{ color: '#fa8c16' }}
              data-testid="statistic-container"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card
            loading={loading}
            title="待处理变更"
            extra={<WarningOutlined style={{ color: '#faad14' }} />}
            data-testid="card-pending-changes"
          >
            <Statistic
              value={stats.changePending}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#faad14' }}
              data-testid="statistic-pending-changes"
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card loading={loading} title="资源趋势" data-testid="card-resource-trend">
            <Space direction="vertical">
              <div>本周新增资源: <strong>23</strong></div>
              <div>本周变更: <strong>156</strong></div>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card title="最近变更" data-testid="card-recent-changes">
        <Table
          columns={columns}
          dataSource={recentChanges}
          rowKey="id"
          pagination={false}
          data-testid="table-recent-changes"
        />
      </Card>
    </div>
  )
}
