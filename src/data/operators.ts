import type { Operator, OperatorClass, VoiceLine } from '../types/app'
import { isVoiceConfiguredForPlayback } from '../lib/voicePlayback'
import { operatorCatalog } from './operatorCatalog'
import { operatorVoiceRecords } from './operatorVoices'

const audioRoot =
  'https://raw.githubusercontent.com/PseudoMon/arknights-audio/global-server-voices/voice_en'

function voicesFor(operatorId: string): VoiceLine[] {
  return (operatorVoiceRecords[operatorId] ?? []).map(
    ({ audioPath, ...record }) => ({
      ...record,
      id: `${operatorId}-${record.fileCode.toLowerCase()}`,
      operatorId,
      audioUrl: audioPath ? `${audioRoot}/${audioPath}` : null,
      playbackMode: audioPath ? 'audio' : 'unavailable',
    }),
  )
}

export const operators: Operator[] = operatorCatalog.map((record) => ({
  ...record,
  voices: voicesFor(record.id),
}))

export const voiceLines = operators.flatMap((operator) => operator.voices)
export const playableVoiceLines = voiceLines.filter(
  isVoiceConfiguredForPlayback,
)

export const operatorClasses: OperatorClass[] = [
  'Vanguard',
  'Guard',
  'Defender',
  'Sniper',
  'Caster',
  'Medic',
  'Supporter',
  'Specialist',
]

export const classLabels: Record<string, string> = {
  Vanguard: '先鋒',
  Guard: '前衛',
  Defender: '重装',
  Sniper: '狙撃',
  Caster: '術師',
  Medic: '医療',
  Supporter: '補助',
  Specialist: '特殊',
}

export const arknightsCatalog = {
  id: 'arknights',
  operators,
  voiceLines,
  playableVoiceLines,
  operatorClasses,
  classLabels,
  rarityOptions: [6, 5, 4, 3, 2, 1],
  classFilterLabel: '職業',
  secondaryMetadataLabel: 'BRANCH',
  source: {
    label: 'Arknights Audio（音声データ）',
    url: 'https://github.com/PseudoMon/arknights-audio',
  },
} satisfies import('../types/app').GameCatalog

export function getOperator(operatorId: string) {
  return operators.find((operator) => operator.id === operatorId)
}

export function getVoice(voiceId: string) {
  return voiceLines.find((line) => line.id === voiceId)
}
