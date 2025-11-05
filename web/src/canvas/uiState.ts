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

  // Grid options
  snapToGrid: boolean

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
  setSnapToGrid: (snap: boolean) => void
  
  // Panel collision helpers
  getAllPanelPositions: () => Map<string, SnapPosition>
  swapPanelPositions: (panelId1: string, panelId2: string) => void
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
      aiPanelPosition: 'bottom-right',
      toolbarPosition: 'bottom-center',
      strokeWidth: 2,
      opacity: 100,
      snapToGrid: false,

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
      setSnapToGrid: (snap) => set({ snapToGrid: snap }),
      
      // Panel collision helpers
      getAllPanelPositions: (): Map<string, SnapPosition> => {
        const state = useUIState.getState()
        return new Map<string, SnapPosition>([
          ['colorPalette', state.colorPalettePosition],
          ['aiPanel', state.aiPanelPosition],
          ['toolbar', state.toolbarPosition],
        ])
      },
      swapPanelPositions: (panelId1: string, panelId2: string): void => {
        const currentState = useUIState.getState()
        const positions = currentState.getAllPanelPositions()
        const pos1 = positions.get(panelId1)
        const pos2 = positions.get(panelId2)
        
        if (!pos1 || !pos2) return
        
        // Swap positions atomically
        set(() => {
          const updates: Partial<UIState> = {}
          if (panelId1 === 'colorPalette') updates.colorPalettePosition = pos2
          if (panelId1 === 'aiPanel') updates.aiPanelPosition = pos2
          if (panelId1 === 'toolbar') updates.toolbarPosition = pos2
          if (panelId2 === 'colorPalette') updates.colorPalettePosition = pos1
          if (panelId2 === 'aiPanel') updates.aiPanelPosition = pos1
          if (panelId2 === 'toolbar') updates.toolbarPosition = pos1
          return updates
        })
      },
    }),
    {
      name: 'figma-clone-ui-state',
    }
  )
)
