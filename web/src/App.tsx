import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './App.css'
import { createCanvasWithMembership } from './lib/canvasService'
import { supabase } from './lib/supabaseClient'

function App() {
  const navigate = useNavigate()
  const [joinId, setJoinId] = useState('')
  const [loading, setLoading] = useState(false)

  const createCanvas = async () => {
    setLoading(true)
    try {
      const id = await createCanvasWithMembership('Untitled')
      navigate(`/c/${id}`)
    } catch (error) {
      alert('Failed to create canvas')
    } finally {
      setLoading(false)
    }
  }

  const joinCanvas = () => {
    if (!joinId.trim()) {
      alert('Please enter a canvas ID')
      return
    }
    navigate(`/c/${joinId.trim()}`)
  }

  return (
    <div style={{ maxWidth: 600, margin: '80px auto', padding: 24 }}>
      <h1 style={{ fontSize: '48px', marginBottom: '8px' }}>CollabCanvas</h1>
      <p style={{ color: '#666', marginBottom: '48px' }}>Real-time collaborative design canvas</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {/* Create new canvas */}
        <div style={{ 
          padding: 24, 
          border: '2px solid #4f46e5', 
          borderRadius: 8,
          background: '#fafafa'
        }}>
          <h2 style={{ fontSize: '20px', marginBottom: '12px' }}>Create New Canvas</h2>
          <p style={{ color: '#666', marginBottom: '16px' }}>Start a new collaborative session</p>
          <button 
            onClick={createCanvas}
            disabled={loading}
            style={{ 
              padding: '12px 24px', 
              borderRadius: 6, 
              border: 'none', 
              background: '#4f46e5',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Creating...' : '+ Create Canvas'}
          </button>
        </div>

        {/* Join existing canvas */}
        <div style={{ 
          padding: 24, 
          border: '2px solid #ddd', 
          borderRadius: 8,
          background: '#fafafa'
        }}>
          <h2 style={{ fontSize: '20px', marginBottom: '12px' }}>Join Existing Canvas</h2>
          <p style={{ color: '#666', marginBottom: '16px' }}>Enter a canvas ID to collaborate</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              placeholder="Paste canvas ID or URL"
              value={joinId}
              onChange={(e) => {
                // Extract ID from full URL if pasted
                const val = e.target.value
                const match = val.match(/\/c\/([a-f0-9-]+)/)
                setJoinId(match ? match[1] : val)
              }}
              onKeyDown={(e) => e.key === 'Enter' && joinCanvas()}
              style={{ 
                flex: 1,
                padding: '12px 16px', 
                borderRadius: 6, 
                border: '1px solid #ddd',
                fontSize: '14px',
                fontFamily: 'monospace'
              }}
            />
            <button 
              onClick={joinCanvas}
              style={{ 
                padding: '12px 24px', 
                borderRadius: 6, 
                border: '1px solid #ddd', 
                background: 'white',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Join →
            </button>
          </div>
        </div>

        {/* Sign out */}
        <div style={{ textAlign: 'center' }}>
          <button 
            onClick={() => supabase.auth.signOut()}
            style={{ 
              padding: '8px 16px',
              border: '1px solid #ddd',
              borderRadius: 6,
              background: 'white',
              color: '#666',
              cursor: 'pointer'
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
