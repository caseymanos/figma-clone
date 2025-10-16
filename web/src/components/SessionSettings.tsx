import { useState, useEffect } from 'react'
import type { CSSProperties } from 'react'

interface SessionSettingsProps {
  onSettingsChange: (name: string, color: string) => void
  currentName: string
  currentColor: string
}

const PRESET_COLORS = [
  { name: 'Red', value: '#ef4444' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#10b981' },
  { name: 'Orange', value: '#f59e0b' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Amber', value: '#f97316' },
]

export function SessionSettings({ onSettingsChange, currentName, currentColor }: SessionSettingsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState(currentName)
  const [color, setColor] = useState(currentColor)
  const [customColor, setCustomColor] = useState(currentColor)

  useEffect(() => {
    setName(currentName)
    setColor(currentColor)
    setCustomColor(currentColor)
  }, [currentName, currentColor])

  const handleSave = () => {
    const finalColor = color === 'custom' ? customColor : color
    localStorage.setItem('session_name', name)
    localStorage.setItem('session_color', finalColor)
    onSettingsChange(name, finalColor)
    setIsOpen(false)
  }

  const overlayStyle: CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1001,
    backdropFilter: 'blur(2px)'
  }

  const modalStyle: CSSProperties = {
    background: 'white',
    borderRadius: 12,
    padding: 24,
    maxWidth: 400,
    width: '90%',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
  }

  const previewStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 12px',
    borderRadius: 20,
    background: '#f9fafb',
    border: '1px solid #e5e7eb'
  }

  const colorDotStyle: CSSProperties = {
    width: 16,
    height: 16,
    borderRadius: '50%',
    background: color === 'custom' ? customColor : color,
    border: '2px solid white',
    boxShadow: '0 0 4px rgba(0,0,0,0.2)'
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        style={{
          padding: '6px 12px',
          borderRadius: 4,
          border: '1px solid #ddd',
          background: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}
        title="Customize your cursor name and color for this tab"
      >
        <span style={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          background: currentColor,
          display: 'inline-block'
        }} />
        Session
      </button>

      {isOpen && (
        <div style={overlayStyle} onClick={() => setIsOpen(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 600 }}>
              Session Settings
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: 14, color: '#6b7280' }}>
              Customize your cursor name and color for this browser tab only
            </p>

            {/* Name Input */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 8 }}>
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter a name for this session"
                maxLength={30}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 6,
                  border: '1px solid #e5e7eb',
                  fontSize: 14,
                  boxSizing: 'border-box'
                }}
              />
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                This helps identify different tabs/browsers
              </div>
            </div>

            {/* Color Picker */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 8 }}>
                Cursor Color
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
                {PRESET_COLORS.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => setColor(preset.value)}
                    style={{
                      padding: 12,
                      borderRadius: 6,
                      border: color === preset.value ? `2px solid ${preset.value}` : '1px solid #e5e7eb',
                      background: color === preset.value ? '#f9fafb' : 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 13
                    }}
                  >
                    <span style={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      background: preset.value,
                      border: '2px solid white',
                      boxShadow: '0 0 4px rgba(0,0,0,0.2)'
                    }} />
                    {preset.name}
                  </button>
                ))}
              </div>

              {/* Custom Color */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => {
                    setCustomColor(e.target.value)
                    setColor('custom')
                  }}
                  style={{
                    width: 60,
                    height: 40,
                    borderRadius: 6,
                    border: '1px solid #e5e7eb',
                    cursor: 'pointer'
                  }}
                />
                <span style={{ fontSize: 14, color: '#6b7280' }}>Custom color</span>
              </div>
            </div>

            {/* Preview */}
            <div style={{ marginBottom: 20, padding: 16, background: '#f9fafb', borderRadius: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8, color: '#6b7280' }}>
                Preview
              </div>
              <div style={previewStyle}>
                <div style={colorDotStyle} />
                <span style={{ fontSize: 14, fontWeight: 500 }}>
                  {name || 'Enter a name'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: 6,
                  border: '1px solid #e5e7eb',
                  background: 'white',
                  cursor: 'pointer',
                  fontSize: 14
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!name.trim()}
                style={{
                  padding: '10px 20px',
                  borderRadius: 6,
                  border: 'none',
                  background: name.trim() ? '#4f46e5' : '#d1d5db',
                  color: 'white',
                  cursor: name.trim() ? 'pointer' : 'not-allowed',
                  fontSize: 14,
                  fontWeight: 500
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

