import { useEffect, useCallback } from 'react'
import { useToolState } from './state'
import type { ObjectRecord } from './state'
import { useSelection } from './selection'
import { supabase } from '../lib/supabaseClient'

interface KeyboardShortcutsConfig {
  canvasId: string
  objects: Record<string, ObjectRecord>
  onDeleteSelected: () => void
  onDuplicateSelected: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onNudge: (dx: number, dy: number) => void
  upsertObject: (obj: Partial<ObjectRecord> & { id: string }) => void
}

export function useKeyboardShortcuts({
  canvasId,
  objects,
  onDeleteSelected,
  onDuplicateSelected,
  onZoomIn,
  onZoomOut,
  onNudge,
  upsertObject: _upsertObject,
}: KeyboardShortcutsConfig) {
  const { activeTool, setActiveTool, clipboard, setClipboard } = useToolState()
  const { selectedIds, setSelectedIds, clear: clearSelection } = useSelection()

  // Track temporary pan mode with space bar
  const tempPanRef = useCallback((enabled: boolean) => {
    const stage = document.querySelector('canvas')?.parentElement
    if (stage && enabled) {
      stage.style.cursor = 'grab'
    }
  }, [])

  const handleCopy = useCallback(() => {
    const selectedObjects = selectedIds
      .map(id => objects[id])
      .filter(Boolean)

    if (selectedObjects.length > 0) {
      setClipboard(selectedObjects)
    }
  }, [selectedIds, objects, setClipboard])

  const handlePaste = useCallback(async () => {
    if (clipboard.length === 0) return

    const newObjects = clipboard.map(obj => ({
      canvas_id: canvasId,
      type: obj.type,
      x: obj.x + 20, // Offset pasted objects
      y: obj.y + 20,
      width: obj.width,
      height: obj.height,
      rotation: obj.rotation,
      fill: obj.fill,
      text_content: obj.text_content,
    }))

    // Insert all objects into database
    const { data, error } = await supabase
      .from('objects')
      .insert(newObjects)
      .select()

    if (error) {
      console.error('Paste error:', error)
      return
    }

    // Select newly pasted objects
    if (data) {
      setSelectedIds(data.map(obj => obj.id))
    }
  }, [clipboard, canvasId, setSelectedIds])

  const handleSelectAll = useCallback(() => {
    const allIds = Object.keys(objects)
    setSelectedIds(allIds)
  }, [objects, setSelectedIds])

  useEffect(() => {
    let spacePressed = false
    let previousTool: string | null = null

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      // Space for temporary pan
      if (e.code === 'Space' && !spacePressed && activeTool !== 'pan') {
        e.preventDefault()
        spacePressed = true
        previousTool = activeTool
        setActiveTool('pan')
        tempPanRef(true)
        return
      }

      const isMod = e.metaKey || e.ctrlKey
      const isShift = e.shiftKey

      // Tool selection shortcuts
      if (!isMod) {
        switch (e.key.toLowerCase()) {
          case 'v':
            e.preventDefault()
            setActiveTool('select')
            break
          case 'h':
            e.preventDefault()
            setActiveTool('pan')
            break
          case 'r':
            e.preventDefault()
            setActiveTool('rect')
            break
          case 'o':
            e.preventDefault()
            setActiveTool('circle')
            break
          case 't':
            e.preventDefault()
            setActiveTool('text')
            break
          case 'f':
            e.preventDefault()
            setActiveTool('frame')
            break
          case 'p':
            e.preventDefault()
            setActiveTool('pen')
            break
          case 'escape':
            e.preventDefault()
            clearSelection()
            break
          case '+':
          case '=':
            e.preventDefault()
            onZoomIn()
            break
          case '-':
          case '_':
            e.preventDefault()
            onZoomOut()
            break
        }

        // Delete/Backspace handling (separate check, not lowercased)
        if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
          e.preventDefault()
          onDeleteSelected()
        }

        // Arrow key nudging
        const nudgeAmount = isShift ? 10 : 1
        switch (e.key) {
          case 'ArrowUp':
            if (selectedIds.length > 0) {
              e.preventDefault()
              onNudge(0, -nudgeAmount)
            }
            break
          case 'ArrowDown':
            if (selectedIds.length > 0) {
              e.preventDefault()
              onNudge(0, nudgeAmount)
            }
            break
          case 'ArrowLeft':
            if (selectedIds.length > 0) {
              e.preventDefault()
              onNudge(-nudgeAmount, 0)
            }
            break
          case 'ArrowRight':
            if (selectedIds.length > 0) {
              e.preventDefault()
              onNudge(nudgeAmount, 0)
            }
            break
        }
      }

      // Modifier key shortcuts
      if (isMod) {
        switch (e.key.toLowerCase()) {
          case 'a':
            e.preventDefault()
            handleSelectAll()
            break
          case 'c':
            e.preventDefault()
            handleCopy()
            break
          case 'v':
            e.preventDefault()
            handlePaste()
            break
          case 'd':
            if (selectedIds.length > 0) {
              e.preventDefault()
              onDuplicateSelected()
            }
            break
          case '=':
          case '+':
            e.preventDefault()
            onZoomIn()
            break
          case '-':
          case '_':
            e.preventDefault()
            onZoomOut()
            break
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && spacePressed) {
        spacePressed = false
        if (previousTool) {
          setActiveTool(previousTool as any)
          previousTool = null
        }
        tempPanRef(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [
    activeTool,
    setActiveTool,
    clearSelection,
    selectedIds,
    onDeleteSelected,
    onDuplicateSelected,
    onZoomIn,
    onZoomOut,
    onNudge,
    handleCopy,
    handlePaste,
    handleSelectAll,
    tempPanRef,
  ])

  return { activeTool }
}
