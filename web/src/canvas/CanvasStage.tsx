import { Stage, Layer, Rect, Circle, Text, Transformer, Line } from 'react-konva'
import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { updateObjectOptimistic, updateManyPositionsOptimistic } from './api'
import { useCanvasState, useToolState } from './state'
import { usePresenceChannel } from './usePresenceChannel'
import { usePresenceState } from './presenceState'
import { useSelection } from './selection'
import { useKeyboardShortcuts } from './useKeyboardShortcuts'
import { TextEditor } from '../components/TextEditor'
import { BottomToolbar } from '../components/BottomToolbar'
import { createSmoothedCursor, updateSmoothedCursor, animateCursor, stageToContent } from './cursorSmoothing'
import type { SmoothedCursor } from './cursorSmoothing'
import Konva from 'konva'
import { trackConflict } from '../lib/metrics'

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

// Ramer-Douglas-Peucker algorithm for path simplification
function simplifyPath(points: Array<{ x: number; y: number }>, tolerance: number = 2): Array<{ x: number; y: number }> {
  if (points.length <= 2) return points

  // Find the point with the maximum distance from line between start and end
  let maxDistance = 0
  let index = 0
  const start = points[0]
  const end = points[points.length - 1]

  for (let i = 1; i < points.length - 1; i++) {
    const distance = perpendicularDistance(points[i], start, end)
    if (distance > maxDistance) {
      maxDistance = distance
      index = i
    }
  }

  // If max distance is greater than tolerance, recursively simplify
  if (maxDistance > tolerance) {
    const left = simplifyPath(points.slice(0, index + 1), tolerance)
    const right = simplifyPath(points.slice(index), tolerance)
    return [...left.slice(0, -1), ...right]
  } else {
    return [start, end]
  }
}

// Calculate perpendicular distance from point to line
function perpendicularDistance(
  point: { x: number; y: number },
  lineStart: { x: number; y: number },
  lineEnd: { x: number; y: number }
): number {
  const dx = lineEnd.x - lineStart.x
  const dy = lineEnd.y - lineStart.y
  const mag = Math.sqrt(dx * dx + dy * dy)

  if (mag === 0) {
    return Math.sqrt(
      Math.pow(point.x - lineStart.x, 2) + Math.pow(point.y - lineStart.y, 2)
    )
  }

  const u = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (mag * mag)
  const closestX = lineStart.x + u * dx
  const closestY = lineStart.y + u * dy

  return Math.sqrt(Math.pow(point.x - closestX, 2) + Math.pow(point.y - closestY, 2))
}

