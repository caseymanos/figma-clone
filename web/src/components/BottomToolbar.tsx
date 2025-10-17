// Figma UI3-style Bottom Toolbar
import type { CSSProperties } from 'react'
import { Icon } from './icons/Icon'
import { colors, typography, spacing, borderRadius, components, transitions, shadows, zIndex } from '../styles/design-tokens'
import { useToolState } from '../canvas/state'
import type { Tool } from '../canvas/state'

interface BottomToolbarProps {
  onZoomIn?: () => void
  onZoomOut?: () => void
}

export function BottomToolbar({ onZoomIn, onZoomOut }: BottomToolbarProps) {
  const { activeTool, setActiveTool } = useToolState()
  const toolbarStyle: CSSProperties = {
    position: 'fixed',
    bottom: spacing[4],
    left: '50%',
    transform: 'translateX(-50%)',
    height: components.toolbar.height,
    padding: components.toolbar.padding,
    display: 'flex',
    alignItems: 'center',
    gap: spacing[1],
    background: colors.chrome.toolbar,
    borderRadius: borderRadius.md,
    boxShadow: shadows.toolbar,
    zIndex: zIndex.toolbar,
    border: `1px solid ${colors.gray[700]}`,
  }

  const toolButtonStyle: CSSProperties = {
    width: '36px',
    height: '36px',
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
    position: 'relative',
  }

  const dividerStyle: CSSProperties = {
    width: '1px',
    height: '20px',
    background: colors.gray[700],
    margin: `0 ${spacing[1]}`,
  }

  const labelStyle: CSSProperties = {
    position: 'absolute',
    bottom: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    marginBottom: spacing[2],
    padding: `${spacing[1]} ${spacing[2]}`,
    background: colors.gray[900],
    color: colors.text.inverse,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    borderRadius: borderRadius.sm,
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    opacity: 0,
    transition: transitions.fast,
    zIndex: zIndex.tooltip,
  }

  const createToolButton = (
    icon: string,
    label: string,
    onClick: () => void,
    shortcut?: string,
    tool?: Tool
  ) => {
    const isActive = tool && activeTool === tool
    const activeStyle: CSSProperties = isActive
      ? {
          ...toolButtonStyle,
          background: colors.primary[600],
        }
      : toolButtonStyle

    return (
      <button
        onClick={onClick}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = colors.gray[700]
          }
          const tooltip = e.currentTarget.querySelector('.tooltip') as HTMLElement
          if (tooltip) tooltip.style.opacity = '1'
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = 'transparent'
          }
          const tooltip = e.currentTarget.querySelector('.tooltip') as HTMLElement
          if (tooltip) tooltip.style.opacity = '0'
        }}
        style={activeStyle}
        title={label}
      >
        <Icon name={icon} size={18} color={colors.text.inverse} />
        <div className="tooltip" style={labelStyle}>
          {label}
          {shortcut && (
            <span style={{ marginLeft: spacing[2], opacity: 0.7 }}>
              {shortcut}
            </span>
          )}
        </div>
      </button>
    )
  }

  const handleToolClick = (tool: Tool) => {
    setActiveTool(tool)
  }

  return (
    <div style={toolbarStyle}>
      {/* Selection tools */}
      {createToolButton('cursor', 'Move', () => handleToolClick('select'), 'V', 'select')}
      {createToolButton('hand', 'Pan', () => handleToolClick('pan'), 'H', 'pan')}

      <div style={dividerStyle} />

      {/* Shape tools */}
      {createToolButton('rectangle', 'Rectangle', () => handleToolClick('rect'), 'R', 'rect')}
      {createToolButton('circle', 'Circle', () => handleToolClick('circle'), 'O', 'circle')}
      {createToolButton('text', 'Text', () => handleToolClick('text'), 'T', 'text')}
      {createToolButton('frame', 'Frame', () => handleToolClick('frame'), 'F', 'frame')}
      {createToolButton('pen', 'Pen', () => handleToolClick('pen'), 'P', 'pen')}

      <div style={dividerStyle} />

      {/* View tools */}
      {createToolButton('zoomIn', 'Zoom In', () => onZoomIn?.(), '+')}
      {createToolButton('zoomOut', 'Zoom Out', () => onZoomOut?.(), '-')}
    </div>
  )
}
