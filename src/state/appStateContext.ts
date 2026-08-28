import { createContext } from 'react'
import type { DictationAttempt } from '../types/app'

export type AppStateValue = {
  favoriteOperatorIds: string[]
  favoriteVoiceIds: string[]
  attempts: DictationAttempt[]
  showJapaneseTranslations: boolean
  toggleOperatorFavorite: (operatorId: string) => void
  toggleVoiceFavorite: (voiceId: string) => void
  toggleJapaneseTranslations: () => void
  recordAttempt: (attempt: DictationAttempt) => void
  clearProgress: () => void
  syncStatus: 'local' | 'syncing' | 'synced' | 'error'
  syncError: string | null
  lastSyncedAt: string | null
  retrySync: () => void
}

export const AppStateContext = createContext<AppStateValue | null>(null)
