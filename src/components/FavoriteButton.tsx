import { Icon } from './Icon'

type FavoriteButtonProps = {
  active: boolean
  label: string
  onClick: () => void
  compact?: boolean
}

export function FavoriteButton({
  active,
  label,
  onClick,
  compact = false,
}: FavoriteButtonProps) {
  return (
    <button
      type="button"
      className={`favorite-button${active ? ' active' : ''}${compact ? ' compact' : ''}`}
      aria-label={active ? `${label}をお気に入りから削除` : `${label}をお気に入りに追加`}
      aria-pressed={active}
      onClick={onClick}
    >
      <Icon name="heart" size={compact ? 17 : 19} filled={active} />
      {!compact && <span>{active ? 'Saved' : 'Save'}</span>}
    </button>
  )
}
