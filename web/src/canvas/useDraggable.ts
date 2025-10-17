import { useState, useCallback, useEffect, useRef } from 'react'
import type { SnapPosition } from './uiState'
import { getNearestSnapPosition } from './snapPositions'

interface UseDraggableOptions {
  currentPosition: SnapPosition
  onPositionChange: (position: SnapPosition) => void
  disabled?: boolean
}

interface UseDraggableReturn {
  isDragging: boolean
  onMouseDown: (e: React.MouseEvent) => void
  dragStyle: React.CSSProperties
  previewPosition: SnapPosition | null
}

export function useDraggable({
  currentPosition,
  onPositionChange,
  disabled = false,
}: UseDraggableOptions): UseDraggableReturn {
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [currentMouse, setCurrentMouse] = useState({ x: 0, y: 0 })
  const [previewPosition, setPreviewPosition] = useState<SnapPosition | null>(null)
  const dragStartRef = useRef({ x: 0, y: 0 })

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return

      // Only start drag if not clicking on interactive elements
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'BUTTON' ||
        target.tagName === 'TEXTAREA' ||
        target.closest('button') ||
        target.closest('input')
      ) {
        return
      }

      e.preventDefault()
      e.stopPropagation()

      const rect = e.currentTarget.getBoundingClientRect()
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
      dragStartRef.current = { x: e.clientX, y: e.clientY }
      setIsDragging(true)
      setCurrentMouse({ x: e.clientX, y: e.clientY })
    },
    [disabled]
  )

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      setCurrentMouse({ x: e.clientX, y: e.clientY })

      // Calculate nearest snap position for preview
      const nearest = getNearestSnapPosition(
        e.clientX,
        e.clientY,
        window.innerWidth,
        window.innerHeight
      )
      setPreviewPosition(nearest)
    }

    const handleMouseUp = (e: MouseEvent) => {
      // Calculate final snap position
      const finalPosition = getNearestSnapPosition(
        e.clientX,
        e.clientY,
        window.innerWidth,
        window.innerHeight
      )

      // Only update if position changed
      if (finalPosition !== currentPosition) {
        onPositionChange(finalPosition)
      }

      setIsDragging(false)
      setPreviewPosition(null)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, currentPosition, onPositionChange])

  const dragStyle: React.CSSProperties = isDragging
    ? {
        position: 'fixed',
        left: currentMouse.x - dragOffset.x,
        top: currentMouse.y - dragOffset.y,
        opacity: 0.8,
        cursor: 'grabbing',
        zIndex: 10000,
        pointerEvents: 'none',
      }
    : {
        cursor: disabled ? 'default' : 'grab',
      }

  return {
    isDragging,
    onMouseDown,
    dragStyle,
    previewPosition,
  }
}
