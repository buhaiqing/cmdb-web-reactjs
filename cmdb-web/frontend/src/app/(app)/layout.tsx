'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Layout, Spin } from 'antd'
import { AppHeader, AppSidebar, AppFooter } from '@/components/layout'
import { useUserStore } from '@/stores/user'

const { Content } = Layout

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isLoggedIn, checkAuth } = useUserStore()

  useEffect(() => {
    const initAuth = async () => {
      await checkAuth()
    }
    initAuth()
  }, [checkAuth])

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login')
    }
  }, [isLoggedIn, router])

  if (!isLoggedIn) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <Layout className="app-layout" data-testid="layout-app">
      <AppHeader />
      <Layout className="app-body">
        <AppSidebar />
        <Content className="app-main" data-testid="content-main">
          {children}
        </Content>
      </Layout>
      <AppFooter />
    </Layout>
  )
}
