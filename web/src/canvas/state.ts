import { create } from 'zustand'

type Cursor = { x: number; y: number; name: string; color: string }
type ObjectRecord = { id: string; x: number; y: number; width: number; height: number; fill?: string; updatedAt?: string }

interface CanvasState {
  cursors: Record<string, Cursor>
  objects: Record<string, ObjectRecord>
  upsertObject: (o: ObjectRecord) => void
  removeObject: (id: string) => void
  setCursor: (id: string, c: Cursor) => void
}

export const useCanvasState = create<CanvasState>((set) => ({
  cursors: {},
  objects: {},
  upsertObject: (o) => set((s) => {
    const prev = s.objects[o.id]
    if (prev && prev.updatedAt && o.updatedAt) {
      const incoming = Date.parse(o.updatedAt)
      const current = Date.parse(prev.updatedAt)
      if (incoming < current) return s
    }
    return { objects: { ...s.objects, [o.id]: { ...prev, ...o } } }
  }),
  removeObject: (id) => set((s) => { const { [id]: _, ...rest } = s.objects; return { objects: rest } }),
  setCursor: (id, c) => set((s) => ({ cursors: { ...s.cursors, [id]: c } })),
}))
