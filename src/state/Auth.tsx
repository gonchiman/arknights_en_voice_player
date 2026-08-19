import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { getAuthRedirectUrl, isSupabaseConfigured, supabase } from '../lib/supabase'
import { AuthContext, type AuthStateValue } from './authContext'

const returnRouteKey = 'akvp.authReturnRoute'

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : '認証処理に失敗しました。'
}

function restoreReturnRoute() {
  const returnRoute = window.localStorage.getItem(returnRouteKey)
  if (!returnRoute) return
  window.localStorage.removeItem(returnRouteKey)
  window.setTimeout(() => {
    window.location.hash = returnRoute
  }, 0)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) return

    let active = true
    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return
      if (sessionError) setError(sessionError.message)
      setUser(data.session?.user ?? null)
      setIsLoading(false)
    })

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return
      setUser(session?.user ?? null)
      setIsLoading(false)
      if (event === 'SIGNED_IN') restoreReturnRoute()
    })

    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) {
      setError('Supabaseの環境変数が設定されていません。')
      return
    }

    setError(null)
    window.localStorage.setItem(returnRouteKey, window.location.hash || '#/')
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: getAuthRedirectUrl() },
    })
    if (signInError) {
      window.localStorage.removeItem(returnRouteKey)
      setError(errorMessage(signInError))
    }
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) return
    setError(null)
    const { error: signOutError } = await supabase.auth.signOut()
    if (signOutError) setError(errorMessage(signOutError))
  }, [])

  const value = useMemo<AuthStateValue>(
    () => ({
      user,
      isLoading,
      isConfigured: isSupabaseConfigured,
      error,
      signInWithGoogle,
      signOut,
      clearError: () => setError(null),
    }),
    [error, isLoading, signInWithGoogle, signOut, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
