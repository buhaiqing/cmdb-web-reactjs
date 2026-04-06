import { create } from 'zustand'
import { api } from './user'

export interface Change {
  id: string
  title: string
  ciId: string
  ciName?: string
  changeType: string
  description: string
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  createdBy?: string
  approvedBy?: string
  approvedAt?: string
  createdAt: string
  updatedAt?: string
}

interface ChangeState {
  changeList: Change[]
  currentChange: Change | null
  isLoading: boolean
  pagination: {
    current: number
    pageSize: number
    total: number
  }
  filters: Record<string, unknown>
  fetchChangeList: (params?: { page?: number; pageSize?: number; filters?: Record<string, unknown> }) => Promise<void>
  fetchChangeDetail: (id: string) => Promise<void>
  createChange: (data: Partial<Change>) => Promise<boolean>
  approveChange: (id: string) => Promise<boolean>
  rejectChange: (id: string) => Promise<boolean>
  setFilters: (filters: Record<string, unknown>) => void
}

export const useChangeStore = create<ChangeState>((set, get) => ({
  changeList: [],
  currentChange: null,
  isLoading: false,
  pagination: {
    current: 1,
    pageSize: 20,
    total: 0,
  },
  filters: {},

  fetchChangeList: async (params) => {
    set({ isLoading: true })
    try {
      const state = get()
      const currentPage = state.pagination.current
      const pageSize = state.pagination.pageSize
      const filters = state.filters
      const response = await api.get('/changes', {
        params: {
          page: params?.page || currentPage,
          pageSize: params?.pageSize || pageSize,
          ...params?.filters || filters,
        },
      })
      const { items, total } = response.data.data
      set({
        changeList: items,
        pagination: { ...state.pagination, total },
        isLoading: false,
      })
    } catch (error) {
      set({ isLoading: false })
      console.error('Failed to fetch change list:', error)
    }
  },

  fetchChangeDetail: async (id: string) => {
    set({ isLoading: true })
    try {
      const response = await api.get(`/changes/${id}`)
      set({ currentChange: response.data.data, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      console.error('Failed to fetch change detail:', error)
    }
  },

  createChange: async (data: Partial<Change>) => {
    set({ isLoading: true })
    try {
      await api.post('/changes', data)
      set({ isLoading: false })
      await get().fetchChangeList()
      return true
    } catch (error) {
      set({ isLoading: false })
      console.error('Failed to create change:', error)
      return false
    }
  },

  approveChange: async (id: string) => {
    set({ isLoading: true })
    try {
      await api.post(`/changes/${id}/approve`)
      set({ isLoading: false })
      await get().fetchChangeDetail(id)
      return true
    } catch (error) {
      set({ isLoading: false })
      console.error('Failed to approve change:', error)
      return false
    }
  },

  rejectChange: async (id: string) => {
    set({ isLoading: true })
    try {
      await api.post(`/changes/${id}/reject`)
      set({ isLoading: false })
      await get().fetchChangeDetail(id)
      return true
    } catch (error) {
      set({ isLoading: false })
      console.error('Failed to reject change:', error)
      return false
    }
  },

  setFilters: (filters: Record<string, unknown>) => {
    set({ filters })
  },
}))
