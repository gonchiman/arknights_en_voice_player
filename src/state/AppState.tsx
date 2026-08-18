import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { DictationAttempt } from '../types/app'
import { AppStateContext, type AppStateValue } from './appStateContext'

function readStored<T>(key: string, fallback: T): T {
  try {
    const stored = window.localStorage.getItem(key)
    return stored ? (JSON.parse(stored) as T) : fallback
  } catch {
    return fallback
  }
}

function useStoredState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => readStored(key, fallback))

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue] as const
}

function toggleId(ids: string[], id: string) {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [favoriteOperatorIds, setFavoriteOperatorIds] = useStoredState<string[]>(
    'akvp.favoriteOperators',
    [],
  )
  const [favoriteVoiceIds, setFavoriteVoiceIds] = useStoredState<string[]>(
    'akvp.favoriteVoices',
    [],
  )
  const [attempts, setAttempts] = useStoredState<DictationAttempt[]>(
    'akvp.dictationAttempts',
    [],
  )

  const value = useMemo<AppStateValue>(
    () => ({
      favoriteOperatorIds,
      favoriteVoiceIds,
      attempts,
      toggleOperatorFavorite: (operatorId) =>
        setFavoriteOperatorIds((current) => toggleId(current, operatorId)),
      toggleVoiceFavorite: (voiceId) =>
        setFavoriteVoiceIds((current) => toggleId(current, voiceId)),
      recordAttempt: (attempt) =>
        setAttempts((current) => [attempt, ...current].slice(0, 200)),
      clearProgress: () => setAttempts([]),
    }),
    [
      attempts,
      favoriteOperatorIds,
      favoriteVoiceIds,
      setAttempts,
      setFavoriteOperatorIds,
      setFavoriteVoiceIds,
    ],
  )

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}
