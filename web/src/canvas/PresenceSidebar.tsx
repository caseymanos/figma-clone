import { useState } from 'react'
import type { CSSProperties } from 'react'
import { usePresenceState } from './presenceState'
import { UserAvatar } from '../components/UserAvatar'
import { components } from '../styles/design-tokens'

export function PresenceSidebar() {
  const users = usePresenceState((state) => state.users)
  const [isCollapsed, setIsCollapsed] = useState(false)
  
  const userList = Object.values(users) // Show all sessions
  const userCount = userList.length

  const sidebarStyle: CSSProperties = {
    position: 'fixed',
    top: components.header.height, // Below header
    right: isCollapsed ? -280 : 0,
    width: 280,
    height: `calc(100vh - ${components.header.height})`,
    background: 'white',
    borderLeft: '1px solid #e5e7eb',
    boxShadow: isCollapsed ? 'none' : '-2px 0 8px rgba(0,0,0,0.05)',
    transition: 'right 0.3s ease',
    zIndex: 100,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  }

  const toggleButtonStyle: CSSProperties = {
    position: 'absolute',
    left: -40,
    top: 12,
    width: 40,
    height: 40,
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRight: 'none',
    borderRadius: '8px 0 0 8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    transition: 'all 0.2s',
    boxShadow: '-2px 0 4px rgba(0,0,0,0.05)'
  }

  const headerStyle: CSSProperties = {
    padding: '16px',
    borderBottom: '1px solid #e5e7eb',
    background: '#fafafa'
  }

  const userListStyle: CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: '8px'
  }

  const userItemStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 12px',
    borderRadius: 8,
    marginBottom: 4,
    transition: 'background 0.2s',
    cursor: 'default'
  }

  const emptyStateStyle: CSSProperties = {
    padding: '40px 20px',
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 14
  }

  return (
    <div style={sidebarStyle}>
      <button 
        style={toggleButtonStyle}
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? 'Show users' : 'Hide users'}
      >
        {isCollapsed ? '👥' : '→'}
      </button>

      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
            Online Users
          </h3>
          <div style={{ 
            background: '#4f46e5', 
            color: 'white', 
            padding: '2px 8px', 
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 600 
          }}>
            {userCount}
          </div>
        </div>
      </div>

      <div style={userListStyle}>
        {userCount === 0 ? (
          <div style={emptyStateStyle}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>👋</div>
            <div>No other users online</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>
              Share the canvas link to collaborate
            </div>
          </div>
        ) : (
          userList.map((user) => (
            <div 
              key={user.id} 
              style={userItemStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f9fafb'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <UserAvatar 
                displayName={user.displayName}
                avatarUrl={user.avatarUrl}
                status={user.status}
                size="medium"
                cursorColor={user.color}
                showStatus={true}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ 
                  fontWeight: 500, 
                  fontSize: 14,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {user.displayName}
                </div>
                <div style={{ 
                  fontSize: 11, 
                  color: '#9ca3af',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  marginTop: 2
                }}>
                  <span style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: user.color,
                    display: 'inline-block'
                  }} />
                  Cursor
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

