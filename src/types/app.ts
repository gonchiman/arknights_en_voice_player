export type OperatorClass =
  | 'Vanguard'
  | 'Guard'
  | 'Defender'
  | 'Sniper'
  | 'Caster'
  | 'Medic'

export type VoiceLine = {
  id: string
  operatorId: string
  fileCode: string
  label: string
  category: 'Talk' | 'Battle' | 'Greeting'
  english: string
  japanese: string
  audioUrl: string | null
}

export type Operator = {
  id: string
  name: string
  japaneseName: string
  rarity: 4 | 5 | 6
  operatorClass: OperatorClass
  subclass: string
  faction: string
  voiceActor: string
  initials: string
  accent: string
  description: string
  voices: VoiceLine[]
}

export type DictationAttempt = {
  id: string
  voiceId: string
  score: number
  correct: boolean
  createdAt: string
}
