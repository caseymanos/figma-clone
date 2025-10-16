// Pluggable provider adapter. Initial version is a stub that maps simple
// structured prompts to tool calls without external network calls.

export type ParsedIntent =
  | { kind: 'create'; type: 'rect' | 'circle' | 'text'; x?: number; y?: number; width?: number; height?: number; color?: string; text?: string }
  | { kind: 'move'; id: string; x: number; y: number }
  | { kind: 'resize'; id: string; width: number; height: number }
  | { kind: 'rotate'; id: string; degrees: number }
  | { kind: 'layout-row'; ids?: string[]; spacing?: number }
  | { kind: 'layout-grid'; ids?: string[]; rows: number; cols: number; gap?: number }
  | { kind: 'distribute'; ids?: string[]; axis: 'x' | 'y'; spacing?: number }
  | { kind: 'pattern-login'; }

export interface Provider {
  parse(prompt: string): Promise<ParsedIntent>
}

function extractNumbers(s: string): number[] {
  return (s.match(/-?\d+/g) || []).map((v) => parseInt(v, 10))
}

function extractColorHex(s: string): string | undefined {
  const m = s.match(/#([0-9a-fA-F]{6})/)
  return m ? `#${m[1]}` : undefined
}

export const provider: Provider = {
  async parse(prompt: string): Promise<ParsedIntent> {
    const p = prompt.trim().toLowerCase()
    // naive patterns for initial version
    if (p.startsWith('create') || p.startsWith('add') || p.startsWith('make')) {
      const color = extractColorHex(p)
      const nums = extractNumbers(p)
      const hasText = p.includes('text') || p.includes('label')
      if (p.includes('circle')) return { kind: 'create', type: 'circle', x: nums[0], y: nums[1], width: nums[2], height: nums[2], color }
      if (hasText) return { kind: 'create', type: 'text', x: nums[0], y: nums[1], text: prompt.replace(/^[^']*'([^']+)'?.*$/s, '$1') }
      return { kind: 'create', type: 'rect', x: nums[0], y: nums[1], width: nums[2], height: nums[3], color }
    }
    if (p.startsWith('move')) {
      const nums = extractNumbers(p)
      return { kind: 'move', id: String(nums[0]), x: nums[1], y: nums[2] }
    }
    if (p.startsWith('resize')) {
      const nums = extractNumbers(p)
      return { kind: 'resize', id: String(nums[0]), width: nums[1], height: nums[2] }
    }
    if (p.startsWith('rotate')) {
      const nums = extractNumbers(p)
      return { kind: 'rotate', id: String(nums[0]), degrees: nums[1] }
    }
    if (p.includes('arrange') && p.includes('row')) {
      const nums = extractNumbers(p)
      return { kind: 'layout-row', spacing: nums[0] }
    }
    if (p.includes('grid')) {
      const nums = extractNumbers(p)
      const rows = nums[0] ?? 3
      const cols = nums[1] ?? 3
      const gap = nums[2]
      return { kind: 'layout-grid', rows, cols, gap }
    }
    if (p.includes('distribute')) {
      const axis: 'x' | 'y' = p.includes('vertical') ? 'y' : 'x'
      const nums = extractNumbers(p)
      return { kind: 'distribute', axis, spacing: nums[0] }
    }
    if (p.includes('login form')) {
      return { kind: 'pattern-login' }
    }
    // default: create rect at random-ish
    return { kind: 'create', type: 'rect' }
  },
}


