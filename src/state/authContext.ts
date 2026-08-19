import { createContext } from 'react'
import type { User } from '@supabase/supabase-js'

export type AuthStateValue = {
  user: User | null
  isLoading: boolean
  isConfigured: boolean
  error: string | null
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  clearError: () => void
}

export const AuthContext = createContext<AuthStateValue | null>(null)
