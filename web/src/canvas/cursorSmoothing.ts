/**
 * Advanced cursor smoothing utilities for multiplayer cursors
 * Implements exponential smoothing and predictive rendering
 */

export interface CursorState {
  x: number
  y: number
  vx: number  // velocity x
  vy: number  // velocity y
  timestamp: number
}

export interface SmoothedCursor {
  current: { x: number; y: number }
  target: { x: number; y: number }
  velocity: { x: number; y: number }
  lastUpdateTime: number
}

// Smoothing constants
const SMOOTH_FACTOR = 0.15  // Gentle interpolation (vs aggressive 0.6-0.85)
const VELOCITY_SMOOTH_FACTOR = 0.2
const MAX_PREDICTION_MS = 100  // Maximum time to predict ahead
const MIN_MOVEMENT_THRESHOLD = 0.1  // Pixels

/**
 * Exponential moving average for smooth interpolation
 * Much smoother than linear interpolation with high factors
 */
export function exponentialSmooth(
  current: number,
  target: number,
  factor: number = SMOOTH_FACTOR
): number {
  return current + (target - current) * factor
}

/**
 * Update cursor state with predictive smoothing
 * Uses timestamp to predict position and smooth out network jitter
 */
export function updateSmoothedCursor(
  smoothed: SmoothedCursor,
  newTarget: { x: number; y: number },
  _timestamp: number = Date.now()
): void {
  const now = performance.now()
  const dt = Math.max(1, now - smoothed.lastUpdateTime)

  // Calculate velocity from target change
  const dx = newTarget.x - smoothed.target.x
  const dy = newTarget.y - smoothed.target.y

  if (Math.abs(dx) > MIN_MOVEMENT_THRESHOLD || Math.abs(dy) > MIN_MOVEMENT_THRESHOLD) {
    // Update velocity with smoothing
    const newVx = (dx / dt) * 1000  // pixels per second
    const newVy = (dy / dt) * 1000

    smoothed.velocity.x = exponentialSmooth(smoothed.velocity.x, newVx, VELOCITY_SMOOTH_FACTOR)
    smoothed.velocity.y = exponentialSmooth(smoothed.velocity.y, newVy, VELOCITY_SMOOTH_FACTOR)
  }

  // Update target
  smoothed.target.x = newTarget.x
  smoothed.target.y = newTarget.y
  smoothed.lastUpdateTime = now
}

/**
 * Animate cursor towards target with prediction
 * Call this in animation loop (60fps)
 */
export function animateCursor(
  smoothed: SmoothedCursor,
  enablePrediction: boolean = true
): { x: number; y: number } {
  const now = performance.now()
  const timeSinceUpdate = now - smoothed.lastUpdateTime

  // Smooth interpolation towards target
  smoothed.current.x = exponentialSmooth(smoothed.current.x, smoothed.target.x)
  smoothed.current.y = exponentialSmooth(smoothed.current.y, smoothed.target.y)

  // Add predictive offset if we haven't received updates recently
  if (enablePrediction && timeSinceUpdate < MAX_PREDICTION_MS) {
    const predictionFactor = Math.min(timeSinceUpdate / 1000, 0.05)  // Max 50ms prediction

    const predictedX = smoothed.current.x + smoothed.velocity.x * predictionFactor
    const predictedY = smoothed.current.y + smoothed.velocity.y * predictionFactor

    return { x: predictedX, y: predictedY }
  }

  return { x: smoothed.current.x, y: smoothed.current.y }
}

/**
 * Create initial smoothed cursor state
 */
export function createSmoothedCursor(x: number, y: number): SmoothedCursor {
  return {
    current: { x, y },
    target: { x, y },
    velocity: { x: 0, y: 0 },
    lastUpdateTime: performance.now()
  }
}

/**
 * Transform coordinates from content space to stage space
 */
export function contentToStage(
  x: number,
  y: number,
  stageX: number,
  stageY: number,
  scale: number
): { x: number; y: number } {
  return {
    x: x * scale + stageX,
    y: y * scale + stageY
  }
}

/**
 * Transform coordinates from stage space to content space
 */
export function stageToContent(
  x: number,
  y: number,
  stageX: number,
  stageY: number,
  scale: number
): { x: number; y: number } {
  return {
    x: (x - stageX) / scale,
    y: (y - stageY) / scale
  }
}
