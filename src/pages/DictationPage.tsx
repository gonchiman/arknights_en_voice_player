import { useMemo, useState } from 'react'
import { Icon } from '../components/Icon'
import { VoicePlayer } from '../components/VoicePlayer'
import {
  getOperator,
  operators,
  playableVoiceLines,
  voiceLines,
} from '../data/operators'
import { useAppState } from '../state/useAppState'
import { answerScore } from '../utils/text'

type Result = {
  score: number
  correct: boolean
}

export function DictationPage() {
  const { attempts, recordAttempt, clearProgress } = useAppState()
  const [operatorFilter, setOperatorFilter] = useState('all')
  const [currentVoiceId, setCurrentVoiceId] = useState(
    playableVoiceLines[0]?.id ?? '',
  )
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState<Result | null>(null)

  const pool = useMemo(
    () =>
      operatorFilter === 'all'
        ? playableVoiceLines
        : playableVoiceLines.filter(
            (line) => line.operatorId === operatorFilter,
          ),
    [operatorFilter],
  )
  const currentVoice = pool.find((line) => line.id === currentVoiceId) ?? pool[0]
  const currentOperator = currentVoice ? getOperator(currentVoice.operatorId) : undefined

  const averageScore = attempts.length
    ? Math.round(attempts.reduce((sum, attempt) => sum + attempt.score, 0) / attempts.length)
    : 0
  const mastered = new Set(
    attempts.filter((attempt) => attempt.score >= 90).map((attempt) => attempt.voiceId),
  ).size

  const chooseNext = () => {
    if (pool.length === 0) return
    const alternatives = pool.filter((line) => line.id !== currentVoice?.id)
    const choices = alternatives.length > 0 ? alternatives : pool
    const next = choices[Math.floor(Math.random() * choices.length)]
    setCurrentVoiceId(next.id)
    setAnswer('')
    setResult(null)
  }

  const changeOperator = (operatorId: string) => {
    setOperatorFilter(operatorId)
    const nextPool =
      operatorId === 'all'
        ? playableVoiceLines
        : playableVoiceLines.filter((line) => line.operatorId === operatorId)
    setCurrentVoiceId(nextPool[0]?.id ?? '')
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
        <label>
          <span>VOICE SET</span>
          <select value={operatorFilter} onChange={(event) => changeOperator(event.target.value)}>
            <option value="all">All available operators</option>
            {operators
              .filter((operator) =>
                operator.voices.some((voice) => voice.audioUrl !== null),
              )
              .map((operator) => (
                <option key={operator.id} value={operator.id}>
                  {operator.name} / {operator.japaneseName}
                </option>
              ))}
          </select>
        </label>
        <div className="dictation-metrics" aria-label="学習状況">
          <span><strong>{attempts.length}</strong> attempts</span>
          <span><strong>{averageScore}%</strong> average</span>
          <span><strong>{mastered}</strong> mastered</span>
        </div>
        <button type="button" className="quiet-button" onClick={chooseNext}>
          <Icon name="shuffle" size={17} />
          Random voice
        </button>
      </section>

      {currentVoice && currentOperator ? (
        <section className="dictation-workspace">
          <div className="exercise-operator">
            <span style={{ backgroundColor: currentOperator.accent }}>
              {currentOperator.initials}
            </span>
            <div>
              <p className="eyebrow">CURRENT SPEAKER</p>
              <h2>{currentOperator.name}</h2>
              <p>{currentVoice.category} · {currentVoice.label}</p>
            </div>
          </div>

          <div className="exercise-audio">
            <p className="exercise-instruction">
              <Icon name="headphones" size={19} />
              必要なだけ繰り返し再生してください
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
              <button type="button" className="primary-button" onClick={chooseNext}>
                Next voice
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
      ) : (
        <p className="muted-block">この条件で学習できる音声がありません。</p>
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
