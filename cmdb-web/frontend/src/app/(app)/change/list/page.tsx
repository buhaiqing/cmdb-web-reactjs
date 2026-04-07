'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Table, Card, Tag, Space, Button, Select } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import Link from 'next/link'
import type { ColumnsType } from 'antd/es/table'
import { useChangeStore, type Change } from '@/stores/change'

export default function ChangeListPage() {
  const { changeList, isLoading, pagination, fetchChangeList } = useChangeStore()
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

  const filteredData = useMemo(
    () => (statusFilter ? changeList.filter(item => item.status === statusFilter) : changeList),
    [changeList, statusFilter]
  )

  useEffect(() => {
    fetchChangeList()
  }, [fetchChangeList])

  const handleRefresh = () => {
    fetchChangeList()
  }

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
          <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={isLoading} data-testid="button-change-refresh">
            刷新
          </Button>
        </Space>
      </div>

      <Card data-testid="card-change-table">
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: statusFilter ? filteredData.length : pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => fetchChangeList({ page, pageSize }),
          }}
          data-testid="table-change-list"
        />
      </Card>
    </div>
  )
}
