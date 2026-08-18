import { createContext } from 'react'
import type { DictationAttempt } from '../types/app'

export type AppStateValue = {
  favoriteOperatorIds: string[]
  favoriteVoiceIds: string[]
  attempts: DictationAttempt[]
  toggleOperatorFavorite: (operatorId: string) => void
  toggleVoiceFavorite: (voiceId: string) => void
  recordAttempt: (attempt: DictationAttempt) => void
  clearProgress: () => void
}

export const AppStateContext = createContext<AppStateValue | null>(null)
