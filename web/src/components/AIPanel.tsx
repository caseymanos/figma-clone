import { useState } from 'react'
import type { CSSProperties } from 'react'
import { runAgent } from '../ai/agent'
import { useSelection } from '../canvas/selection'

export function AIPanel({ canvasId }: { canvasId: string }) {
  const [prompt, setPrompt] = useState('')
  const [running, setRunning] = useState(false)
  const [steps, setSteps] = useState<{ description: string; status: string; error?: string }[]>([])
  const selectedIds = useSelection((s) => s.selectedIds)

  const onSubmit = async (e: any) => {
    e.preventDefault()
    if (!prompt.trim()) return
    setRunning(true)
    setSteps([])
    try {
      const res = await runAgent(prompt, { canvasId, selectedIds })
      setSteps(res.steps)
    } catch (e: any) {
      setSteps([{ description: 'Agent failed', status: 'error', error: e?.message || String(e) }])
    } finally {
      setRunning(false)
    }
  }

  const panelStyle: CSSProperties = {
    position: 'absolute',
    bottom: 12,
    left: 12,
    width: 360,
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
    padding: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    zIndex: 150
  }

  return (
    <div style={panelStyle}>
      <form onSubmit={onSubmit} style={{ display: 'flex', gap: 8 }}>
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask AI to create, move, layout…"
          style={{ flex: 1, padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 6 }}
        />
        <button disabled={running} type="submit" style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #4f46e5', background: '#4f46e5', color: 'white', cursor: running ? 'not-allowed' : 'pointer' }}>
          {running ? 'Running…' : 'Run'}
        </button>
      </form>
      {steps.length > 0 && (
        <div style={{ fontSize: 12, color: '#374151' }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0' }}>
              <span>{s.status === 'success' ? '✅' : s.status === 'error' ? '❌' : '⏳'}</span>
              <span>{s.description}{s.error ? ` — ${s.error}` : ''}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


