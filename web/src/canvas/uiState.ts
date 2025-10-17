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

export type ColorTab = 'presets' | 'custom'

interface UIState {
  // Panel visibility states
  colorPaletteCollapsed: boolean
  colorPaletteShowAll: boolean
  colorPaletteActiveTab: ColorTab
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
  setColorPaletteActiveTab: (tab: ColorTab) => void
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
      colorPaletteActiveTab: 'presets',
      aiPanelMinimized: false,
      colorPalettePosition: 'bottom-left',
      aiPanelPosition: 'bottom-left',
      toolbarPosition: 'bottom-center',
      strokeWidth: 2,
      opacity: 100,

      // Actions
      setColorPaletteCollapsed: (collapsed) => set({ colorPaletteCollapsed: collapsed }),
      setColorPaletteShowAll: (showAll) => set({ colorPaletteShowAll: showAll }),
      setColorPaletteActiveTab: (tab) => set({ colorPaletteActiveTab: tab }),
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
