'use client'

import React, { useState } from 'react'
import { Table, Card, Tag, Space, Button, Select } from 'antd'
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
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)

  const statusOptions = [
    { value: 'pending', label: '待审批' },
    { value: 'approved', label: '已批准' },
    { value: 'rejected', label: '已拒绝' },
    { value: 'completed', label: '已完成' },
  ]

  const columns: ColumnsType<Change> = [
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
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => <span data-testid="cell-change-desc">{text}</span>,
    },
    {
      title: '操作人',
      dataIndex: 'operator',
      key: 'operator',
      render: (text: string) => <span data-testid="cell-change-operator">{text}</span>,
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
    {
      title: '申请时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text: string) => <span data-testid="cell-change-createdAt">{text}</span>,
    },
    {
      title: '审批人',
      dataIndex: 'approvedBy',
      key: 'approvedBy',
      render: (val) => <span data-testid="cell-change-approvedBy">{val || '-'}</span>,
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

  const filteredData = statusFilter
    ? mockData.filter(item => item.status === statusFilter)
    : mockData

  return (
    <div className="page-change-list" data-testid="page-change-list">
      <div className="page-header">
        <h1 className="page-title">变更记录</h1>
        <Space>
          <Select
            placeholder="筛选状态"
            allowClear
            options={statusOptions}
            value={statusFilter}
            onChange={setStatusFilter}
            data-testid="select-change-status-filter"
            style={{ width: 120 }}
          />
          <Button icon={<ReloadOutlined />} data-testid="button-change-refresh">
            刷新
          </Button>
        </Space>
      </div>

      <Card data-testid="card-change-table">
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={loading}
          pagination={{
            current: 1,
            pageSize: 20,
            total: filteredData.length,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          data-testid="table-change-list"
        />
      </Card>
    </div>
  )
}
