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

