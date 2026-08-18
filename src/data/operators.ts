import type { Operator, OperatorClass, VoiceLine } from '../types/app'
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
    }),
  )
}

export const operators: Operator[] = [
  {
    id: 'amiya',
    name: 'Amiya',
    japaneseName: 'アーミヤ',
    rarity: 5,
    operatorClass: 'Caster',
    subclass: 'Core Caster',
    faction: 'Rhodes Island',
    voiceActor: 'Emma Ballantine',
    initials: 'AM',
    accent: '#48c7e8',
    description:
      'Rhodes Islandを率いる若きリーダー。穏やかな語り口の中に、強い決意が感じられます。',
    voices: voicesFor('amiya'),
  },
  {
    id: 'texas',
    name: 'Texas',
    japaneseName: 'テキサス',
    rarity: 5,
    operatorClass: 'Vanguard',
    subclass: 'Pioneer',
    faction: 'Penguin Logistics',
    voiceActor: 'Jessica Preddy',
    initials: 'TX',
    accent: '#7e9cff',
    description:
      '寡黙で冷静なPenguin Logisticsの運び屋。短い台詞のリズムが聞き取り練習に向いています。',
    voices: voicesFor('texas'),
  },
  {
    id: 'exusiai',
    name: 'Exusiai',
    japaneseName: 'エクシア',
    rarity: 6,
    operatorClass: 'Sniper',
    subclass: 'Marksman',
    faction: 'Penguin Logistics',
    voiceActor: 'Lisa Reimold',
    initials: 'EX',
    accent: '#ff695f',
    description:
      'いつも明るく、テンポの速い話し方が特徴の狙撃オペレーター。日常会話から戦闘時の短い掛け声まで幅広く学べます。',
    voices: voicesFor('exusiai'),
  },
  {
    id: 'silverash',
    name: 'SilverAsh',
    japaneseName: 'シルバーアッシュ',
    rarity: 6,
    operatorClass: 'Guard',
    subclass: 'Lord',
    faction: 'Karlan Trade',
    voiceActor: 'Matthew Mercer',
    initials: 'SA',
    accent: '#b9c6d0',
    description:
      'Karlan Tradeを率いるカリスマ。落ち着いた発音と長いセンテンスが特徴です。',
    voices: voicesFor('silverash'),
  },
  {
    id: 'nearl',
    name: 'Nearl',
    japaneseName: 'ニアール',
    rarity: 5,
    operatorClass: 'Defender',
    subclass: 'Guardian',
    faction: 'Rhodes Island',
    voiceActor: 'Devora Wilde',
    initials: 'NR',
    accent: '#f4c45d',
    description:
      '仲間を守ることを信条とする騎士。明瞭で力強い発音が特徴です。',
    voices: voicesFor('nearl'),
  },
  {
    id: 'ptilopsis',
    name: 'Ptilopsis',
    japaneseName: 'フィリオプシス',
    rarity: 5,
    operatorClass: 'Medic',
    subclass: 'Multi-target Medic',
    faction: 'Rhine Lab',
    voiceActor: 'Anne Yatco',
    initials: 'PT',
    accent: '#8ce0c3',
    description:
      '機械的で正確な話し方をする医療オペレーター。一定したテンポで細かな音を確認できます。',
    voices: voicesFor('ptilopsis'),
  },
  {
    id: 'myrtle',
    name: 'Myrtle',
    japaneseName: 'テンニンカ',
    rarity: 4,
    operatorClass: 'Vanguard',
    subclass: 'Standard Bearer',
    faction: 'Rhodes Island',
    voiceActor: 'Kira Buckland',
    initials: 'MY',
    accent: '#ff9a63',
    description:
      '元気いっぱいの旗手。日常会話に近い軽快な英語が特徴です。',
    voices: voicesFor('myrtle'),
  },
  {
    id: 'lappland',
    name: 'Lappland',
    japaneseName: 'ラップランド',
    rarity: 5,
    operatorClass: 'Guard',
    subclass: 'Lord',
    faction: 'Siracusa',
    voiceActor: 'Christina Kowalchuk',
    initials: 'LP',
    accent: '#e1e4e8',
    description:
      '予測できない言動と鋭い笑い声が印象的な前衛オペレーター。感情の振れ幅が大きい英語を聞き取れます。',
    voices: voicesFor('lappland'),
  },
]

export const voiceLines = operators.flatMap((operator) => operator.voices)
export const playableVoiceLines = voiceLines.filter(
  (line): line is VoiceLine & { audioUrl: string } => line.audioUrl !== null,
)

export const operatorClasses: OperatorClass[] = [
  'Vanguard',
  'Guard',
  'Defender',
  'Sniper',
  'Caster',
  'Medic',
]

export const classLabels: Record<OperatorClass, string> = {
  Vanguard: '先鋒',
  Guard: '前衛',
  Defender: '重装',
  Sniper: '狙撃',
  Caster: '術師',
  Medic: '医療',
}

export function getOperator(operatorId: string) {
  return operators.find((operator) => operator.id === operatorId)
}

export function getVoice(voiceId: string) {
  return voiceLines.find((line) => line.id === voiceId)
}
