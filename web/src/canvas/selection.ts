import { create } from 'zustand'

interface SelectionState {
  selectedIds: string[]
  setSelectedIds: (ids: string[]) => void
  toggleId: (id: string) => void
  clear: () => void
}

export const useSelection = create<SelectionState>((set, get) => ({
  selectedIds: [],
  setSelectedIds: (ids) => set({ selectedIds: Array.from(new Set(ids)) }),
  toggleId: (id) => set((s) => {
    const exists = s.selectedIds.includes(id)
    return { selectedIds: exists ? s.selectedIds.filter((x) => x !== id) : [...s.selectedIds, id] }
  }),
  clear: () => set({ selectedIds: [] })
}))


