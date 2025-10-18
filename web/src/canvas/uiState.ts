import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type SnapPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'left-center'
  | 'right-center'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'

interface UIState {
  // Panel visibility states
  colorPaletteCollapsed: boolean
  colorPaletteShowAll: boolean
  showColorWheel: boolean
  aiPanelMinimized: boolean

  // Panel positions
  colorPalettePosition: SnapPosition
  aiPanelPosition: SnapPosition
  toolbarPosition: SnapPosition

  // Drawing options
  strokeWidth: number
  opacity: number

  // Actions
  setColorPaletteCollapsed: (collapsed: boolean) => void
  setColorPaletteShowAll: (showAll: boolean) => void
  setShowColorWheel: (show: boolean) => void
  setAIPanelMinimized: (minimized: boolean) => void
  setColorPalettePosition: (position: SnapPosition) => void
  setAIPanelPosition: (position: SnapPosition) => void
  setToolbarPosition: (position: SnapPosition) => void
  setStrokeWidth: (width: number) => void
  setOpacity: (opacity: number) => void
}

export const useUIState = create<UIState>()(
  persist(
    (set) => ({
      // Default states
      colorPaletteCollapsed: false,
      colorPaletteShowAll: false,
      showColorWheel: false,
      aiPanelMinimized: false,
      colorPalettePosition: 'bottom-left',
      aiPanelPosition: 'bottom-left',
      toolbarPosition: 'bottom-center',
      strokeWidth: 2,
      opacity: 100,

      // Actions
      setColorPaletteCollapsed: (collapsed) => set({ colorPaletteCollapsed: collapsed }),
      setColorPaletteShowAll: (showAll) => set({ colorPaletteShowAll: showAll }),
      setShowColorWheel: (show) => set({ showColorWheel: show }),
      setAIPanelMinimized: (minimized) => set({ aiPanelMinimized: minimized }),
      setColorPalettePosition: (position) => set({ colorPalettePosition: position }),
      setAIPanelPosition: (position) => set({ aiPanelPosition: position }),
      setToolbarPosition: (position) => set({ toolbarPosition: position }),
      setStrokeWidth: (width) => set({ strokeWidth: width }),
      setOpacity: (opacity) => set({ opacity: opacity }),
    }),
    {
      name: 'figma-clone-ui-state',
    }
  )
)
