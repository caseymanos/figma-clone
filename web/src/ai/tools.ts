import { supabase } from '../lib/supabaseClient'
import { globalIdempotencyCache, buildOperationKey } from './idempotency'
import { arrangeRow as computeArrangeRow, arrangeGrid as computeArrangeGrid, distribute as computeDistribute } from './layout'
import { trackAIEvent } from '../lib/metrics'

export type ShapeType = 'rect' | 'circle' | 'text'
export type ColorHex = string
export type ShapeId = string
export type CanvasId = string

export interface CanvasObjectInput {
  type: ShapeType
  x: number
  y: number
  width?: number
  height?: number
  rotation?: number
  fill?: ColorHex
  text?: string
}

function clamp(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min
  return Math.max(min, Math.min(max, n))
}

function isValidHexColor(input?: string): input is string {
  if (!input) return false
  return /^#([0-9a-fA-F]{6})$/.test(input)
}

function normalizeInput(input: CanvasObjectInput): CanvasObjectInput {
  const minSize = 8
  const maxSize = 5000
  const width = input.width != null ? clamp(Math.round(input.width), minSize, maxSize) : input.type === 'text' ? 200 : input.type === 'circle' ? 80 : 120
  const height = input.height != null ? clamp(Math.round(input.height), minSize, maxSize) : input.type === 'text' ? 40 : input.type === 'circle' ? 80 : 80
  const fill = isValidHexColor(input.fill) ? input.fill : input.type === 'text' ? '#000000' : '#4f46e5'
  const rotation = input.rotation != null ? clamp(Math.round(input.rotation), -360, 360) : 0
  return {
    ...input,
    x: Math.round(input.x),
    y: Math.round(input.y),
    width,
    height,
    fill,
    rotation
  }
}

export interface AITools {
  createShape(input: CanvasObjectInput, canvasId: CanvasId): Promise<ShapeId>
  createShapes(inputs: CanvasObjectInput[], canvasId: CanvasId): Promise<ShapeId[]>
  moveShape(id: ShapeId, x: number, y: number): Promise<void>
  resizeShape(id: ShapeId, width: number, height: number): Promise<void>
  rotateShape(id: ShapeId, degrees: number): Promise<void>
  createText(text: string, x: number, y: number, opts?: { fontSize?: number; color?: ColorHex; canvasId?: CanvasId }): Promise<ShapeId>
  getCanvasState(canvasId: CanvasId): Promise<Array<{ id: string; type: ShapeType; x: number; y: number; width?: number; height?: number; rotation?: number; fill?: ColorHex; text?: string }>>
  arrangeRow(ids: ShapeId[], spacing: number, canvasId: CanvasId): Promise<void>
  arrangeGrid(ids: ShapeId[], rows: number, cols: number, canvasId: CanvasId, cellW?: number, cellH?: number, gap?: number): Promise<void>
  distribute(ids: ShapeId[], axis: 'x' | 'y', canvasId: CanvasId, spacing?: number): Promise<void>
}

async function updateObject(id: string, patch: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from('objects').update(patch).eq('id', id)
  if (error) throw error
}

