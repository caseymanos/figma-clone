import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { usePresenceState } from './presenceState'

interface UsePresenceChannelOptions {
  canvasId: string
  onCursorUpdate?: (cursors: Record<string, { x: number; y: number; name: string; color: string }>) => void
}

// Get session settings from localStorage
function getSessionSettings() {
  const sessionName = localStorage.getItem('session_name')
  const sessionColor = localStorage.getItem('session_color')
  return { sessionName, sessionColor }
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
    
    // Use session color or generate random one
    const { sessionColor } = getSessionSettings()
    if (sessionColor) {
      myColorRef.current = sessionColor
    } else {
      const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']
      const colorIndex = parseInt(uid.slice(-8), 36) % colors.length
      myColorRef.current = colors[colorIndex]
    }

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

        // Update presence store (include all sessions)
        addUser({
          id: key,
          displayName: latest.name || 'User',
          avatarUrl: latest.avatarUrl,
          status: 'online',
          color: latest.color || myColorRef.current,
          cursorX: latest.x,
          cursorY: latest.y
        })
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
        // Fetch user profile FIRST, before initial track
        const { data } = await supabase.auth.getUser()
        const user = data.user
        
        let displayName = 'User'
        let avatarUrl: string | undefined = undefined
        
        // Check for session-specific name first
        const { sessionName } = getSessionSettings()
        if (sessionName) {
          displayName = sessionName
        } else if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('id', user.id)
            .maybeSingle()
          
          displayName = (profile?.display_name as string) || user.email?.split('@')[0] || user.user_metadata?.full_name || user.user_metadata?.name || 'User'
          avatarUrl = profile?.avatar_url as string | undefined
        }
        myNameRef.current = displayName
        
        // Initial track with correct name
        await channel.track({ 
          x: 0, 
          y: 0, 
          name: displayName,
          avatarUrl: avatarUrl,
          color: myColorRef.current, 
          t: Date.now() 
        })
      }
    })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [canvasId, addUser, removeUser, updateUser, onCursorUpdate])

  // Method to update session settings
  const updateSessionSettings = (name: string, color: string) => {
    myNameRef.current = name
    myColorRef.current = color
    
    // Broadcast updated settings
    if (channelRef.current) {
      channelRef.current.track({
        name: name,
        color: color,
        t: Date.now()
      })
    }
  }

  return {
    trackCursor: (x: number, y: number) => {
      if (channelRef.current) {
        channelRef.current.track({ x, y, t: Date.now() })
      }
    },
    updateSessionSettings,
    myId: myIdRef.current,
    myName: myNameRef.current,
    myColor: myColorRef.current
  }
}

