import { create } from 'zustand'

interface LayoutState {
  collapsed: boolean
  toggleCollapsed: () => void
  setCollapsed: (collapsed: boolean) => void
}

export const useLayoutStore = create<LayoutState>((set) => ({
  collapsed: false,
  toggleCollapsed: () => set((state) => ({ collapsed: !state.collapsed })),
  setCollapsed: (collapsed: boolean) => set({ collapsed }),
}))
