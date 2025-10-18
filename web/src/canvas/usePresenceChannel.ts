import { useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { usePresenceState } from './presenceState'

interface UsePresenceChannelOptions {
  canvasId: string
  onCursorUpdate?: (cursors: Record<string, { x: number; y: number; name: string; color: string; t?: number; seq?: number }>) => void
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
  const cursorChannelRef = useRef<any>(null)
  const lastMetadataBroadcastRef = useRef<{ name: string; color: string; editingIds?: string[] }>({ name: '', color: '' })
  const myEditingIdsRef = useRef<string[]>([])

  // Method to update session settings (defined early for use in effects)
  const updateSessionSettings = useCallback((name: string, color: string) => {
    myNameRef.current = name
    myColorRef.current = color
    
    // Broadcast updated settings WITH all required fields
    if (channelRef.current) {
      channelRef.current.track({
        name: name,
        color: color,
        avatarUrl: undefined,
        editingIds: myEditingIdsRef.current,
        t: Date.now()
      })
      // Update metadata tracking so next cursor move includes it too
      lastMetadataBroadcastRef.current = { name, color, editingIds: myEditingIdsRef.current }
    }
  }, [])

  useEffect(() => {
    const uid = (window as any).crypto?.randomUUID?.() || Math.random().toString(36).slice(2)
    myIdRef.current = uid
    
    // Get session settings FIRST
    const { sessionName, sessionColor } = getSessionSettings()
    
    // Set name from session or default
    myNameRef.current = sessionName || 'User'
    
    // Set color from session or generate with better hash
    if (sessionColor) {
      myColorRef.current = sessionColor
    } else {
      const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']
      const hash = uid.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)
      myColorRef.current = colors[hash % colors.length]
    }

    const channel = supabase.channel(`presence:canvas:${canvasId}`, { 
      config: { 
        presence: { key: uid },
        broadcast: { 
          self: false,  // Don't broadcast to self
          ack: false    // Don't wait for acknowledgments (faster cursor updates)
        }
      } 
    })
    
    channelRef.current = channel

    // Create dedicated broadcast channel for high-frequency cursor updates
    const cursorChannel = supabase.channel(`cursor:canvas:${canvasId}`, {
      config: {
        broadcast: { self: false, ack: false }
      }
    })

    cursorChannel
      .on('broadcast', { event: 'cursor' }, ({ payload: p }: any) => {
        // Supabase passes an envelope with { event, payload }
        if (!onCursorUpdate || !p || !p.id) return
        const users = usePresenceState.getState().users
        const name = users[p.id]?.displayName || 'User'
        const color = users[p.id]?.color || myColorRef.current
        onCursorUpdate({ [p.id]: { x: p.x, y: p.y, name, color, t: p.t, seq: p.seq } })
      })

    cursorChannelRef.current = cursorChannel

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState() as Record<string, Array<any>>
      const cursors: Record<string, { x: number; y: number; name: string; color: string; t?: number; seq?: number }> = {}

      Object.entries(state).forEach(([key, arr]) => {
        const latest = arr[arr.length - 1]
        if (!latest) return

        cursors[key] = {
          x: latest.x || 0,
          y: latest.y || 0,
          name: latest.name || 'User',
          color: latest.color || myColorRef.current,
          t: latest.t,
          seq: latest.seq
        }

        // Update presence store (include all sessions)
        addUser({
          id: key,
          displayName: latest.name || 'User',
          avatarUrl: latest.avatarUrl,
          status: 'online',
          color: latest.color || myColorRef.current,
          cursorX: latest.x,
          cursorY: latest.y,
          editingIds: latest.editingIds
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

      // Do not notify cursor positions from Presence; positions come from Broadcast
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
          name: displayName,
          avatarUrl: avatarUrl,
          color: myColorRef.current, 
          t: Date.now() 
        })
        
        // Set last metadata so we know what we broadcasted
        lastMetadataBroadcastRef.current = { name: displayName, color: myColorRef.current, editingIds: myEditingIdsRef.current }
      }
    })

    // Subscribe cursor broadcast channel
    cursorChannel.subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(cursorChannel)
    }
  }, [canvasId, addUser, removeUser, updateUser, onCursorUpdate])

  // Listen for session settings updates
  useEffect(() => {
    const handleSettingsUpdate = (event: CustomEvent) => {
      const { name, color } = event.detail
      updateSessionSettings(name, color)
    }
    
    window.addEventListener('session-settings-updated', handleSettingsUpdate as EventListener)
    
    return () => {
      window.removeEventListener('session-settings-updated', handleSettingsUpdate as EventListener)
    }
  }, [updateSessionSettings])

  // Smart debouncing with dead zone
  const lastBroadcastPos = useRef({ x: 0, y: 0 })
  const lastBroadcastTime = useRef(0)
  const seqCounter = useRef(0)
  const DEAD_ZONE = 1  // Pixels - more responsive (reduced from 2)
  const MIN_BROADCAST_INTERVAL = 16  // ms (~60fps, reduced from 50ms for faster cursor updates)

  return {
    trackCursor: (x: number, y: number) => {
      if (!cursorChannelRef.current) return

      const now = Date.now()
      const timeSinceBroadcast = now - lastBroadcastTime.current

      // Calculate distance from last broadcast position
      const dx = x - lastBroadcastPos.current.x
      const dy = y - lastBroadcastPos.current.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      // Skip if within dead zone and too soon
      if (distance < DEAD_ZONE && timeSinceBroadcast < MIN_BROADCAST_INTERVAL) {
        return
      }

      // Round to 0.1px to reduce noise
      const roundedX = Math.round(x * 10) / 10
      const roundedY = Math.round(y * 10) / 10

      // Increment sequence for ordering
      const seq = seqCounter.current++

      // Only include metadata if it changed (reduces payload by 50%)
      const currentMetadata = { name: myNameRef.current, color: myColorRef.current, editingIds: myEditingIdsRef.current }
      const metadataChanged =
        lastMetadataBroadcastRef.current.name !== currentMetadata.name ||
        lastMetadataBroadcastRef.current.color !== currentMetadata.color ||
        JSON.stringify(lastMetadataBroadcastRef.current.editingIds || []) !== JSON.stringify(currentMetadata.editingIds || [])

      if (metadataChanged && channelRef.current) {
        // Update Presence metadata (no x/y)
        channelRef.current.track({
          name: currentMetadata.name,
          color: currentMetadata.color,
          editingIds: currentMetadata.editingIds,
          t: now
        })
        lastMetadataBroadcastRef.current = currentMetadata
      }

      // Send cursor position via Broadcast (only after channel subscribed)
      if ((cursorChannelRef.current as any)?.state?.value === 'joined' || (cursorChannelRef.current as any)?.state === 'joined') {
        cursorChannelRef.current.send({
          type: 'broadcast',
          event: 'cursor',
          payload: { id: myIdRef.current, x: roundedX, y: roundedY, t: now, seq }
        })
      }

      // Update tracking refs
      lastBroadcastPos.current = { x: roundedX, y: roundedY }
      lastBroadcastTime.current = now
    },
    setEditingIds: (ids: string[]) => {
      myEditingIdsRef.current = ids
    },
    updateSessionSettings,
    myId: myIdRef.current,
    myName: myNameRef.current,
    myColor: myColorRef.current
  }
}

