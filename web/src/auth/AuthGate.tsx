import type { PropsWithChildren } from 'react'
import { useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'

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
        <Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} providers={['github']} redirectTo={window.location.origin} />
      </div>
    )
  }

  return <>{children}</>
}
