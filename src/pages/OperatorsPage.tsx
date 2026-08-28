import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { FavoriteButton } from '../components/FavoriteButton'
import { OperatorCard } from '../components/OperatorCard'
import { OperatorFilterPanel } from '../components/OperatorFilterPanel'
import { TranslationToggle } from '../components/TranslationToggle'
import { VoicePlayer } from '../components/VoicePlayer'
import { VoiceVariantSwitch } from '../components/VoiceVariantSwitch'
import { useOperatorSearch } from '../hooks/useOperatorSearch'
import { sortOperatorsByJapaneseName } from '../lib/operatorSorting'
import { isVoicePlayable } from '../lib/voicePlayback'
import { useGameCatalog } from '../state/gameCatalogContext'
import { useAppState } from '../state/useAppState'
import type { VoiceVariant } from '../types/app'

const operatorCardButtonId = (operatorId: string) => `operator-card-${operatorId}`

type OperatorNavigationState = {
  operatorDetailOrigin?: 'index'
}

export function OperatorsPage() {
  const catalog = useGameCatalog()
  const detailBackButtonRef = useRef<HTMLButtonElement>(null)
  const indexScrollPositionRef = useRef(0)
  const restoreOperatorIdRef = useRef<string | null>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [voiceVariant, setVoiceVariant] = useState<VoiceVariant>('female')
  const operatorsByJapaneseName = useMemo(
    () => sortOperatorsByJapaneseName(catalog.operators),
    [catalog.operators],
  )
  const playableVoiceCount = catalog.voiceLines.filter(isVoicePlayable).length
  const operatorSearch = useOperatorSearch(operatorsByJapaneseName)
  const { filteredOperators, resetFilters } = operatorSearch
  const { favoriteOperatorIds, toggleOperatorFavorite } = useAppState()

  const requestedOperator = searchParams.get('operator')
  const selectedOperator = requestedOperator
    ? catalog.operators.find((operator) => operator.id === requestedOperator)
    : undefined
  const hasVoiceVariants = Boolean(
    selectedOperator?.voices.some((voice) => voice.voiceVariant),
  )
  const visibleVoices =
    selectedOperator?.voices.filter(
      (voice) => !hasVoiceVariants || voice.voiceVariant === voiceVariant,
    ) ?? []

  useEffect(() => {
    if (!selectedOperator) return

    restoreOperatorIdRef.current = selectedOperator.id
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    const focusFrame = window.requestAnimationFrame(() => {
      detailBackButtonRef.current?.focus()
    })

    return () => window.cancelAnimationFrame(focusFrame)
  }, [selectedOperator])

  useEffect(() => {
    if (selectedOperator || !restoreOperatorIdRef.current) return

    const operatorId = restoreOperatorIdRef.current
    const focusFrame = window.requestAnimationFrame(() => {
      window.scrollTo({
        top: indexScrollPositionRef.current,
        left: 0,
        behavior: 'auto',
      })
      document.getElementById(operatorCardButtonId(operatorId))?.focus()
      restoreOperatorIdRef.current = null
    })

    return () => window.cancelAnimationFrame(focusFrame)
  }, [selectedOperator])

  useEffect(() => {
    if (!requestedOperator || selectedOperator) return

    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.delete('operator')
    setSearchParams(nextSearchParams, { replace: true, state: null })
  }, [requestedOperator, searchParams, selectedOperator, setSearchParams])

  useEffect(() => {
    const firstAvailableVariant = selectedOperator?.voices.find(
      (voice) => voice.voiceVariant,
    )?.voiceVariant
    const hasFemaleVariant = selectedOperator?.voices.some(
      (voice) => voice.voiceVariant === 'female',
    )

    setVoiceVariant(hasFemaleVariant ? 'female' : firstAvailableVariant ?? 'female')
  }, [selectedOperator])

  useEffect(() => {
    const gameName = catalog.id === 'endfield' ? 'Endfield' : 'Arknights'
    document.title = selectedOperator
      ? `${selectedOperator.japaneseName} | ${gameName} EN Voice Player`
      : `${gameName} EN Voice Player`

    return () => {
      document.title = `${gameName} EN Voice Player`
    }
  }, [catalog.id, selectedOperator])

  const closeOperatorDetail = () => {
    if (!selectedOperator) return

    restoreOperatorIdRef.current = selectedOperator.id
    const navigationState = location.state as OperatorNavigationState | null
    if (navigationState?.operatorDetailOrigin === 'index') {
      navigate(-1)
      return
    }

    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.delete('operator')
    setSearchParams(nextSearchParams, { replace: true, state: null })
  }

  const openOperatorDetail = (operatorId: string) => {
    indexScrollPositionRef.current = window.scrollY
    restoreOperatorIdRef.current = operatorId
    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.set('operator', operatorId)
    setSearchParams(nextSearchParams, {
      state: { operatorDetailOrigin: 'index' } satisfies OperatorNavigationState,
    })
  }

  if (selectedOperator) {
    return (
      <div className="operator-detail-page">
        <nav className="operator-detail-navigation" aria-label="オペレーター詳細">
          <button
            ref={detailBackButtonRef}
            type="button"
            className="operator-detail-back"
            onClick={closeOperatorDetail}
          >
            <span aria-hidden="true">←</span>
            オペレーター一覧
          </button>
        </nav>

        <section
          className="operator-detail-view"
          aria-labelledby="operator-detail-title"
          style={{ '--operator-accent': selectedOperator.accent } as CSSProperties}
        >
          <div className="operator-detail-hero">
            <div>
              <p className="operator-stars">{'★'.repeat(selectedOperator.rarity)}</p>
              <h1 id="operator-detail-title">{selectedOperator.japaneseName}</h1>
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
              <h2>
                ボイス {visibleVoices.length}
                {hasVoiceVariants ? ` / ${selectedOperator.voices.length}` : ''}件
              </h2>
              <div className="voice-section-tools">
                <VoiceVariantSwitch
                  voices={selectedOperator.voices}
                  value={voiceVariant}
                  onChange={setVoiceVariant}
                />
                {selectedOperator.voices.length > 0 && <TranslationToggle />}
              </div>
            </div>

            {visibleVoices.length > 0 ? (
              <div className="voice-list">
                {visibleVoices.map((line) => (
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
        </section>
      </div>
    )
  }

  return (
    <>
      <OperatorFilterPanel search={operatorSearch} />

      <section className="operator-index-view">
        <div className="section-heading">
          <div>
            <p className="eyebrow">OPERATOR INDEX</p>
            <h1>
              {filteredOperators.length} / {catalog.operators.length} operators ·{' '}
              {playableVoiceCount} playable / {catalog.voiceLines.length} records
            </h1>
          </div>
        </div>

        {filteredOperators.length > 0 ? (
          <div className="operator-list operator-index-grid">
            {filteredOperators.map((operator) => (
              <OperatorCard
                key={operator.id}
                buttonId={operatorCardButtonId(operator.id)}
                operator={operator}
                onSelect={() => openOperatorDetail(operator.id)}
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
      </section>
    </>
  )
}
