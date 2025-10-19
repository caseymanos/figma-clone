import { useEffect } from 'react'
import type { CSSProperties } from 'react'
import { colors, typography, spacing, borderRadius, shadows, transitions } from '../styles/design-tokens'

export type PresenceStyleVariant = 'compact-stack' | 'modern-cards' | 'minimal-bar' | 'dropdown-panel'

const STYLE_NAMES: Record<PresenceStyleVariant, string> = {
  'compact-stack': 'Compact Stack',
  'modern-cards': 'Modern Cards',
  'minimal-bar': 'Minimal Bar',
  'dropdown-panel': 'Dropdown Panel'
}

const STYLE_ORDER: PresenceStyleVariant[] = [
  'compact-stack',
  'modern-cards',
  'minimal-bar',
  'dropdown-panel'
]

interface StyleTestToggleProps {
  currentStyle: PresenceStyleVariant
  onStyleChange: (style: PresenceStyleVariant) => void
}

export function StyleTestToggle({ currentStyle, onStyleChange }: StyleTestToggleProps) {
  // Keyboard shortcut: Shift+P to cycle through styles
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'P') {
        e.preventDefault()
        const currentIndex = STYLE_ORDER.indexOf(currentStyle)
        const nextIndex = (currentIndex + 1) % STYLE_ORDER.length
        onStyleChange(STYLE_ORDER[nextIndex])
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentStyle, onStyleChange])

  const handleCycle = () => {
    const currentIndex = STYLE_ORDER.indexOf(currentStyle)
    const nextIndex = (currentIndex + 1) % STYLE_ORDER.length
    onStyleChange(STYLE_ORDER[nextIndex])
  }

  const containerStyle: CSSProperties = {
    position: 'fixed',
    bottom: spacing[4],
    left: spacing[4],
    background: 'white',
    border: `1px solid ${colors.border.base}`,
    borderRadius: borderRadius.md,
    boxShadow: shadows.lg,
    padding: spacing[3],
    zIndex: 400,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[2],
    minWidth: 200
  }

  const labelStyle: CSSProperties = {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  }

  const currentStyleStyle: CSSProperties = {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing[1]
  }

  const buttonStyle: CSSProperties = {
    padding: `${spacing[2]} ${spacing[3]}`,
    background: colors.primary[600],
    color: 'white',
    border: 'none',
    borderRadius: borderRadius.base,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    cursor: 'pointer',
    transition: transitions.all,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2]
  }

  const shortcutStyle: CSSProperties = {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing[1]
  }

  const kbdStyle: CSSProperties = {
    background: colors.gray[100],
    padding: '2px 6px',
    borderRadius: borderRadius.sm,
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.mono,
    border: `1px solid ${colors.border.base}`
  }

  return (
    <div style={containerStyle}>
      <div style={labelStyle}>Presence UI Style</div>
      <div style={currentStyleStyle}>{STYLE_NAMES[currentStyle]}</div>

      <button
        style={buttonStyle}
        onClick={handleCycle}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = colors.primary[700]
          e.currentTarget.style.transform = 'translateY(-1px)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = colors.primary[600]
          e.currentTarget.style.transform = 'translateY(0)'
        }}
      >
        <span>Switch Style</span>
        <span>→</span>
      </button>

      <div style={shortcutStyle}>
        Press <span style={kbdStyle}>Shift+P</span> to cycle
      </div>

      <div style={{
        fontSize: typography.fontSize.xs,
        color: colors.text.tertiary,
        paddingTop: spacing[2],
        borderTop: `1px solid ${colors.border.base}`,
        marginTop: spacing[1]
      }}>
        {STYLE_ORDER.indexOf(currentStyle) + 1} of {STYLE_ORDER.length}
      </div>
    </div>
  )
}
