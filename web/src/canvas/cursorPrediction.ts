/**
 * State-of-the-art cursor prediction for multiplayer presence
 * 
 * Implements:
 * - Time-based interpolation buffer (entity interpolation)
 * - Catmull-Rom spline interpolation (smooth curves)
 * - One-Euro filter (adaptive jitter reduction)
 * - Dead reckoning (extrapolation with velocity clamping)
 */

export interface CursorSample {
  x: number
  y: number
  arriveMs: number
  seq?: number
}

export interface CursorPredictorConfig {
  interpolationDelayMs?: number  // Render delay to buffer jitter (90-110ms)
  maxExtrapolationMs?: number    // Max time to extrapolate (120-150ms)
  maxSpeedPxPerSec?: number      // Cap speed for dead reckoning
  maxAccelPxPerSec2?: number     // Cap acceleration
  bufferSize?: number            // Ring buffer size
  // One-Euro filter params
  oneEuroMinCutoff?: number      // Low-speed cutoff (~1.2-1.8)
  oneEuroBeta?: number           // Speed sensitivity (~0.003-0.01)
  oneEuroDCutoff?: number        // Derivative cutoff (~1.0-1.5)
}

interface OneEuroState {
  x: number
  y: number
  dx: number
  dy: number
  lastTime: number
}

/**
 * Ring buffer with time-ordered samples
 */
class SampleBuffer {
  private buffer: CursorSample[] = []
  private maxSize: number
  private lastSeq = -1

  constructor(maxSize: number) {
    this.maxSize = maxSize
  }

  push(sample: CursorSample): void {
    // Ignore out-of-order by seq if provided
    if (sample.seq !== undefined && sample.seq <= this.lastSeq) {
      return
    }
    if (sample.seq !== undefined) {
      this.lastSeq = sample.seq
    }

    // Ignore duplicates by time (within 1ms)
    if (this.buffer.length > 0) {
      const last = this.buffer[this.buffer.length - 1]
      if (Math.abs(sample.arriveMs - last.arriveMs) < 1) {
        return
      }
    }

    this.buffer.push(sample)

    // Keep buffer sorted by time
    this.buffer.sort((a, b) => a.arriveMs - b.arriveMs)

    // Prune old samples
    if (this.buffer.length > this.maxSize) {
      this.buffer.shift()
    }
  }

  /**
   * Get samples surrounding a target time
   */
  getSurrounding(targetMs: number): CursorSample[] {
    if (this.buffer.length === 0) return []

    // Find samples before and after target time
    let beforeIdx = -1
    for (let i = this.buffer.length - 1; i >= 0; i--) {
      if (this.buffer[i].arriveMs <= targetMs) {
        beforeIdx = i
        break
      }
    }

    // Return up to 4 samples for Catmull-Rom (2 before, 2 after)
    const samples: CursorSample[] = []
    const startIdx = Math.max(0, beforeIdx - 1)
    const endIdx = Math.min(this.buffer.length - 1, beforeIdx + 2)

    for (let i = startIdx; i <= endIdx; i++) {
      if (i >= 0 && i < this.buffer.length) {
        samples.push(this.buffer[i])
      }
    }

    return samples
  }

  getLatest(): CursorSample | null {
    return this.buffer.length > 0 ? this.buffer[this.buffer.length - 1] : null
  }

  getOldest(): CursorSample | null {
    return this.buffer.length > 0 ? this.buffer[0] : null
  }

  clear(): void {
    this.buffer = []
    this.lastSeq = -1
  }
}

/**
 * One-Euro filter for adaptive smoothing
 * Paper: "1€ Filter: A Simple Speed-based Low-pass Filter for Noisy Input" (Casiez et al. 2012)
 */
class OneEuroFilter {
  private state: OneEuroState | null = null
  private minCutoff: number
  private beta: number
  private dCutoff: number

  constructor(minCutoff: number, beta: number, dCutoff: number) {
    this.minCutoff = minCutoff
    this.beta = beta
    this.dCutoff = dCutoff
  }

