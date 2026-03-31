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

api.interceptors.request.use((config) => {
  const token = Cookies.get('token') || useUserStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      useUserStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

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
      partialize: (state) => ({ user: state.user, token: state.token, isLoggedIn: state.isLoggedIn }),
    }
  )
)

export { api }
