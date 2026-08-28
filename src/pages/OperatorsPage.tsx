import { useEffect, useMemo, useRef, type CSSProperties } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FavoriteButton } from '../components/FavoriteButton'
import { OperatorCard } from '../components/OperatorCard'
import { OperatorFilterPanel } from '../components/OperatorFilterPanel'
import { TranslationToggle } from '../components/TranslationToggle'
import { VoicePlayer } from '../components/VoicePlayer'
import { useOperatorSearch } from '../hooks/useOperatorSearch'
import { sortOperatorsByJapaneseName } from '../lib/operatorSorting'
import { isVoicePlayable } from '../lib/voicePlayback'
import { useGameCatalog } from '../state/gameCatalogContext'
import { useAppState } from '../state/useAppState'

export function OperatorsPage() {
  const catalog = useGameCatalog()
  const operatorDetailRef = useRef<HTMLElement>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const operatorsByJapaneseName = useMemo(
    () => sortOperatorsByJapaneseName(catalog.operators),
    [catalog.operators],
  )
  const playableVoiceCount = catalog.voiceLines.filter(isVoicePlayable).length
  const operatorSearch = useOperatorSearch(operatorsByJapaneseName)
  const { filteredOperators, resetFilters } = operatorSearch
  const { favoriteOperatorIds, toggleOperatorFavorite } = useAppState()

  const requestedOperator = searchParams.get('operator')
  const selectedOperator =
    filteredOperators.find((operator) => operator.id === requestedOperator) ??
    filteredOperators[0]

  useEffect(() => {
    if (requestedOperator) {
      operatorDetailRef.current?.scrollTo({ top: 0 })
    }
  }, [requestedOperator])

  const closeOperatorDetail = () => {
    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.delete('operator')
    setSearchParams(nextSearchParams, { replace: true })
  }

  return (
    <>
      <OperatorFilterPanel search={operatorSearch} />

      <section
        className={`catalog-layout${requestedOperator ? ' mobile-detail-active' : ''}`}
      >
        <div className="catalog-column">
          <div className="section-heading">
            <div>
              <p className="eyebrow">OPERATOR INDEX</p>
              <h2>
                {filteredOperators.length} / {catalog.operators.length} operators ·{' '}
                {playableVoiceCount} playable / {catalog.voiceLines.length} records
              </h2>
            </div>
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
            ref={operatorDetailRef}
            className={`operator-detail${requestedOperator ? ' mobile-detail-open' : ''}`}
            aria-label={`${selectedOperator.japaneseName}（${selectedOperator.name}）のボイス詳細`}
            style={{ '--operator-accent': selectedOperator.accent } as CSSProperties}
          >
            <div className="mobile-detail-toolbar">
              <button
                type="button"
                className="mobile-detail-back"
                onClick={closeOperatorDetail}
              >
                <span aria-hidden="true">←</span>
                オペレーター一覧
              </button>
              <span>ボイス詳細</span>
            </div>

            <div className="operator-detail-hero">
              <div>
                <p className="operator-stars">{'★'.repeat(selectedOperator.rarity)}</p>
                <h2>{selectedOperator.japaneseName}</h2>
                <p>{selectedOperator.name}</p>
              </div>
              <FavoriteButton
                active={favoriteOperatorIds.includes(selectedOperator.id)}
                label={selectedOperator.japaneseName}
                onClick={() => toggleOperatorFavorite(selectedOperator.id)}
              />
            </div>

            <div className="operator-detail-body">
              <div className="metadata-grid">
                <div>
                  <span>CLASS</span>
                  <strong>{catalog.classLabels[selectedOperator.operatorClass]}</strong>
                  <small>{selectedOperator.operatorClass}</small>
                </div>
                <div>
                  <span>{catalog.secondaryMetadataLabel}</span>
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
                <h2>ボイス {selectedOperator.voices.length}件</h2>
                {selectedOperator.voices.length > 0 && <TranslationToggle />}
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
