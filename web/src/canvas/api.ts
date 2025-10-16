import { supabase } from '../lib/supabaseClient'

export type DBObject = {
  id: string
  canvas_id: string
  type: 'rect' | 'circle' | 'text'
  x: number
  y: number
  width?: number
  height?: number
  rotation?: number
  fill?: string
  stroke?: string
  text_content?: string
  z_index?: number
  updated_by?: string
  updated_at?: string
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

export async function deleteObject(id: string) {
  const { error } = await supabase.from('objects').delete().eq('id', id)
  if (error) throw error
}

