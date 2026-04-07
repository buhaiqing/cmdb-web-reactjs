import { create } from 'zustand'
import { api } from './user'

export interface Tag {
  id: string
  name: string
  color: string
  description?: string
  createdBy?: string
  createdAt: string
  updatedAt: string
}

interface TagState {
  tagList: Tag[]
  isLoading: boolean
  pagination: {
    current: number
    pageSize: number
    total: number
  }
  fetchTags: () => Promise<void>
  createTag: (data: { name: string; color?: string; description?: string }) => Promise<boolean>
  updateTag: (id: string, data: { name?: string; color?: string; description?: string }) => Promise<boolean>
  deleteTag: (id: string) => Promise<boolean>
}

export const useTagStore = create<TagState>((set, get) => ({
  tagList: [],
  isLoading: false,
  pagination: {
    current: 1,
    pageSize: 50,
    total: 0,
  },

  fetchTags: async () => {
    set({ isLoading: true })
    try {
      const response = await api.get('/tags')
      const data = response.data.data || []
      set({
        tagList: data,
        pagination: { ...get().pagination, total: data.length },
        isLoading: false,
      })
    } catch (error) {
      set({ isLoading: false })
      console.error('Failed to fetch tags:', error)
    }
  },

  createTag: async (data) => {
    set({ isLoading: true })
    try {
      await api.post('/tags', data)
      set({ isLoading: false })
      await get().fetchTags()
      return true
    } catch (error) {
      set({ isLoading: false })
      console.error('Failed to create tag:', error)
      return false
    }
  },

  updateTag: async (id, data) => {
    set({ isLoading: true })
    try {
      await api.put(`/tags/${id}`, data)
      set({ isLoading: false })
      await get().fetchTags()
      return true
    } catch (error) {
      set({ isLoading: false })
      console.error('Failed to update tag:', error)
      return false
    }
  },

  deleteTag: async (id) => {
    set({ isLoading: true })
    try {
      await api.delete(`/tags/${id}`)
      set({ isLoading: false })
      await get().fetchTags()
      return true
    } catch (error) {
      set({ isLoading: false })
      console.error('Failed to delete tag:', error)
      return false
    }
  },
}))
