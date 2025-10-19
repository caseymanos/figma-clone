import { useState, useRef, useEffect } from 'react'
import type { CSSProperties } from 'react'
import { usePresenceState } from './presenceState'
import type { PresenceUser } from './presenceState'
import { colors, typography, spacing, borderRadius, shadows, components, transitions } from '../styles/design-tokens'

// ============================================================================
// SHARED COMPONENTS
// ============================================================================

interface AvatarProps {
  user: PresenceUser
  size?: number
  showStatus?: boolean
  onClick?: () => void
}

function Avatar({ user, size = 32, showStatus = true, onClick }: AvatarProps) {
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  const containerStyle: CSSProperties = {
    position: 'relative',
    width: size,
    height: size,
    flexShrink: 0,
    cursor: onClick ? 'pointer' : 'default'
  }

  const avatarStyle: CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50%',
    border: `2px solid ${user.color}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    background: user.avatarUrl ? 'transparent' : colors.gray[100],
    fontWeight: typography.fontWeight.semibold,
    fontSize: size / 2.5,
    color: colors.text.secondary,
    userSelect: 'none',
    transition: transitions.all
  }

  const statusDotSize = Math.max(6, size / 5)
  const statusDotStyle: CSSProperties = {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: statusDotSize,
    height: statusDotSize,
    borderRadius: '50%',
    background: colors.status[user.status],
    border: '2px solid white',
    boxShadow: shadows.sm
  }

  return (
    <div style={containerStyle} onClick={onClick}>
      <div style={avatarStyle}>
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.displayName}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          getInitials(user.displayName)
        )}
      </div>
      {showStatus && <div style={statusDotStyle} />}
    </div>
  )
}

interface TooltipProps {
  user: PresenceUser
  anchor: HTMLElement
}

function Tooltip({ user, anchor }: TooltipProps) {
  const [position, setPosition] = useState({ top: 0, left: 0 })

  useEffect(() => {
    const rect = anchor.getBoundingClientRect()
    setPosition({
      top: rect.bottom + 8,
      left: rect.left + rect.width / 2
    })
  }, [anchor])

  const tooltipStyle: CSSProperties = {
    position: 'fixed',
    top: position.top,
    left: position.left,
    transform: 'translateX(-50%)',
    background: colors.gray[900],
    color: 'white',
    padding: `${spacing[2]} ${spacing[3]}`,
    borderRadius: borderRadius.md,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    whiteSpace: 'nowrap',
    boxShadow: shadows.lg,
    zIndex: 1000,
    pointerEvents: 'none',
    animation: 'tooltipFadeIn 150ms ease-out'
  }

  const arrowStyle: CSSProperties = {
    position: 'absolute',
    top: -4,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 0,
    height: 0,
    borderLeft: '4px solid transparent',
    borderRight: '4px solid transparent',
    borderBottom: `4px solid ${colors.gray[900]}`
  }

  const statusStyle: CSSProperties = {
    display: 'inline-block',
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: colors.status[user.status],
    marginRight: spacing[1]
  }

  return (
    <>
      <style>{`
        @keyframes tooltipFadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-4px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
      <div style={tooltipStyle}>
        <div style={arrowStyle} />
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
          <span style={statusStyle} />
          {user.displayName}
        </div>
      </div>
    </>
  )
}

// ============================================================================
// STYLE 1: COMPACT STACK (Figma-like horizontal avatars)
// ============================================================================

