import { useState, useEffect } from 'react'
import {
  CompactStackPresence,
  ModernCardsPresence,
  MinimalBarPresence,
  DropdownPanelPresence
} from './PresenceSidebarVariants'
import { StyleTestToggle, type PresenceStyleVariant } from '../components/StyleTestToggle'

const STORAGE_KEY = 'presence-ui-style'

export function PresenceSidebar() {
  // Load saved style from localStorage, default to 'compact-stack'
  const [currentStyle, setCurrentStyle] = useState<PresenceStyleVariant>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return (saved as PresenceStyleVariant) || 'compact-stack'
  })

  // Save style to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, currentStyle)
  }, [currentStyle])

  // Render the appropriate variant
  const renderVariant = () => {
    switch (currentStyle) {
      case 'compact-stack':
        return <CompactStackPresence />
      case 'modern-cards':
        return <ModernCardsPresence />
      case 'minimal-bar':
        return <MinimalBarPresence />
      case 'dropdown-panel':
        return <DropdownPanelPresence />
      default:
        return <CompactStackPresence />
    }
  }

  return (
    <>
      {renderVariant()}
      <StyleTestToggle currentStyle={currentStyle} onStyleChange={setCurrentStyle} />
    </>
  )
}

