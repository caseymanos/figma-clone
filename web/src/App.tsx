import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './App.css'
import { createCanvasWithMembership, getCanvasIdByShareCode } from './lib/canvasService'
import { supabase } from './lib/supabaseClient'

function App() {
  const navigate = useNavigate()
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [joining, setJoining] = useState(false)

  const createCanvas = async () => {
    setLoading(true)
    try {
      const id = await createCanvasWithMembership('Untitled')
      navigate(`/c/${id}`)
    } catch {
      alert('Failed to create canvas')
    } finally {
      setLoading(false)
    }
  }

  const joinCanvas = async () => {
    const trimmedCode = joinCode.trim()
    if (!trimmedCode) {
      alert('Please enter a share code')
      return
    }

    // Validate 8-digit format
    if (!/^\d{8}$/.test(trimmedCode)) {
      alert('Share code must be exactly 8 digits')
      return
    }

    setJoining(true)
    try {
      const code = parseInt(trimmedCode, 10)
      const canvasId = await getCanvasIdByShareCode(code)
      
      if (!canvasId) {
        alert('Invalid share code. Please check the code and try again.')
        return
      }

      navigate(`/c/${canvasId}`)
    } catch {
      alert('Failed to join canvas')
    } finally {
      setJoining(false)
    }
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
          <h2 style={{ fontSize: '20px', marginBottom: '12px' }}>Join Canvas</h2>
          <p style={{ color: '#666', marginBottom: '16px' }}>Enter an 8-digit share code</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              placeholder="12345678"
              value={joinCode}
              onChange={(e) => {
                // Only allow digits and limit to 8 characters
                const value = e.target.value.replace(/\D/g, '').slice(0, 8)
                setJoinCode(value)
              }}
              maxLength={8}
              onKeyDown={(e) => e.key === 'Enter' && joinCanvas()}
              style={{ 
                flex: 1,
                padding: '12px 16px', 
                borderRadius: 6, 
                border: '1px solid #ddd',
                fontSize: '18px',
                fontFamily: 'monospace',
                letterSpacing: '0.15em',
                textAlign: 'center'
              }}
            />
            <button 
              onClick={joinCanvas}
              disabled={joining || joinCode.length !== 8}
              style={{ 
                padding: '12px 24px', 
                borderRadius: 6, 
                border: 'none', 
                background: (joining || joinCode.length !== 8) ? '#9ca3af' : '#4f46e5',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                cursor: (joining || joinCode.length !== 8) ? 'not-allowed' : 'pointer',
                opacity: (joining || joinCode.length !== 8) ? 0.6 : 1
              }}
            >
              {joining ? 'Joining...' : 'Join →'}
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
