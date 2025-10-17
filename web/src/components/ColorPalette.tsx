import type { CSSProperties } from 'react'
import { useUIState } from '../canvas/uiState'
import { useDraggable } from '../canvas/useDraggable'
import { getSnapPositionStyle, getSnapPreviewStyle } from '../canvas/snapPositions'

const CORE_COLORS = {
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
  white: '#ffffff',
  'gray-900': '#111827',
}

const EXTENDED_COLORS = {
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
  'gray-800': '#1f2937',
  'gray-700': '#374151',
}

const STROKE_WIDTHS = [1, 2, 3, 5, 8]

interface ColorPaletteProps {
  selectedColor: string // hex code
  onColorSelect: (colorName: string, colorHex: string) => void
}

export function ColorPalette({ selectedColor, onColorSelect }: ColorPaletteProps) {
  const collapsed = useUIState((s) => s.colorPaletteCollapsed)
  const showAll = useUIState((s) => s.colorPaletteShowAll)
  const strokeWidth = useUIState((s) => s.strokeWidth)
  const opacity = useUIState((s) => s.opacity)
  const position = useUIState((s) => s.colorPalettePosition)
  const setCollapsed = useUIState((s) => s.setColorPaletteCollapsed)
  const setShowAll = useUIState((s) => s.setColorPaletteShowAll)
  const setStrokeWidth = useUIState((s) => s.setStrokeWidth)
  const setOpacity = useUIState((s) => s.setOpacity)
  const setPosition = useUIState((s) => s.setColorPalettePosition)

  const { isDragging, onMouseDown, dragStyle, previewPosition } = useDraggable({
    currentPosition: position,
    onPositionChange: setPosition,
  })

  const colorsToShow = showAll ? { ...CORE_COLORS, ...EXTENDED_COLORS } : CORE_COLORS

  const positionStyle = getSnapPositionStyle(position)

  const containerStyle: CSSProperties = {
    ...positionStyle,
    position: 'fixed',
    width: 340,
    maxWidth: 'calc(100vw - 32px)',
    padding: collapsed ? 8 : 10,
    border: '1px solid #e5e7eb',
    background: 'white',
    borderRadius: 8,
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    zIndex: 300,
    transition: isDragging ? 'none' : 'all 0.2s ease',
    ...dragStyle,
  }

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: collapsed ? 0 : 8,
  }

  const headingStyle: CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: '#1f2937',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  }

  const toggleButtonStyle: CSSProperties = {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: 4,
    borderRadius: 4,
    fontSize: 14,
    display: 'flex',
    alignItems: 'center',
    color: '#6b7280',
  }

  const gridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: 6,
    marginBottom: 8,
  }

  const getButtonStyle = (hex: string): CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: 4,
    padding: 6,
    borderRadius: 6,
    border: selectedColor === hex ? '2px solid #4f46e5' : '1px solid #d1d5db',
    background: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  })

  const swatchStyle = (hex: string): CSSProperties => ({
    width: 18,
    height: 18,
    borderRadius: '50%',
    background: hex,
    border: '1px solid rgba(0,0,0,0.1)',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  })

  const labelStyle: CSSProperties = {
    fontSize: 9,
    color: '#6b7280',
    fontWeight: 500,
    textAlign: 'center',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: 55,
  }

  const optionRowStyle: CSSProperties = {
    display: 'flex',
    gap: 8,
    marginBottom: 6,
    alignItems: 'center',
  }

  const optionLabelStyle: CSSProperties = {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: 500,
    minWidth: 60,
  }

  const strokeButtonStyle = (width: number): CSSProperties => ({
    flex: 1,
    padding: '4px 8px',
    borderRadius: 4,
    border: strokeWidth === width ? '2px solid #4f46e5' : '1px solid #d1d5db',
    background: strokeWidth === width ? '#eef2ff' : '#ffffff',
    cursor: 'pointer',
    fontSize: 10,
    fontWeight: 500,
    transition: 'all 0.2s ease',
    color: strokeWidth === width ? '#4f46e5' : '#6b7280',
  })

  const sliderStyle: CSSProperties = {
    flex: 1,
    height: 4,
    borderRadius: 2,
    appearance: 'none',
    background: `linear-gradient(to right, #4f46e5 0%, #4f46e5 ${opacity}%, #e5e7eb ${opacity}%, #e5e7eb 100%)`,
    outline: 'none',
    cursor: 'pointer',
  }

  if (collapsed) {
    return (
      <>
        <div style={containerStyle} onMouseDown={onMouseDown}>
          <div
            style={{
              ...headerStyle,
              cursor: isDragging ? 'grabbing' : 'grab',
            }}
            onClick={() => !isDragging && setCollapsed(false)}
          >
            <div style={{ ...headingStyle, flexDirection: 'row', gap: 8 }}>
              <div style={{ ...swatchStyle(selectedColor), width: 16, height: 16 }} />
              <span>Colors & Options</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setCollapsed(false)
              }}
              style={toggleButtonStyle}
              title="Expand"
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
      <div style={containerStyle} onMouseDown={onMouseDown}>
        <div style={headerStyle}>
          <h3 style={headingStyle}>
            🎨 Colors & Options
          </h3>
          <button
            onClick={() => setCollapsed(true)}
            style={toggleButtonStyle}
            title="Collapse"
          >
            ▼
          </button>
        </div>

      {/* Color Grid */}
      <div style={gridStyle}>
        {Object.entries(colorsToShow).map(([name, hex]) => (
          <button
            key={name}
            onClick={() => onColorSelect(name, hex)}
            title={`${name}: ${hex}`}
            style={getButtonStyle(hex)}
            onMouseEnter={(e) => {
              const el = e.currentTarget
              el.style.borderColor = '#4f46e5'
              el.style.boxShadow = '0 0 0 2px rgba(79, 70, 229, 0.1)'
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

      {/* Show More/Less Button */}
      <button
        onClick={() => setShowAll(!showAll)}
        style={{
          width: '100%',
          padding: '6px',
          fontSize: 10,
          fontWeight: 600,
          color: '#4f46e5',
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: 4,
          cursor: 'pointer',
          marginBottom: 8,
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#eef2ff'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#f9fafb'
        }}
      >
        {showAll ? '▲ Show Less' : '▼ Show More Colors'}
      </button>

      {/* Stroke Width */}
      <div style={optionRowStyle}>
        <span style={optionLabelStyle}>Stroke:</span>
        {STROKE_WIDTHS.map((width) => (
          <button
            key={width}
            onClick={() => setStrokeWidth(width)}
            style={strokeButtonStyle(width)}
            onMouseEnter={(e) => {
              if (strokeWidth !== width) {
                e.currentTarget.style.background = '#f3f4f6'
              }
            }}
            onMouseLeave={(e) => {
              if (strokeWidth !== width) {
                e.currentTarget.style.background = '#ffffff'
              }
            }}
          >
            {width}px
          </button>
        ))}
      </div>

      {/* Opacity Slider */}
      <div style={optionRowStyle}>
        <span style={optionLabelStyle}>Opacity:</span>
        <input
          type="range"
          min="0"
          max="100"
          value={opacity}
          onChange={(e) => setOpacity(Number(e.target.value))}
          style={sliderStyle}
        />
        <span style={{ fontSize: 10, color: '#6b7280', fontWeight: 600, minWidth: 32 }}>
          {opacity}%
        </span>
      </div>
      </div>
      {previewPosition && <div style={getSnapPreviewStyle(previewPosition)} />}
    </>
  )
}