export function CompactStackPresence() {
  const users = usePresenceState((state) => state.users)
  const [hoveredUser, setHoveredUser] = useState<{ user: PresenceUser; anchor: HTMLElement } | null>(null)

  const userList = Object.values(users)
  const visibleUsers = userList.slice(0, 5)
  const hiddenCount = Math.max(0, userList.length - 5)

  const containerStyle: CSSProperties = {
    position: 'fixed',
    top: 12,
    right: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 0,
    zIndex: 200,
    background: 'white',
    padding: `${spacing[1]} ${spacing[2]}`,
    borderRadius: borderRadius.full,
    boxShadow: shadows.md,
    border: `1px solid ${colors.border.base}`
  }

  const avatarWrapperStyle = (index: number): CSSProperties => ({
    marginLeft: index > 0 ? -10 : 0,
    position: 'relative',
    transition: transitions.transform,
    zIndex: visibleUsers.length - index
  })

  const countBadgeStyle: CSSProperties = {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: colors.gray[200],
    color: colors.text.secondary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -10,
    border: '2px solid white'
  }

  if (userList.length === 0) return null

  return (
    <>
      <div style={containerStyle}>
        {visibleUsers.map((user, index) => (
          <div
            key={user.id}
            style={avatarWrapperStyle(index)}
            onMouseEnter={(e) => setHoveredUser({ user, anchor: e.currentTarget })}
            onMouseLeave={() => setHoveredUser(null)}
          >
            <Avatar user={user} size={32} />
          </div>
        ))}
        {hiddenCount > 0 && (
          <div style={countBadgeStyle}>
            +{hiddenCount}
          </div>
        )}
      </div>
      {hoveredUser && <Tooltip user={hoveredUser.user} anchor={hoveredUser.anchor} />}
    </>
  )
}

// ============================================================================
// STYLE 2: MODERN CARDS (Polished sidebar with cards)
// ============================================================================

