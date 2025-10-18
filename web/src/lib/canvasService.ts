import { supabase } from './supabaseClient'

export async function createCanvasWithMembership(title: string = 'Untitled') {
  const { data: sessionData } = await supabase.auth.getSession()
  const userId = sessionData.session?.user.id
  if (!userId) throw new Error('Not authenticated')

  const { data: canvas, error: cErr } = await supabase
    .from('canvases')
    .insert({ title, created_by: userId })
    .select('id')
    .single()
  if (cErr) throw cErr

  const { error: mErr } = await supabase
    .from('canvas_members')
    .insert({ canvas_id: canvas.id, user_id: userId, role: 'editor' })
  if (mErr) throw mErr

  return canvas.id as string
}

export async function ensureCanvasMembership(canvasId: string) {
  const { data: sessionData } = await supabase.auth.getSession()
  const userId = sessionData.session?.user.id
  if (!userId) throw new Error('Not authenticated')

  // Check if user is already a member
  const { data: existing } = await supabase
    .from('canvas_members')
    .select('canvas_id')
    .eq('canvas_id', canvasId)
    .eq('user_id', userId)
    .maybeSingle()

  // If not a member, add them
  if (!existing) {
    const { error } = await supabase
      .from('canvas_members')
      .insert({ canvas_id: canvasId, user_id: userId, role: 'editor' })
    
    if (error) {
      // Ignore duplicate key errors (race condition if multiple tabs)
      if (error.message.includes('duplicate')) {
        return // Already a member, ignore
      }
      // Foreign key error means canvas doesn't exist
      if (error.message.includes('foreign key') || error.message.includes('violates')) {
        throw new Error('Canvas not found')
      }
      throw error
    }
  }
}

