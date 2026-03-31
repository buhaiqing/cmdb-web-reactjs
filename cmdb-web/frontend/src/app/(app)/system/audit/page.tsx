'use client'

import React, { useState } from 'react'
import { Table, Card, Space, Button, Input, Select, DatePicker } from 'antd'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

interface AuditLog {
  id: string
  user: string
  action: string
  resource: string
  resourceType: string
  ip: string
  createdAt: string
  status: string
}

export default function AuditLogPage() {
  const [loading] = useState(false)
  const [searchText, setSearchText] = useState('')

  const columns: ColumnsType<AuditLog> = [
    {
      title: '用户',
      dataIndex: 'user',
      key: 'user',
      dataTestid: 'cell-audit-user',
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      render: (action: string) => {
        const actionMap: Record<string, { color: string; label: string }> = {
          create: { color: 'green', label: '创建' },
          update: { color: 'blue', label: '更新' },
          delete: { color: 'red', label: '删除' },
          login: { color: 'purple', label: '登录' },
          logout: { color: 'orange', label: '登出' },
        }
        const config = actionMap[action] || { color: 'default', label: action }
        return <span style={{ color: config.color }}>{config.label}</span>
      },
      dataTestid: 'cell-audit-action',
    },
    {
      title: '资源类型',
      dataIndex: 'resourceType',
      key: 'resourceType',
      dataTestid: 'cell-audit-resourceType',
    },
    {
      title: '资源',
      dataIndex: 'resource',
      key: 'resource',
      dataTestid: 'cell-audit-resource',
    },
    {
      title: 'IP地址',
      dataIndex: 'ip',
      key: 'ip',
      dataTestid: 'cell-audit-ip',
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      dataTestid: 'cell-audit-createdAt',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (status === 'success' ? '成功' : '失败'),
      dataTestid: 'cell-audit-status',
    },
  ]

  const mockData: AuditLog[] = [
    { id: '1', user: 'admin', action: 'login', resource: '-', resourceType: '-', ip: '192.168.1.100', createdAt: '2024-01-15 10:00:00', status: 'success' },
    { id: '2', user: 'admin', action: 'create', resource: 'DB-主库-01', resourceType: 'CI', ip: '192.168.1.100', createdAt: '2024-01-15 10:30:00', status: 'success' },
    { id: '3', user: 'admin', action: 'update', resource: 'APP-订单服务', resourceType: 'CI', ip: '192.168.1.100', createdAt: '2024-01-15 11:00:00', status: 'success' },
    { id: '4', user: 'operator', action: 'delete', resource: 'Web-前端服务', resourceType: 'CI', ip: '192.168.1.101', createdAt: '2024-01-15 14:00:00', status: 'success' },
  ]

  return (
    <div className="page-audit-log" data-testid="page-audit-log">
      <div className="page-header">
        <h1 className="page-title">审计日志</h1>
        <Space>
          <Button icon={<ReloadOutlined />} data-testid="button-audit-refresh">
            刷新
          </Button>
        </Space>
      </div>

      <Card style={{ marginBottom: 16 }} data-testid="card-audit-filters">
        <Space wrap>
          <Input
            placeholder="搜索用户/资源"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 200 }}
            allowClear
            data-testid="input-audit-search"
          />
          <Select
            placeholder="操作类型"
            style={{ width: 120 }}
            allowClear
            options={[
              { value: 'create', label: '创建' },
              { value: 'update', label: '更新' },
              { value: 'delete', label: '删除' },
              { value: 'login', label: '登录' },
            ]}
            data-testid="select-audit-action"
          />
          <RangePicker data-testid="picker-audit-range" />
        </Space>
      </Card>

      <Card data-testid="card-audit-table">
        <Table
          columns={columns}
          dataSource={mockData}
          rowKey="id"
          loading={loading}
          pagination={{
            current: 1,
            pageSize: 20,
            total: 4,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          data-testid="table-audit-list"
        />
      </Card>
    </div>
  )
}
