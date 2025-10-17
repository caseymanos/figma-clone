import type { CSSProperties } from 'react'

const CANVAS_COLORS = {
  indigo: '#4f46e5',
  purple: '#7c3aed',
  red: '#ef4444',
  orange: '#f97316',
  yellow: '#eab308',
  green: '#22c55e',
  cyan: '#06b6d4',
  blue: '#3b82f6',
  gray: '#6b7280',
  slate: '#64748b',
  zinc: '#71717a',
  'indigo-light': '#e0e7ff',
  'red-light': '#fee2e2',
  'green-light': '#dcfce7',
  'blue-light': '#dbeafe',
  'yellow-light': '#fef08a',
  'orange-light': '#ffedd5',
  'indigo-dark': '#312e81',
  'red-dark': '#7f1d1d',
  'green-dark': '#15803d',
  'blue-dark': '#1e40af',
  'yellow-dark': '#ca8a04',
  'orange-dark': '#92400e',
  white: '#ffffff',
  'gray-900': '#111827',
  'gray-800': '#1f2937',
  'gray-700': '#374151',
}

interface ColorPaletteProps {
  selectedColor: string // hex code
  onColorSelect: (colorName: string, colorHex: string) => void
}

export function ColorPalette({ selectedColor, onColorSelect }: ColorPaletteProps) {
  const containerStyle: CSSProperties = {
    padding: 16,
    borderTop: '1px solid #e5e7eb',
  }

  const headingStyle: CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 12,
    color: '#1f2937',
    margin: 0,
  }

  const gridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
    gap: 8,
  }

  const getButtonStyle = (hex: string): CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: 6,
    padding: 8,
    borderRadius: 8,
    border: selectedColor === hex ? '2px solid #4f46e5' : '1px solid #d1d5db',
    background: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  })

  const swatchStyle = (hex: string): CSSProperties => ({
    width: 24,
    height: 24,
    borderRadius: '50%',
    background: hex,
    border: '1px solid rgba(0,0,0,0.1)',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  })

  const labelStyle: CSSProperties = {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: 500,
    textAlign: 'center',
    maxWidth: 70,
  }

  return (
    <div style={containerStyle}>
      <h3 style={headingStyle}>🎨 Colors</h3>
      <div style={gridStyle}>
        {Object.entries(CANVAS_COLORS).map(([name, hex]) => (
          <button
            key={name}
            onClick={() => onColorSelect(name, hex)}
            title={`${name}: ${hex}`}
            style={getButtonStyle(hex)}
            onMouseEnter={(e) => {
              const el = e.currentTarget
              el.style.borderColor = '#4f46e5'
              el.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.1)'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget
              el.style.borderColor = selectedColor === hex ? '#4f46e5' : '#d1d5db'
              el.style.boxShadow = 'none'
            }}
          >
            <div style={swatchStyle(hex)} />
            <span style={labelStyle}>{name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
