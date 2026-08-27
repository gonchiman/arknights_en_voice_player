export type OperatorClass =
  | 'Vanguard'
  | 'Guard'
  | 'Defender'
  | 'Sniper'
  | 'Caster'
  | 'Medic'
  | 'Supporter'
  | 'Specialist'

export type OperatorRarity = 1 | 2 | 3 | 4 | 5 | 6

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

export type DictationAttempt = {
  id: string
  voiceId: string
  score: number
  correct: boolean
  createdAt: string
}
