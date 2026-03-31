'use client'

import React, { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Layout, Menu } from 'antd'
import {
  DashboardOutlined,
  FolderOutlined,
  FileTextOutlined,
  PlusOutlined,
  ShareAltOutlined,
  ApartmentOutlined,
  HistoryOutlined,
  FileSyncOutlined,
  BarChartOutlined,
  PieChartOutlined,
  SettingOutlined,
  UserOutlined,
  SafetyOutlined,
  AuditOutlined,
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { usePermissionStore } from '@/stores/permission'

const { Sider } = Layout

const iconMap: Record<string, React.ReactNode> = {
  Dashboard: <DashboardOutlined />,
  FolderOutlined: <FolderOutlined />,
  FileTextOutlined: <FileTextOutlined />,
  PlusOutlined: <PlusOutlined />,
  ShareAltOutlined: <ShareAltOutlined />,
  ApartmentOutlined: <ApartmentOutlined />,
  HistoryOutlined: <HistoryOutlined />,
  FileSyncOutlined: <FileSyncOutlined />,
  BarChartOutlined: <BarChartOutlined />,
  PieChartOutlined: <PieChartOutlined />,
  SettingOutlined: <SettingOutlined />,
  UserOutlined: <UserOutlined />,
  SafetyOutlined: <SafetyOutlined />,
  AuditOutlined: <AuditOutlined />,
}

export default function AppSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { menus, collapsed } = usePermissionStore()
  const [openKeys, setOpenKeys] = useState<string[]>([])

  const convertMenuItems = (menuList: typeof menus): MenuProps['items'] => {
    return menuList.map((item) => ({
      key: item.key,
      icon: item.icon ? iconMap[item.icon] : undefined,
      label: item.label,
      children: item.children ? convertMenuItems(item.children) : undefined,
      onClick: item.path
        ? () => {
            router.push(item.path!)
          }
        : undefined,
    }))
  }

  const handleMenuClick = (e: { key: string }) => {
    const selectedMenu = findMenuPath(menus, e.key)
    if (selectedMenu?.path) {
      router.push(selectedMenu.path)
    }
  }

  const findMenuPath = (menuList: typeof menus, key: string): (typeof menus)[0] | null => {
    for (const item of menuList) {
      if (item.key === key) return item
      if (item.children) {
        const found = findMenuPath(item.children, key)
        if (found) return found
      }
    }
    return null
  }

  const getSelectedKeys = () => {
    const keys: string[] = []
    const findKey = (menuList: typeof menus) => {
      for (const item of menuList) {
        if (item.path === pathname) {
          keys.push(item.key)
        }
        if (item.children) {
          findKey(item.children)
        }
      }
    }
    findKey(menus)
    return keys
  }

  return (
    <Sider
      width={240}
      collapsedWidth={80}
      collapsed={collapsed}
      className="app-sidebar"
      data-testid="sidebar"
    >
      <Menu
        mode="inline"
        selectedKeys={getSelectedKeys()}
        defaultOpenKeys={openKeys}
        items={convertMenuItems(menus)}
        onClick={handleMenuClick}
        style={{ height: '100%', borderRight: 0 }}
        data-testid="menu-sidebar"
      />
    </Sider>
  )
}
