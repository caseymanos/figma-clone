import type { PropsWithChildren } from 'react'
import { useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

export function AuthGate({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session || null)
      setUser(data.session?.user ?? null)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      setUser(s?.user ?? null)
    })
    return () => { sub.subscription.unsubscribe() }
  }, [])

  // Upsert profile on sign-in
  useEffect(() => {
    const u = user
    if (!u) return
    const displayName = (u.user_metadata && (u.user_metadata.full_name || u.user_metadata.name)) || u.email || 'User'
    const avatarUrl = (u.user_metadata && (u.user_metadata.avatar_url || u.user_metadata.picture)) || null
    supabase.from('profiles').upsert({ id: u.id, display_name: displayName, avatar_url: avatarUrl }).then(() => {})
  }, [user])

  if (!session || !user) {
    return (
      <div style={{ maxWidth: 420, margin: '72px auto' }}>
        <h2>Sign in to CollabCanvas</h2>
        <p style={{ margin: '12px 0', opacity: 0.8 }}>Use your GitHub account to continue.</p>
        <button
          onClick={async () => {
            await supabase.auth.signInWithOAuth({
              provider: 'github',
              options: { redirectTo: window.location.origin },
            })
          }}
          style={{
            padding: '10px 14px',
            borderRadius: 6,
            border: '1px solid #e5e7eb',
            background: '#111827',
            color: 'white',
            cursor: 'pointer',
          }}
        >
          Continue with GitHub
        </button>
      </div>
    )
  }

  return <>{children}</>
}
