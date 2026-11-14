import { create } from 'zustand'
import { api, useUserStore } from './user'
import type { Permission, Role } from '../types/permission'

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
      const response = await api.get('/permissions')
      set({ permissions: response.data.data || [], isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      console.error('Failed to fetch permissions:', error)
    }
  },

  fetchRoles: async () => {
    set({ isLoading: true })
    try {
      const response = await api.get('/roles')
      set({ roles: response.data.data || [], isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      console.error('Failed to fetch roles:', error)
    }
  },

  hasPermission: (code: string) => {
    const user = useUserStore.getState().user
    if (!user) return false
    if (user.role === 'admin') return true
    return user.permissions?.includes(code) || user.permissions?.includes('*') || false
  },
}))
