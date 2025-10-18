import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useKeyboardShortcuts } from './useKeyboardShortcuts'
import { useSelection } from './selection'
import { useToolState } from './state'
import type { ObjectRecord } from './state'

// Mock the selection and tool state
vi.mock('./selection', () => ({
  useSelection: vi.fn(),
}))

vi.mock('./state', () => ({
  useToolState: vi.fn(),
}))

describe('useKeyboardShortcuts - Delete Key', () => {
  const mockOnDeleteSelected = vi.fn()
  const mockOnDuplicateSelected = vi.fn()
  const mockOnZoomIn = vi.fn()
  const mockOnZoomOut = vi.fn()
  const mockOnNudge = vi.fn()
  const mockUpsertObject = vi.fn()
  const mockSetSelectedIds = vi.fn()
  const mockClearSelection = vi.fn()
  const mockSetActiveTool = vi.fn()
  const mockSetClipboard = vi.fn()

  // Create a test object
  const testObject: ObjectRecord = {
    id: 'test-object-123',
    type: 'rect',
    x: 100,
    y: 100,
    width: 120,
    height: 80,
    fill: '#4f46e5',
  }

  const testObjects: Record<string, ObjectRecord> = {
    'test-object-123': testObject,
  }

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks()

    // Mock useSelection hook
    vi.mocked(useSelection).mockReturnValue({
      selectedIds: ['test-object-123'],
      setSelectedIds: mockSetSelectedIds,
      clear: mockClearSelection,
      toggleId: vi.fn(),
      selectMultiple: vi.fn(),
      isSelected: vi.fn(),
    })

    // Mock useToolState hook
    vi.mocked(useToolState).mockReturnValue({
      activeTool: 'select',
      setActiveTool: mockSetActiveTool,
      clipboard: [],
      setClipboard: mockSetClipboard,
    })
  })

  it('should call onDeleteSelected when Delete key is pressed with selected objects', () => {
    // Render the hook
    renderHook(() =>
      useKeyboardShortcuts({
        canvasId: 'test-canvas',
        objects: testObjects,
        onDeleteSelected: mockOnDeleteSelected,
        onDuplicateSelected: mockOnDuplicateSelected,
        onZoomIn: mockOnZoomIn,
        onZoomOut: mockOnZoomOut,
        onNudge: mockOnNudge,
        upsertObject: mockUpsertObject,
      })
    )

    // Simulate Delete key press
    act(() => {
      const event = new KeyboardEvent('keydown', {
        key: 'Delete',
        code: 'Delete',
        bubbles: true,
      })
      window.dispatchEvent(event)
    })

    // Assert that delete callback was called
    expect(mockOnDeleteSelected).toHaveBeenCalledTimes(1)
  })

  it('should call onDeleteSelected when Backspace key is pressed with selected objects', () => {
    // Render the hook
    renderHook(() =>
      useKeyboardShortcuts({
        canvasId: 'test-canvas',
        objects: testObjects,
        onDeleteSelected: mockOnDeleteSelected,
        onDuplicateSelected: mockOnDuplicateSelected,
        onZoomIn: mockOnZoomIn,
        onZoomOut: mockOnZoomOut,
        onNudge: mockOnNudge,
        upsertObject: mockUpsertObject,
      })
    )

    // Simulate Backspace key press
    act(() => {
      const event = new KeyboardEvent('keydown', {
        key: 'Backspace',
        code: 'Backspace',
        bubbles: true,
      })
      window.dispatchEvent(event)
    })

    // Assert that delete callback was called
    expect(mockOnDeleteSelected).toHaveBeenCalledTimes(1)
  })

  it('should NOT call onDeleteSelected when Delete key is pressed with no selected objects', () => {
    // Mock empty selection
    vi.mocked(useSelection).mockReturnValue({
      selectedIds: [],
      setSelectedIds: mockSetSelectedIds,
      clear: mockClearSelection,
      toggleId: vi.fn(),
      selectMultiple: vi.fn(),
      isSelected: vi.fn(),
    })

    // Render the hook
    renderHook(() =>
      useKeyboardShortcuts({
        canvasId: 'test-canvas',
        objects: testObjects,
        onDeleteSelected: mockOnDeleteSelected,
        onDuplicateSelected: mockOnDuplicateSelected,
        onZoomIn: mockOnZoomIn,
        onZoomOut: mockOnZoomOut,
        onNudge: mockOnNudge,
        upsertObject: mockUpsertObject,
      })
    )

    // Simulate Delete key press
    act(() => {
      const event = new KeyboardEvent('keydown', {
        key: 'Delete',
        code: 'Delete',
        bubbles: true,
      })
      window.dispatchEvent(event)
    })

    // Assert that delete callback was NOT called
    expect(mockOnDeleteSelected).not.toHaveBeenCalled()
  })

  it('should NOT trigger shortcuts when typing in an input field', () => {
    // Render the hook
    renderHook(() =>
      useKeyboardShortcuts({
        canvasId: 'test-canvas',
        objects: testObjects,
        onDeleteSelected: mockOnDeleteSelected,
        onDuplicateSelected: mockOnDuplicateSelected,
        onZoomIn: mockOnZoomIn,
        onZoomOut: mockOnZoomOut,
        onNudge: mockOnNudge,
        upsertObject: mockUpsertObject,
      })
    )

    // Create a fake input element
    const input = document.createElement('input')
    document.body.appendChild(input)

    // Simulate Delete key press on input
    act(() => {
      const event = new KeyboardEvent('keydown', {
        key: 'Delete',
        code: 'Delete',
        bubbles: true,
      })
      Object.defineProperty(event, 'target', { value: input, enumerable: true })
      window.dispatchEvent(event)
    })

    // Assert that delete callback was NOT called
    expect(mockOnDeleteSelected).not.toHaveBeenCalled()

    // Cleanup
    document.body.removeChild(input)
  })

  it('should handle Cmd+D for duplicate', () => {
    // Render the hook
    renderHook(() =>
      useKeyboardShortcuts({
        canvasId: 'test-canvas',
        objects: testObjects,
        onDeleteSelected: mockOnDeleteSelected,
        onDuplicateSelected: mockOnDuplicateSelected,
        onZoomIn: mockOnZoomIn,
        onZoomOut: mockOnZoomOut,
        onNudge: mockOnNudge,
        upsertObject: mockUpsertObject,
      })
    )

    // Simulate Cmd+D key press
    act(() => {
      const event = new KeyboardEvent('keydown', {
        key: 'd',
        code: 'KeyD',
        metaKey: true,
        bubbles: true,
      })
      window.dispatchEvent(event)
    })

    // Assert that duplicate callback was called
    expect(mockOnDuplicateSelected).toHaveBeenCalledTimes(1)
  })

  it('should handle arrow key nudging', () => {
    // Render the hook
    renderHook(() =>
      useKeyboardShortcuts({
        canvasId: 'test-canvas',
        objects: testObjects,
        onDeleteSelected: mockOnDeleteSelected,
        onDuplicateSelected: mockOnDuplicateSelected,
        onZoomIn: mockOnZoomIn,
        onZoomOut: mockOnZoomOut,
        onNudge: mockOnNudge,
        upsertObject: mockUpsertObject,
      })
    )

    // Simulate arrow key presses
    act(() => {
      // ArrowUp
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true })
      )
      // ArrowDown
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })
      )
      // ArrowLeft
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true })
      )
      // ArrowRight
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })
      )
    })

    // Assert that nudge was called 4 times with correct deltas
    expect(mockOnNudge).toHaveBeenCalledTimes(4)
    expect(mockOnNudge).toHaveBeenNthCalledWith(1, 0, -1) // Up
    expect(mockOnNudge).toHaveBeenNthCalledWith(2, 0, 1)  // Down
    expect(mockOnNudge).toHaveBeenNthCalledWith(3, -1, 0) // Left
    expect(mockOnNudge).toHaveBeenNthCalledWith(4, 1, 0)  // Right
  })

  it('should handle tool selection shortcuts', () => {
    // Render the hook
    renderHook(() =>
      useKeyboardShortcuts({
        canvasId: 'test-canvas',
        objects: testObjects,
        onDeleteSelected: mockOnDeleteSelected,
        onDuplicateSelected: mockOnDuplicateSelected,
        onZoomIn: mockOnZoomIn,
        onZoomOut: mockOnZoomOut,
        onNudge: mockOnNudge,
        upsertObject: mockUpsertObject,
      })
    )

    // Simulate tool selection key presses
    act(() => {
      // 'v' for select tool
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'v', bubbles: true })
      )
      // 'r' for rect tool
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'r', bubbles: true })
      )
      // 'o' for circle tool
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'o', bubbles: true })
      )
    })

    // Assert that setActiveTool was called for each shortcut
    expect(mockSetActiveTool).toHaveBeenCalledWith('select')
    expect(mockSetActiveTool).toHaveBeenCalledWith('rect')
    expect(mockSetActiveTool).toHaveBeenCalledWith('circle')
  })
})

