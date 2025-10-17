import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  // Panel visibility states
  colorPaletteCollapsed: boolean
  colorPaletteShowAll: boolean
  aiPanelMinimized: boolean

  // Drawing options
  strokeWidth: number
  opacity: number

  // Actions
  setColorPaletteCollapsed: (collapsed: boolean) => void
  setColorPaletteShowAll: (showAll: boolean) => void
  setAIPanelMinimized: (minimized: boolean) => void
  setStrokeWidth: (width: number) => void
  setOpacity: (opacity: number) => void
}

export const useUIState = create<UIState>()(
  persist(
    (set) => ({
      // Default states
      colorPaletteCollapsed: false,
      colorPaletteShowAll: false,
      aiPanelMinimized: false,
      strokeWidth: 2,
      opacity: 100,

      // Actions
      setColorPaletteCollapsed: (collapsed) => set({ colorPaletteCollapsed: collapsed }),
      setColorPaletteShowAll: (showAll) => set({ colorPaletteShowAll: showAll }),
      setAIPanelMinimized: (minimized) => set({ aiPanelMinimized: minimized }),
      setStrokeWidth: (width) => set({ strokeWidth: width }),
      setOpacity: (opacity) => set({ opacity: opacity }),
    }),
    {
      name: 'figma-clone-ui-state',
    }
  )
)
