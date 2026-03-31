'use client'

import React, { useState } from 'react'
import { Table, Card, Tag, Space, Button } from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import Link from 'next/link'
import type { ColumnsType } from 'antd/es/table'

interface Change {
  id: string
  ciName: string
  changeType: string
  description: string
  operator: string
  status: string
  createdAt: string
  approvedBy?: string
  approvedAt?: string
}

export default function ChangeListPage() {
  const [loading] = useState(false)

  const columns: ColumnsType<Change> = [
    {
      title: '配置项',
      dataIndex: 'ciName',
      key: 'ciName',
      dataTestid: 'cell-change-ciName',
    },
    {
      title: '变更类型',
      dataIndex: 'changeType',
      key: 'changeType',
      dataTestid: 'cell-change-type',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      dataTestid: 'cell-change-desc',
    },
    {
      title: '操作人',
      dataIndex: 'operator',
      key: 'operator',
      dataTestid: 'cell-change-operator',
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
        return <Tag color={colorMap[status]}>{labelMap[status]}</Tag>
      },
      dataTestid: 'cell-change-status',
    },
    {
      title: '申请时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      dataTestid: 'cell-change-createdAt',
    },
    {
      title: '审批人',
      dataIndex: 'approvedBy',
      key: 'approvedBy',
      render: (val) => val || '-',
      dataTestid: 'cell-change-approvedBy',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Change) => (
        <Link href={`/change/${record.id}`}>
          <Button type="link" size="small" data-testid={`button-change-detail-${record.id}`}>
            详情
          </Button>
        </Link>
      ),
    },
  ]

  const mockData: Change[] = [
    { id: '1', ciName: 'DB-主库-01', changeType: '更新配置', description: '修改最大连接数', operator: 'admin', status: 'pending', createdAt: '2024-01-15 10:30' },
    { id: '2', ciName: 'APP-订单服务', changeType: '重启服务', description: '重启应用服务', operator: 'admin', status: 'approved', createdAt: '2024-01-15 09:15', approvedBy: 'admin' },
    { id: '3', ciName: 'K8S-集群-01', changeType: '扩缩容', description: '扩容2个节点', operator: 'admin', status: 'completed', createdAt: '2024-01-14 16:45', approvedBy: 'admin', approvedAt: '2024-01-14 17:00' },
  ]

  return (
    <div className="page-change-list" data-testid="page-change-list">
      <div className="page-header">
        <h1 className="page-title">变更记录</h1>
        <Space>
          <Button icon={<ReloadOutlined />} data-testid="button-change-refresh">
            刷新
          </Button>
        </Space>
      </div>

      <Card data-testid="card-change-table">
        <Table
          columns={columns}
          dataSource={mockData}
          rowKey="id"
          loading={loading}
          pagination={{
            current: 1,
            pageSize: 20,
            total: 3,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          data-testid="table-change-list"
        />
      </Card>
    </div>
  )
}
