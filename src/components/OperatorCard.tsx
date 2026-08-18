import type { CSSProperties } from 'react'
import { classLabels } from '../data/operators'
import { useAppState } from '../state/useAppState'
import type { Operator } from '../types/app'
import { FavoriteButton } from './FavoriteButton'

type OperatorCardProps = {
  operator: Operator
  selected?: boolean
  onSelect?: () => void
}

export function OperatorCard({ operator, selected = false, onSelect }: OperatorCardProps) {
  const { favoriteOperatorIds, toggleOperatorFavorite } = useAppState()
  const isFavorite = favoriteOperatorIds.includes(operator.id)
  const playableVoices = operator.voices.filter(
    (voice) => voice.audioUrl !== null,
  ).length
  const style = { '--operator-accent': operator.accent } as CSSProperties

  return (
    <article className={`operator-card${selected ? ' selected' : ''}`} style={style}>
      <button
        type="button"
        className="operator-card-main"
        onClick={onSelect}
        aria-label={`${operator.name}のボイスを表示`}
      >
        <span className="operator-monogram" aria-hidden="true">
          {operator.initials}
        </span>
        <span className="operator-card-copy">
          <span className="operator-stars" aria-label={`${operator.rarity} stars`}>
            {'★'.repeat(operator.rarity)}
          </span>
          <strong>{operator.name}</strong>
          <span>{operator.japaneseName}</span>
        </span>
        <span className="operator-card-meta">
          <span>{classLabels[operator.operatorClass]}</span>
          <span>
            {playableVoices === operator.voices.length
              ? `${playableVoices} voices`
              : `${playableVoices}/${operator.voices.length} voices`}
          </span>
        </span>
      </button>
      <FavoriteButton
        active={isFavorite}
        compact
        label={operator.name}
        onClick={() => toggleOperatorFavorite(operator.id)}
      />
    </article>
  )
}
