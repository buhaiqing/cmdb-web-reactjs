# CMDB 系统前端设计文档

## 技术栈

- **框架**: React 19 + Next.js 15 (App Router)
- **UI 组件库**: Ant Design 5.x
- **状态管理**: Zustand
- **语言**: TypeScript
- **样式**: CSS Modules + Ant Design Token

## 1. 页面布局设计

### 1.1 整体布局

```
┌────────────────────────────────────────────────────────────┐
│                      Header (64px)                          │
│  [Logo] [导航菜单]                           [用户] [通知]   │
├─────────────┬──────────────────────────────────────────────┤
│             │                                               │
│  Sidebar    │              Main Content                     │
│  (240px)    │                                               │
│  [菜单]     │  ┌─────────────────────────────────────────┐ │
│             │  │                                         │ │
│             │  │           Page Content                  │ │
│             │  │                                         │ │
│             │  └─────────────────────────────────────────┘ │
│             │                                               │
└─────────────┴──────────────────────────────────────────────┘
│                      Footer (32px)                          │
│                   © 2024 CMDB System                        │
└────────────────────────────────────────────────────────────┘
```

### 1.2 布局组件结构

```tsx
// app/layout.tsx
import React from 'react'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import AppHeader from '@/components/layout/AppHeader'
import AppSidebar from '@/components/layout/AppSidebar'
import AppFooter from '@/components/layout/AppFooter'
import { useUserStore } from '@/stores/user'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const userStore = useUserStore()

  return (
    <html lang="zh-CN">
      <body>
        <ConfigProvider locale={zhCN}>
          <div className="app-layout">
            <AppHeader />
            <div className="app-body">
              <AppSidebar />
              <main className="app-main">
                {children}
              </main>
            </div>
            <AppFooter />
          </div>
        </ConfigProvider>
      </body>
    </html>
  )
}
```

## 2. 路由设计

### 2.1 目录结构 (App Router)

```
app/
├── (auth)/
│   └── login/
│       └── page.tsx
├── (main)/
│   ├── layout.tsx
│   ├── page.tsx                    # Dashboard
│   ├── ci/
│   │   ├── page.tsx                # CI 列表
│   │   ├── [id]/
│   │   │   └── page.tsx            # CI 详情
│   │   ├── create/
│   │   │   └── page.tsx            # 创建 CI
│   │   └── [id]/
│   │       └── edit/
│   │           └── page.tsx        # 编辑 CI
│   ├── relation/
│   │   └── graph/
│   │       └── page.tsx            # 关系图
│   ├── change/
│   │   ├── page.tsx                # 变更列表
│   │   └── [id]/
│   │       └── page.tsx            # 变更详情
│   ├── report/
│   │   └── summary/
│   │       └── page.tsx            # 资源统计
│   └── system/
│       ├── user/
│       │   └── page.tsx            # 用户管理
│       ├── role/
│       │   └── page.tsx            # 角色管理
│       └── audit/
│           └── page.tsx            # 审计日志
├── not-found.tsx
└── global-error.tsx
```

### 2.2 路由守卫 (Middleware)

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  const { pathname } = request.nextUrl

  if (pathname === '/login') {
    if (token) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}
```

### 2.3 主布局模板

```tsx
// app/(main)/layout.tsx
'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/stores/user'
import AppSidebar from '@/components/layout/AppSidebar'
import AppHeader from '@/components/layout/AppHeader'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { isLoggedIn, checkAuth } = useUserStore()

  useEffect(() => {
    if (!checkAuth()) {
      router.push('/login')
    }
  }, [checkAuth, router])

  if (!isLoggedIn) {
    return null
  }

  return (
    <div className="app-layout">
      <AppHeader />
      <div className="app-body">
        <AppSidebar />
        <main className="app-main">{children}</main>
      </div>
    </div>
  )
}
```

## 3. 页面设计

### 3.1 登录页面

```tsx
// app/(auth)/login/page.tsx
'use client'

