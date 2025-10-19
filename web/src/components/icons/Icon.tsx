// SVG Icon Component Library - Figma-style icons
import type { CSSProperties, ReactElement } from 'react'

interface IconProps {
  name: string
  size?: number | string
  color?: string
  style?: CSSProperties
  className?: string
}

export function Icon({ name, size = 16, color = 'currentColor', style, className }: IconProps) {
  const iconStyle: CSSProperties = {
    width: typeof size === 'number' ? `${size}px` : size,
    height: typeof size === 'number' ? `${size}px` : size,
    display: 'inline-block',
    flexShrink: 0,
    ...style,
  }

  const icons: Record<string, ReactElement> = {
    // Navigation
    home: (
      <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 6L8 2L14 6V13C14 13.2652 13.8946 13.5196 13.7071 13.7071C13.5196 13.8946 13.2652 14 13 14H3C2.73478 14 2.48043 13.8946 2.29289 13.7071C2.10536 13.5196 2 13.2652 2 13V6Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M6 14V8H10V14" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),

    // Tools
    rectangle: (
      <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="3" width="12" height="10" rx="1" stroke={color} strokeWidth="1.5"/>
      </svg>
    ),

    circle: (
      <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="8" cy="8" r="5.5" stroke={color} strokeWidth="1.5"/>
      </svg>
    ),

    text: (
      <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 3H12M8 3V13M6 13H10" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),

    frame: (
      <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2.5" y="2.5" width="11" height="11" rx="0.5" stroke={color} strokeWidth="1.5"/>
        <path d="M2.5 5.5H13.5M5.5 2.5V13.5" stroke={color} strokeWidth="1.5"/>
      </svg>
    ),

    pen: (
      <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11.5 2L14 4.5L5.5 13H3V10.5L11.5 2Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),

    // Actions
    copy: (
      <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="5" y="5" width="9" height="9" rx="1.5" stroke={color} strokeWidth="1.5"/>
        <path d="M3 11H2.5C2.10218 11 1.72064 10.842 1.43934 10.5607C1.15804 10.2794 1 9.89782 1 9.5V2.5C1 2.10218 1.15804 1.72064 1.43934 1.43934C1.72064 1.15804 2.10218 1 2.5 1H9.5C9.89782 1 10.2794 1.15804 10.5607 1.43934C10.842 1.72064 11 2.10218 11 2.5V3" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),

    link: (
      <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6.5 9.5L9.5 6.5M7.5 5H8.5C9.16304 5 9.79893 5.26339 10.2678 5.73223C10.7366 6.20107 11 6.83696 11 7.5C11 8.16304 10.7366 8.79893 10.2678 9.26777C9.79893 9.73661 9.16304 10 8.5 10H7.5M8.5 11H7.5C6.83696 11 6.20107 10.7366 5.73223 10.2678C5.26339 9.79893 5 9.16304 5 8.5C5 7.83696 5.26339 7.20107 5.73223 6.73223C6.20107 6.26339 6.83696 6 7.5 6H8.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),

    check: (
      <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M13 4L6 11L3 8" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),

    // UI Elements
    user: (
      <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M13 14C13 12.3431 10.7614 11 8 11C5.23858 11 3 12.3431 3 14M8 8C6.34315 8 5 6.65685 5 5C5 3.34315 6.34315 2 8 2C9.65685 2 11 3.34315 11 5C11 6.65685 9.65685 8 8 8Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),

    users: (
      <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11 14C11 12.3431 9.20914 11 7 11C4.79086 11 3 12.3431 3 14M14 11C14 9.89543 13.1046 9 12 9M10 3.5C10.7956 3.5 11.5587 3.81607 12.1213 4.37868C12.6839 4.94129 13 5.70435 13 6.5C13 7.29565 12.6839 8.05871 12.1213 8.62132C11.5587 9.18393 10.7956 9.5 10 9.5M7 8C5.34315 8 4 6.65685 4 5C4 3.34315 5.34315 2 7 2C8.65685 2 10 3.34315 10 5C10 6.65685 8.65685 8 7 8Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),

    settings: (
      <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="8" cy="8" r="2" stroke={color} strokeWidth="1.5"/>
        <path d="M6.5 2.5L7 1H9L9.5 2.5M6.5 13.5L7 15H9L9.5 13.5M13.5 6.5L15 7V9L13.5 9.5M2.5 6.5L1 7V9L2.5 9.5M11.5 3L12.5 2L14 3.5L13 4.5M4.5 11.5L3.5 12.5L2 11L3 10M11.5 13L12.5 14L14 12.5L13 11.5M4.5 4.5L3.5 3.5L2 5L3 6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),

    logout: (
      <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 14H3C2.73478 14 2.48043 13.8946 2.29289 13.7071C2.10536 13.5196 2 13.2652 2 13V3C2 2.73478 2.10536 2.48043 2.29289 2.29289C2.48043 2.10536 2.73478 2 3 2H6M11 11L14 8L11 5M14 8H6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),

    // Navigation arrows
    chevronLeft: (
      <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 12L6 8L10 4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),

    chevronRight: (
      <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 4L10 8L6 12" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),

    chevronDown: (
      <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 6L8 10L12 6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),

    // Visibility
    eye: (
      <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 8C1 8 3 3 8 3C13 3 15 8 15 8C15 8 13 13 8 13C3 13 1 8 1 8Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="8" cy="8" r="2" stroke={color} strokeWidth="1.5"/>
      </svg>
    ),

    eyeOff: (
      <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7 3.5C7.33 3.48 7.66 3.47 8 3.47C13 3.47 15 8.47 15 8.47C14.66 9.13 14.24 9.74 13.76 10.29M4.52 4.5C2.85 5.57 1.71 7.41 1 8.47C1 8.47 3 13.47 8 13.47C9.45 13.47 10.72 13.05 11.81 12.37M10 10C9.78 10.23 9.52 10.42 9.23 10.56C8.94 10.7 8.63 10.78 8.31 10.79C8 10.8 7.68 10.75 7.38 10.64C7.08 10.53 6.8 10.36 6.57 10.14C6.34 9.92 6.16 9.65 6.05 9.35C5.93 9.06 5.88 8.74 5.89 8.43C5.9 8.11 5.98 7.8 6.12 7.52C6.26 7.23 6.46 6.97 6.7 6.76M1 1L15 15" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),

    // Zoom
    zoomIn: (
      <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="7" cy="7" r="4.5" stroke={color} strokeWidth="1.5"/>
        <path d="M7 5V9M5 7H9M10 10L13 13" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),

    zoomOut: (
      <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="7" cy="7" r="4.5" stroke={color} strokeWidth="1.5"/>
        <path d="M5 7H9M10 10L13 13" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),

    // More
    moreVertical: (
      <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="8" cy="3" r="1" fill={color}/>
        <circle cx="8" cy="8" r="1" fill={color}/>
        <circle cx="8" cy="13" r="1" fill={color}/>
      </svg>
    ),

    moreHorizontal: (
      <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="3" cy="8" r="1" fill={color}/>
        <circle cx="8" cy="8" r="1" fill={color}/>
        <circle cx="13" cy="8" r="1" fill={color}/>
      </svg>
    ),

    // Close
    x: (
      <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 4L4 12M4 4L12 12" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),

    // Selection
    move: (
      <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 2V14M2 8H14M8 2L5 5M8 2L11 5M8 14L5 11M8 14L11 11M2 8L5 5M2 8L5 11M14 8L11 5M14 8L11 11" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),

    // Cursor
    cursor: (
      <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 2L3 12L6 9L8 14L10 13L8 8L12 8L3 2Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),

    // Hand/Pan
    hand: (
      <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 3V8M11 5V8M5 5V10M2 8V11C2 12.657 3.343 14 5 14H8C9.657 14 11 12.657 11 11V9M14 9V7C14 6.448 13.552 6 13 6C12.448 6 12 6.448 12 7V9" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),

    // AI/Magic
    sparkles: (
      <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 2L9 6L13 7L9 8L8 12L7 8L3 7L7 6L8 2Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M13 2L13.5 3.5L15 4L13.5 4.5L13 6L12.5 4.5L11 4L12.5 3.5L13 2Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
    ),

    // View controls
    refresh: (
      <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1.5 3.5C1.5 3.5 3 1 6.5 1C10.09 1 13 3.91 13 7.5C13 11.09 10.09 14 6.5 14C3.91 14 1.5 12.5 1.5 12.5M1.5 3.5V1M1.5 3.5H4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),

    target: (
      <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="8" cy="8" r="6" stroke={color} strokeWidth="1.5"/>
        <circle cx="8" cy="8" r="3" stroke={color} strokeWidth="1.5"/>
        <circle cx="8" cy="8" r="1" fill={color}/>
      </svg>
    ),

    grid: (
      <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 6H14M2 10H14M6 2V14M10 2V14" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  }

  const icon = icons[name]

  if (!icon) {
    console.warn(`Icon "${name}" not found`)
    return null
  }

  return (
    <span style={iconStyle} className={className}>
      {icon}
    </span>
  )
}
