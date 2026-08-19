import { classLabels, operatorClasses } from '../data/operators'
import type { OperatorSearchController } from '../hooks/useOperatorSearch'
import { Icon } from './Icon'

const rarityOptions = [4, 5, 6] as const

type OperatorFilterPanelProps = {
  search: OperatorSearchController
}

export function OperatorFilterPanel({ search }: OperatorFilterPanelProps) {
  return (
    <section className="filter-panel" aria-label="オペレーター検索条件">
      <label className="search-field">
        <span className="sr-only">名前・陣営・職業で検索</span>
        <Icon name="search" size={19} />
        <input
          type="search"
          value={search.query}
          onChange={(event) => search.setQuery(event.target.value)}
          placeholder="Search name, class, faction..."
        />
      </label>

      <div className="filter-selects">
        <label>
          <span>Rarity</span>
          <select
            value={search.rarity}
            onChange={(event) => search.setRarity(event.target.value)}
          >
            <option value="all">All rarities</option>
            {rarityOptions.map((value) => (
              <option key={value} value={value}>
                {value} stars
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Class</span>
          <select
            value={search.operatorClass}
            onChange={(event) => search.setOperatorClass(event.target.value)}
          >
            <option value="all">All classes</option>
            {operatorClasses.map((value) => (
              <option key={value} value={value}>
                {classLabels[value]} / {value}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Branch</span>
          <select
            value={search.subclass}
            onChange={(event) => search.setSubclass(event.target.value)}
          >
            <option value="all">All branches</option>
            {search.subclassOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Initial</span>
          <select
            value={search.initial}
            onChange={(event) => search.setInitial(event.target.value)}
          >
            <option value="all">A–Z</option>
            {search.initialOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  )
}
