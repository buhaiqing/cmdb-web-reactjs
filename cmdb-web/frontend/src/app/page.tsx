'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Spin } from 'antd'
import { useUserStore } from '@/stores/user'

export default function HomePage() {
  const router = useRouter()
  const { isLoggedIn, isHydrated, checkAuth } = useUserStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (isHydrated) {
      if (isLoggedIn) {
        router.push('/dashboard')
      } else {
        router.push('/login')
      }
    }
  }, [isLoggedIn, isHydrated, router])

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Spin size="large" />
    </div>
  )
}
