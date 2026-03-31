'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { Spin } from 'antd'
import { useUserStore } from '@/stores/user'

export default function HomePage() {
  const router = useRouter()
  const pathname = usePathname()
  const { isLoggedIn, checkAuth } = useUserStore()

  useEffect(() => {
    const initAuth = async () => {
      await checkAuth()
    }
    initAuth()
  }, [checkAuth])

  useEffect(() => {
    if (isLoggedIn) {
      router.push('/dashboard')
    } else {
      router.push('/login')
    }
  }, [isLoggedIn, router])

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Spin size="large" />
    </div>
  )
}
