import type { PropsWithChildren } from 'react'
import { useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

export function AuthGate({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState<{ github?: boolean; google?: boolean; email?: boolean }>({})

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
    supabase.from('profiles').upsert({ 
      id: u.id, 
      display_name: displayName, 
      avatar_url: avatarUrl,
      status: 'online',
      last_seen: new Date().toISOString()
    }).then(() => {})
  }, [user])

  if (!session || !user) {
    return (
      <div style={{ maxWidth: 420, margin: '72px auto' }}>
        <h2>Sign in to CollabCanvas</h2>
        <p style={{ margin: '12px 0', opacity: 0.8 }}>Use your GitHub account to continue.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={async () => {
              try {
                setError(null); setLoading((l) => ({ ...l, github: true }))
                await supabase.auth.signInWithOAuth({ provider: 'github', options: { redirectTo: window.location.origin } })
              } catch (e: any) {
                setError(e?.message || 'GitHub sign-in failed')
              } finally {
                setLoading((l) => ({ ...l, github: false }))
              }
            }}
            disabled={!!loading.github}
            style={{ padding: '10px 14px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#111827', color: 'white', cursor: 'pointer' }}
          >
            {loading.github ? 'Signing in…' : 'Continue with GitHub'}
          </button>

          <button
            onClick={async () => {
              try {
                setError(null); setLoading((l) => ({ ...l, google: true }))
                await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
              } catch (e: any) {
                setError(e?.message || 'Google sign-in failed')
              } finally {
                setLoading((l) => ({ ...l, google: false }))
              }
            }}
            disabled={!!loading.google}
            style={{ padding: '10px 14px', borderRadius: 6, border: '1px solid #e5e7eb', background: 'white', color: '#111827', cursor: 'pointer' }}
          >
            {loading.google ? 'Signing in…' : 'Continue with Google'}
          </button>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ flex: 1, padding: '10px 12px', borderRadius: 6, border: '1px solid #e5e7eb' }}
            />
            <button
              onClick={async () => {
                try {
                  setError(null); setInfo(null); setLoading((l) => ({ ...l, email: true }))
                  const { error: otpError } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })
                  if (otpError) throw otpError
                  setInfo('Check your email for a magic link to sign in.')
                } catch (e: any) {
                  setError(e?.message || 'Email sign-in failed')
                } finally {
                  setLoading((l) => ({ ...l, email: false }))
                }
              }}
              disabled={!email || !!loading.email}
              style={{ padding: '10px 14px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#111827', color: 'white', cursor: 'pointer' }}
            >
              {loading.email ? 'Sending…' : 'Send magic link'}
            </button>
          </div>
        </div>

        {error ? <p style={{ color: '#b91c1c', marginTop: 8 }}>{error}</p> : null}
        {info ? <p style={{ color: '#065f46', marginTop: 8 }}>{info}</p> : null}
      </div>
    )
  }

  return <>{children}</>
}
