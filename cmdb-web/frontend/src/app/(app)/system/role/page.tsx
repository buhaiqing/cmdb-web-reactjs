'use client'

import React, { useEffect, useState } from 'react'
import { Table, Card, Space, Button } from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { api } from '@/stores/user'

interface Role {
  id: string
  name: string
  code: string
  description: string
  userCount: number
  createdAt: string
}

export default function RoleManagePage() {
  const [loading, setLoading] = useState(false)
  const [roles, setRoles] = useState<Role[]>([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 })

  const columns: ColumnsType<Role> = [
    {
      title: '角色名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span data-testid="cell-role-name">{text}</span>,
    },
    {
      title: '角色代码',
      dataIndex: 'code',
      key: 'code',
      render: (text: string) => <span data-testid="cell-role-code">{text}</span>,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => <span data-testid="cell-role-desc">{text}</span>,
    },
    {
      title: '用户数',
      dataIndex: 'userCount',
      key: 'userCount',
      render: (count: number) => <span data-testid="cell-role-userCount">{count}</span>,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text: string) => <span data-testid="cell-role-createdAt">{text}</span>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Role) => (
        <Space>
          <Button type="link" size="small" data-testid={`button-role-edit-${record.id}`}>
            编辑
          </Button>
          <Button type="link" size="small" data-testid={`button-role-permission-${record.id}`}>
            权限
          </Button>
        </Space>
      ),
    },
  ]

  const loadRoles = async (page = pagination.current, pageSize = pagination.pageSize) => {
    setLoading(true)
    try {
      const [roleResp, userResp] = await Promise.all([
        api.get('/roles', { params: { page, pageSize } }),
        api.get('/users', { params: { page: 1, pageSize: 500 } }),
      ])

      const roleList = roleResp.data?.data || []
      const total = roleResp.data?.total || 0
      const userList = userResp.data?.data || []
      const userCountMap = new Map<string, number>()
      userList.forEach((user: any) => {
        const roleId = user.role_id
        if (!roleId) return
        userCountMap.set(roleId, (userCountMap.get(roleId) || 0) + 1)
      })

      setRoles(
        roleList.map((item: any) => ({
          id: item.id,
          name: item.name,
          code: item.code,
          description: item.description || '-',
          userCount: userCountMap.get(item.id) || 0,
          createdAt: item.created_at || item.createdAt || '',
        }))
      )
      setPagination({ current: page, pageSize, total })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRoles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="page-role-manage" data-testid="page-role-manage">
      <div className="page-header">
        <h1 className="page-title">角色管理</h1>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} data-testid="button-role-create">
            创建角色
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => loadRoles()} loading={loading} data-testid="button-role-refresh">
            刷新
          </Button>
        </Space>
      </div>

      <Card data-testid="card-role-table">
        <Table
          columns={columns}
          dataSource={roles}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => loadRoles(page, pageSize),
          }}
          data-testid="table-role-list"
        />
      </Card>
    </div>
  )
}
