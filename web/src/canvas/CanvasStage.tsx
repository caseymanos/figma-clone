import { Stage, Layer, Rect, Circle, Text } from 'react-konva'
import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useCanvasState } from './state'
import { usePresenceChannel } from './usePresenceChannel'
import { useSelection } from './selection'
import Konva from 'konva'

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

function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t
}

export function CanvasStage({ canvasId, selectedColor }: { canvasId: string; selectedColor?: string }) {
  const stageRef = useRef<any>(null)
  const objectLayerRef = useRef<any>(null)
  const cursorLayerRef = useRef<any>(null)
  
  const [scale, setScale] = useState(1)
  const setScaleIfChanged = (next: number) => {
    setScale((prev) => (prev === next ? prev : next))
  }
  
  const objectsRecord = useCanvasState((s) => s.objects)
  const objects = Object.values(objectsRecord)
  const upsertObject = useCanvasState((s) => s.upsertObject)
  const upsertMany = useCanvasState((s) => (s as any).upsertMany)
  const removeObject = useCanvasState((s) => s.removeObject)
  const selectedIds = useSelection((s) => s.selectedIds)
  const setSelectedIds = useSelection((s) => s.setSelectedIds)
  const toggleId = useSelection((s) => s.toggleId)

  const [fps, setFps] = useState(0)

  const pendingObjectsRef = useRef<Array<any>>([])
  const objectsRafRef = useRef<number | null>(null)
  
  // Cursor data store - ref-based, never triggers React renders
  const cursorsDataRef = useRef<Record<string, {
    current: { x: number; y: number }
    target: { x: number; y: number }
    name: string
    color: string
    group: Konva.Group | null
    samples: Array<{ x: number; y: number; t: number }>
  }>>({})

  // Load initial objects and subscribe to changes
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
        if (!data || !data.length) return
        const batch = data.map((r: any) => ({
          id: r.id,
          type: r.type,
          x: r.x,
          y: r.y,
          width: r.width,
          height: r.height,
          fill: r.fill || '#4f46e5',
          text_content: r.text_content,
          updatedAt: r.updated_at,
        }))
        upsertMany(batch)
      })

    return () => {
      supabase.removeChannel(channel)
      if (objectsRafRef.current != null) cancelAnimationFrame(objectsRafRef.current)
    }
  }, [canvasId, upsertMany, removeObject])

  // CURSOR SYSTEM - Using shared presence hook
  const handleCursorUpdate = useCallback((cursors: Record<string, { x: number; y: number; name: string; color: string }>) => {
    const cursorLayer = cursorLayerRef.current
    if (!cursorLayer) return

    const seenIds = new Set<string>()

    const createCursorGroup = (x: number, y: number, name: string, color: string) => {
      const group = new Konva.Group({ listening: false })
      const dot = new Konva.Circle({
        x, y,
        radius: 6,
        fill: color,
        stroke: 'white',
        strokeWidth: 2,
      })
      const labelWidth = name.length * 7.5 + 16
      const labelBg = new Konva.Rect({
        x: x + 10,
        y: y - 26,
        width: labelWidth,
        height: 20,
        fill: color,
        cornerRadius: 4,
        opacity: 0.95,
      })
      const labelText = new Konva.Text({
        x: x + 16,
        y: y - 22,
        text: name,
        fontSize: 12,
        fontStyle: 'bold',
        fill: 'white',
      })
      group.add(dot, labelBg, labelText)
      return group
    }

    Object.entries(cursors).forEach(([key, cursor]) => {
      seenIds.add(key)
      const cursorsData = cursorsDataRef.current
      
      if (!cursorsData[key]) {
        // Create new cursor
        const group = createCursorGroup(
          cursor.x, 
          cursor.y, 
          cursor.name, 
          cursor.color
        )
        cursorLayer.add(group)

        cursorsData[key] = {
          current: { x: cursor.x, y: cursor.y },
          target: { x: cursor.x, y: cursor.y },
          name: cursor.name,
          color: cursor.color,
          group,
          samples: [{ x: cursor.x, y: cursor.y, t: (cursor as any).t ?? Date.now() }],
        }
      } else {
        // Update target position for interpolation
        cursorsData[key].target = { x: cursor.x, y: cursor.y }
        // Push timestamped sample to jitter buffer (cap length)
        const buf = cursorsData[key].samples
        const ts = (cursor as any).t ?? Date.now()
        buf.push({ x: cursor.x, y: cursor.y, t: ts })
        if (buf.length > 16) buf.shift()

        // Update label if name changed
        if (cursorsData[key].name !== cursor.name) {
          const group = cursorsData[key].group
          if (group) {
            const children = group.getChildren()
            const labelText = children[2] as Konva.Text
            const labelBg = children[1] as Konva.Rect
            labelText.text(cursor.name)
            const labelWidth = cursor.name.length * 7.5 + 16
            labelBg.width(labelWidth)
            cursorsData[key].name = cursor.name
          }
        }
      }
    })

    // Remove cursors that left
    const cursorsData = cursorsDataRef.current
    Object.keys(cursorsData).forEach(id => {
      if (!seenIds.has(id)) {
        cursorsData[id].group?.destroy()
        delete cursorsData[id]
      }
    })

    cursorLayer.batchDraw()
  }, [])

  const { trackCursor } = usePresenceChannel({
    canvasId,
    onCursorUpdate: handleCursorUpdate
  })

  // Helper: convert content-space point to stage-space (for drawing)
  const contentToStage = useCallback((pt: { x: number; y: number }) => {
    const stage = stageRef.current?.getStage()
    if (!stage) return pt
    const transform = stage.getAbsoluteTransform().copy()
    // Do not invert: content -> stage uses forward transform
    return transform.point(pt)
  }, [])

  // Reproject existing cursors when scale/position changes
  useEffect(() => {
    const stage = stageRef.current?.getStage()
    if (!stage) return

    const handleTransform = () => {
      // Nothing to change in stored content-space coords; drawing uses contentToStage per frame
      // This callback triggers a redraw to make sure positions update immediately
      cursorLayerRef.current?.batchDraw()
    }

    stage.on('scaleXChange scaleYChange xChange yChange', handleTransform)
    return () => {
      stage.off('scaleXChange scaleYChange xChange yChange', handleTransform)
    }
  }, [])

  // Animation loop for smooth cursor interpolation with jitter buffer
  useEffect(() => {
    const anim = new Konva.Animation(() => {
      const cursorLayer = cursorLayerRef.current
      if (!cursorLayer) return

      let needsRedraw = false
      const cursorsData = cursorsDataRef.current

      // Render slightly in the past to interpolate between samples
      const renderDelayMs = 80
      const renderTime = performance.now() - renderDelayMs

      function getDesiredPosition(samples: Array<{ x: number; y: number; t: number }>, fallback: { x: number; y: number }) {
        if (!samples || samples.length === 0) return fallback
        // If not enough samples, return last
        if (samples.length === 1) return { x: samples[0].x, y: samples[0].y }
        // Find two samples surrounding renderTime
        let a = samples[0]
        let b = samples[samples.length - 1]
        if (renderTime <= a.t) return { x: a.x, y: a.y }
        if (renderTime >= b.t) return { x: b.x, y: b.y }
        for (let i = 1; i < samples.length; i++) {
          const s = samples[i]
          if (s.t >= renderTime) {
            a = samples[i - 1]
            b = s
            break
          }
        }
        const span = Math.max(1, b.t - a.t)
        const tt = (renderTime - a.t) / span
        return { x: lerp(a.x, b.x, tt), y: lerp(a.y, b.y, tt) }
      }

      Object.values(cursorsData).forEach(cursor => {
        if (!cursor.group) return

        // Compute desired position from jitter buffer
        const desired = getDesiredPosition(cursor.samples, cursor.target)
        const dx = desired.x - cursor.current.x
        const dy = desired.y - cursor.current.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        // Snap when very close to avoid micro-jitter
        if (distance < 0.75) {
          cursor.current.x = desired.x
          cursor.current.y = desired.y
        } else {
          // AGGRESSIVE lerp factors for ultra-responsive feel
          let lerpFactor = 0.6 // Base speed (increased from 0.4)
          if (distance > 100) {
            lerpFactor = 0.85 // Nearly instant for big jumps
          } else if (distance > 50) {
            lerpFactor = 0.75 // Very fast for medium distances
          } else if (distance > 20) {
            lerpFactor = 0.7 // Fast for small-medium distances
          } else {
            lerpFactor = 0.5 // Slightly lower near target to reduce overshoot
          }

          const newX = lerp(cursor.current.x, desired.x, lerpFactor)
          const newY = lerp(cursor.current.y, desired.y, lerpFactor)
          cursor.current.x = newX
          cursor.current.y = newY
        }

        const children = cursor.group.getChildren()
        const dot = children[0] as Konva.Circle
        const labelBg = children[1] as Konva.Rect
        const labelText = children[2] as Konva.Text

        // Convert content-space current position to stage-space for drawing
        const stagePt = contentToStage({ x: cursor.current.x, y: cursor.current.y })
        dot.position({ x: stagePt.x, y: stagePt.y })
        labelBg.position({ x: stagePt.x + 10, y: stagePt.y - 26 })
        labelText.position({ x: stagePt.x + 16, y: stagePt.y - 22 })

        needsRedraw = true
      })

      if (needsRedraw) {
        cursorLayer.batchDraw()
      }
    }, cursorLayerRef.current?.getLayer())

    anim.start()

    return () => {
      anim.stop()
      Object.values(cursorsDataRef.current).forEach(cursor => cursor.group?.destroy())
    }
  }, [contentToStage])

  // Broadcast cursor position on mouse move - OPTIMIZED FOR 30FPS
  useEffect(() => {
    let lastPos = { x: 0, y: 0 }
    const minDelta = 3 // Slightly increased to reduce unnecessary updates
    let baseTickMs = 33 // ~30fps (optimal balance: responsive + low bandwidth)
    let lastTick = 0

    // Adaptive burst mode when pointer moves fast
    let burstUntil = 0
    const velocityThreshold = 300 // px/sec
    let lastTime = performance.now()

    const handleMove = () => {
      const now = performance.now()
      const tickMs = now < burstUntil ? 16 : baseTickMs
      if (now - lastTick < tickMs) return
      lastTick = now
      if (document.hidden) return

      const stage = stageRef.current?.getStage()
      const raw = stage?.getPointerPosition()
      if (!stage || !raw) return

      // Map to content coordinates (inverse stage transform)
      const transform = stage.getAbsoluteTransform().copy()
      transform.invert()
      const content = transform.point(raw)

      const dx = content.x - lastPos.x
      const dy = content.y - lastPos.y
      const dist = Math.hypot(dx, dy)
      const dt = Math.max(1, now - lastTime)
      const velocity = (dist * 1000) / dt // px/sec

      if (dist < minDelta) return

      // Enable burst mode briefly on high velocity
      if (velocity > velocityThreshold) burstUntil = now + 250

      lastPos = { x: content.x, y: content.y }
      lastTime = now
      trackCursor(content.x, content.y)
    }

    const stage = stageRef.current?.getStage()
    stage?.on('mousemove', handleMove)

    return () => {
      stage?.off('mousemove', handleMove)
    }
  }, [trackCursor])

  // FPS counter
  useEffect(() => {
    let mounted = true
    let last = performance.now()
    let frames = 0
    const loop = () => {
      if (!mounted) return
      frames += 1
      const now = performance.now()
      if (now - last >= 500) {
        const fpsNow = Math.round((frames * 1000) / (now - last))
        setFps(fpsNow)
        frames = 0
        last = now
      }
      requestAnimationFrame(loop)
    }
    const id = requestAnimationFrame(loop)
    return () => { mounted = false; cancelAnimationFrame(id) }
  }, [])

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

  const onStageDragEnd = () => {}

  // Event delegation for object dragging
  const onLayerDragEnd = useCallback((e: any) => {
    const shape = e.target
    if (shape === objectLayerRef.current) return

    const id = shape.attrs.id
    if (!id) return

    const finalPos = { x: shape.x(), y: shape.y() }
    
    // Update local state immediately
    upsertObject({ 
      id, 
      x: finalPos.x, 
      y: finalPos.y,
      width: shape.width(),
      height: shape.height()
    })
    
    // Broadcast to other users
    supabase.from('objects').update({ x: finalPos.x, y: finalPos.y }).eq('id', id).then()
  }, [upsertObject])

  const addShape = async (type: 'rect' | 'circle' | 'text') => {
    let shapeData: any = {
      canvas_id: canvasId,
      type,
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      fill: selectedColor || '#4f46e5'
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

  const onShapeClick = (e: any) => {
    const shape = e.target
    const id = shape?.attrs?.id
    if (!id) return
    const isShift = e.evt?.shiftKey
    if (isShift) {
      toggleId(id)
    } else {
      setSelectedIds([id])
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
        <Layer ref={objectLayerRef} onDragEnd={onLayerDragEnd}>
          {objects.map((o) => {
            const commonProps = {
              id: o.id,
              key: o.id,
              draggable: true,
              onClick: onShapeClick,
            }

            if (o.type === 'circle') {
              const isSelected = selectedIds.includes(o.id)
              return (
                <Circle
                  {...commonProps}
                  x={o.x}
                  y={o.y}
                  radius={(o.width || 80) / 2}
                  fill={o.fill || '#4f46e5'}
                  stroke={isSelected ? '#10b981' : undefined}
                  strokeWidth={isSelected ? 3 : 0}
                />
              )
            } else if (o.type === 'text') {
              const isSelected = selectedIds.includes(o.id)
              return (
                <Text
                  {...commonProps}
                  x={o.x}
                  y={o.y}
                  text={o.text_content || 'Text'}
                  fontSize={20}
                  fill={o.fill || '#000000'}
                  stroke={isSelected ? '#10b981' : undefined}
                  strokeWidth={isSelected ? 2 : 0}
                />
              )
            } else {
              const isSelected = selectedIds.includes(o.id)
              return (
                <Rect
                  {...commonProps}
                  x={o.x}
                  y={o.y}
                  width={o.width}
                  height={o.height}
                  fill={o.fill || '#4f46e5'}
                  stroke={isSelected ? '#10b981' : undefined}
                  strokeWidth={isSelected ? 3 : 0}
                />
              )
            }
          })}
        </Layer>
        
        {/* Cursor layer - managed entirely by refs, never re-renders */}
        <Layer ref={cursorLayerRef} listening={false} />
      </Stage>
      <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 8px', borderRadius: 4, fontSize: 12 }}>
        FPS: {fps}
      </div>
    </div>
  )
}
