import { Suspense, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { CanvasStage } from '../canvas/CanvasStage'

export default function CanvasRoute() {
  const navigate = useNavigate()
  const { canvasId } = useParams()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!canvasId) navigate('/')
  }, [canvasId, navigate])

  const copyToClipboard = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <Suspense fallback={null}>
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <header style={{ padding: 8, display: 'flex', gap: 8, alignItems: 'center', borderBottom: '1px solid #eee', background: '#fafafa' }}>
          <button 
            onClick={() => navigate('/')}
            style={{ padding: '6px 12px', borderRadius: 4, border: '1px solid #ddd', background: 'white', cursor: 'pointer' }}
          >
            ← Home
          </button>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
            <strong>Canvas:</strong>
            <code style={{ 
              padding: '4px 8px', 
              background: '#f0f0f0', 
              borderRadius: 4, 
              fontSize: '12px',
              maxWidth: '200px',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {canvasId}
            </code>
            <button 
              onClick={copyToClipboard}
              style={{ 
                padding: '6px 12px', 
                borderRadius: 4, 
                border: '1px solid #4f46e5', 
                background: copied ? '#10b981' : '#4f46e5',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {copied ? '✓ Copied!' : '📋 Copy Share Link'}
            </button>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <button 
              onClick={() => supabase.auth.signOut()}
              style={{ padding: '6px 12px', borderRadius: 4, border: '1px solid #ddd', background: 'white', cursor: 'pointer' }}
            >
              Sign out
            </button>
          </div>
        </header>
        <div style={{ flex: 1, minHeight: 0 }}>
          {canvasId ? <CanvasStage canvasId={canvasId} /> : null}
        </div>
      </div>
    </Suspense>
  )
}

