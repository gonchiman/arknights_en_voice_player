import type { CSSProperties } from 'react'
import { isVoicePlayable } from '../lib/voicePlayback'
import { useGameCatalog } from '../state/gameCatalogContext'
import { useAppState } from '../state/useAppState'
import type { Operator } from '../types/app'
import { FavoriteButton } from './FavoriteButton'

type OperatorCardProps = {
  operator: Operator
  selected?: boolean
  onSelect?: () => void
  buttonId?: string
  clearedVoiceCount?: number
}

export function OperatorCard({
  operator,
  selected = false,
  onSelect,
  buttonId,
  clearedVoiceCount,
}: OperatorCardProps) {
  const { classLabels } = useGameCatalog()
  const { favoriteOperatorIds, toggleOperatorFavorite } = useAppState()
  const isFavorite = favoriteOperatorIds.includes(operator.id)
  const playableVoices = operator.voices.filter(isVoicePlayable).length
  const style = { '--operator-accent': operator.accent } as CSSProperties

  return (
    <article className={`operator-card${selected ? ' selected' : ''}`} style={style}>
      <button
        id={buttonId}
        type="button"
        className="operator-card-main"
        onClick={onSelect}
        aria-label={`${operator.japaneseName}（${operator.name}）のボイスを表示`}
      >
        <span className="operator-card-copy">
          <span className="operator-stars" aria-label={`${operator.rarity} stars`}>
            {'★'.repeat(operator.rarity)}
          </span>
          <strong>{operator.japaneseName}</strong>
          <span>{operator.name}</span>
        </span>
        <span className="operator-card-meta">
          <span>{classLabels[operator.operatorClass]}</span>
          <span>
            {clearedVoiceCount !== undefined
              ? `クリア ${clearedVoiceCount} / ${playableVoices}`
              : playableVoices === operator.voices.length
              ? `${playableVoices} voices`
              : `${playableVoices}/${operator.voices.length} voices`}
          </span>
        </span>
      </button>
      <FavoriteButton
        active={isFavorite}
        compact
        label={operator.japaneseName}
        onClick={() => toggleOperatorFavorite(operator.id)}
      />
    </article>
  )
}
