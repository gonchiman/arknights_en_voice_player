import { useMemo, useState, type CSSProperties } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FavoriteButton } from '../components/FavoriteButton'
import { Icon } from '../components/Icon'
import { OperatorCard } from '../components/OperatorCard'
import { VoicePlayer } from '../components/VoicePlayer'
import {
  classLabels,
  operatorClasses,
  operators,
  voiceLines,
} from '../data/operators'
import { useAppState } from '../state/useAppState'

const rarityOptions = [4, 5, 6] as const
const initialOptions = Array.from(
  new Set(operators.map((operator) => operator.name.at(0)?.toUpperCase() ?? '')),
).sort()
const subclassOptions = Array.from(
  new Set(operators.map((operator) => operator.subclass)),
).sort()

export function OperatorsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [rarity, setRarity] = useState('all')
  const [operatorClass, setOperatorClass] = useState('all')
  const [subclass, setSubclass] = useState('all')
  const [initial, setInitial] = useState('all')
  const { favoriteOperatorIds, toggleOperatorFavorite } = useAppState()

  const filteredOperators = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()
    return operators.filter((operator) => {
      const searchable = [
        operator.name,
        operator.japaneseName,
        operator.operatorClass,
        classLabels[operator.operatorClass],
        operator.subclass,
        operator.faction,
      ]
        .join(' ')
        .toLocaleLowerCase()

      return (
        (!normalizedQuery || searchable.includes(normalizedQuery)) &&
        (rarity === 'all' || operator.rarity === Number(rarity)) &&
        (operatorClass === 'all' || operator.operatorClass === operatorClass) &&
        (subclass === 'all' || operator.subclass === subclass) &&
        (initial === 'all' || operator.name.toUpperCase().startsWith(initial))
      )
    })
  }, [initial, operatorClass, query, rarity, subclass])

  const requestedOperator = searchParams.get('operator')
  const selectedOperator =
    filteredOperators.find((operator) => operator.id === requestedOperator) ??
    filteredOperators[0]

  const resetFilters = () => {
    setQuery('')
    setRarity('all')
    setOperatorClass('all')
    setSubclass('all')
    setInitial('all')
  }

  return (
    <>
      <section className="filter-panel" aria-label="オペレーター検索条件">
        <label className="search-field">
          <span className="sr-only">名前・陣営・職業で検索</span>
          <Icon name="search" size={19} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, class, faction..."
          />
        </label>

        <div className="filter-selects">
          <label>
            <span>Rarity</span>
            <select value={rarity} onChange={(event) => setRarity(event.target.value)}>
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
              value={operatorClass}
              onChange={(event) => setOperatorClass(event.target.value)}
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
            <select value={subclass} onChange={(event) => setSubclass(event.target.value)}>
              <option value="all">All branches</option>
              {subclassOptions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Initial</span>
            <select value={initial} onChange={(event) => setInitial(event.target.value)}>
              <option value="all">A–Z</option>
              {initialOptions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="catalog-layout">
        <div className="catalog-column">
          <div className="section-heading">
            <div>
              <p className="eyebrow">OPERATOR INDEX</p>
              <h2>
                {filteredOperators.length} / {operators.length} operators · {voiceLines.length} voices
              </h2>
            </div>
            <button type="button" className="quiet-button" onClick={resetFilters}>
              Reset filters
            </button>
          </div>

          {filteredOperators.length > 0 ? (
            <div className="operator-list">
              {filteredOperators.map((operator) => (
                <OperatorCard
                  key={operator.id}
                  operator={operator}
                  selected={operator.id === selectedOperator?.id}
                  onSelect={() => setSearchParams({ operator: operator.id })}
                />
              ))}
            </div>
          ) : (
            <div className="no-results">
              <span>NO MATCH</span>
              <h2>条件に合うオペレーターがいません。</h2>
              <button type="button" className="primary-button" onClick={resetFilters}>
                条件をリセット
              </button>
            </div>
          )}
        </div>

        {selectedOperator && (
          <aside
            className="operator-detail"
            style={{ '--operator-accent': selectedOperator.accent } as CSSProperties}
          >
            <div className="operator-detail-hero">
              <div className="operator-detail-monogram" aria-hidden="true">
                {selectedOperator.initials}
              </div>
              <div>
                <p className="operator-stars">{'★'.repeat(selectedOperator.rarity)}</p>
                <h2>{selectedOperator.name}</h2>
                <p>{selectedOperator.japaneseName}</p>
              </div>
              <FavoriteButton
                active={favoriteOperatorIds.includes(selectedOperator.id)}
                label={selectedOperator.name}
                onClick={() => toggleOperatorFavorite(selectedOperator.id)}
              />
            </div>

            <div className="operator-detail-body">
              <div className="metadata-grid">
                <div>
                  <span>CLASS</span>
                  <strong>{classLabels[selectedOperator.operatorClass]}</strong>
                  <small>{selectedOperator.operatorClass}</small>
                </div>
                <div>
                  <span>BRANCH</span>
                  <strong>{selectedOperator.subclass}</strong>
                </div>
                <div>
                  <span>FACTION</span>
                  <strong>{selectedOperator.faction}</strong>
                </div>
                <div>
                  <span>EN VOICE</span>
                  <strong>{selectedOperator.voiceActor}</strong>
                </div>
              </div>

              <p className="operator-description">{selectedOperator.description}</p>

              <div className="voice-section-heading">
                <div>
                  <p className="eyebrow">ENGLISH VOICE RECORDS</p>
                  <h2>{selectedOperator.voices.length} records</h2>
                </div>
                <Icon name="headphones" size={24} />
              </div>

              {selectedOperator.voices.length > 0 ? (
                <div className="voice-list">
                  {selectedOperator.voices.map((line) => (
                    <VoicePlayer key={line.id} voice={line} />
                  ))}
                </div>
              ) : (
                <div className="voice-coming-soon">
                  <span>DATA PENDING</span>
                  <p>このオペレーターの英語音声は追加準備中です。</p>
                </div>
              )}
            </div>
          </aside>
        )}
      </section>
    </>
  )
}
