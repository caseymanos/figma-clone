# Performance Optimizations - October 16, 2025

## Problem
The application was experiencing over 1000ms of cursor lag during drag operations and cursor movement.

## Root Causes Identified

1. **Database calls during drag operations** - The `onDragMove` handler was making database updates on every drag movement, causing network latency
2. **Unnecessary re-renders** - Cursor updates were triggering full component re-renders, affecting all objects
3. **Wasteful rendering** - Line 403 had `{Object.entries(cursors).map(() => null)}` that iterated through cursors but rendered nothing
4. **Missing memoization** - Shape components weren't memoized, causing re-renders on every state change
5. **Inefficient callback creation** - New callback functions were created on every render, breaking memoization
6. **High presence update frequency** - Cursor positions were being broadcast every 50ms (20 updates/sec)

## Solutions Implemented

### 1. Eliminated Database Calls During Drag
**Before:**
```typescript
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
```

**After:**
```typescript
const onDragMove = () => {
  // No-op during drag - Konva handles visual updates
  // This prevents unnecessary re-renders and network calls
}
```

Now database updates only happen on `dragEnd`, not during the drag operation.

### 2. Added Component Memoization with Custom Comparison
Created memoized shape components with custom equality checks:

```typescript
const shapePropsEqual = (prev: any, next: any) => {
  return (
    prev.obj.x === next.obj.x &&
    prev.obj.y === next.obj.y &&
    prev.obj.width === next.obj.width &&
    prev.obj.height === next.obj.height &&
    prev.obj.fill === next.obj.fill &&
    prev.obj.text_content === next.obj.text_content &&
    prev.onDragMove === next.onDragMove &&
    prev.onDragEnd === next.onDragEnd
  )
}

const MemoRect = memo(({ obj, onDragMove, onDragEnd }: any) => (
  <Rect
    x={obj.x}
    y={obj.y}
    width={obj.width}
    height={obj.height}
    fill={obj.fill || '#4f46e5'}
    draggable
    onDragMove={onDragMove}
    onDragEnd={onDragEnd}
  />
), shapePropsEqual)
```

### 3. Separated Cursor Rendering
Created a separate `CursorsLayer` component that subscribes only to cursor state:

```typescript
const CursorsLayer = memo(() => {
  const cursors = useCanvasState((s) => s.cursors)
  return (
    <FastLayer listening={false}>
      {/* Cursor rendering */}
    </FastLayer>
  )
})
```

This prevents cursor updates from triggering re-renders of object shapes.

### 4. Stable Callback References
Used refs to create stable callback references that don't change on every render:

```typescript
const dragCallbacksRef = useRef<{ move: Record<string, any>, end: Record<string, any> }>({ move: {}, end: {} })

const getOrCreateDragCallbacks = useCallback((id: string) => {
  if (!dragCallbacksRef.current.move[id]) {
    dragCallbacksRef.current.move[id] = () => {
      // No-op during drag
    }
  }
  if (!dragCallbacksRef.current.end[id]) {
    dragCallbacksRef.current.end[id] = (e: any) => {
      const node = e.target
      const finalPos = { x: node.x(), y: node.y(), width: node.width(), height: node.height() }
      upsertObject({ id, ...finalPos })
      supabase.from('objects').update({ x: finalPos.x, y: finalPos.y }).eq('id', id).then()
    }
  }
  return {
    move: dragCallbacksRef.current.move[id],
    end: dragCallbacksRef.current.end[id]
  }
}, [upsertObject])
```

### 5. Reduced Presence Update Frequency
**Before:**
```typescript
const minDelta = 2
const tickMs = 50  // 20 updates per second
```

**After:**
```typescript
const minDelta = 3
const tickMs = 100  // 10 updates per second
```

This reduces network traffic and state updates by 50%.

### 6. Removed Wasteful Rendering
Removed the line that was iterating through cursors but rendering nothing:
```typescript
{Object.entries(cursors).map(() => null)}  // REMOVED
```

## Results

These optimizations should result in:
- **No lag during drag operations** - Visual updates are handled by Konva without state updates
- **Reduced network traffic** - 50% fewer presence updates, no DB calls during drag
- **Minimal re-renders** - Memoization and separation of concerns prevent unnecessary renders
- **Smooth cursor movement** - Cursor updates don't affect object rendering

## Testing

To verify the improvements:
1. Deploy the updated code
2. Open the canvas with multiple objects
3. Drag objects around - should be smooth with no lag
4. Monitor the FPS counter and cursor lag indicator in the top-left
5. Expected: 60 FPS, cursor lag < 200ms

## Future Optimizations

If further optimization is needed:
1. Implement virtual rendering for canvases with 100+ objects
2. Add spatial indexing for collision detection
3. Implement object culling for off-screen elements
4. Use Web Workers for complex calculations