  filter(x: number, y: number, timestampMs: number): { x: number; y: number } {
    if (!this.state) {
      this.state = { x, y, dx: 0, dy: 0, lastTime: timestampMs }
      return { x, y }
    }

    const dt = (timestampMs - this.state.lastTime) / 1000 // seconds
    if (dt <= 0) return { x: this.state.x, y: this.state.y }

    // Compute derivatives
    const edx = (x - this.state.x) / dt
    const edy = (y - this.state.y) / dt

    // Filter derivatives
    const alphaDx = this.alpha(dt, this.dCutoff)
    const alphaDy = this.alpha(dt, this.dCutoff)
    const dx = this.state.dx + alphaDx * (edx - this.state.dx)
    const dy = this.state.dy + alphaDy * (edy - this.state.dy)

    // Compute cutoff frequency based on speed
    const speed = Math.sqrt(dx * dx + dy * dy)
    const cutoff = this.minCutoff + this.beta * speed

    // Filter position
    const alphaX = this.alpha(dt, cutoff)
    const alphaY = this.alpha(dt, cutoff)
    const filteredX = this.state.x + alphaX * (x - this.state.x)
    const filteredY = this.state.y + alphaY * (y - this.state.y)

    this.state = { x: filteredX, y: filteredY, dx, dy, lastTime: timestampMs }
    return { x: filteredX, y: filteredY }
  }

  private alpha(dt: number, cutoff: number): number {
    const tau = 1.0 / (2.0 * Math.PI * cutoff)
    return 1.0 / (1.0 + tau / dt)
  }

  reset(): void {
    this.state = null
  }
}

/**
 * Catmull-Rom spline interpolation
 */
function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t
  const t3 = t2 * t
  return 0.5 * (
    2 * p1 +
    (-p0 + p2) * t +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
    (-p0 + 3 * p1 - 3 * p2 + p3) * t3
  )
}

/**
 * Linear interpolation fallback
 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/**
 * Main cursor predictor
 */
export class CursorPredictor {
  private buffer: SampleBuffer
  private filter: OneEuroFilter
  private config: Required<CursorPredictorConfig>
  private lastPosition: { x: number; y: number } | null = null
  private lastVelocity: { x: number; y: number } = { x: 0, y: 0 }

  constructor(config: CursorPredictorConfig = {}) {
    this.config = {
      interpolationDelayMs: config.interpolationDelayMs ?? 100,
      maxExtrapolationMs: config.maxExtrapolationMs ?? 150,
      maxSpeedPxPerSec: config.maxSpeedPxPerSec ?? 5000,
      maxAccelPxPerSec2: config.maxAccelPxPerSec2 ?? 10000,
      bufferSize: config.bufferSize ?? 20,
      oneEuroMinCutoff: config.oneEuroMinCutoff ?? 1.5,
      oneEuroBeta: config.oneEuroBeta ?? 0.007,
      oneEuroDCutoff: config.oneEuroDCutoff ?? 1.0,
    }

    this.buffer = new SampleBuffer(this.config.bufferSize)
    this.filter = new OneEuroFilter(
      this.config.oneEuroMinCutoff,
      this.config.oneEuroBeta,
      this.config.oneEuroDCutoff
    )
  }

  /**
   * Push a new cursor sample (in content space)
   */
  push(sample: CursorSample): void {
    // Round to 0.1px to reduce noise
    const rounded: CursorSample = {
      x: Math.round(sample.x * 10) / 10,
      y: Math.round(sample.y * 10) / 10,
      arriveMs: sample.arriveMs,
      seq: sample.seq,
    }
    this.buffer.push(rounded)
  }

