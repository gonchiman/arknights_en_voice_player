import type { GameModeId } from '../config/gameModes'

export type OperatorClass = string

export type OperatorRarity = number

export type VoicePlaybackMode = 'audio' | 'tts' | 'unavailable'

export type VoiceLine = {
  id: string
  operatorId: string
  fileCode: string
  displayCode?: string
  label: string
  category: 'Talk' | 'Battle' | 'Greeting'
  english: string
  japanese: string
  audioUrl: string | null
  playbackMode: VoicePlaybackMode
}

export type Operator = {
  id: string
  charId: string
  name: string
  japaneseName: string
  rarity: OperatorRarity
  operatorClass: OperatorClass
  subclass: string
  faction: string
  voiceActor: string
  initials: string
  accent: string
  description: string
  voices: VoiceLine[]
}

export type OperatorCatalogRecord = Omit<Operator, 'voices'>

export type GameCatalog = {
  id: GameModeId
  operators: Operator[]
  voiceLines: VoiceLine[]
  playableVoiceLines: VoiceLine[]
  operatorClasses: string[]
  classLabels: Record<string, string>
  rarityOptions: number[]
  classFilterLabel: string
  secondaryMetadataLabel: string
  source: {
    label: string
    url: string
  }
  notice?: string
}

export type DictationAttempt = {
  id: string
  voiceId: string
  score: number
  correct: boolean
  createdAt: string
}
