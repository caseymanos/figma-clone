import { Suspense, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { CanvasStage } from '../canvas/CanvasStage'

export default function CanvasRoute() {
  const navigate = useNavigate()
  const { canvasId } = useParams()

  useEffect(() => {
    if (!canvasId) navigate('/')
  }, [canvasId, navigate])

  return (
    <Suspense fallback={null}>
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <header style={{ padding: 8, display: 'flex', gap: 8, alignItems: 'center', borderBottom: '1px solid #eee' }}>
          <strong>Canvas</strong> <span style={{ opacity: 0.6 }}>{canvasId}</span>
          <div style={{ marginLeft: 'auto' }}>
            <button onClick={() => supabase.auth.signOut()}>Sign out</button>
          </div>
        </header>
        <div style={{ flex: 1, minHeight: 0 }}>
          {canvasId ? <CanvasStage canvasId={canvasId} /> : null}
        </div>
      </div>
    </Suspense>
  )
}

