'use client'

import React, { useState } from 'react'
import { Table, Card, Space, Button, Row, Col } from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

interface User {
  id: string
  username: string
  email: string
  role: string
  status: string
  createdAt: string
}

export default function UserManagePage() {
  const [loading] = useState(false)

  const columns: ColumnsType<User> = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      dataTestid: 'cell-user-username',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      dataTestid: 'cell-user-email',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const roleMap: Record<string, { color: string; label: string }> = {
          admin: { color: 'red', label: '管理员' },
          operator: { color: 'blue', label: '运维工程师' },
          readonly: { color: 'green', label: '只读用户' },
          auditor: { color: 'orange', label: '审计员' },
        }
        const config = roleMap[role] || { color: 'default', label: role }
        return <span style={{ color: config.color }}>{config.label}</span>
      },
      dataTestid: 'cell-user-role',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (status === 'active' ? '启用' : '禁用'),
      dataTestid: 'cell-user-status',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      dataTestid: 'cell-user-createdAt',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: User) => (
        <Space>
          <Button type="link" size="small" data-testid={`button-user-edit-${record.id}`}>
            编辑
          </Button>
          <Button type="link" size="small" danger data-testid={`button-user-delete-${record.id}`}>
            删除
          </Button>
        </Space>
      ),
    },
  ]

  const mockData: User[] = [
    { id: '1', username: 'admin', email: 'admin@example.com', role: 'admin', status: 'active', createdAt: '2024-01-01 00:00:00' },
    { id: '2', username: 'operator', email: 'operator@example.com', role: 'operator', status: 'active', createdAt: '2024-01-05 10:00:00' },
    { id: '3', username: 'readonly', email: 'readonly@example.com', role: 'readonly', status: 'active', createdAt: '2024-01-10 14:30:00' },
  ]

  return (
    <div className="page-user-manage" data-testid="page-user-manage">
      <div className="page-header">
        <h1 className="page-title">用户管理</h1>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} data-testid="button-user-create">
            创建用户
          </Button>
          <Button icon={<ReloadOutlined />} data-testid="button-user-refresh">
            刷新
          </Button>
        </Space>
      </div>

      <Card data-testid="card-user-table">
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
          data-testid="table-user-list"
        />
      </Card>
    </div>
  )
}
