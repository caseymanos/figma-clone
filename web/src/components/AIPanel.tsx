import { useState } from 'react'
import type { CSSProperties } from 'react'
import { runAgent } from '../ai/agent'
import { useSelection } from '../canvas/selection'
import { useUIState } from '../canvas/uiState'
import { useDraggable } from '../canvas/useDraggable'
import { getSnapPositionStyle, getSnapPreviewStyle } from '../canvas/snapPositions'

export function AIPanel({ canvasId, selectedColorName }: { canvasId: string; selectedColorName?: string }) {
  const [prompt, setPrompt] = useState('')
  const [running, setRunning] = useState(false)
  const [steps, setSteps] = useState<{ description: string; status: string; error?: string }[]>([])
  const selectedIds = useSelection((s) => s.selectedIds)

  const minimized = useUIState((s) => s.aiPanelMinimized)
  const position = useUIState((s) => s.aiPanelPosition)
  const setMinimized = useUIState((s) => s.setAIPanelMinimized)
  const setPosition = useUIState((s) => s.setAIPanelPosition)
  const getAllPanelPositions = useUIState((s) => s.getAllPanelPositions)
  const swapPanelPositions = useUIState((s) => s.swapPanelPositions)

  const { isDragging, onMouseDown, dragStyle, previewPosition } = useDraggable({
    currentPosition: position,
    onPositionChange: setPosition,
    panelId: 'aiPanel',
    occupiedPositions: getAllPanelPositions(),
    onSwapPositions: swapPanelPositions,
  })

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

  const positionStyle = getSnapPositionStyle(position)

  const panelStyle: CSSProperties = {
    ...positionStyle,
    position: 'fixed',
    width: 340,
    maxWidth: 'calc(100vw - 32px)',
    background: 'white',
    border: '2px solid #4f46e5',
    borderRadius: 8,
    boxShadow: '0 10px 40px rgba(79, 70, 229, 0.15)',
    padding: minimized ? 8 : 12,
    display: 'flex',
    flexDirection: 'column',
    gap: minimized ? 0 : 8,
    zIndex: 200,
    transition: isDragging ? 'none' : 'all 0.2s ease',
    ...dragStyle,
  }

  const minimizeButtonStyle: CSSProperties = {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: 4,
    borderRadius: 4,
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 'auto',
  }

  if (minimized) {
    return (
      <>
        <div style={panelStyle} onMouseDown={onMouseDown}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: isDragging ? 'grabbing' : 'grab',
            }}
            onClick={() => !isDragging && setMinimized(false)}
          >
            <span style={{ fontSize: 16 }}>🤖</span>
            <h3 style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#4f46e5' }}>AI Assistant</h3>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setMinimized(false)
              }}
              style={minimizeButtonStyle}
              title="Maximize"
            >
              ▲
            </button>
          </div>
        </div>
        {previewPosition && <div style={getSnapPreviewStyle(previewPosition)} />}
      </>
    )
  }

  return (
    <>
      <div style={panelStyle} onMouseDown={onMouseDown}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 16 }}>🤖</span>
          <h3 style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#4f46e5' }}>AI Canvas Assistant</h3>
          <button
            onClick={() => setMinimized(true)}
            style={minimizeButtonStyle}
            title="Minimize"
          >
            ▼
          </button>
        </div>

      {selectedColorName && (
        <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6, padding: '4px 8px', background: '#f3f4f6', borderRadius: 4 }}>
          Current color: <span style={{ fontWeight: 600, color: '#1f2937' }}>{selectedColorName}</span>
        </div>
      )}

      <form onSubmit={onSubmit} style={{ display: 'flex', gap: 6 }}>
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., 'create 3 circles' or 'arrange in a row'"
          style={{
            flex: 1,
            padding: '8px 10px',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            fontSize: 12,
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
            padding: '8px 14px',
            borderRadius: 6,
            border: 'none',
            background: running ? '#9ca3af' : '#4f46e5',
            color: 'white',
            cursor: running ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            fontSize: 12,
            transition: 'background 0.2s'
          }}
        >
          {running ? '⏳' : '✨'} Run
        </button>
      </form>
      {steps.length > 0 && (
        <div style={{ fontSize: 11, color: '#374151', marginTop: 4 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0' }}>
              <span>{s.status === 'success' ? '✅' : s.status === 'error' ? '❌' : '⏳'}</span>
              <span>{s.description}{s.error ? ` — ${s.error}` : ''}</span>
            </div>
          ))}
        </div>
      )}
      </div>
      {previewPosition && <div style={getSnapPreviewStyle(previewPosition)} />}
    </>
  )
}


