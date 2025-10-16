// Simple in-memory idempotency cache for short windows
// Used to avoid duplicate AI-triggered operations within a brief TTL

type EpochMs = number

interface OperationEntry {
  lastSeenAtMs: EpochMs
}

export interface IdempotencyOptions {
  ttlMs?: number
  maxEntries?: number
}

const DEFAULT_TTL_MS = 5000
const DEFAULT_MAX_ENTRIES = 500

export class IdempotencyCache {
  private readonly entries: Map<string, OperationEntry>
  private readonly ttlMs: number
  private readonly maxEntries: number

  constructor(options?: IdempotencyOptions) {
    this.entries = new Map()
    this.ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS
    this.maxEntries = options?.maxEntries ?? DEFAULT_MAX_ENTRIES
  }

  public isDuplicate(key: string): boolean {
    const now = Date.now()
    const existing = this.entries.get(key)
    if (!existing) return false
    const expired = now - existing.lastSeenAtMs > this.ttlMs
    if (expired) {
      this.entries.delete(key)
      return false
    }
    return true
  }

  public remember(key: string): void {
    const now = Date.now()
    this.entries.set(key, { lastSeenAtMs: now })
    // Basic eviction when exceeding capacity
    if (this.entries.size > this.maxEntries) {
      const cutoff = now - this.ttlMs
      for (const [k, v] of this.entries) {
        if (v.lastSeenAtMs < cutoff) this.entries.delete(k)
        if (this.entries.size <= this.maxEntries) break
      }
      // If still over capacity, drop oldest entries
      if (this.entries.size > this.maxEntries) {
        const keys = Array.from(this.entries.entries()).sort((a, b) => a[1].lastSeenAtMs - b[1].lastSeenAtMs)
        const toDelete = this.entries.size - this.maxEntries
        for (let i = 0; i < toDelete; i++) this.entries.delete(keys[i][0])
      }
    }
  }
}

// Global cache instance suitable for a single browser tab/session
export const globalIdempotencyCache = new IdempotencyCache()

export function buildOperationKey(parts: Record<string, unknown>): string {
  // Stable stringify by sorting keys
  const sortedEntries = Object.entries(parts).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  return sortedEntries
    .map(([k, v]) => `${k}=${typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
    .join('|')
}


