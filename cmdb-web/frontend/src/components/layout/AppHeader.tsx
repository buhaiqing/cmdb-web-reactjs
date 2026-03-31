'use client'

import React from 'react'
import Link from 'next/link'
import { Layout, Menu, Button, Avatar, Dropdown, Space } from 'antd'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { useUserStore } from '@/stores/user'
import { usePermissionStore } from '@/stores/permission'

const { Header } = Layout

export default function AppHeader() {
  const { user, logout } = useUserStore()
  const { collapsed, toggleCollapsed } = usePermissionStore()

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      label: '个人中心',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogoutOutlined />,
      onClick: () => logout(),
    },
  ]

  return (
    <Header className="app-header" data-testid="header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={toggleCollapsed}
          style={{ color: '#fff', fontSize: 18 }}
          data-testid="button-toggle-sidebar"
        />
        <Link href="/dashboard" style={{ color: '#fff', fontSize: 18, fontWeight: 600 }}>
          CMDB 配置管理系统
        </Link>
      </div>

      <Space size={16}>
        <Button
          type="text"
          icon={<BellOutlined />}
          style={{ color: '#fff', fontSize: 18 }}
          data-testid="button-notifications"
        />

        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar icon={<UserOutlined />} data-testid="header-avatar" />
            <span style={{ color: '#fff' }} data-testid="header-username">
              {user?.username || '用户'}
            </span>
          </div>
        </Dropdown>
      </Space>
    </Header>
  )
}
