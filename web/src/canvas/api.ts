import { supabase } from '../lib/supabaseClient'

export type DBObject = {
  id: string
  canvas_id: string
  type: 'rect' | 'circle' | 'text' | 'frame' | 'line'
  x: number
  y: number
  width?: number
  height?: number
  rotation?: number
  fill?: string
  stroke?: string
  stroke_width?: number
  text_content?: string
  points?: Array<{ x: number; y: number }>
  z_index?: number
  updated_by?: string
  updated_at?: string
  version?: number
}

export async function listObjects(canvasId: string) {
  const { data, error } = await supabase.from('objects').select('*').eq('canvas_id', canvasId)
  if (error) throw error
  return data as DBObject[]
}

export async function createRect(canvasId: string, attrs: Partial<DBObject> = {}) {
  const base = { canvas_id: canvasId, type: 'rect', x: 100, y: 100, width: 120, height: 80, fill: '#4f46e5' }
  const { data, error } = await supabase.from('objects').insert({ ...base, ...attrs }).select().single()
  if (error) throw error
  return data as DBObject
}

export async function createCircle(canvasId: string, attrs: Partial<DBObject> = {}) {
  const base = { canvas_id: canvasId, type: 'circle', x: 100, y: 100, width: 80, height: 80, fill: '#4f46e5' }
  const { data, error } = await supabase.from('objects').insert({ ...base, ...attrs }).select().single()
  if (error) throw error
  return data as DBObject
}

export async function createText(canvasId: string, text: string, attrs: Partial<DBObject> = {}) {
  const base = { canvas_id: canvasId, type: 'text', x: 100, y: 100, width: 200, height: 40, text_content: text, fill: '#000000' }
  const { data, error } = await supabase.from('objects').insert({ ...base, ...attrs }).select().single()
  if (error) throw error
  return data as DBObject
}

export async function updateObject(id: string, patch: Partial<DBObject>) {
  const { data, error } = await supabase.from('objects').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data as DBObject
}

export async function updateObjectOptimistic(id: string, expectedVersion: number | undefined, patch: Partial<DBObject>) {
  // Fallback: if we don't have a version yet, do a regular update
  if (expectedVersion == null) return updateObject(id, patch)

  const { data, error } = await supabase
    .rpc('rpc_update_object_if_unmodified', {
      p_id: id,
      p_expected_version: expectedVersion,
      p_patch: patch as any
    })
    .select()

  if (error) throw error
  // If empty, it means conflict
  if (!data || (Array.isArray(data) && data.length === 0)) {
    // Fetch latest row to return for conflict handling
    const latest = await supabase.from('objects').select('*').eq('id', id).single()
    if (latest.error) throw latest.error
    const err: any = new Error('version_conflict')
    err.latest = latest.data
    throw err
  }

  // Supabase returns array of rows from RPC
  return (Array.isArray(data) ? data[0] : data) as DBObject
}

export async function updateManyPositionsOptimistic(
  updates: Array<{ id: string; expected_version: number; x?: number; y?: number }>
) {
  const { data, error } = await supabase
    .rpc('rpc_update_many_positions', { p_updates: updates as any })
    .select()
  if (error) throw error
  return data as DBObject[]
}

export async function deleteObject(id: string) {
  const { error } = await supabase.from('objects').delete().eq('id', id)
  if (error) throw error
}

