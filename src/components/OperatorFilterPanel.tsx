import type { OperatorSearchController } from '../hooks/useOperatorSearch'
import { useGameCatalog } from '../state/gameCatalogContext'

const initialOptions = [
  { value: 'all', label: 'すべて' },
  { value: 'a', label: 'あ行' },
  { value: 'ka', label: 'か行' },
  { value: 'sa', label: 'さ行' },
  { value: 'ta', label: 'た行' },
  { value: 'na', label: 'な行' },
  { value: 'ha', label: 'は行' },
  { value: 'ma', label: 'ま行' },
  { value: 'ya', label: 'や行' },
  { value: 'ra', label: 'ら行' },
  { value: 'wa', label: 'わ行' },
  { value: 'latin', label: 'A–Z' },
  { value: 'numeric', label: '0–9' },
  { value: 'other', label: 'その他' },
] as const

type OperatorFilterPanelProps = {
  search: OperatorSearchController
  favoriteFilter?: {
    active: boolean
    count: number
    onChange: (active: boolean) => void
  }
}

export function OperatorFilterPanel({
  search,
  favoriteFilter,
}: OperatorFilterPanelProps) {
  const { classFilterLabel, classLabels, operatorClasses, rarityOptions } =
    useGameCatalog()
  const hasActiveFilters =
    search.hasActiveFilters || Boolean(favoriteFilter?.active)

  const resetFilters = () => {
    search.resetFilters()
    favoriteFilter?.onChange(false)
  }

  return (
    <section className="filter-panel" aria-label="オペレーター検索条件">
      <div className="filter-panel-heading">
        <span>検索条件</span>
        <button
          type="button"
          className="filter-reset-button"
          disabled={!hasActiveFilters}
          onClick={resetFilters}
        >
          条件をリセット
        </button>
      </div>

      <div className="filter-option-row" role="group" aria-label="オペレーター名の頭文字">
        <span className="filter-option-label">頭文字</span>
        {initialOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`filter-chip${search.initial === option.value ? ' active' : ''}`}
            aria-pressed={search.initial === option.value}
            onClick={() => search.setInitial(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="filter-option-row" role="group" aria-label={classFilterLabel}>
        <span className="filter-option-label">{classFilterLabel}</span>
        <button
          type="button"
          className={`filter-chip${search.operatorClass === 'all' ? ' active' : ''}`}
          aria-pressed={search.operatorClass === 'all'}
          onClick={() => search.setOperatorClass('all')}
        >
          すべて
        </button>
        {operatorClasses.map((value) => (
          <button
            key={value}
            type="button"
            className={`filter-chip${search.operatorClass === value ? ' active' : ''}`}
            aria-pressed={search.operatorClass === value}
            title={`${classLabels[value]} / ${value}`}
            onClick={() => search.setOperatorClass(value)}
          >
            {classLabels[value]}
          </button>
        ))}
      </div>

      <div className="filter-option-row" role="group" aria-label="レアリティ">
        <span className="filter-option-label">レアリティ</span>
        <button
          type="button"
          className={`filter-chip${search.rarity === 'all' ? ' active' : ''}`}
          aria-pressed={search.rarity === 'all'}
          onClick={() => search.setRarity('all')}
        >
          すべて
        </button>
        {rarityOptions.map((value) => (
          <button
            key={value}
            type="button"
            className={`filter-chip${search.rarity === String(value) ? ' active' : ''}`}
            aria-pressed={search.rarity === String(value)}
            onClick={() => search.setRarity(String(value))}
          >
            ★{value}
          </button>
        ))}
      </div>

      {favoriteFilter && (
        <div className="filter-option-row" role="group" aria-label="お気に入り">
          <span className="filter-option-label">お気に入り</span>
          <button
            type="button"
            className={`filter-chip${favoriteFilter.active ? '' : ' active'}`}
            aria-pressed={!favoriteFilter.active}
            onClick={() => favoriteFilter.onChange(false)}
          >
            すべて
          </button>
          <button
            type="button"
            className={`filter-chip${favoriteFilter.active ? ' active' : ''}`}
            aria-pressed={favoriteFilter.active}
            onClick={() => favoriteFilter.onChange(true)}
          >
            お気に入りのみ（{favoriteFilter.count}）
          </button>
        </div>
      )}

      <label className="filter-search-row">
        <span className="sr-only">オペレーター検索</span>
        <input
          className="operator-search-input"
          type="search"
          value={search.query}
          onChange={(event) => search.setQuery(event.target.value)}
          placeholder={`オペレーター名・${classFilterLabel}・陣営で検索`}
        />
      </label>
    </section>
  )
}
