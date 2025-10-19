// Canvas world dimensions and grid settings
export const WORLD_WIDTH = 5000
export const WORLD_HEIGHT = 5000
export const GRID_STEP = 50
export const GRID_MAJOR_STEP = 10 // Major line every 10 steps

// Zoom constraints
export const MIN_ZOOM = 0.1
export const MAX_ZOOM = 8

// Grid styling
export const GRID_LINE_COLOR = '#e5e7eb'
export const GRID_MAJOR_LINE_COLOR = '#d1d5db'
export const GRID_LINE_WIDTH = 1
export const GRID_MAJOR_LINE_WIDTH = 1.5

// Snap to grid helper
export function snapToGrid(value: number, gridSize: number = GRID_STEP): number {
  return Math.round(value / gridSize) * gridSize
}

