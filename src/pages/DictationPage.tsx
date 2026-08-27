import { useMemo, useState } from 'react'
import { Icon } from '../components/Icon'
import { OperatorCard } from '../components/OperatorCard'
import { OperatorFilterPanel } from '../components/OperatorFilterPanel'
import { VoicePlayer } from '../components/VoicePlayer'
import { getOperator, operators, voiceLines } from '../data/operators'
import { useOperatorSearch } from '../hooks/useOperatorSearch'
import { useAppState } from '../state/useAppState'
import { answerScore } from '../utils/text'

type Result = {
  score: number
  correct: boolean
}

const dictationOperators = operators.filter((operator) =>
  operator.voices.some((voice) => voice.audioUrl !== null),
)
const dictationVoiceIds = new Set(
  dictationOperators.flatMap((operator) =>
    operator.voices
      .filter((voice) => voice.audioUrl !== null)
      .map((voice) => voice.id),
  ),
)
const dictationVoiceCount = dictationVoiceIds.size

export function DictationPage() {
  const { attempts, recordAttempt, clearProgress } = useAppState()
  const operatorSearch = useOperatorSearch(dictationOperators)
  const [selectedOperatorId, setSelectedOperatorId] = useState('')
  const [currentVoiceId, setCurrentVoiceId] = useState('')
  const [voiceQuery, setVoiceQuery] = useState('')
  const [voiceCategory, setVoiceCategory] = useState('all')
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState<Result | null>(null)

  const selectedOperator = dictationOperators.find(
    (operator) => operator.id === selectedOperatorId,
  )
  const selectedVoices =
    selectedOperator?.voices.filter((voice) => voice.audioUrl !== null) ?? []
  const normalizedVoiceQuery = voiceQuery.trim().toLocaleLowerCase()
  const filteredVoices = selectedVoices.filter(
    (voice) =>
      (!normalizedVoiceQuery ||
        [voice.label, voice.fileCode, voice.category]
          .join(' ')
          .toLocaleLowerCase()
          .includes(normalizedVoiceQuery)) &&
      (voiceCategory === 'all' || voice.category === voiceCategory),
  )
  const currentVoice = selectedVoices.find((voice) => voice.id === currentVoiceId)
  const currentStep = currentVoice ? 3 : selectedOperator ? 2 : 1

  const mastered = new Set(
    attempts
      .filter(
        (attempt) =>
          attempt.score >= 90 && dictationVoiceIds.has(attempt.voiceId),
      )
      .map((attempt) => attempt.voiceId),
  )
  const clearRate = dictationVoiceCount
    ? Math.round((mastered.size / dictationVoiceCount) * 100)
    : 0
  const remainingVoiceCount = Math.max(
    dictationVoiceCount - mastered.size,
    0,
  )
  const bestScoreByVoice = useMemo(() => {
    const scores = new Map<string, number>()
    for (const attempt of attempts) {
      scores.set(
        attempt.voiceId,
        Math.max(scores.get(attempt.voiceId) ?? 0, attempt.score),
      )
    }
    return scores
  }, [attempts])

  const selectOperator = (operatorId: string) => {
    setSelectedOperatorId(operatorId)
    setCurrentVoiceId('')
    setVoiceQuery('')
    setVoiceCategory('all')
    setAnswer('')
    setResult(null)
  }

  const selectVoice = (voiceId: string) => {
    setCurrentVoiceId(voiceId)
    setAnswer('')
    setResult(null)
  }

  const returnToOperators = () => {
    setSelectedOperatorId('')
    setCurrentVoiceId('')
    setAnswer('')
    setResult(null)
  }

  const returnToVoiceSelection = () => {
    setCurrentVoiceId('')
    setAnswer('')
    setResult(null)
  }

  const checkAnswer = () => {
    if (!currentVoice || !answer.trim()) return
    const score = answerScore(answer, currentVoice.english)
    const correct = score >= 90
    setResult({ score, correct })
    recordAttempt({
      id: `${Date.now()}-${currentVoice.id}`,
      voiceId: currentVoice.id,
      score,
      correct,
      createdAt: new Date().toISOString(),
    })
  }

  return (
    <>
      <section className="dictation-toolbar">
        <ol className="dictation-steps" aria-label="ディクテーションの手順">
          {['オペレーター', 'ボイス', '回答'].map((label, index) => {
            const step = index + 1
            const state = step === currentStep ? ' current' : step < currentStep ? ' complete' : ''
            return (
              <li
                key={label}
                className={state}
                aria-current={step === currentStep ? 'step' : undefined}
              >
                <span>{step}</span>
                {label}
              </li>
            )
          })}
        </ol>

        <div
          className="dictation-clear-progress"
          aria-label={`クリア率 ${clearRate}%。${dictationVoiceCount}件中${mastered.size}件クリア、残り${remainingVoiceCount}件`}
        >
          <div className="dictation-clear-progress-heading">
            <span>CLEAR RATE</span>
            <strong>{clearRate}%</strong>
          </div>
          <progress max={dictationVoiceCount} value={mastered.size}>
            {clearRate}%
          </progress>
          <div className="dictation-clear-progress-detail">
            <span>
              <strong>{mastered.size}</strong> / {dictationVoiceCount} voices
            </span>
            <span>残り {remainingVoiceCount}</span>
          </div>
        </div>
      </section>

      {!selectedOperator && (
        <div className="dictation-operator-step">
          <OperatorFilterPanel search={operatorSearch} />

          <section className="dictation-selection-panel" aria-label="オペレーター選択">
            <div className="section-heading">
              <h2>
                {operatorSearch.filteredOperators.length} / {dictationOperators.length}{' '}
                オペレーター
              </h2>
            </div>

            {operatorSearch.filteredOperators.length > 0 ? (
              <div className="operator-list dictation-operator-list">
                {operatorSearch.filteredOperators.map((operator) => (
                  <OperatorCard
                    key={operator.id}
                    operator={operator}
                    onSelect={() => selectOperator(operator.id)}
                    clearedVoiceCount={operator.voices.filter(
                      (voice) => voice.audioUrl !== null && mastered.has(voice.id),
                    ).length}
                  />
                ))}
              </div>
            ) : (
              <div className="no-results">
                <span>NO MATCH</span>
                <h2>条件に合うオペレーターがいません。</h2>
                <button
                  type="button"
                  className="primary-button"
                  onClick={operatorSearch.resetFilters}
                >
                  条件をリセット
                </button>
              </div>
            )}
          </section>
        </div>
      )}

      {selectedOperator && !currentVoice && (
        <section className="dictation-voice-selection" aria-label="ボイス選択">
          <div className="dictation-selection-header">
            <button type="button" className="quiet-button" onClick={returnToOperators}>
              <span aria-hidden="true">←</span>
              オペレーター選択
            </button>
            <div>
              <strong>{selectedOperator.name}</strong>
              <span>{selectedVoices.length} voices</span>
            </div>
          </div>

          <div className="dictation-voice-filter">
            <label className="search-field">
              <span className="sr-only">ボイス名・コードで検索</span>
              <Icon name="search" size={19} />
              <input
                type="search"
                value={voiceQuery}
                onChange={(event) => setVoiceQuery(event.target.value)}
                placeholder="Search voice label or code..."
              />
            </label>
            <label>
              <span>Category</span>
              <select
                value={voiceCategory}
                onChange={(event) => setVoiceCategory(event.target.value)}
              >
                <option value="all">All categories</option>
                <option value="Talk">Talk</option>
                <option value="Battle">Battle</option>
                <option value="Greeting">Greeting</option>
              </select>
            </label>
          </div>

          {filteredVoices.length > 0 ? (
            <div className="dictation-voice-options">
              {filteredVoices.map((voice) => (
                <button
                  key={voice.id}
                  type="button"
                  className="dictation-voice-option"
                  onClick={() => selectVoice(voice.id)}
                >
                  <span className="voice-code">
                    {voice.fileCode.replace('CN_', 'EN / ')}
                  </span>
                  <span>
                    <strong>{voice.label}</strong>
                    <small>{voice.category}</small>
                  </span>
                  <span
                    className={`dictation-voice-best-score${
                      (bestScoreByVoice.get(voice.id) ?? 0) >= 90 ? ' mastered' : ''
                    }`}
                  >
                    <small>BEST</small>
                    <strong>{bestScoreByVoice.get(voice.id) ?? '—'}</strong>
                  </span>
                  <Icon name="arrow" size={17} />
                </button>
              ))}
            </div>
          ) : (
            <div className="no-results dictation-voice-no-results">
              <span>NO MATCH</span>
              <h2>条件に合うボイスがありません。</h2>
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  setVoiceQuery('')
                  setVoiceCategory('all')
                }}
              >
                条件をリセット
              </button>
            </div>
          )}
        </section>
      )}

      {currentVoice && selectedOperator && (
        <section className="dictation-workspace">
          <button
            type="button"
            className="quiet-button dictation-back-button"
            onClick={returnToVoiceSelection}
          >
            <span aria-hidden="true">←</span>
            ボイス選択
          </button>

          <div className="exercise-operator">
            <span style={{ backgroundColor: selectedOperator.accent }}>
              {selectedOperator.initials}
            </span>
            <div>
              <p className="eyebrow">CURRENT SPEAKER</p>
              <h2>{selectedOperator.name}</h2>
              <p>{currentVoice.category} · {currentVoice.label}</p>
            </div>
          </div>

          <div className="exercise-audio">
            <p className="exercise-instruction">
              <Icon name="headphones" size={19} />
              <span>必要なだけ繰り返し再生してください</span>
              <span className="dictation-keyboard-shortcut">
                <kbd>Space</kbd>
                再生 / 一時停止
              </span>
            </p>
            <VoicePlayer voice={currentVoice} hideText exerciseMode />
          </div>

          <form
            className="dictation-form"
            onSubmit={(event) => {
              event.preventDefault()
              checkAnswer()
            }}
          >
            <label htmlFor="dictation-answer">TYPE WHAT YOU HEAR</label>
            <textarea
              id="dictation-answer"
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder="Enter the English line here..."
              rows={4}
              spellCheck={false}
              disabled={Boolean(result)}
            />
            {!result ? (
              <button type="submit" className="primary-button" disabled={!answer.trim()}>
                <Icon name="check" size={18} />
                Check answer
              </button>
            ) : (
              <button
                type="button"
                className="primary-button"
                onClick={returnToVoiceSelection}
              >
                別のボイスを選ぶ
                <Icon name="arrow" size={18} />
              </button>
            )}
          </form>

          {result && (
            <div className={`dictation-result${result.correct ? ' correct' : ''}`} role="status">
              <div className="result-score">
                <span>{result.score}</span>
                <small>/ 100</small>
              </div>
              <div>
                <p className="eyebrow">{result.correct ? 'MASTERED' : 'KEEP LISTENING'}</p>
                <h2>{result.correct ? 'Great listening.' : 'もう一度、音のつながりを確認しましょう。'}</h2>
                <div className="answer-comparison">
                  <p>
                    <span>YOUR ANSWER</span>
                    {answer}
                  </p>
                  <p>
                    <span>TRANSCRIPT</span>
                    <strong lang="en">{currentVoice.english}</strong>
                    <small lang="ja">{currentVoice.japanese}</small>
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {attempts.length > 0 && (
        <section className="progress-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">LOCAL LEARNING LOG</p>
              <h2>Recent progress</h2>
            </div>
            <button type="button" className="danger-button" onClick={clearProgress}>
              履歴を消去
            </button>
          </div>
          <div className="attempt-list">
            {attempts.slice(0, 6).map((attempt) => {
              const voice = voiceLines.find((line) => line.id === attempt.voiceId)
              const operator = voice ? getOperator(voice.operatorId) : undefined
              return (
                <div key={attempt.id} className="attempt-row">
                  <span className={attempt.correct ? 'attempt-status correct' : 'attempt-status'}>
                    {attempt.score}
                  </span>
                  <div>
                    <strong>{operator?.name ?? 'Unknown'} · {voice?.label ?? 'Voice'}</strong>
                    <small>{new Date(attempt.createdAt).toLocaleString('ja-JP')}</small>
                  </div>
                  <span>{attempt.correct ? 'Mastered' : 'Practice'}</span>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </>
  )
}
