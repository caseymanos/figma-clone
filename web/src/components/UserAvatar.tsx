import type { CSSProperties } from 'react'

interface UserAvatarProps {
  displayName: string
  avatarUrl?: string
  status?: 'online' | 'away' | 'busy'
  size?: 'small' | 'medium' | 'large'
  cursorColor?: string
  showStatus?: boolean
}

const sizeMap = {
  small: 32,
  medium: 40,
  large: 56
}

const statusColors = {
  online: '#10b981',
  away: '#f59e0b',
  busy: '#ef4444'
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export function UserAvatar({ 
  displayName, 
  avatarUrl, 
  status = 'online',
  size = 'medium', 
  cursorColor,
  showStatus = true 
}: UserAvatarProps) {
  const dimension = sizeMap[size]
  const fontSize = dimension / 2.5
  const statusDotSize = dimension / 5

  const containerStyle: CSSProperties = {
    position: 'relative',
    width: dimension,
    height: dimension,
    flexShrink: 0
  }

  const avatarStyle: CSSProperties = {
    width: dimension,
    height: dimension,
    borderRadius: '50%',
    border: cursorColor ? `2px solid ${cursorColor}` : '2px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    background: avatarUrl ? 'transparent' : '#f3f4f6',
    fontWeight: 600,
    fontSize: fontSize,
    color: '#6b7280',
    userSelect: 'none'
  }

  const statusDotStyle: CSSProperties = {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: statusDotSize,
    height: statusDotSize,
    borderRadius: '50%',
    background: statusColors[status],
    border: '2px solid white',
    boxShadow: '0 0 4px rgba(0,0,0,0.2)'
  }

  return (
    <div style={containerStyle}>
      <div style={avatarStyle}>
        {avatarUrl ? (
          <img 
            src={avatarUrl} 
            alt={displayName}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              // Fallback to initials if image fails to load
              e.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          getInitials(displayName)
        )}
      </div>
      {showStatus && <div style={statusDotStyle} />}
    </div>
  )
}