export function CanvasStage({ canvasId, selectedColor }: { canvasId: string; selectedColor?: string }) {
  const stageRef = useRef<any>(null)
  const objectLayerRef = useRef<any>(null)
  const cursorLayerRef = useRef<any>(null)
  const transformerRef = useRef<any>(null)
  const shapeRefsMap = useRef<Map<string, any>>(new Map())

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
  const activeTool = useToolState((s) => s.activeTool)
  const setActiveTool = useToolState((s) => s.setActiveTool)

  const [fps, setFps] = useState(0)
  const [editingTextId, setEditingTextId] = useState<string | null>(null)
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 })
  const [isDrawing, setIsDrawing] = useState(false)
  const [newShape, setNewShape] = useState<{ startX: number; startY: number; type: 'rect' | 'circle' | 'text' | 'frame' } | null>(null)
  const [previewShape, setPreviewShape] = useState<{ x: number; y: number; width: number; height: number; type: 'rect' | 'circle' | 'text' | 'frame' } | null>(null)

  // Pen tool state
  const [penPoints, setPenPoints] = useState<Array<{ x: number; y: number }>>([])
  const [isPenDrawing, setIsPenDrawing] = useState(false)

  // Selection box state (marquee selection)
  const [selectionBox, setSelectionBox] = useState<{ startX: number; startY: number; x: number; y: number; width: number; height: number } | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)

  const pendingObjectsRef = useRef<Array<any>>([])
  const objectsRafRef = useRef<number | null>(null)

  // Multi-select drag tracking
  const dragStartPositionsRef = useRef<Record<string, { x: number; y: number }>>({})
  const myUserIdRef = useRef<string | null>(null)

  // Cursor data store - ref-based, never triggers React renders
  const cursorsDataRef = useRef<Record<string, {
    smoothed: SmoothedCursor
    name: string
    color: string
    group: Konva.Group | null
  }>>({})

  // Load initial objects and subscribe to changes
  useEffect(() => {
    // Resolve current auth user id for author-aware filtering
    supabase.auth.getUser().then(({ data }) => {
      myUserIdRef.current = data.user?.id || null
    })

    const channel = supabase
      .channel(`objects:${canvasId}`, {
        config: {
          broadcast: { ack: false },  // Don't wait for acknowledgments (faster object updates)
          presence: { key: '' }
        }
      })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'objects', filter: `canvas_id=eq.${canvasId}` },
        (payload: any) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const r = payload.new
            // Ignore own updates to prevent flicker
            if (r.updated_by && myUserIdRef.current && r.updated_by === myUserIdRef.current) return
            pendingObjectsRef.current.push({
              id: r.id,
              type: r.type,
              x: r.x,
              y: r.y,
              width: r.width,
              height: r.height,
              rotation: r.rotation,
              fill: r.fill || '#4f46e5',
              stroke: r.stroke,
              stroke_width: r.stroke_width,
              text_content: r.text_content,
              points: r.points,
              updatedBy: r.updated_by,
              updatedAt: r.updated_at,
              version: r.version,
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
          rotation: r.rotation,
          fill: r.fill || '#4f46e5',
          stroke: r.stroke,
          stroke_width: r.stroke_width,
          text_content: r.text_content,
          points: r.points,
          updatedBy: r.updated_by,
          updatedAt: r.updated_at,
          version: r.version,
        }))
        upsertMany(batch)
      })

    return () => {
      supabase.removeChannel(channel)
      if (objectsRafRef.current != null) cancelAnimationFrame(objectsRafRef.current)
    }
  }, [canvasId, upsertMany, removeObject])

  // CURSOR SYSTEM - Using shared presence hook
  const handleCursorUpdate = useCallback((cursors: Record<string, { x: number; y: number; name: string; color: string; t?: number }>) => {
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
        // Create new cursor with smoothing
        const group = createCursorGroup(
          cursor.x,
          cursor.y,
          cursor.name,
          cursor.color
        )
        cursorLayer.add(group)

        cursorsData[key] = {
          smoothed: createSmoothedCursor(cursor.x, cursor.y),
          name: cursor.name,
          color: cursor.color,
          group,
        }
      } else {
        // Update smoothed target position
        updateSmoothedCursor(
          cursorsData[key].smoothed,
          { x: cursor.x, y: cursor.y },
          cursor.t
        )

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

  // Get presence hook with trackCursor and myId
  const { trackCursor, myId, setEditingIds } = usePresenceChannel({
    canvasId,
    onCursorUpdate: handleCursorUpdate
  })

  // Animation loop with exponential smoothing and prediction
  useEffect(() => {
    const anim = new Konva.Animation(() => {
      const cursorLayer = cursorLayerRef.current
      if (!cursorLayer) return

      let needsRedraw = false
      const cursorsData = cursorsDataRef.current

      Object.entries(cursorsData).forEach(([id, cursor]) => {
        if (!cursor.group) return

        // Hide local user's cursor to prevent disconnect
        if (id === myId) {
          cursor.group.opacity(0)
          return
        }

        cursor.group.opacity(1)

        // Animate with prediction
        const pos = animateCursor(cursor.smoothed, true)

        const children = cursor.group.getChildren()
        const dot = children[0] as Konva.Circle
        const labelBg = children[1] as Konva.Rect
        const labelText = children[2] as Konva.Text

        dot.position({ x: pos.x, y: pos.y })
        labelBg.position({ x: pos.x + 10, y: pos.y - 26 })
        labelText.position({ x: pos.x + 16, y: pos.y - 22 })

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
  }, [myId])

  // Broadcast cursor position in CONTENT-SPACE coordinates
  useEffect(() => {
    const handleMove = () => {
      if (document.hidden) return

      const stage = stageRef.current
      if (!stage) return

      const pos = stage.getPointerPosition()
      if (!pos) return

      // Convert stage-space to content-space
      const contentPos = stageToContent(
        pos.x,
        pos.y,
        stage.x(),
        stage.y(),
        stage.scaleX()
      )

      // trackCursor now has smart debouncing built-in
      trackCursor(contentPos.x, contentPos.y)
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

  // Attach transformer to selected shapes
  useEffect(() => {
    const transformer = transformerRef.current
    if (!transformer) return

    const selectedNodes = selectedIds
      .map(id => shapeRefsMap.current.get(id))
      .filter(Boolean)

    transformer.nodes(selectedNodes)
    transformer.getLayer()?.batchDraw()
  }, [selectedIds])

  const onWheel = throttle((e: any) => {
    e.evt.preventDefault()
    const stage = stageRef.current

    // Check if Ctrl/Cmd key is held for zoom
    if (e.evt.ctrlKey || e.evt.metaKey) {
      // Zoom behavior - smoother with 1.02 scale factor
      const scaleBy = 1.02
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
      setStagePos(newPos)
    } else {
      // Pan behavior - scroll vertically
      const dx = e.evt.deltaX
      const dy = e.evt.deltaY
      const currentPos = stage.position()
      const newPos = {
        x: currentPos.x - dx,
        y: currentPos.y - dy
      }
      stage.position(newPos)
      setStagePos(newPos)
    }
  }, 8)

  const onStageDragEnd = () => {
    const stage = stageRef.current
    if (stage) {
      setStagePos({ x: stage.x(), y: stage.y() })
    }
  }

  // Track initial positions of all selected shapes when drag starts
  const onLayerDragStart = useCallback((e: any) => {
    const shape = e.target
    if (shape === objectLayerRef.current) return

    const id = shape.attrs.id
    if (!id || !selectedIds.includes(id)) return

    // Store initial positions of all selected shapes
    dragStartPositionsRef.current = {}
    selectedIds.forEach(selectedId => {
      const node = shapeRefsMap.current.get(selectedId)
      if (node) {
        dragStartPositionsRef.current[selectedId] = {
          x: node.x(),
          y: node.y()
        }
      }
    })

    // Broadcast soft-locks for selected objects
    setEditingIds(selectedIds)
  }, [selectedIds])

  // Move all selected shapes together during drag
  const onLayerDragMove = useCallback((e: any) => {
    const shape = e.target
    if (shape === objectLayerRef.current) return

    const id = shape.attrs.id
    if (!id || !selectedIds.includes(id) || selectedIds.length <= 1) return

    // Calculate delta from the dragged shape
    const startPos = dragStartPositionsRef.current[id]
    if (!startPos) return

    const dx = shape.x() - startPos.x
    const dy = shape.y() - startPos.y

    // Move all other selected shapes by the same delta
    selectedIds.forEach(selectedId => {
      if (selectedId !== id) {
        const node = shapeRefsMap.current.get(selectedId)
        const initialPos = dragStartPositionsRef.current[selectedId]
        if (node && initialPos) {
          node.x(initialPos.x + dx)
          node.y(initialPos.y + dy)
        }
      }
    })

    // Redraw the layer
    objectLayerRef.current?.batchDraw()
  }, [selectedIds])

  // Event delegation for object dragging
  const onLayerDragEnd = useCallback(async (e: any) => {
    const shape = e.target
    if (shape === objectLayerRef.current) return

    const id = shape.attrs.id
    if (!id) return

    // If multiple shapes are selected, update all of them
    if (selectedIds.includes(id) && selectedIds.length > 1) {
      const updates: Array<{ id: string; x: number; y: number }> = []

      selectedIds.forEach(selectedId => {
        const node = shapeRefsMap.current.get(selectedId)
        if (node) {
          const pos = { x: node.x(), y: node.y() }

          // Update local state
          upsertObject({
            id: selectedId,
            x: pos.x,
            y: pos.y,
            width: node.width(),
            height: node.height()
          })

          updates.push({ id: selectedId, x: pos.x, y: pos.y })
        }
      })

      // Build optimistic batch with expected versions
      const versioned = updates
        .map(u => {
          const obj = (objectsRecord as any)[u.id]
          return obj && obj.version != null ? { id: u.id, expected_version: obj.version, x: u.x, y: u.y } : null
        })
        .filter(Boolean) as Array<{ id: string; expected_version: number; x: number; y: number }>

      try {
        await updateManyPositionsOptimistic(versioned)
      } catch (err: any) {
        trackConflict('conflict_detected', { type: 'batch', count: versioned.length })
        // On conflict, fallback to regular updates (rare) or refresh
        versioned.forEach(v => {
          supabase.from('objects').update({ x: v.x, y: v.y }).eq('id', v.id).then()
        })
      }
    } else {
      // Single shape drag
      const finalPos = { x: shape.x(), y: shape.y() }

      // Update local state immediately
      upsertObject({
        id,
        x: finalPos.x,
        y: finalPos.y,
        width: shape.width(),
        height: shape.height()
      })

      // Optimistic single update
      const obj = (objectsRecord as any)[id]
      try {
        await updateObjectOptimistic(id, obj?.version, { x: finalPos.x, y: finalPos.y } as any)
      } catch (err: any) {
        if (err?.message === 'version_conflict' && err.latest) {
          // Merge by applying our delta from prev to latest if safe; fallback to LWW
          const dx = finalPos.x - (obj?.x ?? finalPos.x)
          const dy = finalPos.y - (obj?.y ?? finalPos.y)
          const merged = { x: (err.latest.x as number) + dx, y: (err.latest.y as number) + dy }
          await supabase.from('objects').update(merged).eq('id', id)
          trackConflict('merge_applied', { id })
        } else {
          // Fallback regular update
          await supabase.from('objects').update({ x: finalPos.x, y: finalPos.y }).eq('id', id)
          trackConflict('merge_failed', { id })
        }
      }
    }

    // Clear drag start positions
    dragStartPositionsRef.current = {}
    // Release soft-locks
    setEditingIds([])
  }, [upsertObject, selectedIds])

  // Handle transform (resize/rotate) end
  const onTransformEnd = useCallback(async (e: any) => {
    const node = e.target
    const id = node.attrs.id
    if (!id) return

    const scaleX = node.scaleX()
    const scaleY = node.scaleY()

    // Reset scale and apply to width/height
    node.scaleX(1)
    node.scaleY(1)

    const updates: any = {
      id,
      x: node.x(),
      y: node.y(),
      rotation: node.rotation(),
      width: Math.max(5, node.width() * scaleX),
      height: Math.max(5, node.height() * scaleY),
    }

    // Update local state
    upsertObject(updates)

    // Optimistic single update
    const obj = (objectsRecord as any)[id]
    try {
      await updateObjectOptimistic(id, obj?.version, {
        x: updates.x,
        y: updates.y,
        width: updates.width,
        height: updates.height,
        rotation: updates.rotation,
      } as any)
    } catch (err: any) {
      await supabase.from('objects').update({
        x: updates.x,
        y: updates.y,
        width: updates.width,
        height: updates.height,
        rotation: updates.rotation,
      }).eq('id', id)
      trackConflict('merge_failed', { id })
    }
  }, [upsertObject])

  const createShapeAtPosition = async (type: 'rect' | 'circle' | 'text' | 'frame', x: number, y: number, width: number, height: number) => {
    let shapeData: any = {
      canvas_id: canvasId,
      type,
      x,
      y,
      width: Math.max(Math.abs(width), 5),
      height: Math.max(Math.abs(height), 5),
      fill: selectedColor || '#4f46e5'
    }

    if (type === 'text') {
      shapeData.text_content = 'Text'
      shapeData.fill = '#000000'
    } else if (type === 'frame') {
      // Frame: border only, no fill
      shapeData.fill = 'transparent'
      shapeData.stroke = selectedColor || '#8b5cf6'
      shapeData.stroke_width = 2
    }

    const { data, error } = await supabase.from('objects').insert(shapeData).select()

    if (error) {
      console.error(`Failed to add ${type}:`, error)
    } else if (data && data[0]) {
      // Select the newly created shape
      setSelectedIds([data[0].id])
      // Switch back to select tool
      setActiveTool('select')
    }
  }

  const onShapeClick = (e: any) => {
    if (activeTool !== 'select') return
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

  const onShapeDoubleClick = (e: any) => {
    if (activeTool !== 'select') return
    const shape = e.target
    const id = shape?.attrs?.id
    const obj = objects.find(o => o.id === id)
    if (obj && obj.type === 'text') {
      setEditingTextId(id)
      setSelectedIds([]) // Clear selection while editing
    }
  }

  // Handle stage click for drawing shapes
  const onStageMouseDown = (e: any) => {
    // Only handle clicks on empty canvas (not on shapes)
    if (e.target !== e.target.getStage() && e.target !== objectLayerRef.current) {
      return
    }

    // Select mode: start selection box (marquee selection)
    if (activeTool === 'select') {
      const stage = stageRef.current
      const pos = stage.getPointerPosition()
      if (!pos) return

      // Convert to content space
      const contentPos = stageToContent(pos.x, pos.y, stage.x(), stage.y(), stage.scaleX())

      setIsSelecting(true)
      setSelectionBox({
        startX: contentPos.x,
        startY: contentPos.y,
        x: contentPos.x,
        y: contentPos.y,
        width: 0,
        height: 0
      })
      return
    }

    // Pen tool: start freehand drawing
    if (activeTool === 'pen') {
      const stage = stageRef.current
      const pos = stage.getPointerPosition()
      if (!pos) return

      // Convert to content space
      const contentPos = stageToContent(pos.x, pos.y, stage.x(), stage.y(), stage.scaleX())

      setIsPenDrawing(true)
      setPenPoints([contentPos])
      return
    }

    // Start drawing shape if a shape tool is active
    if (activeTool === 'rect' || activeTool === 'circle' || activeTool === 'text' || activeTool === 'frame') {
      const stage = stageRef.current
      const pos = stage.getPointerPosition()
      if (!pos) return

      // Convert to content space
      const contentPos = stageToContent(pos.x, pos.y, stage.x(), stage.y(), stage.scaleX())

      setIsDrawing(true)
      setNewShape({ startX: contentPos.x, startY: contentPos.y, type: activeTool })
    }
  }

  const onStageMouseMove = () => {
    const stage = stageRef.current
    const pos = stage?.getPointerPosition()
    if (!pos) return

    // Convert to content space
    const contentPos = stageToContent(pos.x, pos.y, stage.x(), stage.y(), stage.scaleX())

    // Handle selection box dragging
    if (isSelecting && selectionBox) {
      const width = contentPos.x - selectionBox.startX
      const height = contentPos.y - selectionBox.startY

      // Calculate actual position (adjust if drawn backwards)
      const x = width < 0 ? selectionBox.startX + width : selectionBox.startX
      const y = height < 0 ? selectionBox.startY + height : selectionBox.startY

      setSelectionBox({
        ...selectionBox,
        x,
        y,
        width: Math.abs(width),
        height: Math.abs(height)
      })
      return
    }

    // Handle pen tool freehand drawing
    if (isPenDrawing && penPoints.length > 0) {
      const lastPoint = penPoints[penPoints.length - 1]
      // Only add point if it's far enough from the last one (distance threshold)
      const distance = Math.sqrt(
        Math.pow(contentPos.x - lastPoint.x, 2) + Math.pow(contentPos.y - lastPoint.y, 2)
      )
      if (distance > 3) {
        setPenPoints(prev => [...prev, contentPos])
      }
      return
    }

    // Handle shape drawing
    if (!isDrawing || !newShape) return

    let width = contentPos.x - newShape.startX
    let height = contentPos.y - newShape.startY

    // For circles, use the larger dimension
    if (newShape.type === 'circle') {
      const size = Math.max(Math.abs(width), Math.abs(height))
      width = width < 0 ? -size : size
      height = height < 0 ? -size : size
    }

    // Calculate actual position (adjust if drawn backwards)
    const x = width < 0 ? newShape.startX + width : newShape.startX
    const y = height < 0 ? newShape.startY + height : newShape.startY

    setPreviewShape({
      x,
      y,
      width: Math.abs(width),
      height: Math.abs(height),
      type: newShape.type
    })
  }

  const onStageMouseUp = async () => {
    // Handle pen tool completion - auto-finish on mouse up
    if (isPenDrawing && penPoints.length >= 2) {
      // Simplify the path using Ramer-Douglas-Peucker
      const simplified = simplifyPath(penPoints, 2)

      // Calculate bounding box for the path
      const xs = simplified.map(p => p.x)
      const ys = simplified.map(p => p.y)
      const minX = Math.min(...xs)
      const minY = Math.min(...ys)
      const maxX = Math.max(...xs)
      const maxY = Math.max(...ys)

      const lineData = {
        canvas_id: canvasId,
        type: 'line',
        x: minX,
        y: minY,
        width: maxX - minX || 1,
        height: maxY - minY || 1,
        points: simplified,
        stroke: selectedColor || '#4f46e5',
        stroke_width: 2,
        fill: 'transparent',
      }

      const { data, error } = await supabase.from('objects').insert(lineData).select()

      if (error) {
        console.error('Failed to add line:', error)
      } else if (data && data[0]) {
        setSelectedIds([data[0].id])
      }

      // Reset pen state
      setPenPoints([])
      setIsPenDrawing(false)
      setActiveTool('select')
      return
    }

    // Handle selection box completion
    if (isSelecting && selectionBox) {
      // Only process if the box has meaningful size (more than 5px)
      if (selectionBox.width > 5 || selectionBox.height > 5) {
        // Find all objects that intersect with the selection box
        const selectedObjects = objects.filter(obj => {
          // Get object bounds
          const objLeft = obj.x
          const objRight = obj.x + obj.width
          const objTop = obj.y
          const objBottom = obj.y + obj.height

          // Get selection box bounds
          const boxLeft = selectionBox.x
          const boxRight = selectionBox.x + selectionBox.width
          const boxTop = selectionBox.y
          const boxBottom = selectionBox.y + selectionBox.height

          // Check for intersection
          return !(
            objRight < boxLeft ||
            objLeft > boxRight ||
            objBottom < boxTop ||
            objTop > boxBottom
          )
        })

        setSelectedIds(selectedObjects.map(obj => obj.id))
      } else {
        // Click without drag - clear selection
        setSelectedIds([])
      }

      setIsSelecting(false)
      setSelectionBox(null)
      return
    }

    // Handle shape drawing
    if (!isDrawing || !newShape) return

    const stage = stageRef.current
    const pos = stage.getPointerPosition()
    if (!pos) return

    const contentPos = stageToContent(pos.x, pos.y, stage.x(), stage.y(), stage.scaleX())

    const width = contentPos.x - newShape.startX
    const height = contentPos.y - newShape.startY

    // For circles, use the larger dimension
    let finalWidth = Math.abs(width)
    let finalHeight = Math.abs(height)

    if (newShape.type === 'circle') {
      const size = Math.max(finalWidth, finalHeight)
      finalWidth = size
      finalHeight = size
    }

    // Click-to-create: if mouse didn't move much, create default-sized shape
    if (finalWidth < 5 && finalHeight < 5) {
      // Default sizes for click-to-create
      if (newShape.type === 'rect') {
        finalWidth = 120
        finalHeight = 80
      } else if (newShape.type === 'circle') {
        finalWidth = 80
        finalHeight = 80
      } else if (newShape.type === 'text') {
        finalWidth = 200
        finalHeight = 40
      } else if (newShape.type === 'frame') {
        finalWidth = 300
        finalHeight = 200
      }

      // Use click position as top-left corner for click-to-create
      await createShapeAtPosition(newShape.type, newShape.startX, newShape.startY, finalWidth, finalHeight)
    } else {
      // Drag-to-create: use drawn dimensions
      // Adjust position if drawn backwards
      const x = width < 0 ? newShape.startX + width : newShape.startX
      const y = height < 0 ? newShape.startY + height : newShape.startY
      await createShapeAtPosition(newShape.type, x, y, finalWidth, finalHeight)
    }

    setIsDrawing(false)
    setNewShape(null)
    setPreviewShape(null)
  }

  // Keyboard shortcuts callbacks
  const handleDeleteSelected = useCallback(async () => {
    if (selectedIds.length === 0) return

    for (const id of selectedIds) {
      await supabase.from('objects').delete().eq('id', id)
    }
    setSelectedIds([])
  }, [selectedIds, setSelectedIds])

  const handleDuplicateSelected = useCallback(async () => {
    if (selectedIds.length === 0) return

    const selectedObjects = selectedIds
      .map(id => objects.find(o => o.id === id))
      .filter(Boolean)

    const newObjects = selectedObjects.map(obj => ({
      canvas_id: canvasId,
      type: obj!.type,
      x: obj!.x + 20,
      y: obj!.y + 20,
      width: obj!.width,
      height: obj!.height,
      rotation: obj!.rotation,
      fill: obj!.fill,
      text_content: obj!.text_content,
    }))

    const { data, error } = await supabase
      .from('objects')
      .insert(newObjects)
      .select()

    if (!error && data) {
      setSelectedIds(data.map(obj => obj.id))
    }
  }, [selectedIds, objects, canvasId, setSelectedIds])

  const handleZoomIn = useCallback(() => {
    const stage = stageRef.current
    if (!stage) return
    const oldScale = stage.scaleX()
    const newScale = oldScale * 1.2
    setScale(newScale)
    const pointer = stage.getPointerPosition() || { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    }
    stage.position({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    })
    setStagePos({ x: stage.x(), y: stage.y() })
  }, [])

  const handleZoomOut = useCallback(() => {
    const stage = stageRef.current
    if (!stage) return
    const oldScale = stage.scaleX()
    const newScale = oldScale / 1.2
    setScale(newScale)
    const pointer = stage.getPointerPosition() || { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    }
    stage.position({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    })
    setStagePos({ x: stage.x(), y: stage.y() })
  }, [])

  const handleNudge = useCallback(async (dx: number, dy: number) => {
    if (selectedIds.length === 0) return

    for (const id of selectedIds) {
      const obj = objects.find(o => o.id === id)
      if (obj) {
        const newX = obj.x + dx
        const newY = obj.y + dy
        upsertObject({ id, x: newX, y: newY })
        await supabase.from('objects').update({ x: newX, y: newY }).eq('id', id)
      }
    }
  }, [selectedIds, objects, upsertObject])

  const handleTextSave = useCallback(async (newText: string) => {
    if (!editingTextId) return

    await supabase
      .from('objects')
      .update({ text_content: newText })
      .eq('id', editingTextId)

    setEditingTextId(null)
  }, [editingTextId])

  const handleTextCancel = useCallback(() => {
    setEditingTextId(null)
  }, [])

  // Integrate keyboard shortcuts
  useKeyboardShortcuts({
    canvasId,
    objects: objectsRecord,
    onDeleteSelected: handleDeleteSelected,
    onDuplicateSelected: handleDuplicateSelected,
    onZoomIn: handleZoomIn,
    onZoomOut: handleZoomOut,
    onNudge: handleNudge,
    upsertObject,
  })

  // Update cursor style based on active tool
  const getCursorStyle = () => {
    switch (activeTool) {
      case 'pan':
        return 'grab'
      case 'rect':
      case 'circle':
      case 'text':
      case 'frame':
      case 'pen':
        return 'crosshair'
      default:
        return 'default'
    }
  }

  // Compute locked object ids from presence (others' editingIds)
  const presenceUsers = usePresenceState((s) => s.users)
  const lockedIds = new Set<string>()
  Object.entries(presenceUsers).forEach(([pid, user]) => {
    if (pid !== myId && user.editingIds) {
      user.editingIds.forEach((id) => lockedIds.add(id))
    }
  })

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative', cursor: getCursorStyle() }}>
      <Stage
        ref={stageRef}
        width={window.innerWidth}
        height={window.innerHeight}
        draggable={activeTool === 'pan'}
        scaleX={scale}
        scaleY={scale}
        onWheel={onWheel}
        onDragEnd={onStageDragEnd}
        onMouseDown={onStageMouseDown}
        onMouseMove={onStageMouseMove}
        onMouseUp={onStageMouseUp}
      >
        <Layer ref={objectLayerRef} onDragStart={onLayerDragStart} onDragMove={onLayerDragMove} onDragEnd={onLayerDragEnd}>
          {objects.map((o) => {
            const isLocked = lockedIds.has(o.id)
            const commonProps = {
              id: o.id,
              key: o.id,
              draggable: activeTool === 'select' && !isLocked,
              onClick: onShapeClick,
              onDblClick: onShapeDoubleClick,
              rotation: o.rotation || 0,
              onTransformEnd: onTransformEnd,
              ref: (node: any) => {
                if (node) {
                  shapeRefsMap.current.set(o.id, node)
                } else {
                  shapeRefsMap.current.delete(o.id)
                }
              },
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
                  stroke={isSelected ? '#10b981' : isLocked ? '#f59e0b' : undefined}
                  strokeWidth={isSelected ? 3 : isLocked ? 2 : 0}
                  dash={isLocked && !isSelected ? [6, 4] : undefined}
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
                  stroke={isSelected ? '#10b981' : isLocked ? '#f59e0b' : undefined}
                  strokeWidth={isSelected ? 2 : isLocked ? 2 : 0}
                />
              )
            } else if (o.type === 'frame') {
              const isSelected = selectedIds.includes(o.id)
              return (
                <Rect
                  {...commonProps}
                  x={o.x}
                  y={o.y}
                  width={o.width}
                  height={o.height}
                  fill="transparent"
                  stroke={isSelected ? '#10b981' : isLocked ? '#f59e0b' : (o.stroke || '#8b5cf6')}
                  strokeWidth={isSelected ? 3 : isLocked ? 2 : (o.stroke_width || 2)}
                  dash={isLocked && !isSelected ? [6, 4] : undefined}
                />
              )
            } else if (o.type === 'line' && o.points) {
              const isSelected = selectedIds.includes(o.id)
              return (
                <Line
                  {...commonProps}
                  points={o.points.flatMap(p => [p.x, p.y])}
                  stroke={isSelected ? '#10b981' : isLocked ? '#f59e0b' : (o.stroke || '#4f46e5')}
                  strokeWidth={isSelected ? 3 : isLocked ? 2 : (o.stroke_width || 2)}
                  lineCap="round"
                  lineJoin="round"
                  fill={undefined}
                  dash={isLocked && !isSelected ? [6, 4] : undefined}
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
                  stroke={isSelected ? '#10b981' : isLocked ? '#f59e0b' : undefined}
                  strokeWidth={isSelected ? 3 : isLocked ? 2 : 0}
                  dash={isLocked && !isSelected ? [6, 4] : undefined}
                />
              )
            }
          })}

          {/* Selection box preview (marquee selection) */}
          {isSelecting && selectionBox && selectionBox.width > 0 && selectionBox.height > 0 && (
            <Rect
              x={selectionBox.x}
              y={selectionBox.y}
              width={selectionBox.width}
              height={selectionBox.height}
              fill="rgba(99, 102, 241, 0.1)"
              stroke="#6366f1"
              strokeWidth={1}
              dash={[4, 4]}
              listening={false}
            />
          )}

          {/* Pen tool preview - show smooth path being drawn */}
          {isPenDrawing && penPoints.length > 1 && (
            <Line
              points={penPoints.flatMap(p => [p.x, p.y])}
              stroke={selectedColor || '#4f46e5'}
              strokeWidth={2}
              lineCap="round"
              lineJoin="round"
              listening={false}
            />
          )}

          {/* Preview shape during creation */}
          {previewShape && (() => {
            const commonPreviewProps = {
              listening: false,
              opacity: 0.5,
              stroke: selectedColor || '#4f46e5',
              strokeWidth: 2,
              dash: [5, 5],
              fill: selectedColor || '#4f46e5',
            }

            if (previewShape.type === 'circle') {
              return (
                <Circle
                  {...commonPreviewProps}
                  x={previewShape.x + previewShape.width / 2}
                  y={previewShape.y + previewShape.height / 2}
                  radius={previewShape.width / 2}
                />
              )
            } else if (previewShape.type === 'text') {
              return (
                <Rect
                  {...commonPreviewProps}
                  x={previewShape.x}
                  y={previewShape.y}
                  width={previewShape.width}
                  height={previewShape.height}
                  fill="transparent"
                />
              )
            } else if (previewShape.type === 'frame') {
              return (
                <Rect
                  {...commonPreviewProps}
                  x={previewShape.x}
                  y={previewShape.y}
                  width={previewShape.width}
                  height={previewShape.height}
                  fill="transparent"
                  stroke={selectedColor || '#8b5cf6'}
                  strokeWidth={2}
                />
              )
            } else {
              return (
                <Rect
                  {...commonPreviewProps}
                  x={previewShape.x}
                  y={previewShape.y}
                  width={previewShape.width}
                  height={previewShape.height}
                />
              )
            }
          })()}

          <Transformer
            ref={transformerRef}
            boundBoxFunc={(oldBox, newBox) => {
              // Limit resize to minimum 5px
              if (newBox.width < 5 || newBox.height < 5) {
                return oldBox
              }
              return newBox
            }}
          />
        </Layer>
        
        {/* Cursor layer - managed entirely by refs, never re-renders */}
        <Layer ref={cursorLayerRef} listening={false} />
      </Stage>
      <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 8px', borderRadius: 4, fontSize: 12 }}>
        FPS: {fps}
      </div>

      {/* Text editor overlay */}
      {editingTextId && (() => {
        const textObj = objects.find(o => o.id === editingTextId)
        if (!textObj) return null
        return (
          <TextEditor
            value={textObj.text_content || ''}
            x={textObj.x}
            y={textObj.y}
            width={textObj.width}
            fontSize={20}
            stageScale={scale}
            stageX={stagePos.x}
            stageY={stagePos.y}
            onSave={handleTextSave}
            onCancel={handleTextCancel}
          />
        )
      })()}

      {/* Bottom toolbar */}
      <BottomToolbar
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
      />
    </div>
  )
}
