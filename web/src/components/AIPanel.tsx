import { useState } from 'react'
import type { CSSProperties } from 'react'
import { runAgent } from '../ai/agent'
import { useSelection } from '../canvas/selection'

export function AIPanel({ canvasId, selectedColorName }: { canvasId: string; selectedColorName?: string }) {
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
      // Include selected color in prompt for AI context
      const enhancedPrompt = selectedColorName 
        ? `${prompt} (Current color: ${selectedColorName})`
        : prompt
      
      const res = await runAgent(enhancedPrompt, { canvasId, selectedIds })
      setSteps(res.steps)
    } catch (e: any) {
      setSteps([{ description: 'Agent failed', status: 'error', error: e?.message || String(e) }])
    } finally {
      setRunning(false)
    }
  }

  const panelStyle: CSSProperties = {
    position: 'fixed',
    bottom: 16,
    left: 16,
    width: 380,
    maxWidth: 'calc(100vw - 32px)',
    background: 'white',
    border: '2px solid #4f46e5',
    borderRadius: 12,
    boxShadow: '0 10px 40px rgba(79, 70, 229, 0.15)',
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    zIndex: 200
  }

  return (
    <div style={panelStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 18 }}>🤖</span>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#4f46e5' }}>AI Canvas Assistant</h3>
      </div>
      
      {selectedColorName && (
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8, padding: '6px 10px', background: '#f3f4f6', borderRadius: 4 }}>
          Current color: <span style={{ fontWeight: 600, color: '#1f2937' }}>{selectedColorName}</span>
        </div>
      )}
      
      <form onSubmit={onSubmit} style={{ display: 'flex', gap: 8 }}>
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., 'create 3 circles' or 'arrange in a row'"
          style={{ 
            flex: 1, 
            padding: '10px 12px', 
            border: '1px solid #d1d5db', 
            borderRadius: 8,
            fontSize: 14,
            outline: 'none',
            transition: 'border-color 0.2s'
          }}
          onFocus={(e) => e.target.style.borderColor = '#4f46e5'}
          onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
        />
        <button 
          disabled={running} 
          type="submit" 
          style={{ 
            padding: '10px 16px', 
            borderRadius: 8, 
            border: 'none', 
            background: running ? '#9ca3af' : '#4f46e5', 
            color: 'white', 
            cursor: running ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            fontSize: 14,
            transition: 'background 0.2s'
          }}
        >
          {running ? '⏳ Running' : '✨ Run'}
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


