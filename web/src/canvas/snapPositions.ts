import type { SnapPosition } from './uiState'
import type { CSSProperties } from 'react'

const EDGE_SPACING = 16 // pixels from edge

export interface SnapPositionStyle {
  top?: number | string
  left?: number | string
  right?: number | string
  bottom?: number | string
  transform?: string
}

/**
 * Calculate CSS position styles based on snap position
 */
export function getSnapPositionStyle(
  position: SnapPosition
): CSSProperties {
  const style: SnapPositionStyle = {}

  switch (position) {
    case 'top-left':
      style.top = EDGE_SPACING
      style.left = EDGE_SPACING
      break
    case 'top-center':
      style.top = EDGE_SPACING
      style.left = '50%'
      style.transform = 'translateX(-50%)'
      break
    case 'top-right':
      style.top = EDGE_SPACING
      style.right = EDGE_SPACING
      break
    case 'left-center':
      style.left = EDGE_SPACING
      style.top = '50%'
      style.transform = 'translateY(-50%)'
      break
    case 'right-center':
      style.right = EDGE_SPACING
      style.top = '50%'
      style.transform = 'translateY(-50%)'
      break
    case 'bottom-left':
      style.bottom = EDGE_SPACING
      style.left = EDGE_SPACING
      break
    case 'bottom-center':
      style.bottom = EDGE_SPACING
      style.left = '50%'
      style.transform = 'translateX(-50%)'
      break
    case 'bottom-right':
      style.bottom = EDGE_SPACING
      style.right = EDGE_SPACING
      break
  }

  return style as CSSProperties
}

/**
 * Calculate the nearest snap position based on mouse coordinates
 */
export function getNearestSnapPosition(
  mouseX: number,
  mouseY: number,
  windowWidth: number,
  windowHeight: number
): SnapPosition {
  const positions: Array<{ position: SnapPosition; x: number; y: number }> = [
    { position: 'top-left', x: EDGE_SPACING, y: EDGE_SPACING },
    { position: 'top-center', x: windowWidth / 2, y: EDGE_SPACING },
    { position: 'top-right', x: windowWidth - EDGE_SPACING, y: EDGE_SPACING },
    { position: 'left-center', x: EDGE_SPACING, y: windowHeight / 2 },
    { position: 'right-center', x: windowWidth - EDGE_SPACING, y: windowHeight / 2 },
    { position: 'bottom-left', x: EDGE_SPACING, y: windowHeight - EDGE_SPACING },
    { position: 'bottom-center', x: windowWidth / 2, y: windowHeight - EDGE_SPACING },
    { position: 'bottom-right', x: windowWidth - EDGE_SPACING, y: windowHeight - EDGE_SPACING },
  ]

  let nearestPosition = positions[0]
  let minDistance = Infinity

  for (const pos of positions) {
    const distance = Math.sqrt(Math.pow(mouseX - pos.x, 2) + Math.pow(mouseY - pos.y, 2))
    if (distance < minDistance) {
      minDistance = distance
      nearestPosition = pos
    }
  }

  return nearestPosition.position
}

/**
 * Get visual indicator position for snap preview
 */
export function getSnapPreviewStyle(position: SnapPosition): CSSProperties {
  const baseStyle: CSSProperties = {
    position: 'fixed',
    width: 100,
    height: 100,
    background: 'rgba(79, 70, 229, 0.2)',
    border: '2px dashed #4f46e5',
    borderRadius: 8,
    pointerEvents: 'none',
    zIndex: 9999,
    transition: 'all 0.15s ease',
  }

  return {
    ...baseStyle,
    ...getSnapPositionStyle(position),
  }
}
