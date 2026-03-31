'use client'

import React, { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Layout, Menu } from 'antd'
import {
  DashboardOutlined,
  FolderOutlined,
  FileTextOutlined,
  UserOutlined,
  SafetyOutlined,
  AuditOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { useLayoutStore } from '@/stores/layout'

const { Sider } = Layout

interface MenuItem {
  key: string
  icon?: React.ReactNode
  label: string
  path?: string
  children?: MenuItem[]
}

const menuList: MenuItem[] = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: '首页',
    path: '/dashboard',
  },
  {
    key: '/ci',
    icon: <FolderOutlined />,
    label: '配置项管理',
    children: [
      { key: '/ci/list', label: '配置项列表', path: '/ci/list' },
      { key: '/ci/types', label: '配置项类型', path: '/ci/types' },
      { key: '/ci/relations', label: '关系管理', path: '/ci/relations' },
    ],
  },
  {
    key: '/change',
    icon: <FileTextOutlined />,
    label: '变更管理',
    children: [
      { key: '/change/list', label: '变更列表', path: '/change/list' },
      { key: '/change/create', label: '创建变更', path: '/change/create' },
    ],
  },
  {
    key: '/system',
    icon: <TeamOutlined />,
    label: '系统管理',
    children: [
      { key: '/system/user', label: '用户列表', path: '/system/user' },
      { key: '/system/role', label: '角色列表', path: '/system/role' },
      { key: '/system/audit', label: '审计日志', path: '/system/audit' },
    ],
  },
]

export default function AppSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { collapsed } = useLayoutStore()
  const [openKeys, setOpenKeys] = useState<string[]>([])

  const convertMenuItems = (menuItems: MenuItem[]): MenuProps['items'] => {
    return menuItems.map((item) => ({
      key: item.key,
      icon: item.icon,
      label: item.label,
      children: item.children ? convertMenuItems(item.children) : undefined,
      onClick: item.path
        ? () => {
            if (item.path) router.push(item.path)
          }
        : undefined,
    }))
  }

  const findMenuPath = (menuItems: MenuItem[], key: string): MenuItem | null => {
    for (const item of menuItems) {
      if (item.key === key) return item
      if (item.children) {
        const found = findMenuPath(item.children, key)
        if (found) return found
      }
    }
    return null
  }

  const getSelectedKeys = (): string[] => {
    const keys: string[] = []
    const findKey = (items: MenuItem[]) => {
      for (const item of items) {
        if (item.path === pathname) {
          keys.push(item.key)
        }
        if (item.children) {
          findKey(item.children)
        }
      }
    }
    findKey(menuList)
    return keys
  }

  const handleMenuClick = (e: { key: string }) => {
    const selectedMenu = findMenuPath(menuList, e.key)
    if (selectedMenu?.path) {
      router.push(selectedMenu.path)
    }
  }

  return (
    <Sider
      width={240}
      collapsedWidth={80}
      collapsed={collapsed}
      style={{
        background: '#fff',
        height: '100vh',
        position: 'sticky',
        top: 0,
        left: 0,
        boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
        overflow: 'auto',
      }}
    >
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? 0 : '0 24px',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <TeamOutlined style={{ fontSize: 24, color: '#1890ff' }} />
        {!collapsed && (
          <span style={{ marginLeft: 12, fontSize: 16, fontWeight: 'bold' }}>
            CMDB
          </span>
        )}
      </div>
      <Menu
        mode="inline"
        selectedKeys={getSelectedKeys()}
        defaultOpenKeys={['/ci', '/change', '/user', '/role', '/audit']}
        openKeys={openKeys}
        onOpenChange={setOpenKeys}
        items={convertMenuItems(menuList)}
        onClick={handleMenuClick}
        style={{ borderRight: 0 }}
      />
    </Sider>
  )
}