export const aiTools: AITools = {
  async createShape(input, canvasId) {
    const normalized = normalizeInput(input)
    const opKey = buildOperationKey({ op: 'create', canvasId, ...normalized })
    if (globalIdempotencyCache.isDuplicate(opKey)) return '' as ShapeId
    const row: any = {
      canvas_id: canvasId,
      type: normalized.type,
      x: normalized.x,
      y: normalized.y,
      width: normalized.type === 'circle' ? normalized.width : normalized.width,
      height: normalized.type === 'circle' ? normalized.height : normalized.height,
      rotation: normalized.rotation,
      fill: normalized.fill,
    }
    if (normalized.type === 'text' && normalized.text) row.text_content = normalized.text
    const { data, error } = await supabase.from('objects').insert(row).select('id').single()
    if (error) throw error
    globalIdempotencyCache.remember(opKey)
    trackAIEvent('tool.createShape', { type: normalized.type })
    return data?.id as ShapeId
  },

  async createShapes(inputs, canvasId) {
    if (!inputs.length) return []

    // Normalize all inputs and build rows
    const rows: any[] = []
    const normalizedInputs = inputs.map(input => normalizeInput(input))

    for (const normalized of normalizedInputs) {
      const opKey = buildOperationKey({ op: 'create', canvasId, ...normalized })
      if (globalIdempotencyCache.isDuplicate(opKey)) continue

      const row: any = {
        canvas_id: canvasId,
        type: normalized.type,
        x: normalized.x,
        y: normalized.y,
        width: normalized.width,
        height: normalized.height,
        rotation: normalized.rotation,
        fill: normalized.fill,
      }
      if (normalized.type === 'text' && normalized.text) row.text_content = normalized.text
      rows.push(row)
      globalIdempotencyCache.remember(opKey)
    }

    if (!rows.length) return []

    // Batch insert all shapes in single query
    const { data, error } = await supabase.from('objects').insert(rows).select('id')
    if (error) throw error

    trackAIEvent('tool.createShapes', { count: rows.length })
    return (data || []).map(r => r.id as ShapeId)
  },

  async moveShape(id, x, y) {
    const nx = Math.round(x)
    const ny = Math.round(y)
    const opKey = buildOperationKey({ op: 'move', id, x: nx, y: ny })
    if (globalIdempotencyCache.isDuplicate(opKey)) return
    await updateObject(id, { x: nx, y: ny })
    globalIdempotencyCache.remember(opKey)
    trackAIEvent('tool.moveShape', { id })
  },

  async resizeShape(id, width, height) {
    const minSize = 8
    const maxSize = 5000
    const w = clamp(Math.round(width), minSize, maxSize)
    const h = clamp(Math.round(height), minSize, maxSize)
    const opKey = buildOperationKey({ op: 'resize', id, w, h })
    if (globalIdempotencyCache.isDuplicate(opKey)) return
    await updateObject(id, { width: w, height: h })
    globalIdempotencyCache.remember(opKey)
    trackAIEvent('tool.resizeShape', { id })
  },

  async rotateShape(id, degrees) {
    const rot = clamp(Math.round(degrees), -360, 360)
    const opKey = buildOperationKey({ op: 'rotate', id, rot })
    if (globalIdempotencyCache.isDuplicate(opKey)) return
    await updateObject(id, { rotation: rot })
    globalIdempotencyCache.remember(opKey)
    trackAIEvent('tool.rotateShape', { id })
  },

  async createText(text, x, y, opts) {
    const canvasId = opts?.canvasId as CanvasId
    const input: CanvasObjectInput = { type: 'text', x, y, text, width: 200, height: 40, fill: opts?.color || '#000000' }
    return this.createShape(input, canvasId)
  },

  async getCanvasState(canvasId) {
    const { data, error } = await supabase
      .from('objects')
      .select('id, type, x, y, width, height, rotation, fill, text_content')
      .eq('canvas_id', canvasId)
    if (error) throw error
    return (data || []).map((r: any) => ({
      id: r.id,
      type: r.type as ShapeType,
      x: r.x,
      y: r.y,
      width: r.width ?? undefined,
      height: r.height ?? undefined,
      rotation: r.rotation ?? undefined,
      fill: r.fill ?? undefined,
      text: r.text_content ?? undefined,
    }))
  },

  async arrangeRow(ids, spacing, canvasId) {
    if (!ids.length) return
    const state = await this.getCanvasState(canvasId)
    const objects = state.filter(o => ids.includes(o.id)).map(o => ({ id: o.id, x: o.x, y: o.y, width: o.width, height: o.height }))
    const patches = computeArrangeRow(objects, spacing)
    await Promise.all(patches.map(p => updateObject(p.id, { x: p.x, y: p.y })))
    trackAIEvent('tool.arrangeRow', { count: patches.length })
  },

  async arrangeGrid(ids, rows, cols, canvasId, cellW, cellH, gap) {
    if (!ids.length) return
    const state = await this.getCanvasState(canvasId)
    const objects = state.filter(o => ids.includes(o.id)).map(o => ({ id: o.id, x: o.x, y: o.y, width: o.width, height: o.height }))
    const patches = computeArrangeGrid(objects, rows, cols, cellW, cellH, gap)
    await Promise.all(patches.map(p => updateObject(p.id, { x: p.x, y: p.y })))
    trackAIEvent('tool.arrangeGrid', { count: patches.length })
  },

  async distribute(ids, axis, canvasId, spacing) {
    if (!ids.length) return
    const state = await this.getCanvasState(canvasId)
    const objects = state.filter(o => ids.includes(o.id)).map(o => ({ id: o.id, x: o.x, y: o.y, width: o.width, height: o.height }))
    const patches = computeDistribute(objects, axis, spacing)
    await Promise.all(patches.map(p => updateObject(p.id, { x: p.x, y: p.y })))
    trackAIEvent('tool.distribute', { count: patches.length })
  }
}


