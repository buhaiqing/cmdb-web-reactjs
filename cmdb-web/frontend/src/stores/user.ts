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
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api',
  timeout: 30000,
  withCredentials: false, // 禁用cookie，使用Authorization头
})

api.interceptors.request.use(
  (config) => {
    // 优先使用内存中的token，用于性能和服务端渲染兼容性
    let token = globalToken
    
    // 如果内存中没有，从 store 中获取
    if (!token) {
      token = useUserStore.getState().token
    }

    // 如果 store 中还没有（可能尚未完成 hydration），尝试直接从 localStorage 读取作为兜底
    if (!token && typeof window !== 'undefined') {
      try {
        const storage = window.localStorage.getItem('cmdb-user-storage')
        if (storage) {
          const parsed = JSON.parse(storage)
          token = parsed.state?.token
          if (token) {
            globalToken = token // 同步到内存
          }
        }
      } catch (e) {
        // 忽略解析错误
      }
    }

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
          // 优先尝试真实 API 登录
          const response = await api.post('/auth/login', { username, password })
          const { token, user } = response.data.data
          globalToken = token
          set({ user, token, isLoggedIn: true, isLoading: false, isHydrated: true })
          return true
        } catch (error) {
          // 真实 API 不可用时回退到 mock（用于无后端的独立前端开发）
          const mockResult = await mockLogin(username, password)
          if (mockResult) {
            const { token, user } = mockResult
            globalToken = token
            set({ user, token, isLoggedIn: true, isLoading: false, isHydrated: true })
            return true
          }
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
          get().logout()
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
