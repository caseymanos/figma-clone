import { Stage, Layer, Rect, Group, Circle, Text } from 'react-konva'
import { useEffect, useRef, useState } from 'react'
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
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const objects = useCanvasState((s) => Object.values(s.objects))
  const upsertObject = useCanvasState((s) => s.upsertObject)
  const removeObject = useCanvasState((s) => s.removeObject)
  const cursors = useCanvasState((s) => s.cursors)
  const setCursor = useCanvasState((s) => s.setCursor)

  useEffect(() => {
    const channel = supabase
      .channel(`objects:${canvasId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'objects', filter: `canvas_id=eq.${canvasId}` },
        (payload: any) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const r = payload.new
            upsertObject({
              id: r.id,
              x: r.x,
              y: r.y,
              width: r.width,
              height: r.height,
              fill: r.fill || '#4f46e5',
              updatedAt: r.updated_at,
            })
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
            x: r.x,
            y: r.y,
            width: r.width,
            height: r.height,
            fill: r.fill || '#4f46e5',
            updatedAt: r.updated_at,
          })
        )
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [canvasId, removeObject, upsertObject])

  useEffect(() => {
    const uid = (window as any).crypto?.randomUUID?.() || Math.random().toString(36).slice(2)
    let color = '#ef4444'
    let name = 'You'
    // Try to fetch current user profile for display name
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .maybeSingle()
        name = (profile?.display_name as string) || user.email || 'User'
      }
    })
    const channel = supabase.channel(`presence:canvas:${canvasId}`, { config: { presence: { key: uid } } })
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState() as Record<string, Array<any>>
      const merged: Record<string, any> = {}
      Object.entries(state).forEach(([key, arr]) => {
        const latest = arr[arr.length - 1]
        if (latest) merged[key] = latest
      })
      Object.entries(merged).forEach(([id, c]) => setCursor(id, { x: c.x, y: c.y, name: c.name, color: c.color }))
    })
    channel.subscribe(async (status: any) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ x: 0, y: 0, name, color })
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
    }
  }, [canvasId, setCursor])

  const onWheel = (e: any) => {
    e.evt.preventDefault()
    const scaleBy = 1.05
    const stage = stageRef.current
    const oldScale = stage.scaleX()
    const mousePointTo = {
      x: (stage.getPointerPosition().x - stage.x()) / oldScale,
      y: (stage.getPointerPosition().y - stage.y()) / oldScale,
    }
    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy
    setScale(newScale)
    setOffset({
      x: -(mousePointTo.x - stage.getPointerPosition().x / newScale) * newScale,
      y: -(mousePointTo.y - stage.getPointerPosition().y / newScale) * newScale,
    })
  }

  const sendDragUpdate = throttle(async (id: string, x: number, y: number) => {
    await supabase.from('objects').update({ x, y }).eq('id', id)
  }, 80)

  const onDragMove = (id: string) => (e: any) => {
    const node = e.target
    upsertObject({ id, x: node.x(), y: node.y(), width: node.width(), height: node.height(), fill: node.fill() })
    sendDragUpdate(id, node.x(), node.y())
  }
  const onDragEnd = (id: string) => async (e: any) => {
    const node = e.target
    await supabase.from('objects').update({ x: node.x(), y: node.y() }).eq('id', id)
  }

  const addRect = async () => {
    await supabase
      .from('objects')
      .insert({ canvas_id: canvasId, type: 'rect', x: 100, y: 100, width: 120, height: 80, fill: '#4f46e5' })
  }

  return (
    <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: 8, borderBottom: '1px solid #eee' }}>
        <button onClick={addRect}>Add Rectangle</button>
      </div>
      <Stage
        ref={stageRef}
        width={window.innerWidth}
        height={window.innerHeight - 48}
        draggable
        scaleX={scale}
        scaleY={scale}
        x={offset.x}
        y={offset.y}
        onWheel={onWheel}
      >
        <Layer>
          {objects.map((o) => (
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
          ))}
          {Object.entries(cursors).map(([id, c]) => (
            <Group key={id}>
              <Circle x={c.x} y={c.y} radius={3} fill={c.color} />
              <Text x={c.x + 6} y={c.y - 6} text={c.name} fontSize={12} />
            </Group>
          ))}
        </Layer>
      </Stage>
    </div>
  )
}

