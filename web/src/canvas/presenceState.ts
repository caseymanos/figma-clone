import { create } from 'zustand'

export interface PresenceUser {
  id: string
  displayName: string
  avatarUrl?: string
  status: 'online' | 'away' | 'busy'
  color: string
  cursorX?: number
  cursorY?: number
  editingIds?: string[]
}

interface PresenceState {
  users: Record<string, PresenceUser>
  currentUserId: string | null
  addUser: (user: PresenceUser) => void
  removeUser: (userId: string) => void
  updateUser: (userId: string, updates: Partial<PresenceUser>) => void
  updateUserStatus: (userId: string, status: 'online' | 'away' | 'busy') => void
  setCurrentUserId: (userId: string) => void
  clear: () => void
}

export const usePresenceState = create<PresenceState>((set) => ({
  users: {},
  currentUserId: null,

  addUser: (user) => set((state) => ({
    users: { ...state.users, [user.id]: user }
  })),

  removeUser: (userId) => set((state) => {
    const { [userId]: _, ...rest } = state.users
    return { users: rest }
  }),

  updateUser: (userId, updates) => set((state) => ({
    users: {
      ...state.users,
      [userId]: { ...state.users[userId], ...updates }
    }
  })),

  updateUserStatus: (userId, status) => set((state) => {
    if (!state.users[userId]) return state
    return {
      users: {
        ...state.users,
        [userId]: { ...state.users[userId], status }
      }
    }
  }),

  setCurrentUserId: (userId) => set({ currentUserId: userId }),

  clear: () => set({ users: {}, currentUserId: null })
}))

