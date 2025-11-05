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

  // Generate and store share code
  await generateShareCodeForCanvas(canvas.id)

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

// Generate a unique 8-digit share code for a canvas
async function generateShareCodeForCanvas(canvasId: string): Promise<number> {
  // Call database function to generate unique code
  const { data, error } = await supabase.rpc('generate_share_code')
  if (error) throw error
  
  const shareCode = data as number
  
  // Store the share code
  const { error: insertError } = await supabase
    .from('canvas_share_codes')
    .insert({ canvas_id: canvasId, share_code: shareCode })
  
  if (insertError) throw insertError
  
  return shareCode
}

// Get canvas ID by share code
export async function getCanvasIdByShareCode(shareCode: number): Promise<string | null> {
  const { data, error } = await supabase
    .from('canvas_share_codes')
    .select('canvas_id')
    .eq('share_code', shareCode)
    .maybeSingle()
  
  if (error) throw error
  return data?.canvas_id || null
}

// Get share code by canvas ID
export async function getShareCodeByCanvasId(canvasId: string): Promise<number | null> {
  const { data, error } = await supabase
    .from('canvas_share_codes')
    .select('share_code')
    .eq('canvas_id', canvasId)
    .maybeSingle()
  
  if (error) {
    // If no share code exists, generate one
    if (error.message.includes('not found') || !data) {
      try {
        return await generateShareCodeForCanvas(canvasId)
      } catch (e) {
        console.error('Failed to generate share code:', e)
        return null
      }
    }
    throw error
  }
  
  return data?.share_code || null
}

