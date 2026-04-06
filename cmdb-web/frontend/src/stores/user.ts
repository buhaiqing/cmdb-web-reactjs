import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'

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
  isHydrated: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  checkAuth: () => Promise<void>
  hasPermission: (permission: string) => boolean
}

// 使用内存存储token，避免跨域cookie问题
let globalToken: string | null = null

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
  timeout: 30000,
  withCredentials: false, // 禁用cookie，使用Authorization头
})

api.interceptors.request.use(
  (config) => {
    // 优先使用内存中的token，用于服务端渲染兼容性
    const token = globalToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

const mockLogin = async (username: string, password: string): Promise<{ token: string; user: User } | null> => {
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
      isHydrated: false,

      login: async (username: string, password: string) => {
        set({ isLoading: true })
        try {
          const mockResult = await mockLogin(username, password)
          if (mockResult) {
            const { token, user } = mockResult
            globalToken = token
            set({ user, token, isLoggedIn: true, isLoading: false, isHydrated: true })
            return true
          }

          const response = await api.post('/auth/login', { username, password })
          const { token, user } = response.data.data
          globalToken = token
          set({ user, token, isLoggedIn: true, isLoading: false, isHydrated: true })
          return true
        } catch (error) {
          set({ isLoading: false })
          console.error('Login failed:', error)
          return false
        }
      },

      logout: () => {
        globalToken = null
        set({ user: null, token: null, isLoggedIn: false, isHydrated: true })
      },

      checkAuth: async () => {
        const state = get()

        if (state.isLoggedIn && state.token && state.user) {
          // 同步内存token
          globalToken = state.token
          set({ isHydrated: true })
          return
        }

        const token = state.token
        if (!token) {
          set({ isLoggedIn: false, isHydrated: true })
          return
        }

        globalToken = token
        set({ token })
        try {
          const response = await api.get('/auth/me')
          set({ user: response.data.data, isLoggedIn: true, isHydrated: true })
        } catch {
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
              isHydrated: true,
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
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isHydrated = true
        }
      },
    }
  )
)
