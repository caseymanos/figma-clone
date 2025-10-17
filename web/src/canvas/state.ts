import { create } from 'zustand'

export type ObjectRecord = {
  id: string
  type?: string
  x: number
  y: number
  width: number
  height: number
  rotation?: number
  fill?: string
  stroke?: string
  stroke_width?: number
  text_content?: string
  points?: Array<{ x: number; y: number }> // For line/pen tool
  updatedAt?: string
}

interface CanvasState {
  objects: Record<string, ObjectRecord>
  upsertObject: (o: Partial<ObjectRecord> & { id: string }) => void
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
    if (prev && prev.x === o.x && prev.y === o.y && prev.width === o.width && prev.height === o.height && prev.rotation === o.rotation && prev.fill === o.fill && prev.stroke === o.stroke && prev.stroke_width === o.stroke_width) {
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
        prev.rotation === o.rotation &&
        prev.fill === o.fill &&
        prev.stroke === o.stroke &&
        prev.stroke_width === o.stroke_width &&
        prev.text_content === o.text_content &&
        prev.type === o.type &&
        JSON.stringify(prev.points) === JSON.stringify(o.points)
      ) {
        continue
      }
      nextObjects[o.id] = { ...prev, ...o }
    }
    return { objects: nextObjects }
  }),
  removeObject: (id) => set((s) => { const { [id]: _, ...rest } = s.objects; return { objects: rest } }),
}))

// Tool and UI state
export type Tool = 'select' | 'pan' | 'rect' | 'circle' | 'text' | 'frame' | 'pen'

interface ToolState {
  activeTool: Tool
  setActiveTool: (tool: Tool) => void
  clipboard: ObjectRecord[]
  setClipboard: (objects: ObjectRecord[]) => void
}

export const useToolState = create<ToolState>((set) => ({
  activeTool: 'select',
  setActiveTool: (tool) => set({ activeTool: tool }),
  clipboard: [],
  setClipboard: (objects) => set({ clipboard: objects }),
}))