import React, { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Form, Input, Button, Card, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useUserStore } from '@/stores/user'
import styles from './page.module.css'

interface LoginForm {
  username: string
  password: string
}

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useUserStore()
  const [loading, setLoading] = useState(false)

  const onFinish = async (values: LoginForm) => {
    setLoading(true)
    try {
      await login(values)
      const redirect = searchParams.get('redirect') || '/'
      router.push(redirect)
    } catch (error) {
      message.error('登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.loginContainer}>
      <Card className={styles.loginCard}>
        <div className={styles.loginHeader}>
          <h1>CMDB 配置管理系统</h1>
          <p>运维部统一资源配置平台</p>
        </div>

        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          layout="vertical"
          requiredMark={false}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
              size="large"
              data-testid="login-username"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码长度至少 6 位' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              size="large"
              data-testid="login-password"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading}
              block
              data-testid="login-submit"
            >
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
```

```css
/* app/(auth)/login/page.module.css */
.loginContainer {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.loginCard {
  width: 400px;
}

.loginHeader {
  text-align: center;
  margin-bottom: 30px;
}

.loginHeader h1 {
  color: #303133;
  font-size: 24px;
  margin-bottom: 8px;
}

.loginHeader p {
  color: #909399;
  font-size: 14px;
}
```

### 3.2 配置项列表页

```tsx
// app/(main)/ci/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Table, Button, Space, Tag, Card, Select, Input, Modal, message } from 'antd'
import { PlusOutlined, UploadOutlined, DownloadOutlined } from '@ant-design/icons'
import { useCiStore } from '@/stores/ci'
import { usePermission } from '@/hooks/usePermission'
import type { TablePaginationConfig } from 'antd'
import type { FilterValue } from 'antd/es/table/interface'
import styles from './page.module.css'

const { Search } = Input

interface SearchForm {
  keyword: string
  ci_type: string
  status: string
  environment: string
}

const ciTypeOptions = [
  { label: '服务器', value: 'server' },
  { label: '网络设备', value: 'network_device' },
  { label: '数据库', value: 'database' },
  { label: '中间件', value: 'middleware' },
  { label: '应用程序', value: 'application' }
]

const statusOptions = [
  { label: '活跃', value: 'active' },
  { label: '非活跃', value: 'inactive' }
]

const environmentOptions = [
  { label: '生产', value: 'production' },
  { label: '测试', value: 'test' },
  { label: '开发', value: 'development' }
]

const statusMap: Record<string, { color: string; text: string }> = {
  active: { color: 'success', text: '活跃' },
  inactive: { color: 'default', text: '非活跃' },
  deleted: { color: 'error', text: '已删除' }
}

export default function CiListPage() {
  const router = useRouter()
  const { ciList, pagination, fetchCiList, deleteCi } = useCiStore()
  const { hasPermission } = usePermission()

  const [loading, setLoading] = useState(false)
  const [searchForm] = useState<SearchForm>({
    keyword: '',
    ci_type: '',
    status: '',
    environment: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async (page = 1, pageSize = 20) => {
    setLoading(true)
    try {
      await fetchCiList({
        page,
        page_size: pageSize,
        ...searchForm
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTableChange = (
    pagination: TablePaginationConfig
  ) => {
    loadData(pagination.current || 1, pagination.pageSize || 20)
  }

  const handleCreate = () => {
    router.push('/ci/create')
  }

  const handleView = (record: any) => {
    router.push(`/ci/${record.id}`)
  }

  const handleEdit = (record: any) => {
    router.push(`/ci/${record.id}/edit`)
  }

  const handleDelete = async (record: any) => {
    Modal.confirm({
      title: '提示',
      content: '确定要删除该配置项吗？',
      onOk: async () => {
        try {
          await deleteCi(record.id)
          message.success('删除成功')
          loadData()
        } catch (error) {
          message.error('删除失败')
        }
      }
    })
  }

  const columns = [
    { title: '名称', dataIndex: 'name', width: 200 },
    { title: '类型', dataIndex: 'ci_type', width: 120 },
    { title: '编码', dataIndex: 'code', width: 120 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: string) => {
        const item = statusMap[status] || { color: 'default', text: status }
        return <Tag color={item.color}>{item.text}</Tag>
      }
    },
    { title: '环境', dataIndex: 'environment', width: 100 },
    { title: '负责人', dataIndex: 'owner', width: 100 },
    { title: '更新时间', dataIndex: 'updated_at', width: 180 },
    {
      title: '操作',
      width: 200,
      render: (_: any, record: any) => (
        <Space size="small">
          {hasPermission('ci:read') && (
            <Button type="link" size="small" onClick={() => handleView(record)} data-testid="ci-view-btn">
              查看
            </Button>
          )}
          {hasPermission('ci:update') && (
            <Button type="link" size="small" onClick={() => handleEdit(record)} data-testid="ci-edit-btn">
              编辑
            </Button>
          )}
          {hasPermission('ci:delete') && (
            <Button type="link" size="small" danger onClick={() => handleDelete(record)} data-testid="ci-delete-btn">
              删除
            </Button>
          )}
        </Space>
      )
    }
  ]

  return (
    <div className={styles.ciListPage} data-testid="ci-list-page">
      <Card className={styles.searchCard}>
        <Space size="middle" wrap>
          <Search
            placeholder="关键字搜索"
            onSearch={() => loadData()}
            style={{ width: 200 }}
            data-testid="ci-search-keyword"
          />
          <Select
            placeholder="选择类型"
            allowClear
            style={{ width: 150 }}
            options={ciTypeOptions}
            onChange={() => loadData()}
            data-testid="ci-type-select"
          />
          <Select
            placeholder="选择状态"
            allowClear
            style={{ width: 120 }}
            options={statusOptions}
            onChange={() => loadData()}
            data-testid="ci-status-select"
          />
          <Select
            placeholder="选择环境"
            allowClear
            style={{ width: 120 }}
            options={environmentOptions}
            onChange={() => loadData()}
            data-testid="ci-env-select"
          />
        </Space>
      </Card>

      <Card>
        <Space style={{ marginBottom: 16 }}>
          {hasPermission('ci:create') && (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate} data-testid="ci-create-btn">
              新建
            </Button>
          )}
          {hasPermission('ci:import') && (
            <Button icon={<UploadOutlined />} data-testid="ci-import-btn">
              导入
            </Button>
          )}
          {hasPermission('ci:export') && (
            <Button icon={<DownloadOutlined />} data-testid="ci-export-btn">
              导出
            </Button>
          )}
        </Space>

        <Table
          loading={loading}
          columns={columns}
          dataSource={ciList}
          rowKey="id"
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`
          }}
          onChange={handleTableChange}
          data-testid="ci-data-table"
        />
      </Card>
    </div>
  )
}
```

### 3.3 配置项详情页

```tsx
// app/(main)/ci/[id]/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Row, Col, Card, Descriptions, Tag, Timeline, Progress, Button, Space, Spin, message } from 'antd'
import { useCiStore } from '@/stores/ci'
import { usePermission } from '@/hooks/usePermission'
import styles from './page.module.css'

const statusMap: Record<string, { color: string; text: string }> = {
  active: { color: 'success', text: '活跃' },
  inactive: { color: 'default', text: '非活跃' },
  deleted: { color: 'error', text: '已删除' }
}

const ciTypeMap: Record<string, string> = {
  server: '服务器',
  network_device: '网络设备',
  database: '数据库',
  middleware: '中间件',
  application: '应用程序'
}

export default function CiDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { ci, fetchCiDetail, changes, relations, metrics } = useCiStore()
  const { hasPermission } = usePermission()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [params.id])

  const loadData = async () => {
    setLoading(true)
    try {
      await fetchCiDetail(params.id as string)
    } catch (error) {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    router.push(`/ci/${params.id}/edit`)
  }

  const handleAddRelation = () => {
    message.info('添加关联')
  }

  const goToCi = (ciId: string) => {
    router.push(`/ci/${ciId}`)
  }

  if (loading) {
    return <Spin className={styles.spinner} />
  }

  if (!ci) {
    return null
  }

  return (
    <div className={styles.ciDetailPage} data-testid="ci-detail-page">
      <Card className={styles.headerCard}>
        <Space style={{ float: 'right' }}>
          {hasPermission('ci:update') && (
            <Button type="primary" onClick={handleEdit} data-testid="ci-edit-btn">
              编辑
            </Button>
          )}
        </Space>
        <Descriptions title={ci.name} column={2} data-testid="ci-basic-info" />
      </Card>

      <Row gutter={20}>
        <Col span={16}>
          <Card className={styles.detailCard} title="基本信息">
            <Descriptions column={2} data-testid="ci-basic-info">
              <Descriptions.Item label="名称">{ci.name}</Descriptions.Item>
              <Descriptions.Item label="编码">{ci.code}</Descriptions.Item>
              <Descriptions.Item label="类型">{ciTypeMap[ci.ci_type] || ci.ci_type}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusMap[ci.status]?.color}>
                  {statusMap[ci.status]?.text || ci.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="环境">{ci.environment}</Descriptions.Item>
              <Descriptions.Item label="负责人">{ci.owner}</Descriptions.Item>
              <Descriptions.Item label="部门">{ci.department}</Descriptions.Item>
              <Descriptions.Item label="区域">{ci.region}</Descriptions.Item>
            </Descriptions>
          </Card>

          {ci.attributes && (
            <Card className={styles.detailCard} title="详细属性">
              <Descriptions column={2} data-testid="ci-attributes">
                {Object.entries(ci.attributes).map(([key, value]) => (
                  <Descriptions.Item key={key} label={key}>
                    {String(value)}
                  </Descriptions.Item>
                ))}
              </Descriptions>
            </Card>
          )}

          <Card className={styles.detailCard} title="变更历史">
            <Timeline data-testid="ci-changes">
              {changes.map((change) => (
                <Timeline.Item key={change.id} timestamp={change.created_at}>
                  <Card size="small">
                    <p>{change.change_type} - {change.change_reason}</p>
                    <p className={styles.changeUser}>操作人：{change.created_by?.username}</p>
                  </Card>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Col>

        <Col span={8}>
          <Card
            className={styles.relationCard}
            title={
              <div className={styles.cardHeader}>
                <span>关联关系</span>
                {hasPermission('relation:create') && (
                  <Button type="link" size="small" onClick={handleAddRelation} data-testid="relation-add-btn">
                    添加
                  </Button>
                )}
              </div>
            }
          >
            <div className={styles.relationList}>
              {relations.map((relation) => (
                <div key={relation.id} className={styles.relationItem} data-testid="relation-item">
                  <div className={styles.relationType}>{relation.relation_type}</div>
                  <div className={styles.relationTarget} onClick={() => goToCi(relation.target_ci.id)}>
                    {relation.target_ci.name}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {metrics && (
            <Card className={styles.metricCard} title="监控指标">
              <div className={styles.metricList}>
                <div className={styles.metricItem}>
                  <span className={styles.metricLabel}>CPU 使用率</span>
                  <Progress percent={metrics.cpu_usage} />
                </div>
                <div className={styles.metricItem}>
                  <span className={styles.metricLabel}>内存使用率</span>
                  <Progress percent={metrics.memory_usage} />
                </div>
                <div className={styles.metricItem}>
                  <span className={styles.metricLabel}>磁盘使用率</span>
                  <Progress percent={metrics.disk_usage} />
                </div>
              </div>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  )
}
```

```css
/* app/(main)/ci/[id]/page.module.css */
.ciDetailPage {
  padding: 0;
}

.spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.headerCard {
  margin-bottom: 16px;
}

.detailCard {
  margin-bottom: 16px;
}

.cardHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.relationList {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.relationItem {
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.relationType {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.relationTarget {
  color: #1677ff;
  cursor: pointer;
}

.relationTarget:hover {
  text-decoration: underline;
}

.changeUser {
  color: #909399;
  font-size: 12px;
  margin-top: 4px;
}

.metricList {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.metricItem {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.metricLabel {
  font-size: 14px;
  color: #303133;
}
```

## 4. 状态管理 (Zustand)

### 4.1 用户状态

```typescript
// stores/user.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  username: string
  email: string
  permissions: string[]
}

interface UserState {
  user: User | null
  token: string | null
  isLoggedIn: boolean
  login: (credentials: { username: string; password: string }) => Promise<void>
  logout: () => void
  hasPermission: (permission: string) => boolean
  checkAuth: () => boolean
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoggedIn: false,

      login: async (credentials) => {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials)
        })

        if (!response.ok) {
          throw new Error('Login failed')
        }

        const { data } = await response.json()
        set({
          user: data.user,
          token: data.token,
          isLoggedIn: true
        })
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isLoggedIn: false
        })
      },

      hasPermission: (permission: string) => {
        const { user } = get()
        if (!user) return false
        return user.permissions.includes(permission)
      },

      checkAuth: () => {
        const { token } = get()
        return !!token
      }
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isLoggedIn: state.isLoggedIn
      })
    }
  )
)
```

### 4.2 CI 状态

```typescript
// stores/ci.ts
import { create } from 'zustand'
import { useUserStore } from './user'

interface Ci {
  id: string
  name: string
  code: string
  ci_type: string
  status: string
  environment: string
  owner: string
  department: string
  region: string
  attributes?: Record<string, any>
  updated_at: string
}

interface CiChange {
  id: string
  change_type: string
  change_reason: string
  created_at: string
  created_by: { username: string }
}

interface CiRelation {
  id: string
  relation_type: string
  target_ci: { id: string; name: string }
}

interface CiMetrics {
  cpu_usage: number
  memory_usage: number
  disk_usage: number
}

interface Pagination {
  page: number
  pageSize: number
  total: number
}

interface CiState {
  ciList: Ci[]
  ci: Ci | null
  changes: CiChange[]
  relations: CiRelation[]
  metrics: CiMetrics | null
  pagination: Pagination
  fetchCiList: (params: any) => Promise<void>
  fetchCiDetail: (id: string) => Promise<void>
  createCi: (data: Partial<Ci>) => Promise<void>
  updateCi: (id: string, data: Partial<Ci>) => Promise<void>
  deleteCi: (id: string) => Promise<void>
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const token = useUserStore.getState().token
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers
    }
  })

  if (response.status === 401) {
    useUserStore.getState().logout()
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  if (!response.ok) {
    throw new Error('Request failed')
  }

  const result = await response.json()
  return result.data
}

export const useCiStore = create<CiState>((set, get) => ({
  ciList: [],
  ci: null,
  changes: [],
  relations: [],
  metrics: null,
  pagination: {
    page: 1,
    pageSize: 20,
    total: 0
  },

  fetchCiList: async (params) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, String(value))
      }
    })

    const data = await request<{ items: Ci[]; total: number }>(
      `/api/ci?${searchParams.toString()}`
    )

    set({
      ciList: data.items,
      pagination: {
        ...get().pagination,
        page: params.page || 1,
        pageSize: params.page_size || 20,
        total: data.total
      }
    })
  },

  fetchCiDetail: async (id) => {
    const [ci, changes, relations, metrics] = await Promise.all([
      request<Ci>(`/api/ci/${id}`),
      request<CiChange[]>(`/api/ci/${id}/changes`),
      request<CiRelation[]>(`/api/ci/${id}/relations`),
      request<CiMetrics>(`/api/ci/${id}/metrics`).catch(() => null)
    ])

    set({ ci, changes, relations, metrics })
  },

  createCi: async (data) => {
    await request('/api/ci', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  updateCi: async (id, data) => {
    await request(`/api/ci/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },

  deleteCi: async (id) => {
    await request(`/api/ci/${id}`, {
      method: 'DELETE'
    })
  }
}))
```

## 5. 权限 Hook

```typescript
// hooks/usePermission.ts
import { useUserStore } from '@/stores/user'

export function usePermission() {
  const { hasPermission } = useUserStore()

  return {
    hasPermission: (permission: string) => hasPermission(permission)
  }
}
```

## 6. API 客户端设计

### 6.1 请求工具函数

```typescript
// lib/api.ts
import { useUserStore } from '@/stores/user'

interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
}

export async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const userStore = useUserStore.getState()

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(userStore.token ? { Authorization: `Bearer ${userStore.token}` } : {}),
      ...options.headers
    }
  })

  if (response.status === 401) {
    userStore.logout()
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  const result: ApiResponse<T> = await response.json()

  if (!result.success) {
    throw new Error(result.error || 'Request failed')
  }

  return result.data
}
```

### 6.2 API 模块

```typescript
// api/ci.ts
import { apiRequest } from '@/lib/api'

export interface CiListParams {
  page?: number
  page_size?: number
  keyword?: string
  ci_type?: string
  status?: string
  environment?: string
}

export interface Ci {
  id: string
  name: string
  code: string
  ci_type: string
  status: string
  environment: string
  owner: string
  department: string
  region: string
  attributes?: Record<string, any>
  updated_at: string
}

export const ciApi = {
  getList: (params: CiListParams) =>
    apiRequest<{ items: Ci[]; total: number }>('/api/ci', {
      method: 'GET'
    }),

  getDetail: (id: string) =>
    apiRequest<Ci>(`/api/ci/${id}`),

  create: (data: Partial<Ci>) =>
    apiRequest<Ci>('/api/ci', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  update: (id: string, data: Partial<Ci>) =>
    apiRequest<Ci>(`/api/ci/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  delete: (id: string) =>
    apiRequest<void>(`/api/ci/${id}`, {
      method: 'DELETE'
    })
}
```

## 7. UI 自动化测试支持

### 7.1 Test ID 规范

所有可交互的 UI 元素必须添加 `data-testid` 属性：

| 元素类型 | Test ID 命名规范 | 示例 |
|----------|------------------|------|
| 登录输入框 | login-username | `data-testid="login-username"` |
| 登录密码框 | login-password | `data-testid="login-password"` |
| 登录按钮 | login-submit | `data-testid="login-submit"` |
| 列表页搜索表单 | ci-search-form | `data-testid="ci-search-form"` |
| 列表页数据表格 | ci-data-table | `data-testid="ci-data-table"` |
| 创建按钮 | ci-create-btn | `data-testid="ci-create-btn"` |
| 查看按钮 | ci-view-btn | `data-testid="ci-view-btn"` |
| 编辑按钮 | ci-edit-btn | `data-testid="ci-edit-btn"` |
| 删除按钮 | ci-delete-btn | `data-testid="ci-delete-btn"` |
| 分页组件 | data-table-pagination | `data-testid="data-table-pagination"` |
| 详情基本信息 | ci-basic-info | `data-testid="ci-basic-info"` |
| 详情属性信息 | ci-attributes | `data-testid="ci-attributes"` |
| 详情变更历史 | ci-changes | `data-testid="ci-changes"` |

### 7.2 加载状态指示

```tsx
<Spin spinning={loading} tip="加载中...">
  <div>
    {/* 页面内容 */}
  </div>
</Spin>
```

### 7.3 操作反馈

```tsx
import { message, Modal } from 'antd'

// 成功反馈
message.success('操作成功')

// 错误反馈
message.error('操作失败')

// 确认对话框
Modal.confirm({
  title: '提示',
  content: '确定要删除吗？',
  onOk: () => {
    // 确认操作
  }
})
```

## 7.4 反模式与注意事项

### 7.4.1 类型安全

```tsx
// ❌ 禁止使用 any 或 @ts-ignore
const handleClick = (data: any) => {
  console.log(data.name)
}

// ✅ 正确做法：使用具体的类型定义
interface User {
  id: string
  name: string
  email: string
}

const handleClick = (data: User) => {
  console.log(data.name)
}
```

### 7.4.2 组件渲染

```tsx
// ❌ 禁止在渲染中直接修改 state
const MyComponent = () => {
  const [count, setCount] = useState(0)
  return <div onClick={() => count++}>{count}</div>}
}

// ✅ 正确做法：使用 setState
const MyComponent = () => {
  const [count, setCount] = useState(0)
  return <div onClick={() => setCount(c => c + 1)}>{count}</div>}
}
```

```tsx
// ❌ 禁止在条件渲染中遗漏默认值
const MyComponent = ({ user }) => {
  return <div>{user.name}</div>  // user 可能为 null
}

// ✅ 正确做法：提供默认值或条件检查
const MyComponent = ({ user }) => {
  return <div>{user?.name || '未命名'}</div>
}
```

### 7.4.3 副作用处理

```tsx
// ❌ 禁止在 useEffect 中缺少依赖数组
useEffect(() => {
  fetchData(id)
}, [])  // 缺少 id 依赖

// ✅ 正确做法：确保依赖数组完整
useEffect(() => {
  fetchData(id)
}, [id])

// ✅ 或者使用 useCallback 包装
useEffect(() => {
  fetchData(id)
}, [fetchData])
```

```tsx
// ❌ 禁止在 useEffect 中执行同步 setState
useEffect(() => {
  setLoading(true)  // 同步操作
  setData(fetchData())
}, [])

// ✅ 正确做法：将同步逻辑移到组件顶层
const [loading, setLoading] = useState(true)
const [data, setData] = useState(null)

useEffect(() => {
  const load = async () => {
    setLoading(true)
    try {
      const result = await fetchData()
      setData(result)
    } finally {
      setLoading(false)
    }
  }
  load()
}, [])
```

### 7.4.4 状态管理

```tsx
// ❌ 禁止直接修改 Zustand store 中的对象
const useStore = create((set) => ({
  user: { name: '张三', age: 20 },
  updateUser: (name) => set({ user: { ...user, name } })  // 直接修改
}))

// ✅ 正确做法：使用 Immer 或展开运算符确保不可变性
import { produce } from 'immer'
const useStore = create(
  produce((set) => ({
    user: { name: '张三', age: 20 },
    updateUser: (name) => set(produce((state) => {
      state.user.name = name
    }))
  }))
)
```

### 7.4.5 API 请求

```tsx
// ❌ 禁止在组件中直接处理 401 跳转
const MyComponent = () => {
  const handleFetch = async () => {
    const res = await api.getData()
    if (res.status === 401) {
      window.location.href = '/login'  // 禁止
    }
  }
}

// ✅ 正确做法：让 apiRequest 统一处理
import { apiRequest } from '@/lib/api'
// apiRequest 内部已处理 401 跳转
```

```tsx
// ❌ 禁止忽略 async/await 的错误处理
const handleSubmit = async (values) => {
  await createCi(values)  // 可能失败但未处理
  router.push('/ci/list')
}

// ✅ 正确做法：使用 try-catch
const handleSubmit = async (values) => {
  try {
    await createCi(values)
    message.success('创建成功')
    router.push('/ci/list')
  } catch (error) {
    message.error('创建失败')
  }
}
```

### 7.4.6 React Server Components

```tsx
// ❌ 禁止在 Server Component 中使用客户端 hooks
export default async function Page() {
  const { data } = useUserStore()  // ❌ 错误
  return <div>{data}</div>
}

// ✅ 正确做法：使用 'use client' 标记或通过 props 传递数据
export default async function Page() {
  const data = await fetchUser()  // Server Component 中使用 fetch
  return <ClientComponent data={data} />
}
```

```tsx
// ❌ 避免不必要的 'use client' 标记
'use client'  // 如果组件不需要交互，不要添加
import { Card } from 'antd'

export default Card  // ❌ 不需要客户端标记
```

### 7.4.7 表单处理

```tsx
// ❌ 禁止使用非受控组件处理表单
<Input defaultValue="初始值" />  // 无法获取和验证值

// ✅ 正确做法：使用受控组件 + Ant Design Form
const [form] = Form.useForm()
<Form form={form}>
  <Form.Item name="username" rules={[{ required: true }]}>
    <Input />
  </Form.Item>
</Form>
```

### 7.4.8 列表渲染

```tsx
// ❌ 禁止使用数组索引作为 key
{items.map((item, index) => (
  <div key={index}>{item.name}</div>
))}

// ✅ 正确做法：使用唯一标识符
{items.map((item) => (
  <div key={item.id}>{item.name}</div>
))}
```

### 7.4.9 样式规范

```tsx
// ❌ 禁止使用内联样式处理复杂样式
<div style={{ display: 'flex', justifyContent: 'center', backgroundColor: '#f0f0f0' }}>

// ✅ 正确做法：使用 CSS Modules
<div className={styles.container}>
```

```tsx
// ❌ 禁止在 CSS Modules 中使用全局选择器修改 Ant Design 样式
:global(.ant-btn) {
  margin-right: 8px;
}

// ✅ 正确做法：使用 Ant Design ConfigProvider 或 CSS Modules 特定类名
<div className={styles.customButton}>
```

### 7.4.10 常见错误汇总

| 错误类型 | ❌ 错误做法 | ✅ 正确做法 |
|---------|-----------|-----------|
| 类型安全 | `as any` | 定义具体类型接口 |
| 状态更新 | 直接修改 state | 使用 setState 或不可变操作 |
| 副作用 | 缺少依赖数组 | 完整声明依赖或使用 ref |
| API 错误 | 忽略 catch | 始终处理错误和 loading |
| 组件类型 | 滥用 'use client' | 优先使用 Server Components |
| 表单 | 非受控组件 | Ant Design Form 受控组件 |
| 列表 | 索引作 key | 使用唯一 id 作 key |

## 8. 目录结构

```
src/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       ├── page.tsx
│   │       └── page.module.css
│   ├── (main)/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── ci/
│   │   │   ├── page.tsx
│   │   │   ├── page.module.css
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx
│   │   │   │   └── page.module.css
│   │   │   └── create/
│   │   │       └── page.tsx
│   │   ├── relation/
│   │   │   └── graph/
│   │   │       └── page.tsx
│   │   ├── change/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── report/
│   │   │   └── summary/
│   │   │       └── page.tsx
│   │   └── system/
│   │       ├── user/
│   │       │   └── page.tsx
│   │       ├── role/
│   │       │   └── page.tsx
│   │       └── audit/
│   │           └── page.tsx
│   ├── not-found.tsx
│   ├── global-error.tsx
│   ├── layout.tsx
│   └── globals.css
├── components/
│   └── layout/
│       ├── AppHeader.tsx
│       ├── AppSidebar.tsx
│       └── AppFooter.tsx
├── stores/
│   ├── user.ts
│   └── ci.ts
├── hooks/
│   └── usePermission.ts
├── lib/
│   └── api.ts
├── api/
│   └── ci.ts
└── types/
    └── index.ts
```
