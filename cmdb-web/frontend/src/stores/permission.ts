import { create } from 'zustand'

interface MenuItem {
  key: string
  label: string
  icon?: string
  path?: string
  children?: MenuItem[]
}

interface PermissionState {
  menus: MenuItem[]
  collapsed: boolean
  setMenus: (menus: MenuItem[]) => void
  setCollapsed: (collapsed: boolean) => void
  toggleCollapsed: () => void
}

const defaultMenus: MenuItem[] = [
  {
    key: 'dashboard',
    label: '仪表盘',
    icon: 'Dashboard',
    path: '/dashboard',
  },
  {
    key: 'ci',
    label: '配置项管理',
    icon: 'FolderOutlined',
    children: [
      { key: 'ci-list', label: '配置项列表', path: '/ci/list', icon: 'FileTextOutlined' },
      { key: 'ci-create', label: '创建配置项', path: '/ci/create', icon: 'PlusOutlined' },
    ],
  },
  {
    key: 'relation',
    label: '关系管理',
    icon: 'ShareAltOutlined',
    children: [
      { key: 'relation-graph', label: '关系图', path: '/relation/graph', icon: 'ApartmentOutlined' },
    ],
  },
  {
    key: 'change',
    label: '变更管理',
    icon: 'HistoryOutlined',
    children: [
      { key: 'change-list', label: '变更记录', path: '/change/list', icon: 'FileSyncOutlined' },
    ],
  },
  {
    key: 'report',
    label: '报表统计',
    icon: 'BarChartOutlined',
    children: [
      { key: 'report-summary', label: '资源统计', path: '/report/summary', icon: 'PieChartOutlined' },
    ],
  },
  {
    key: 'system',
    label: '系统管理',
    icon: 'SettingOutlined',
    children: [
      { key: 'system-user', label: '用户管理', path: '/system/user', icon: 'UserOutlined' },
      { key: 'system-role', label: '角色管理', path: '/system/role', icon: 'SafetyOutlined' },
      { key: 'system-audit', label: '审计日志', path: '/system/audit', icon: 'AuditOutlined' },
    ],
  },
]

export const usePermissionStore = create<PermissionState>((set) => ({
  menus: defaultMenus,
  collapsed: false,
  setMenus: (menus) => set({ menus }),
  setCollapsed: (collapsed) => set({ collapsed }),
  toggleCollapsed: () => set((state) => ({ collapsed: !state.collapsed })),
}))
