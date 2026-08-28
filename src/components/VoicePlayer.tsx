import { useCallback, useEffect, useRef, useState } from 'react'
import {
  claimVoicePlayback,
  ownsVoicePlayback,
  releaseVoicePlayback,
} from '../lib/voicePlaybackCoordinator'
import { canUseBrowserTts, voiceDisplayCode } from '../lib/voicePlayback'
import { useAppState } from '../state/useAppState'
import type { VoiceLine } from '../types/app'
import { FavoriteButton } from './FavoriteButton'
import { Icon } from './Icon'

type VoicePlayerProps = {
  voice: VoiceLine
  hideText?: boolean
  exerciseMode?: boolean
}

function formatTime(value: number) {
  if (!Number.isFinite(value)) return '0:00'
  const minutes = Math.floor(value / 60)
  const seconds = Math.floor(value % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function VoicePlayer({
  voice,
  hideText = false,
  exerciseMode = false,
}: VoicePlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const playbackOwnerRef = useRef(Symbol(voice.id))
  const [isPlaying, setIsPlaying] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [audioError, setAudioError] = useState(false)
  const [speechError, setSpeechError] = useState(false)
  const {
    favoriteVoiceIds,
    showJapaneseTranslations,
    toggleVoiceFavorite,
  } = useAppState()
  const isFavorite = favoriteVoiceIds.includes(voice.id)
  const audioUrl = voice.playbackMode === 'audio' ? voice.audioUrl : null
  const hasAudioPlayback = Boolean(audioUrl)
  const isTts = voice.playbackMode === 'tts'
  const canSpeakFallback = voice.english.trim().length > 0 && canUseBrowserTts()
  const hasTtsPlayback = isTts && canSpeakFallback

  const pausePlayback = useCallback(() => {
    audioRef.current?.pause()

    if (speechUtteranceRef.current) {
      speechUtteranceRef.current = null
      window.speechSynthesis.cancel()
    }

    setIsPlaying(false)
    setIsSpeaking(false)
    releaseVoicePlayback(playbackOwnerRef.current)
  }, [])

  const resetPlayback = useCallback(() => {
    const audio = audioRef.current
    audio?.pause()
    if (audio) {
      audio.currentTime = 0
    }

    if (speechUtteranceRef.current) {
      speechUtteranceRef.current = null
      window.speechSynthesis.cancel()
    }

    setIsPlaying(false)
    setIsSpeaking(false)
    setCurrentTime(0)
    releaseVoicePlayback(playbackOwnerRef.current)
  }, [])

  useEffect(() => {
    resetPlayback()
    setDuration(0)
    setAudioError(false)
    setSpeechError(false)
  }, [audioUrl, resetPlayback, voice.id])

  useEffect(
    () => () => {
      audioRef.current?.pause()
      if (speechUtteranceRef.current) {
        speechUtteranceRef.current = null
        window.speechSynthesis.cancel()
      }
      releaseVoicePlayback(playbackOwnerRef.current)
    },
    [],
  )

  const togglePlayback = useCallback(async () => {
    const audio = audioRef.current
    if (!audio || !audioUrl) return

    if (audio.paused) {
      pausePlayback()
      claimVoicePlayback(playbackOwnerRef.current, resetPlayback)
      try {
        await audio.play()
        if (ownsVoicePlayback(playbackOwnerRef.current)) {
          setAudioError(false)
        } else {
          audio.pause()
        }
      } catch {
        if (ownsVoicePlayback(playbackOwnerRef.current)) {
          setAudioError(true)
          releaseVoicePlayback(playbackOwnerRef.current)
        }
      }
    } else {
      pausePlayback()
    }
  }, [audioUrl, pausePlayback, resetPlayback])

  const seek = useCallback((value: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = value
    setCurrentTime(value)
  }, [])

  const movePlayback = useCallback(
    (seconds: number) => {
      const audio = audioRef.current
      if (!audio) return

      const maximum = Number.isFinite(audio.duration)
        ? audio.duration
        : Number.POSITIVE_INFINITY
      const nextTime = Math.min(
        maximum,
        Math.max(0, audio.currentTime + seconds),
      )
      seek(nextTime)
    },
    [seek],
  )

  const toggleSpeechPlayback = useCallback(() => {
    if (!canSpeakFallback) return

    if (isSpeaking) {
      pausePlayback()
      return
    }

    resetPlayback()
    claimVoicePlayback(playbackOwnerRef.current, resetPlayback)
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(voice.english)
    utterance.lang = 'en-US'
    utterance.rate = 0.9
    utterance.onend = () => {
      if (speechUtteranceRef.current !== utterance) return
      speechUtteranceRef.current = null
      setIsSpeaking(false)
      releaseVoicePlayback(playbackOwnerRef.current)
    }
    utterance.onerror = (event) => {
      if (speechUtteranceRef.current !== utterance) return
      speechUtteranceRef.current = null
      setIsSpeaking(false)
      releaseVoicePlayback(playbackOwnerRef.current)
      if (event.error !== 'canceled' && event.error !== 'interrupted') {
        setSpeechError(true)
      }
    }
    speechUtteranceRef.current = utterance
    setSpeechError(false)
    setIsSpeaking(true)
    window.speechSynthesis.speak(utterance)
  }, [canSpeakFallback, isSpeaking, pausePlayback, resetPlayback, voice.english])

  useEffect(() => {
    if (!exerciseMode || (!hasAudioPlayback && !hasTtsPlayback)) return

    const handleKeyDown = (event: KeyboardEvent) => {
      const isPlaybackShortcut =
        event.code === 'Space' ||
        (hasAudioPlayback &&
          (event.code === 'ArrowLeft' || event.code === 'ArrowRight'))

      if (
        !isPlaybackShortcut ||
        event.repeat ||
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey
      ) {
        return
      }

      const target = event.target
      if (
        target instanceof HTMLElement &&
        target.closest(
          'input, textarea, select, button, a, [contenteditable="true"]',
        )
      ) {
        return
      }

      event.preventDefault()
      if (event.code === 'ArrowLeft') {
        movePlayback(-1)
      } else if (event.code === 'ArrowRight') {
        movePlayback(1)
      } else if (hasTtsPlayback) {
        toggleSpeechPlayback()
      } else {
        void togglePlayback()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    exerciseMode,
    hasAudioPlayback,
    hasTtsPlayback,
    movePlayback,
    togglePlayback,
    toggleSpeechPlayback,
  ])

  const fallbackSpeechButton = canSpeakFallback ? (
    <button
      type="button"
      className="speech-fallback-button"
      onClick={toggleSpeechPlayback}
    >
      {isSpeaking ? '停止' : 'ブラウザ音声で確認'}
    </button>
  ) : null

  return (
    <article
      className={`voice-player${exerciseMode ? ' exercise-player' : ''}${
        hasAudioPlayback ? '' : isTts ? ' voice-tts' : ' voice-unavailable'
      }`}
      aria-keyshortcuts={
        exerciseMode && (hasAudioPlayback || hasTtsPlayback)
          ? hasAudioPlayback
            ? 'Space ArrowLeft ArrowRight'
            : 'Space'
          : undefined
      }
    >
      <div className="voice-player-topline">
        <div>
          <span className="voice-code">{voiceDisplayCode(voice)}</span>
          <h3>{voice.label}</h3>
        </div>
        <div className="voice-player-actions">
          {voice.voiceVariant && (
            <span className="voice-variant-badge">
              {voice.voiceVariant === 'female' ? 'FEMALE' : 'MALE'}
            </span>
          )}
          {!hasAudioPlayback && (
            <span className="unavailable-badge">{isTts ? 'BROWSER TTS' : 'NO AUDIO'}</span>
          )}
          {!exerciseMode && (
            <FavoriteButton
              active={isFavorite}
              compact
              label={voice.label}
              onClick={() => toggleVoiceFavorite(voice.id)}
            />
          )}
        </div>
      </div>

      {hasAudioPlayback ? (
        <>
          <audio
            ref={audioRef}
            src={audioUrl ?? undefined}
            preload="none"
            onPlay={(event) => {
              if (!ownsVoicePlayback(playbackOwnerRef.current)) {
                event.currentTarget.pause()
                return
              }
              setIsPlaying(true)
            }}
            onPause={() => {
              setIsPlaying(false)
              releaseVoicePlayback(playbackOwnerRef.current)
            }}
            onEnded={() => {
              setIsPlaying(false)
              releaseVoicePlayback(playbackOwnerRef.current)
            }}
            onDurationChange={(event) => setDuration(event.currentTarget.duration)}
            onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
            onError={() => setAudioError(true)}
          />

          <div className="audio-controls">
            <button
              type="button"
              className="play-button"
              onClick={togglePlayback}
              aria-label={isPlaying ? '一時停止' : '音声を再生'}
              aria-keyshortcuts={exerciseMode ? 'Space' : undefined}
            >
              <Icon name={isPlaying ? 'pause' : 'play'} size={20} />
            </button>
            <Icon name="volume" size={18} />
            <input
              className="audio-progress"
              type="range"
              min="0"
              max={duration || 0}
              step="0.01"
              value={Math.min(currentTime, duration || 0)}
              onChange={(event) => seek(Number(event.target.value))}
              aria-label="再生位置"
            />
            <span className="audio-time">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {audioError && (
            <div className="audio-error" role="status">
              <span>音声を取得できませんでした。</span>
              {fallbackSpeechButton}
            </div>
          )}
        </>
      ) : isTts ? (
        <div className="tts-controls">
          <button
            type="button"
            className="play-button"
            disabled={!canSpeakFallback}
            onClick={toggleSpeechPlayback}
            aria-label={isSpeaking ? 'ブラウザ音声を停止' : 'ブラウザ音声を再生'}
            aria-keyshortcuts={exerciseMode ? 'Space' : undefined}
          >
            <Icon name={isSpeaking ? 'stop' : 'play'} size={20} />
          </button>
          <div className="tts-controls-copy">
            <strong>ブラウザTTS</strong>
            <span>
              {canSpeakFallback
                ? '端末の英語音声で再生します。'
                : 'このブラウザは音声読み上げに対応していません。'}
            </span>
          </div>
          {speechError && <span className="tts-error">再生できませんでした。</span>}
        </div>
      ) : (
        <div className="unavailable-message" role="status">
          <Icon name="volume" size={18} />
          <span>英語音声データがありません。</span>
          {fallbackSpeechButton}
        </div>
      )}

      {!hideText && (
        <div className="voice-transcript">
          <p lang="en">{voice.english}</p>
          {showJapaneseTranslations && <p lang="ja">{voice.japanese}</p>}
        </div>
      )}
    </article>
  )
}
