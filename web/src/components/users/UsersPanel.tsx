import { useState, useEffect } from 'react'
import * as Collapsible from '@radix-ui/react-collapsible'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import { usePresenceState } from '../../canvas/presenceState'
import { UserAvatar } from '../UserAvatar'
import { components, colors, spacing, borderRadius, typography, shadows, zIndex } from '../../styles/design-tokens'

const STORAGE_KEY = 'users-panel-collapsed'

export function UsersPanel() {
  const users = usePresenceState((state) => state.users)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : false
    } catch {
      return false
    }
  })

  const userList = Object.values(users)
  const userCount = userList.length

  // Persist collapsed state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(isCollapsed))
  }, [isCollapsed])

  return (
    <Collapsible.Root
      open={!isCollapsed}
      onOpenChange={(open) => setIsCollapsed(!open)}
      style={{
        position: 'fixed',
        top: components.header.height,
        right: 0,
        zIndex: zIndex.sidebar,
        height: `calc(100vh - ${components.header.height})`,
        display: 'flex',
        flexDirection: 'row-reverse',
        pointerEvents: 'none',
      }}
    >
      {/* Toggle button pill */}
      <Collapsible.Trigger
        style={{
          pointerEvents: 'auto',
          position: 'relative',
          width: 40,
          height: 40,
          margin: spacing[3],
          background: colors.chrome.header,
          border: `1px solid ${colors.gray[700]}`,
          borderRadius: borderRadius.full,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          transition: 'all 0.2s',
          boxShadow: shadows.md,
          color: colors.text.inverse,
        }}
        title={isCollapsed ? 'Show users' : 'Hide users'}
      >
        {isCollapsed ? '👥' : '→'}
        {userCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              background: colors.primary[600],
              color: 'white',
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.semibold,
              width: 20,
              height: 20,
              borderRadius: borderRadius.full,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `2px solid ${colors.chrome.header}`,
            }}
          >
            {userCount}
          </span>
        )}
      </Collapsible.Trigger>

      {/* Panel content */}
      <Collapsible.Content
        style={{
          pointerEvents: 'auto',
          width: 280,
          height: '100%',
          background: 'white',
          borderLeft: `1px solid ${colors.border.base}`,
          boxShadow: shadows.panel,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: spacing[4],
            borderBottom: `1px solid ${colors.border.base}`,
            background: colors.gray[50],
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3
              style={{
                margin: 0,
                fontSize: typography.fontSize.md,
                fontWeight: typography.fontWeight.semibold,
                color: colors.text.primary,
                fontFamily: typography.fontFamily.base,
              }}
            >
              Online Users
            </h3>
            <div
              style={{
                background: colors.primary[600],
                color: 'white',
                padding: '2px 8px',
                borderRadius: borderRadius.full,
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.semibold,
              }}
            >
              {userCount}
            </div>
          </div>
        </div>

        {/* User list with scroll */}
        <ScrollArea.Root
          style={{
            flex: 1,
            overflow: 'hidden',
          }}
        >
          <ScrollArea.Viewport style={{ width: '100%', height: '100%' }}>
            {userCount === 0 ? (
              <div
                style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: colors.text.tertiary,
                  fontSize: typography.fontSize.sm,
                  fontFamily: typography.fontFamily.base,
                }}
              >
                No other users online
              </div>
            ) : (
              <div style={{ padding: spacing[2] }}>
                {userList.map((user) => (
                  <div
                    key={user.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing[3],
                      padding: spacing[3],
                      borderRadius: borderRadius.base,
                      marginBottom: spacing[1],
                      transition: 'background 0.2s',
                      cursor: 'default',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = colors.gray[50]
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <UserAvatar
                      displayName={user.displayName}
                      avatarUrl={user.avatarUrl}
                      status={user.status}
                      color={user.color}
                      size="sm"
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: typography.fontSize.sm,
                          fontWeight: typography.fontWeight.medium,
                          color: colors.text.primary,
                          fontFamily: typography.fontFamily.base,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {user.displayName}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar
            orientation="vertical"
            style={{
              display: 'flex',
              userSelect: 'none',
              touchAction: 'none',
              padding: 2,
              background: colors.gray[100],
              width: 8,
            }}
          >
            <ScrollArea.Thumb
              style={{
                flex: 1,
                background: colors.gray[400],
                borderRadius: borderRadius.full,
                position: 'relative',
              }}
            />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      </Collapsible.Content>
    </Collapsible.Root>
  )
}

