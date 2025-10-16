import { Stage, Layer, Rect, Group, Circle, Text } from 'react-konva'
import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useCanvasState } from './state'

function throttle<T extends (...args: any[]) => void>(fn: T, ms: number): T {
  let last = 0
  let timeout: any
  return function (this: any, ...args: any[]) {
    const now = Date.now()
    const remaining = ms - (now - last)
    if (remaining <= 0) {
      last = now
      fn.apply(this, args)
    } else if (!timeout) {
      timeout = setTimeout(() => {
        last = Date.now()
        timeout = null
        fn.apply(this, args)
      }, remaining)
    }
  } as T
}

export function CanvasStage({ canvasId }: { canvasId: string }) {
  const stageRef = useRef<any>(null)
  const [scale, setScale] = useState(1)
  const setScaleIfChanged = (next: number) => {
    setScale((prev) => (prev === next ? prev : next))
  }
  const objectsRecord = useCanvasState((s) => s.objects)
  const objects = Object.values(objectsRecord)
  const upsertObject = useCanvasState((s) => s.upsertObject)
  const upsertMany = useCanvasState((s) => (s as any).upsertMany)
  const removeObject = useCanvasState((s) => s.removeObject)
  const cursors = useCanvasState((s) => s.cursors)
  const setCursorsRef = useRef(useCanvasState.getState().setCursors)
  const lastPresenceRef = useRef<Record<string, { x: number; y: number; name: string; color: string }>>({})
  const pendingPresenceRef = useRef<Record<string, { x: number; y: number; name: string; color: string }> | null>(null)
  const presenceRafRef = useRef<number | null>(null)

  // Update ref on every render to ensure it's current
  useEffect(() => {
    setCursorsRef.current = useCanvasState.getState().setCursors
  })

  const isSameCursors = useCallback((a: Record<string, any>, b: Record<string, any>) => {
    const aKeys = Object.keys(a)
    const bKeys = Object.keys(b)
    if (aKeys.length !== bKeys.length) return false
    for (const k of aKeys) {
      const av = a[k]
      const bv = b[k]
      if (!bv || av.x !== bv.x || av.y !== bv.y || av.name !== bv.name || av.color !== bv.color) return false
    }
    return true
  }, [])

  const pendingObjectsRef = useRef<Array<any>>([])
  const objectsRafRef = useRef<number | null>(null)

  useEffect(() => {
    const channel = supabase
      .channel(`objects:${canvasId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'objects', filter: `canvas_id=eq.${canvasId}` },
        (payload: any) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const r = payload.new
            pendingObjectsRef.current.push({
              id: r.id,
              type: r.type,
              x: r.x,
              y: r.y,
              width: r.width,
              height: r.height,
              fill: r.fill || '#4f46e5',
              text_content: r.text_content,
              updatedAt: r.updated_at,
            })
            if (objectsRafRef.current == null) {
              objectsRafRef.current = requestAnimationFrame(() => {
                const batch = pendingObjectsRef.current
                pendingObjectsRef.current = []
                objectsRafRef.current = null
                if (batch.length) upsertMany(batch)
              })
            }
          } else if (payload.eventType === 'DELETE') {
            removeObject(payload.old.id)
          }
        }
      )
      .subscribe()

    supabase
      .from('objects')
      .select('*')
      .eq('canvas_id', canvasId)
      .then(({ data }) => {
        data?.forEach((r: any) =>
          upsertObject({
            id: r.id,
            type: r.type,
            x: r.x,
            y: r.y,
            width: r.width,
            height: r.height,
            fill: r.fill || '#4f46e5',
            text_content: r.text_content,
            updatedAt: r.updated_at,
          })
        )
      })

    return () => {
      supabase.removeChannel(channel)
      if (objectsRafRef.current != null) cancelAnimationFrame(objectsRafRef.current)
    }
  }, [canvasId, upsertMany, removeObject])

  useEffect(() => {
    const uid = (window as any).crypto?.randomUUID?.() || Math.random().toString(36).slice(2)
    
    // Generate a unique color per session (not per user)
    const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']
    const colorIndex = parseInt(uid.slice(-8), 36) % colors.length
    const color = colors[colorIndex]
    
    const channel = supabase.channel(`presence:canvas:${canvasId}`, { config: { presence: { key: uid } } })
    
    // Start with default name, update async
    let currentName = 'User'
    
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState() as Record<string, Array<any>>
      const next: Record<string, { x: number; y: number; name: string; color: string }> = {}
      Object.entries(state).forEach(([key, arr]) => {
        const latest = arr[arr.length - 1]
        if (latest) next[key] = { x: latest.x, y: latest.y, name: latest.name || 'User', color: latest.color }
      })
      const prev = lastPresenceRef.current
      if (isSameCursors(next, prev)) return
      pendingPresenceRef.current = next
      if (presenceRafRef.current == null) {
        presenceRafRef.current = requestAnimationFrame(() => {
          const snapshot = pendingPresenceRef.current
          presenceRafRef.current = null
          pendingPresenceRef.current = null
          if (snapshot && !isSameCursors(snapshot, lastPresenceRef.current)) {
            lastPresenceRef.current = snapshot
            setCursorsRef.current(snapshot)
          }
        })
      }
    })
    
    channel.subscribe(async (status: any) => {
      if (status === 'SUBSCRIBED') {
        // Track immediately with default name
        await channel.track({ x: 0, y: 0, name: currentName, color })
        
        // Then fetch real name and update
        const { data } = await supabase.auth.getUser()
        const user = data.user
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', user.id)
            .maybeSingle()
          const fetchedName = (profile?.display_name as string) || user.email?.split('@')[0] || 'User'
          if (fetchedName !== currentName) {
            currentName = fetchedName
            await channel.track({ name: currentName })
          }
        }
      }
    })

    const handleMove = throttle(() => {
      const pos = stageRef.current?.getPointerPosition()
      if (pos) channel.track({ x: pos.x, y: pos.y })
    }, 40)

    const node = stageRef.current?.getStage()
    node?.on('mousemove', handleMove)
    return () => {
      node?.off('mousemove', handleMove)
      supabase.removeChannel(channel)
      if (presenceRafRef.current != null) cancelAnimationFrame(presenceRafRef.current)
      if (dragRafRef.current != null) cancelAnimationFrame(dragRafRef.current)
    }
  }, [canvasId])

  const onWheel = throttle((e: any) => {
    e.evt.preventDefault()
    const scaleBy = 1.05
    const stage = stageRef.current
    const oldScale = stage.scaleX()
    const mousePointTo = {
      x: (stage.getPointerPosition().x - stage.x()) / oldScale,
      y: (stage.getPointerPosition().y - stage.y()) / oldScale,
    }
    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy
    setScaleIfChanged(newScale)
    const pointer = stage.getPointerPosition()
    const newPos = { x: pointer.x - mousePointTo.x * newScale, y: pointer.y - mousePointTo.y * newScale }
    stage.position(newPos)
  }, 16)

  // no-op: stage position is uncontrolled; we don't mirror into React state
  const onStageDragEnd = () => {}

  const dragUpdateRef = useRef<{ id: string; x: number; y: number } | null>(null)
  const dragRafRef = useRef<number | null>(null)

  const onDragMove = useCallback((id: string) => (e: any) => {
    const node = e.target
    dragUpdateRef.current = { id, x: node.x(), y: node.y() }
    if (dragRafRef.current === null) {
      dragRafRef.current = requestAnimationFrame(() => {
        const pending = dragUpdateRef.current
        dragRafRef.current = null
        if (pending) {
          supabase.from('objects').update({ x: pending.x, y: pending.y }).eq('id', pending.id)
        }
      })
    }
  }, [])

  const onDragEnd = useCallback((id: string) => async (e: any) => {
    const node = e.target
    const finalPos = { x: node.x(), y: node.y() }
    // Update local state with final position
    upsertObject({ id, ...finalPos, width: node.width(), height: node.height() })
    // Send final position to DB (will be echoed back via postgres_changes)
    await supabase.from('objects').update(finalPos).eq('id', id)
  }, [upsertObject])

  const addShape = async (type: 'rect' | 'circle' | 'text') => {
    let shapeData: any = {
      canvas_id: canvasId,
      type,
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      fill: '#4f46e5'
    }

    if (type === 'rect') {
      shapeData = { ...shapeData, width: 120, height: 80 }
    } else if (type === 'circle') {
      shapeData = { ...shapeData, width: 80, height: 80 }
    } else if (type === 'text') {
      shapeData = { 
        ...shapeData, 
        text_content: 'Double-click to edit',
        width: 200,
        height: 40,
        fill: '#000000'
      }
    }

    const { error } = await supabase.from('objects').insert(shapeData)
    
    if (error) {
      console.error(`Failed to add ${type}:`, error)
      alert(`Failed to add ${type}: ${error.message}`)
    }
  }

  return (
    <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: 8, borderBottom: '1px solid #eee', display: 'flex', gap: 8 }}>
        <button 
          onClick={() => addShape('rect')}
          style={{ padding: '8px 16px', borderRadius: 4, border: '1px solid #4f46e5', background: 'white', cursor: 'pointer' }}
        >
          ⬜ Rectangle
        </button>
        <button 
          onClick={() => addShape('circle')}
          style={{ padding: '8px 16px', borderRadius: 4, border: '1px solid #4f46e5', background: 'white', cursor: 'pointer' }}
        >
          ⚫ Circle
        </button>
        <button 
          onClick={() => addShape('text')}
          style={{ padding: '8px 16px', borderRadius: 4, border: '1px solid #4f46e5', background: 'white', cursor: 'pointer' }}
        >
          T Text
        </button>
      </div>
      <Stage
        ref={stageRef}
        width={window.innerWidth}
        height={window.innerHeight - 48}
        draggable
        scaleX={scale}
        scaleY={scale}
        onWheel={onWheel}
        onDragEnd={onStageDragEnd}
      >
        <Layer>
          {objects.map((o) => {
            if (o.type === 'circle') {
              return (
                <Circle
                  key={o.id}
                  x={o.x}
                  y={o.y}
                  radius={(o.width || 80) / 2}
                  fill={o.fill || '#4f46e5'}
                  draggable
                  onDragMove={onDragMove(o.id)}
                  onDragEnd={onDragEnd(o.id)}
                />
              )
            } else if (o.type === 'text') {
              return (
                <Text
                  key={o.id}
                  x={o.x}
                  y={o.y}
                  text={o.text_content || 'Text'}
                  fontSize={20}
                  fill={o.fill || '#000000'}
                  draggable
                  onDragMove={onDragMove(o.id)}
                  onDragEnd={onDragEnd(o.id)}
                />
              )
            } else {
              return (
                <Rect
                  key={o.id}
                  x={o.x}
                  y={o.y}
                  width={o.width}
                  height={o.height}
                  fill={o.fill || '#4f46e5'}
                  draggable
                  onDragMove={onDragMove(o.id)}
                  onDragEnd={onDragEnd(o.id)}
                />
              )
            }
          })}
          {Object.entries(cursors).map(([id, c]) => {
            const displayName = c.name || 'User'
            const labelWidth = displayName.length * 7.5 + 16
            return (
              <Group key={id}>
                {/* Cursor pointer */}
                <Circle x={c.x} y={c.y} radius={6} fill={c.color} stroke="white" strokeWidth={2} />
                {/* Name label background */}
                <Rect 
                  x={c.x + 10} 
                  y={c.y + 10} 
                  width={labelWidth}
                  height={22}
                  fill={c.color}
                  cornerRadius={4}
                  opacity={0.95}
                />
                {/* Name label text */}
                <Text 
                  x={c.x + 18} 
                  y={c.y + 15} 
                  text={displayName} 
                  fontSize={13}
                  fontStyle="bold"
                  fill="white"
                />
              </Group>
            )
          })}
        </Layer>
      </Stage>
    </div>
  )
}

