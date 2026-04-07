'use client'

import React, { useEffect, useState } from 'react'
import { Table, Card, Space, Button } from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { api } from '@/stores/user'

interface User {
  id: string
  username: string
  email: string
  role: string
  status: string
  createdAt: string
}

export default function UserManagePage() {
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 })

  const columns: ColumnsType<User> = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      render: (text: string) => <span data-testid="cell-user-username">{text}</span>,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      render: (text: string) => <span data-testid="cell-user-email">{text}</span>,
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
        return <span style={{ color: config.color }} data-testid={`cell-user-role-${role}`}>{config.label}</span>
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <span data-testid={`cell-user-status-${status}`}>{status === 'active' ? '启用' : '禁用'}</span>,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text: string) => <span data-testid="cell-user-createdAt">{text}</span>,
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

  const loadUsers = async (page = pagination.current, pageSize = pagination.pageSize) => {
    setLoading(true)
    try {
      const response = await api.get('/users', { params: { page, pageSize } })
      const list = response.data?.data || []
      const total = response.data?.total || 0
      setUsers(
        list.map((item: any) => ({
          id: item.id,
          username: item.username,
          email: item.email,
          role: item.role?.code || '',
          status: item.is_active ? 'active' : 'inactive',
          createdAt: item.created_at || item.createdAt || '',
        }))
      )
      setPagination({ current: page, pageSize, total })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="page-user-manage" data-testid="page-user-manage">
      <div className="page-header">
        <h1 className="page-title">用户管理</h1>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} data-testid="button-user-create">
            创建用户
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => loadUsers()} loading={loading} data-testid="button-user-refresh">
            刷新
          </Button>
        </Space>
      </div>

      <Card data-testid="card-user-table">
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => loadUsers(page, pageSize),
          }}
          data-testid="table-user-list"
        />
      </Card>
    </div>
  )
}
