import { Line } from 'react-konva'
import { WORLD_WIDTH, WORLD_HEIGHT, GRID_STEP, GRID_MAJOR_STEP, GRID_LINE_COLOR, GRID_MAJOR_LINE_COLOR, GRID_LINE_WIDTH, GRID_MAJOR_LINE_WIDTH } from './constants'

interface GridLayerProps {
  stageX: number
  stageY: number
  scale: number
  viewportWidth: number
  viewportHeight: number
}

export function GridLayer({ stageX, stageY, scale, viewportWidth, viewportHeight }: GridLayerProps) {
  // Calculate visible world bounds
  const worldViewLeft = -stageX / scale
  const worldViewTop = -stageY / scale
  const worldViewRight = worldViewLeft + viewportWidth / scale
  const worldViewBottom = worldViewTop + viewportHeight / scale

  // Clamp to world bounds
  const minX = Math.max(0, Math.floor(worldViewLeft / GRID_STEP) * GRID_STEP)
  const maxX = Math.min(WORLD_WIDTH, Math.ceil(worldViewRight / GRID_STEP) * GRID_STEP)
  const minY = Math.max(0, Math.floor(worldViewTop / GRID_STEP) * GRID_STEP)
  const maxY = Math.min(WORLD_HEIGHT, Math.ceil(worldViewBottom / GRID_STEP) * GRID_STEP)

  const lines: JSX.Element[] = []

  // Vertical lines
  for (let x = minX; x <= maxX; x += GRID_STEP) {
    const isMajor = x % (GRID_STEP * GRID_MAJOR_STEP) === 0
    lines.push(
      <Line
        key={`v-${x}`}
        points={[x, 0, x, WORLD_HEIGHT]}
        stroke={isMajor ? GRID_MAJOR_LINE_COLOR : GRID_LINE_COLOR}
        strokeWidth={isMajor ? GRID_MAJOR_LINE_WIDTH : GRID_LINE_WIDTH}
        strokeScaleEnabled={false}
        listening={false}
        perfectDrawEnabled={false}
      />
    )
  }

  // Horizontal lines
  for (let y = minY; y <= maxY; y += GRID_STEP) {
    const isMajor = y % (GRID_STEP * GRID_MAJOR_STEP) === 0
    lines.push(
      <Line
        key={`h-${y}`}
        points={[0, y, WORLD_WIDTH, y]}
        stroke={isMajor ? GRID_MAJOR_LINE_COLOR : GRID_LINE_COLOR}
        strokeWidth={isMajor ? GRID_MAJOR_LINE_WIDTH : GRID_LINE_WIDTH}
        strokeScaleEnabled={false}
        listening={false}
        perfectDrawEnabled={false}
      />
    )
  }

  return <>{lines}</>
}

