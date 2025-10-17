import { Suspense, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { CanvasStage } from '../canvas/CanvasStage'
import { PresenceSidebar } from '../canvas/PresenceSidebar'
import { ProfileSettings } from '../components/ProfileSettings'
import { SessionSettings } from '../components/SessionSettings'
import { AIPanel } from '../components/AIPanel'
import { ColorPalette } from '../components/ColorPalette'

export default function CanvasRoute() {
  const navigate = useNavigate()
  const { canvasId } = useParams()
  const [copied, setCopied] = useState(false)
  const [showProfileSettings, setShowProfileSettings] = useState(false)
  const [sessionName, setSessionName] = useState(() => localStorage.getItem('session_name') || '')
  const [sessionColor, setSessionColor] = useState(() => localStorage.getItem('session_color') || '#ef4444')
  
  // Color palette state
  const [selectedColorName, setSelectedColorName] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('canvasSelectedColor')
      return saved ? JSON.parse(saved).colorName : 'indigo'
    } catch {
      return 'indigo'
    }
  })
  const [selectedColorHex, setSelectedColorHex] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('canvasSelectedColor')
      return saved ? JSON.parse(saved).colorHex : '#4f46e5'
    } catch {
      return '#4f46e5'
    }
  })
  
  const showAI = true

  useEffect(() => {
    if (!canvasId) navigate('/')
  }, [canvasId, navigate])

  const handleColorSelect = (colorName: string, colorHex: string) => {
    setSelectedColorName(colorName)
    setSelectedColorHex(colorHex)
    localStorage.setItem('canvasSelectedColor', JSON.stringify({ colorName, colorHex }))
  }

  const copyToClipboard = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleSessionSettingsChange = (name: string, color: string) => {
    setSessionName(name)
    setSessionColor(color)
    // No force re-render - CanvasStage will handle updates internally
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
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <SessionSettings
              onSettingsChange={handleSessionSettingsChange}
              currentName={sessionName}
              currentColor={sessionColor}
            />
            <button 
              onClick={() => setShowProfileSettings(true)}
              style={{ 
                padding: '6px 12px', 
                borderRadius: 4, 
                border: '1px solid #ddd', 
                background: 'white', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              👤 Profile
            </button>
            <button 
              onClick={() => supabase.auth.signOut()}
              style={{ padding: '6px 12px', borderRadius: 4, border: '1px solid #ddd', background: 'white', cursor: 'pointer' }}
            >
              Sign out
            </button>
          </div>
        </header>
            <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
              {canvasId ? <CanvasStage canvasId={canvasId} /> : null}
              {canvasId ? <PresenceSidebar /> : null}
              {canvasId && showAI ? (
                <div style={{ position: 'fixed', bottom: 16, left: 16, width: 380, maxWidth: 'calc(100vw - 32px)', display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <AIPanel canvasId={canvasId} selectedColorName={selectedColorName} />
                  <ColorPalette 
                    selectedColor={selectedColorHex} 
                    onColorSelect={handleColorSelect}
                  />
                </div>
              ) : null}
            </div>
        {showProfileSettings && (
          <ProfileSettings onClose={() => setShowProfileSettings(false)} />
        )}
      </div>
    </Suspense>
  )
}