export function ModernCardsPresence() {
  const users = usePresenceState((state) => state.users)
  const [isCollapsed, setIsCollapsed] = useState(false)

  const userList = Object.values(users)
  const userCount = userList.length

  const sidebarStyle: CSSProperties = {
    position: 'fixed',
    top: components.header.height,
    right: isCollapsed ? -300 : 0,
    width: 300,
    height: `calc(100vh - ${components.header.height})`,
    background: colors.gray[50],
    borderLeft: `1px solid ${colors.border.base}`,
    boxShadow: isCollapsed ? 'none' : shadows.panel,
    transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    zIndex: 100,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  }

  const toggleButtonStyle: CSSProperties = {
    position: 'absolute',
    left: -44,
    top: 16,
    width: 44,
    height: 44,
    background: 'white',
    border: `1px solid ${colors.border.base}`,
    borderRight: 'none',
    borderRadius: `${borderRadius.md} 0 0 ${borderRadius.md}`,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    transition: transitions.all,
    boxShadow: shadows.sm,
    color: colors.text.secondary
  }

  const headerStyle: CSSProperties = {
    padding: spacing[4],
    borderBottom: `1px solid ${colors.border.base}`,
    background: 'white'
  }

  const userListStyle: CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: spacing[3]
  }

  const cardStyle = (user: PresenceUser): CSSProperties => ({
    background: 'white',
    borderRadius: borderRadius.md,
    padding: spacing[3],
    marginBottom: spacing[2],
    borderLeft: `3px solid ${user.color}`,
    boxShadow: shadows.sm,
    transition: transitions.all,
    cursor: 'default'
  })

  const emptyStateStyle: CSSProperties = {
    padding: `${spacing[12]} ${spacing[4]}`,
    textAlign: 'center',
    color: colors.text.tertiary
  }

  return (
    <div style={sidebarStyle}>
      <button
        style={toggleButtonStyle}
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? 'Show users' : 'Hide users'}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = colors.gray[50]
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'white'
        }}
      >
        {isCollapsed ? '👥' : '→'}
      </button>

      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{
              margin: 0,
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary
            }}>
              Active Now
            </h3>
            <p style={{
              margin: `${spacing[1]} 0 0 0`,
              fontSize: typography.fontSize.sm,
              color: colors.text.tertiary
            }}>
              {userCount} {userCount === 1 ? 'person' : 'people'} online
            </p>
          </div>
        </div>
      </div>

      <div style={userListStyle}>
        {userCount === 0 ? (
          <div style={emptyStateStyle}>
            <div style={{ fontSize: 40, marginBottom: spacing[3] }}>👋</div>
            <div style={{ fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.medium, color: colors.text.secondary }}>
              No one else here yet
            </div>
            <div style={{ fontSize: typography.fontSize.sm, marginTop: spacing[2] }}>
              Share the canvas link to collaborate
            </div>
          </div>
        ) : (
          userList.map((user) => (
            <div
              key={user.id}
              style={cardStyle(user)}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = shadows.md
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = shadows.sm
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
                <Avatar user={user} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: typography.fontWeight.semibold,
                    fontSize: typography.fontSize.md,
                    color: colors.text.primary,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {user.displayName}
                  </div>
                  <div style={{
                    fontSize: typography.fontSize.sm,
                    color: colors.text.tertiary,
                    marginTop: 2
                  }}>
                    Viewing canvas
                  </div>
                </div>
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: colors.status[user.status],
                  flexShrink: 0
                }} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ============================================================================
// STYLE 3: MINIMAL BAR (Narrow vertical sidebar)
// ============================================================================

export function MinimalBarPresence() {
  const users = usePresenceState((state) => state.users)
  const currentUserId = usePresenceState((state) => state.currentUserId)
  const [hoveredUser, setHoveredUser] = useState<{ user: PresenceUser; anchor: HTMLElement } | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Sort users: current user first, then others
  const userList = Object.values(users).sort((a, b) => {
    if (a.id === currentUserId) return -1
    if (b.id === currentUserId) return 1
    return 0
  })

  const MAX_VISIBLE_USERS = 6
  const totalUsers = userList.length
  const visibleUsers = userList.slice(0, MAX_VISIBLE_USERS)
  const overflowCount = Math.max(0, totalUsers - MAX_VISIBLE_USERS)

  // Calculate dynamic height based on user count
  const itemHeight = 40 // avatar size
  const itemGap = 8 // gap between avatars (spacing[2])
  const padding = 12 // top and bottom padding (spacing[3])
  const toggleButtonHeight = 36 + 16 // button + margin

  const itemsToShow = Math.min(totalUsers, MAX_VISIBLE_USERS) + (overflowCount > 0 ? 1 : 0) // +1 for overflow badge
  const contentHeight = itemsToShow * itemHeight + (itemsToShow - 1) * itemGap + padding * 2 + toggleButtonHeight

  const sidebarStyle: CSSProperties = {
    position: 'fixed',
    top: components.header.height,
    right: isCollapsed ? -72 : 0,
    width: 72,
    height: `${contentHeight}px`,
    background: 'white',
    borderLeft: `1px solid ${colors.border.base}`,
    borderBottom: `1px solid ${colors.border.base}`,
    borderBottomLeftRadius: borderRadius.md,
    boxShadow: isCollapsed ? 'none' : shadows.panel,
    transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1), height 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    zIndex: 100,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: `${spacing[3]} 0`,
    gap: spacing[2]
  }

  const toggleButtonStyle: CSSProperties = {
    position: 'absolute',
    left: -36,
    top: 16,
    width: 36,
    height: 36,
    background: 'white',
    border: `1px solid ${colors.border.base}`,
    borderRight: 'none',
    borderRadius: `${borderRadius.base} 0 0 ${borderRadius.base}`,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    transition: transitions.all,
    boxShadow: shadows.sm,
    color: colors.text.secondary
  }

  const avatarWrapperStyle: CSSProperties = {
    position: 'relative',
    cursor: 'pointer',
    transition: transitions.transform
  }

  const overflowBadgeStyle: CSSProperties = {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: colors.gray[100],
    border: `2px solid ${colors.gray[300]}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    cursor: 'default',
    flexShrink: 0
  }

  if (userList.length === 0 && !isCollapsed) {
    return (
      <div style={{...sidebarStyle, height: `${toggleButtonHeight + padding * 2 + 40}px`}}>
        <button
          style={toggleButtonStyle}
          onClick={() => setIsCollapsed(!isCollapsed)}
          title="Hide"
        >
          →
        </button>
        <div style={{
          color: colors.text.tertiary,
          fontSize: typography.fontSize.xs,
          textAlign: 'center',
          padding: spacing[2]
        }}>
          <div style={{ fontSize: 24 }}>👋</div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div style={sidebarStyle}>
        <button
          style={toggleButtonStyle}
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Show users' : 'Hide users'}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = colors.gray[50]
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'white'
          }}
        >
          {isCollapsed ? '👥' : '→'}
        </button>

        {visibleUsers.map((user) => (
          <div
            key={user.id}
            style={avatarWrapperStyle}
            onMouseEnter={(e) => {
              setHoveredUser({ user, anchor: e.currentTarget })
              e.currentTarget.style.transform = 'scale(1.1)'
            }}
            onMouseLeave={(e) => {
              setHoveredUser(null)
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            <Avatar user={user} size={40} />
          </div>
        ))}

        {overflowCount > 0 && (
          <div style={overflowBadgeStyle}>
            +{overflowCount}
          </div>
        )}
      </div>
      {hoveredUser && <Tooltip user={hoveredUser.user} anchor={hoveredUser.anchor} />}
    </>
  )
}

// ============================================================================
// STYLE 4: DROPDOWN PANEL (Header button with floating menu)
// ============================================================================

export function DropdownPanelPresence() {
  const users = usePresenceState((state) => state.users)
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const userList = Object.values(users)
  const visibleInButton = userList.slice(0, 3)
  const totalCount = userList.length

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: Event) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const buttonStyle: CSSProperties = {
    position: 'fixed',
    top: 8,
    right: 16,
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
    background: 'white',
    border: `1px solid ${colors.border.base}`,
    borderRadius: borderRadius.full,
    padding: `${spacing[1]} ${spacing[2]} ${spacing[1]} ${spacing[1]}`,
    cursor: 'pointer',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    boxShadow: isOpen ? shadows.md : shadows.sm,
    transition: transitions.all,
    zIndex: 300
  }

  const avatarStackStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center'
  }

  const panelStyle: CSSProperties = {
    position: 'fixed',
    top: 56,
    right: 16,
    width: 320,
    maxHeight: 480,
    background: 'white',
    borderRadius: borderRadius.md,
    boxShadow: shadows.xl,
    border: `1px solid ${colors.border.base}`,
    overflow: 'hidden',
    zIndex: 300,
    animation: 'dropdownSlideIn 200ms cubic-bezier(0.4, 0, 0.2, 1)'
  }

  const panelHeaderStyle: CSSProperties = {
    padding: spacing[4],
    borderBottom: `1px solid ${colors.border.base}`,
    background: colors.gray[50]
  }

  const panelListStyle: CSSProperties = {
    maxHeight: 360,
    overflowY: 'auto',
    padding: spacing[2]
  }

  const userItemStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[2],
    borderRadius: borderRadius.base,
    transition: transitions.all,
    cursor: 'default'
  }

  if (userList.length === 0) return null

  return (
    <>
      <style>{`
        @keyframes dropdownSlideIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <button
        ref={buttonRef}
        style={buttonStyle}
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={(e) => {
          if (!isOpen) e.currentTarget.style.boxShadow = shadows.md
        }}
        onMouseLeave={(e) => {
          if (!isOpen) e.currentTarget.style.boxShadow = shadows.sm
        }}
      >
        <div style={avatarStackStyle}>
          {visibleInButton.map((user, index) => (
            <div key={user.id} style={{ marginLeft: index > 0 ? -8 : 0, zIndex: visibleInButton.length - index }}>
              <Avatar user={user} size={28} showStatus={false} />
            </div>
          ))}
        </div>
        <span>
          {totalCount} {totalCount === 1 ? 'person' : 'people'}
        </span>
        <span style={{ fontSize: 12, marginLeft: -4 }}>
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {isOpen && (
        <div ref={panelRef} style={panelStyle}>
          <div style={panelHeaderStyle}>
            <h3 style={{
              margin: 0,
              fontSize: typography.fontSize.md,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary
            }}>
              Active Now
            </h3>
            <p style={{
              margin: `${spacing[1]} 0 0 0`,
              fontSize: typography.fontSize.sm,
              color: colors.text.tertiary
            }}>
              {totalCount} {totalCount === 1 ? 'person is' : 'people are'} viewing this canvas
            </p>
          </div>

          <div style={panelListStyle}>
            {userList.map((user) => (
              <div
                key={user.id}
                style={userItemStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = colors.gray[50]
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <Avatar user={user} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: typography.fontWeight.medium,
                    fontSize: typography.fontSize.md,
                    color: colors.text.primary,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {user.displayName}
                  </div>
                  <div style={{
                    fontSize: typography.fontSize.sm,
                    color: colors.text.tertiary,
                    marginTop: 2
                  }}>
                    Viewing
                  </div>
                </div>
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: user.color,
                  flexShrink: 0,
                  boxShadow: `0 0 0 2px ${user.color}33`
                }} />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
