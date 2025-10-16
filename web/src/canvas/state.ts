import { create } from 'zustand'

type ObjectRecord = { 
  id: string
  type?: string
  x: number
  y: number
  width: number
  height: number
  fill?: string
  text_content?: string
  updatedAt?: string
}

interface CanvasState {
  objects: Record<string, ObjectRecord>
  upsertObject: (o: ObjectRecord) => void
  upsertMany: (os: ObjectRecord[]) => void
  removeObject: (id: string) => void
}

export const useCanvasState = create<CanvasState>((set) => ({
  objects: {},
  upsertObject: (o) => set((s) => {
    const prev = s.objects[o.id]
    // Last-write-wins check for remote updates
    if (prev && prev.updatedAt && o.updatedAt) {
      const incoming = Date.parse(o.updatedAt)
      const current = Date.parse(prev.updatedAt)
      if (incoming < current) return s
    }
    // Skip update if values haven't changed (prevents drag loops)
    if (prev && prev.x === o.x && prev.y === o.y && prev.width === o.width && prev.height === o.height && prev.fill === o.fill) {
      return s
    }
    return { objects: { ...s.objects, [o.id]: { ...prev, ...o } } }
  }),
  upsertMany: (incoming) => set((s) => {
    if (!incoming || incoming.length === 0) return s
    const nextObjects = { ...s.objects }
    for (const o of incoming) {
      const prev = nextObjects[o.id]
      if (prev && prev.updatedAt && o.updatedAt) {
        const inc = Date.parse(o.updatedAt)
        const cur = Date.parse(prev.updatedAt)
        if (inc < cur) continue
      }
      if (
        prev &&
        prev.x === o.x &&
        prev.y === o.y &&
        prev.width === o.width &&
        prev.height === o.height &&
        prev.fill === o.fill &&
        prev.text_content === o.text_content &&
        prev.type === o.type
      ) {
        continue
      }
      nextObjects[o.id] = { ...prev, ...o }
    }
    return { objects: nextObjects }
  }),
  removeObject: (id) => set((s) => { const { [id]: _, ...rest } = s.objects; return { objects: rest } }),
}))
