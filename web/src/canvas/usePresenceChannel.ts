import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { usePresenceState } from './presenceState'

interface UsePresenceChannelOptions {
  canvasId: string
  onCursorUpdate?: (cursors: Record<string, { x: number; y: number; name: string; color: string }>) => void
}

export function usePresenceChannel({ canvasId, onCursorUpdate }: UsePresenceChannelOptions) {
  const addUser = usePresenceState((state) => state.addUser)
  const removeUser = usePresenceState((state) => state.removeUser)
  const updateUser = usePresenceState((state) => state.updateUser)
  
  const myIdRef = useRef<string>('')
  const myNameRef = useRef<string>('User')
  const myColorRef = useRef<string>('#ef4444')
  const channelRef = useRef<any>(null)

  useEffect(() => {
    const uid = (window as any).crypto?.randomUUID?.() || Math.random().toString(36).slice(2)
    myIdRef.current = uid
    
    const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']
    const colorIndex = parseInt(uid.slice(-8), 36) % colors.length
    myColorRef.current = colors[colorIndex]

    const channel = supabase.channel(`presence:canvas:${canvasId}`, { 
      config: { presence: { key: uid } } 
    })
    
    channelRef.current = channel

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState() as Record<string, Array<any>>
      const cursors: Record<string, { x: number; y: number; name: string; color: string }> = {}

      Object.entries(state).forEach(([key, arr]) => {
        const latest = arr[arr.length - 1]
        if (!latest) return

        cursors[key] = {
          x: latest.x || 0,
          y: latest.y || 0,
          name: latest.name || 'User',
          color: latest.color || myColorRef.current
        }

        // Update presence store (skip self)
        if (key !== uid) {
          addUser({
            id: key,
            displayName: latest.name || 'User',
            avatarUrl: latest.avatarUrl,
            status: 'online',
            color: latest.color || myColorRef.current,
            cursorX: latest.x,
            cursorY: latest.y
          })
        }
      })

      // Remove users that left
      const currentIds = new Set(Object.keys(state))
      const storeUsers = usePresenceState.getState().users
      Object.keys(storeUsers).forEach(id => {
        if (!currentIds.has(id)) {
          removeUser(id)
        }
      })

      // Notify cursor system
      if (onCursorUpdate) {
        onCursorUpdate(cursors)
      }
    })

    // Subscribe and fetch user info
    channel.subscribe(async (status: any) => {
      if (status === 'SUBSCRIBED') {
        // Initial track
        await channel.track({ 
          x: 0, 
          y: 0, 
          name: myNameRef.current, 
          color: myColorRef.current, 
          t: Date.now() 
        })
        
        // Fetch user profile
        const { data } = await supabase.auth.getUser()
        const user = data.user
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('id', user.id)
            .maybeSingle()
          
          const fetchedName = (profile?.display_name as string) || user.email?.split('@')[0] || 'User'
          const avatarUrl = profile?.avatar_url as string | undefined
          
          if (fetchedName !== myNameRef.current) {
            myNameRef.current = fetchedName
            await channel.track({ 
              name: myNameRef.current, 
              avatarUrl: avatarUrl,
              t: Date.now() 
            })
          }
        }
      }
    })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [canvasId, addUser, removeUser, updateUser, onCursorUpdate])

  return {
    trackCursor: (x: number, y: number) => {
      if (channelRef.current) {
        channelRef.current.track({ x, y, t: Date.now() })
      }
    },
    myId: myIdRef.current,
    myColor: myColorRef.current
  }
}

