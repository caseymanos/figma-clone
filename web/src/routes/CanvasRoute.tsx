import { Suspense, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { ensureCanvasMembership } from '../lib/canvasService'
import { CanvasStage } from '../canvas/CanvasStage'
import { PresenceSidebar } from '../canvas/PresenceSidebar'
import { ProfileSettings } from '../components/ProfileSettings'
import { SessionSettings } from '../components/SessionSettings'
import { AIPanel } from '../components/AIPanel'
import { ColorPalette } from '../components/ColorPalette'
import { Icon } from '../components/icons/Icon'
import { colors, typography, spacing, borderRadius, components, transitions } from '../styles/design-tokens'

export default function CanvasRoute() {
  const navigate = useNavigate()
  const { canvasId } = useParams()
  const [copied, setCopied] = useState(false)
  const [showProfileSettings, setShowProfileSettings] = useState(false)
  const [sessionName, setSessionName] = useState(() => localStorage.getItem('session_name') || '')
  const [sessionColor, setSessionColor] = useState(() => localStorage.getItem('session_color') || '#ef4444')
  const [membershipReady, setMembershipReady] = useState(false)
  
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

  // Ensure user is a member of this canvas before rendering
  useEffect(() => {
    if (!canvasId) {
      navigate('/')
      return
    }
    
    ensureCanvasMembership(canvasId)
      .then(() => setMembershipReady(true))
      .catch((err) => {
        console.error('Failed to join canvas:', err)
        alert('Unable to access this canvas. It may not exist or you may not have permission.')
        navigate('/')
      })
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
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: colors.chrome.canvas }}>
        <header style={{
          height: components.header.height,
          padding: components.header.padding,
          display: 'flex',
          alignItems: 'center',
          gap: spacing[2],
          background: colors.chrome.header,
          borderBottom: `1px solid ${colors.gray[800]}`,
          color: colors.text.inverse,
          fontFamily: typography.fontFamily.base,
        }}>
          <button
            onClick={() => navigate('/')}
            onMouseEnter={(e) => e.currentTarget.style.background = colors.gray[800]}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            style={{
              height: '32px',
              padding: '0 12px',
              borderRadius: borderRadius.base,
              border: 'none',
              background: 'transparent',
              color: colors.text.inverse,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: spacing[1],
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
              transition: transitions.colors,
            }}
          >
            <Icon name="chevronLeft" size={14} color={colors.text.inverse} />
            Home
          </button>

          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: spacing[2],
            paddingLeft: spacing[2],
          }}>
            <div style={{
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
              color: colors.text.inverse,
              maxWidth: '300px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {canvasId?.split('-')[0] || 'Untitled'}
            </div>

            <button
              onClick={copyToClipboard}
              onMouseEnter={(e) => e.currentTarget.style.background = copied ? colors.status.online : colors.primary[700]}
              onMouseLeave={(e) => e.currentTarget.style.background = copied ? colors.status.online : colors.primary[600]}
              style={{
                height: '28px',
                padding: '0 12px',
                borderRadius: borderRadius.base,
                border: 'none',
                background: copied ? colors.status.online : colors.primary[600],
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: spacing[1],
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.medium,
                transition: transitions.colors,
              }}
            >
              <Icon name={copied ? 'check' : 'link'} size={14} color="white" />
              {copied ? 'Copied' : 'Share'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: spacing[1], alignItems: 'center' }}>
            <SessionSettings
              onSettingsChange={handleSessionSettingsChange}
              currentName={sessionName}
              currentColor={sessionColor}
            />

            <button
              onClick={() => setShowProfileSettings(true)}
              onMouseEnter={(e) => e.currentTarget.style.background = colors.gray[800]}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              title="Profile Settings"
              style={{
                width: '32px',
                height: '32px',
                padding: 0,
                borderRadius: borderRadius.base,
                border: 'none',
                background: 'transparent',
                color: colors.text.inverse,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: transitions.colors,
              }}
            >
              <Icon name="user" size={16} color={colors.text.inverse} />
            </button>

            <button
              onClick={() => supabase.auth.signOut()}
              onMouseEnter={(e) => e.currentTarget.style.background = colors.gray[800]}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              title="Sign Out"
              style={{
                width: '32px',
                height: '32px',
                padding: 0,
                borderRadius: borderRadius.base,
                border: 'none',
                background: 'transparent',
                color: colors.text.inverse,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: transitions.colors,
              }}
            >
              <Icon name="logout" size={16} color={colors.text.inverse} />
            </button>
          </div>
        </header>
            <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
              {canvasId && membershipReady ? <CanvasStage canvasId={canvasId} selectedColor={selectedColorHex} /> : null}
              {canvasId && membershipReady ? <PresenceSidebar /> : null}
              {canvasId && membershipReady && showAI ? (
                <>
                  <AIPanel canvasId={canvasId} selectedColorName={selectedColorName} />
                  <ColorPalette
                    selectedColor={selectedColorHex}
                    onColorSelect={handleColorSelect}
                  />
                </>
              ) : null}
              {!membershipReady && canvasId && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  color: colors.text.primary,
                  fontSize: typography.fontSize.base,
                }}>
                  Loading canvas...
                </div>
              )}
            </div>
        {showProfileSettings && (
          <ProfileSettings onClose={() => setShowProfileSettings(false)} />
        )}
      </div>
    </Suspense>
  )
}

