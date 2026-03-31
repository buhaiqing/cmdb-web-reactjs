import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'
import Cookies from 'js-cookie'

interface User {
  id: string
  username: string
  email: string
  role: string
  permissions: string[]
}

interface UserState {
  user: User | null
  token: string | null
  isLoggedIn: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  checkAuth: () => Promise<void>
  hasPermission: (permission: string) => boolean
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
  timeout: 30000,
})

// 开发模式下的模拟登录
const mockLogin = async (username: string, password: string): Promise<{ token: string; user: User } | null> => {
  // 模拟验证：admin/admin123
  if (username === 'admin' && password === 'admin123') {
    return {
      token: 'mock-jwt-token-' + Date.now(),
      user: {
        id: '1',
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin',
        permissions: ['*'],
      },
    }
  }
  return null
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoggedIn: false,
      isLoading: false,

      login: async (username: string, password: string) => {
        set({ isLoading: true })
        try {
          // 先尝试模拟登录（开发模式）
          const mockResult = await mockLogin(username, password)
          if (mockResult) {
            const { token, user } = mockResult
            Cookies.set('token', token, { expires: 7 })
            set({ user, token, isLoggedIn: true, isLoading: false })
            return true
          }

          // 如果模拟登录失败，尝试真实 API
          const response = await api.post('/auth/login', { username, password })
          const { token, user } = response.data.data
          Cookies.set('token', token, { expires: 7 })
          set({ user, token, isLoggedIn: true, isLoading: false })
          return true
        } catch (error) {
          set({ isLoading: false })
          console.error('Login failed:', error)
          return false
        }
      },

      logout: () => {
        Cookies.remove('token')
        set({ user: null, token: null, isLoggedIn: false })
      },

      checkAuth: async () => {
        const token = Cookies.get('token')
        if (!token) {
          set({ isLoggedIn: false })
          return
        }
        set({ token })
        try {
          const response = await api.get('/auth/me')
          set({ user: response.data.data, isLoggedIn: true })
        } catch {
          // 如果是 mock token，直接设置模拟用户
          if (token.startsWith('mock-jwt-token')) {
            set({
              user: {
                id: '1',
                username: 'admin',
                email: 'admin@example.com',
                role: 'admin',
                permissions: ['*'],
              },
              isLoggedIn: true,
            })
          } else {
            get().logout()
          }
        }
      },

      hasPermission: (permission: string) => {
        const { user } = get()
        if (!user) return false
        if (user.role === 'admin') return true
        return user.permissions.includes(permission)
      },
    }),
    {
      name: 'cmdb-user-storage',
    }
  )
)
