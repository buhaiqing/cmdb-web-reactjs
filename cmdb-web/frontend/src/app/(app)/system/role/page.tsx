'use client'

import React, { useState } from 'react'
import { Table, Card, Space, Button, Tag } from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

interface Role {
  id: string
  name: string
  code: string
  description: string
  userCount: number
  createdAt: string
}

export default function RoleManagePage() {
  const [loading] = useState(false)

  const columns: ColumnsType<Role> = [
    {
      title: '角色名称',
      dataIndex: 'name',
      key: 'name',
      dataTestid: 'cell-role-name',
    },
    {
      title: '角色代码',
      dataIndex: 'code',
      key: 'code',
      dataTestid: 'cell-role-code',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      dataTestid: 'cell-role-desc',
    },
    {
      title: '用户数',
      dataIndex: 'userCount',
      key: 'userCount',
      dataTestid: 'cell-role-userCount',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      dataTestid: 'cell-role-createdAt',
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

  const mockData: Role[] = [
    { id: '1', name: '系统管理员', code: 'admin', description: '完整系统配置和管理权限', userCount: 2, createdAt: '2024-01-01 00:00:00' },
    { id: '2', name: '运维工程师', code: 'operator', description: '配置项 CRUD、变更执行权限', userCount: 5, createdAt: '2024-01-01 00:00:00' },
    { id: '3', name: '只读用户', code: 'readonly', description: '仅查看和搜索权限', userCount: 10, createdAt: '2024-01-01 00:00:00' },
    { id: '4', name: '审计员', code: 'auditor', description: '查看审计日志和变更历史权限', userCount: 3, createdAt: '2024-01-01 00:00:00' },
  ]

  return (
    <div className="page-role-manage" data-testid="page-role-manage">
      <div className="page-header">
        <h1 className="page-title">角色管理</h1>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} data-testid="button-role-create">
            创建角色
          </Button>
          <Button icon={<ReloadOutlined />} data-testid="button-role-refresh">
            刷新
          </Button>
        </Space>
      </div>

      <Card data-testid="card-role-table">
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
          data-testid="table-role-list"
        />
      </Card>
    </div>
  )
}
