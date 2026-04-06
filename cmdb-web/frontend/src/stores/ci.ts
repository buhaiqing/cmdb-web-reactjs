import { create } from 'zustand'
import { api } from './user'

export interface CI {
  id: string
  name: string
  type: string
  status: string
  ip?: string
  cpu?: string
  memory?: string
  disk?: string
  os?: string
  project?: string
  environment?: string
  tags?: string[]
  description?: string
  createdAt: string
  updatedAt: string
}

interface CIState {
  ciList: CI[]
  currentCI: CI | null
  isLoading: boolean
  pagination: {
    current: number
    pageSize: number
    total: number
  }
  filters: Record<string, unknown>
  fetchCIList: (params?: { page?: number; pageSize?: number; filters?: Record<string, unknown> }) => Promise<void>
  fetchCIDetail: (id: string) => Promise<void>
  createCI: (data: Partial<CI>) => Promise<boolean>
  updateCI: (id: string, data: Partial<CI>) => Promise<boolean>
  deleteCI: (id: string) => Promise<boolean>
  setFilters: (filters: Record<string, unknown>) => void
}

export const useCIStore = create<CIState>((set, get) => ({
  ciList: [],
  currentCI: null,
  isLoading: false,
  pagination: {
    current: 1,
    pageSize: 20,
    total: 0,
  },
  filters: {},

  fetchCIList: async (params) => {
    set({ isLoading: true })
    try {
      const state = get()
      const currentPage = state.pagination.current
      const pageSize = state.pagination.pageSize
      const filters = state.filters
      const response = await api.get('/ci', {
        params: {
          page: params?.page || currentPage,
          pageSize: params?.pageSize || pageSize,
          ...params?.filters || filters,
        },
      })
      const { items, total } = response.data.data
      set({
        ciList: items,
        pagination: { ...state.pagination, total },
        isLoading: false,
      })
    } catch (error) {
      set({ isLoading: false })
      console.error('Failed to fetch CI list:', error)
    }
  },

  fetchCIDetail: async (id: string) => {
    set({ isLoading: true })
    try {
      const response = await api.get(`/ci/${id}`)
      set({ currentCI: response.data.data, isLoading: false })
    } catch (error: any) {
      set({ isLoading: false })
      console.error('Failed to fetch CI detail:', error?.response?.status, error?.response?.data || error?.message || error)
      throw error
    }
  },

  createCI: async (data: Partial<CI>) => {
    set({ isLoading: true })
    try {
      await api.post('/ci', data)
      set({ isLoading: false })
      await get().fetchCIList()
      return true
    } catch (error) {
      set({ isLoading: false })
      console.error('Failed to create CI:', error)
      return false
    }
  },

  updateCI: async (id: string, data: Partial<CI>) => {
    set({ isLoading: true })
    try {
      await api.put(`/ci/${id}`, data)
      set({ isLoading: false })
      await get().fetchCIList()
      return true
    } catch (error) {
      set({ isLoading: false })
      console.error('Failed to update CI:', error)
      return false
    }
  },

  deleteCI: async (id: string) => {
    set({ isLoading: true })
    try {
      await api.delete(`/ci/${id}`)
      set({ isLoading: false })
      await get().fetchCIList()
      return true
    } catch (error) {
      set({ isLoading: false })
      console.error('Failed to delete CI:', error)
      return false
    }
  },

  setFilters: (filters: Record<string, unknown>) => {
    set({ filters })
  },
}))
