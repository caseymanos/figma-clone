import { useEffect, useRef } from 'react'

interface TextEditorProps {
  value: string
  x: number
  y: number
  width: number
  fontSize: number
  stageScale: number
  stageX: number
  stageY: number
  onSave: (newText: string) => void
  onCancel: () => void
}

export function TextEditor({
  value,
  x,
  y,
  width,
  fontSize,
  stageScale,
  stageX,
  stageY,
  onSave,
  onCancel,
}: TextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    // Focus and select all text
    if (textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
    }

    // Handle click outside to save
    const handleClickOutside = (e: MouseEvent) => {
      if (textareaRef.current && !textareaRef.current.contains(e.target as Node)) {
        onSave(textareaRef.current.value)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onSave])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSave(textareaRef.current?.value || '')
    }
  }

  // Calculate position accounting for stage transform
  const screenX = x * stageScale + stageX
  const screenY = y * stageScale + stageY
  const scaledWidth = width * stageScale
  const scaledFontSize = fontSize * stageScale

  return (
    <textarea
      ref={textareaRef}
      defaultValue={value}
      onKeyDown={handleKeyDown}
      style={{
        position: 'absolute',
        left: `${screenX}px`,
        top: `${screenY}px`,
        width: `${scaledWidth}px`,
        fontSize: `${scaledFontSize}px`,
        fontFamily: 'Arial, sans-serif',
        border: '2px solid #4f46e5',
        outline: 'none',
        padding: '2px',
        background: 'white',
        resize: 'none',
        overflow: 'hidden',
        lineHeight: '1.2',
        zIndex: 1000,
      }}
      rows={1}
    />
  )
}
