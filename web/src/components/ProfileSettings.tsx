import { useEffect, useState, useRef } from 'react'
import type { CSSProperties } from 'react'
import { supabase } from '../lib/supabaseClient'
import { UserAvatar } from './UserAvatar'

interface ProfileSettingsProps {
  onClose: () => void
}

export function ProfileSettings({ onClose }: ProfileSettingsProps) {
  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>()
  const [status, setStatus] = useState<'online' | 'away' | 'busy'>('online')
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUserId(user.id)

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, avatar_url, status')
        .eq('id', user.id)
        .maybeSingle()

      if (profile) {
        setDisplayName(profile.display_name || '')
        setAvatarUrl(profile.avatar_url || undefined)
        setStatus((profile.status as 'online' | 'away' | 'busy') || 'online')
      }
    } catch (error: any) {
      console.error('Error loading profile:', error)
    }
  }

  const handleSave = async () => {
    if (!userId) return
    
    setLoading(true)
    setMessage(null)
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          status: status,
          last_seen: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw error

      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      setTimeout(() => {
        onClose()
      }, 1000)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' })
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!userId || !event.target.files || event.target.files.length === 0) return

    const file = event.target.files[0]
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File size must be less than 2MB' })
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'File must be an image' })
      return
    }

    setUploading(true)
    setMessage(null)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/${Date.now()}.${fileExt}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId)

      if (updateError) throw updateError

      setAvatarUrl(publicUrl)
      setMessage({ type: 'success', text: 'Avatar uploaded successfully!' })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to upload avatar' })
    } finally {
      setUploading(false)
    }
  }

  const overlayStyle: CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(2px)'
  }

  const modalStyle: CSSProperties = {
    background: 'white',
    borderRadius: 12,
    padding: 32,
    maxWidth: 480,
    width: '90%',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    position: 'relative'
  }

  const headerStyle: CSSProperties = {
    fontSize: 24,
    fontWeight: 600,
    marginBottom: 24,
    color: '#111827'
  }

  const sectionStyle: CSSProperties = {
    marginBottom: 20
  }

  const labelStyle: CSSProperties = {
    display: 'block',
    fontSize: 14,
    fontWeight: 500,
    marginBottom: 8,
    color: '#374151'
  }

  const inputStyle: CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 6,
    border: '1px solid #e5e7eb',
    fontSize: 14,
    boxSizing: 'border-box'
  }

  const statusButtonStyle = (isActive: boolean): CSSProperties => ({
    flex: 1,
    padding: '10px',
    borderRadius: 6,
    border: isActive ? '2px solid #4f46e5' : '1px solid #e5e7eb',
    background: isActive ? '#f5f3ff' : 'white',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: isActive ? 600 : 400,
    transition: 'all 0.2s'
  })

  const buttonStyle: CSSProperties = {
    padding: '10px 20px',
    borderRadius: 6,
    border: 'none',
    background: '#4f46e5',
    color: 'white',
    fontSize: 14,
    fontWeight: 500,
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.6 : 1
  }

  const secondaryButtonStyle: CSSProperties = {
    padding: '10px 20px',
    borderRadius: 6,
    border: '1px solid #e5e7eb',
    background: 'white',
    color: '#374151',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer'
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <h2 style={headerStyle}>Profile Settings</h2>

        <div style={sectionStyle}>
          <label style={labelStyle}>Avatar</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <UserAvatar 
              displayName={displayName || 'User'}
              avatarUrl={avatarUrl}
              size="large"
              showStatus={false}
            />
            <div style={{ flex: 1 }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                style={{ display: 'none' }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{
                  ...secondaryButtonStyle,
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  opacity: uploading ? 0.6 : 1,
                  width: '100%'
                }}
              >
                {uploading ? 'Uploading...' : 'Upload New Avatar'}
              </button>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                Max 2MB, JPG/PNG
              </div>
            </div>
          </div>
        </div>

        <div style={sectionStyle}>
          <label style={labelStyle}>Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter your name"
            style={inputStyle}
          />
        </div>

        <div style={sectionStyle}>
          <label style={labelStyle}>Status</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setStatus('online')}
              style={statusButtonStyle(status === 'online')}
            >
              🟢 Online
            </button>
            <button
              onClick={() => setStatus('away')}
              style={statusButtonStyle(status === 'away')}
            >
              🟡 Away
            </button>
            <button
              onClick={() => setStatus('busy')}
              style={statusButtonStyle(status === 'busy')}
            >
              🔴 Busy
            </button>
          </div>
        </div>

        {message && (
          <div style={{
            padding: '10px 12px',
            borderRadius: 6,
            background: message.type === 'success' ? '#d1fae5' : '#fee2e2',
            color: message.type === 'success' ? '#065f46' : '#991b1b',
            fontSize: 14,
            marginBottom: 20
          }}>
            {message.text}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={secondaryButtonStyle}>
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            disabled={loading}
            style={buttonStyle}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

