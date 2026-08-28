import type { GameModeId } from '../config/gameModes'
import { isVoiceConfiguredForPlayback } from '../lib/voicePlayback'
import type { GameCatalog } from '../types/app'
import { endfieldOperators } from './endfieldOperatorData'
import { arknightsCatalog } from './operators'

const endfieldVoiceLines = endfieldOperators.flatMap((operator) => operator.voices)

export const endfieldCatalog: GameCatalog = {
  id: 'endfield',
  operators: endfieldOperators,
  voiceLines: endfieldVoiceLines,
  playableVoiceLines: endfieldVoiceLines.filter(isVoiceConfiguredForPlayback),
  operatorClasses: ['Guard', 'Defender', 'Supporter', 'Caster', 'Vanguard', 'Striker'],
  classLabels: {
    Guard: '前衛',
    Defender: '重装',
    Supporter: '補助',
    Caster: '術師',
    Vanguard: '先鋒',
    Striker: '突撃',
  },
  rarityOptions: [6, 5, 4],
  classFilterLabel: 'クラス',
  secondaryMetadataLabel: 'ELEMENT',
  source: {
    label: 'Warfarin Wiki（データ・音声出典）',
    url: 'https://warfarin.wiki/en/operators',
  },
  notice:
    '英語音声はWarfarin Wikiからストリーミング再生します。取得できない場合はブラウザTTSへ切り替えられます。公開元の変更により再生できなくなる場合があります。',
}

const catalogs: Record<GameModeId, GameCatalog> = {
  arknights: arknightsCatalog,
  endfield: endfieldCatalog,
}

export function getGameCatalog(gameMode: GameModeId) {
  return catalogs[gameMode]
}
