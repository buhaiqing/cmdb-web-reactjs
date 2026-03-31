import { create } from 'zustand'
import { useUserStore } from './user'

interface Permission {
  id: string
  name: string
  code: string
  description: string
}

interface Role {
  id: string
  name: string
  code: string
  permissions: Permission[]
}

interface PermissionState {
  permissions: Permission[]
  roles: Role[]
  isLoading: boolean
  fetchPermissions: () => Promise<void>
  fetchRoles: () => Promise<void>
  hasPermission: (code: string) => boolean
}

export const usePermissionStore = create<PermissionState>((set, get) => ({
  permissions: [],
  roles: [],
  isLoading: false,

  fetchPermissions: async () => {
    set({ isLoading: true })
    try {
      const userStore = useUserStore.getState()
      const token = userStore.token
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/permissions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      set({ permissions: data.data || [], isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      console.error('Failed to fetch permissions:', error)
    }
  },

  fetchRoles: async () => {
    set({ isLoading: true })
    try {
      const userStore = useUserStore.getState()
      const token = userStore.token
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/roles`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      set({ roles: data.data || [], isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      console.error('Failed to fetch roles:', error)
    }
  },

  hasPermission: (code: string) => {
    const userStore = useUserStore.getState()
    return userStore.hasPermission(code)
  },
}))
