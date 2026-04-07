'use client'

import React from 'react'
import { Layout, Menu, Avatar, Dropdown, Button, Space } from 'antd'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  BellOutlined,
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/stores/user'
import { useLayoutStore } from '@/stores/layout'

const { Header } = Layout

export default function AppHeader() {
  const router = useRouter()
  const { user, logout } = useUserStore()
  const { collapsed, toggleCollapsed } = useLayoutStore()

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '系统设置',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        logout()
        router.push('/login')
      },
    },
  ]

  const menuItems: MenuProps['items'] = [
    {
      key: '/dashboard',
      label: '首页',
    },
    {
      key: '/ci/list',
      label: '配置项管理',
    },
    {
      key: '/change/list',
      label: '变更管理',
    },
    {
      key: '/user/list',
      label: '用户管理',
    },
    {
      key: '/role/list',
      label: '角色管理',
    },
  ]

  return (
    <Header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#001529',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      }}
      data-testid="header-main"
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          style={{ color: 'white', fontSize: 18, marginRight: 16 }}
          onClick={toggleCollapsed}
          data-testid="button-toggle-sidebar"
        />
        <div
          style={{
            color: 'white',
            fontSize: '20px',
            fontWeight: 'bold',
            marginRight: '40px',
          }}
          data-testid="header-title"
        >
          CMDB 配置管理系统
        </div>
        <Menu
          theme="dark"
          mode="horizontal"
          defaultSelectedKeys={['/dashboard']}
          items={menuItems}
          style={{ flex: 1, minWidth: 400 }}
          onClick={({ key }) => router.push(key)}
          data-testid="header-menu"
        />
      </div>
      <Space size="middle">
        <Button
          type="text"
          icon={<BellOutlined />}
          style={{ color: 'rgba(255,255,255,0.85)' }}
          data-testid="button-header-notification"
        />
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" data-testid="dropdown-header-user">
          <Space style={{ cursor: 'pointer' }} data-testid="header-user-menu">
            <Avatar
              style={{ backgroundColor: '#1890ff' }}
              icon={<UserOutlined />}
              data-testid="header-avatar"
            />
            <span style={{ color: 'white' }} data-testid="header-username">{user?.username || 'admin'}</span>
          </Space>
        </Dropdown>
      </Space>
    </Header>
  )
}