  /**
   * Get predicted position at current time (in content space)
   */
  getPosition(nowMs: number): { x: number; y: number } {
    const latest = this.buffer.getLatest()
    if (!latest) {
      return this.lastPosition ?? { x: 0, y: 0 }
    }

    // Target time for interpolation (render in the past to buffer jitter)
    const targetMs = nowMs - this.config.interpolationDelayMs

    // Time since last sample
    const timeSinceUpdate = nowMs - latest.arriveMs

    let rawX: number
    let rawY: number

    if (timeSinceUpdate > this.config.maxExtrapolationMs) {
      // Too stale, freeze at last known position
      rawX = latest.x
      rawY = latest.y
      this.lastVelocity = { x: 0, y: 0 }
    } else if (targetMs < latest.arriveMs) {
      // Need to extrapolate (dead reckoning)
      const extrapolateMs = latest.arriveMs - targetMs
      const extrapolateSec = extrapolateMs / 1000

      // Clamp velocity
      const speed = Math.sqrt(this.lastVelocity.x ** 2 + this.lastVelocity.y ** 2)
      if (speed > this.config.maxSpeedPxPerSec) {
        const scale = this.config.maxSpeedPxPerSec / speed
        this.lastVelocity.x *= scale
        this.lastVelocity.y *= scale
      }

      rawX = latest.x + this.lastVelocity.x * extrapolateSec
      rawY = latest.y + this.lastVelocity.y * extrapolateSec
    } else {
      // Interpolate from buffer
      const samples = this.buffer.getSurrounding(targetMs)

      if (samples.length === 0) {
        rawX = latest.x
        rawY = latest.y
      } else if (samples.length === 1) {
        rawX = samples[0].x
        rawY = samples[0].y
      } else if (samples.length === 2) {
        // Linear interpolation
        const [s0, s1] = samples
        const t = (targetMs - s0.arriveMs) / (s1.arriveMs - s0.arriveMs)
        rawX = lerp(s0.x, s1.x, Math.max(0, Math.min(1, t)))
        rawY = lerp(s0.y, s1.y, Math.max(0, Math.min(1, t)))
      } else {
        // Catmull-Rom interpolation (4+ points)
        const s1Idx = samples.findIndex(s => s.arriveMs > targetMs) - 1
        if (s1Idx >= 0 && s1Idx < samples.length - 1) {
          const s0 = samples[Math.max(0, s1Idx - 1)]
          const s1 = samples[s1Idx]
          const s2 = samples[s1Idx + 1]
          const s3 = samples[Math.min(samples.length - 1, s1Idx + 2)]

          const t = (targetMs - s1.arriveMs) / (s2.arriveMs - s1.arriveMs)
          rawX = catmullRom(s0.x, s1.x, s2.x, s3.x, Math.max(0, Math.min(1, t)))
          rawY = catmullRom(s0.y, s1.y, s2.y, s3.y, Math.max(0, Math.min(1, t)))
        } else {
          // Fallback to latest
          rawX = latest.x
          rawY = latest.y
        }
      }

      // Update velocity from interpolated position
      if (this.lastPosition) {
        const dt = (nowMs - (this.lastPosition as any).lastTime) / 1000
        if (dt > 0) {
          this.lastVelocity.x = (rawX - this.lastPosition.x) / dt
          this.lastVelocity.y = (rawY - this.lastPosition.y) / dt
        }
      }
    }

    // Apply One-Euro filter to reduce jitter
    const filtered = this.filter.filter(rawX, rawY, nowMs)

    // Cap per-frame movement to avoid oscillations
    if (this.lastPosition) {
      const maxDelta = (this.config.maxSpeedPxPerSec / 60) * 2 // 2 frames worth
      const dx = filtered.x - this.lastPosition.x
      const dy = filtered.y - this.lastPosition.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist > maxDelta) {
        const scale = maxDelta / dist
        filtered.x = this.lastPosition.x + dx * scale
        filtered.y = this.lastPosition.y + dy * scale
      }
    }

    this.lastPosition = { x: filtered.x, y: filtered.y, lastTime: nowMs } as any
    return filtered
  }

  /**
   * Clear all state
   */
  reset(): void {
    this.buffer.clear()
    this.filter.reset()
    this.lastPosition = null
    this.lastVelocity = { x: 0, y: 0 }
  }
}

