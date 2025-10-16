export type ShapeId = string

export interface RectLike {
  id: ShapeId
  x: number
  y: number
  width?: number
  height?: number
}

export interface PositionPatch { id: ShapeId; x: number; y: number }

export function arrangeRow(objects: RectLike[], spacing: number): PositionPatch[] {
  if (!objects || objects.length === 0) return []
  const sorted = [...objects].sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x))
  let cursorX = sorted[0].x
  const y = sorted[0].y
  const patches: PositionPatch[] = []
  for (let i = 0; i < sorted.length; i++) {
    const o = sorted[i]
    const w = Math.max(0, o.width ?? 0)
    patches.push({ id: o.id, x: Math.round(cursorX), y })
    cursorX += w + spacing
  }
  return patches
}

export function distribute(objects: RectLike[], axis: 'x' | 'y', spacing?: number): PositionPatch[] {
  if (!objects || objects.length <= 2) return []
  const sorted = [...objects].sort((a, b) => (axis === 'x' ? a.x - b.x : a.y - b.y))
  const start = axis === 'x' ? sorted[0].x : sorted[0].y
  const end = axis === 'x' ? sorted[sorted.length - 1].x : sorted[sorted.length - 1].y
  const gap = spacing != null ? spacing : (end - start) / (sorted.length - 1)
  const patches: PositionPatch[] = []
  for (let i = 0; i < sorted.length; i++) {
    const target = Math.round(start + gap * i)
    const o = sorted[i]
    if (axis === 'x') patches.push({ id: o.id, x: target, y: o.y })
    else patches.push({ id: o.id, x: o.x, y: target })
  }
  return patches
}

export function arrangeGrid(
  objects: RectLike[],
  rows: number,
  cols: number,
  cellW?: number,
  cellH?: number,
  gap: number = 12
): PositionPatch[] {
  if (!objects || objects.length === 0 || rows <= 0 || cols <= 0) return []
  const w = Math.max(1, cellW ?? Math.max(...objects.map(o => o.width ?? 1)))
  const h = Math.max(1, cellH ?? Math.max(...objects.map(o => o.height ?? 1)))
  const sorted = [...objects]
  const originX = sorted[0].x
  const originY = sorted[0].y
  const patches: PositionPatch[] = []
  for (let i = 0; i < objects.length; i++) {
    const r = Math.floor(i / cols)
    const c = i % cols
    if (r >= rows) break
    const x = Math.round(originX + c * (w + gap))
    const y = Math.round(originY + r * (h + gap))
    patches.push({ id: objects[i].id, x, y })
  }
  return patches
}


