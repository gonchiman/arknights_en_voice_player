import { useEffect, useRef, useState } from 'react'
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
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showJapanese, setShowJapanese] = useState(true)
  const [audioError, setAudioError] = useState(false)
  const { favoriteVoiceIds, toggleVoiceFavorite } = useAppState()
  const isFavorite = favoriteVoiceIds.includes(voice.id)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.pause()
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    setAudioError(false)
  }, [voice.audioUrl])

  const togglePlayback = async () => {
    const audio = audioRef.current
    if (!audio) return

    if (audio.paused) {
      try {
        await audio.play()
        setAudioError(false)
      } catch {
        setAudioError(true)
      }
    } else {
      audio.pause()
    }
  }

  const speakFallback = () => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(voice.english)
    utterance.lang = 'en-US'
    utterance.rate = 0.9
    window.speechSynthesis.speak(utterance)
  }

  const seek = (value: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = value
    setCurrentTime(value)
  }

  return (
    <article className={`voice-player${exerciseMode ? ' exercise-player' : ''}`}>
      <audio
        ref={audioRef}
        src={voice.audioUrl}
        preload="none"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onDurationChange={(event) => setDuration(event.currentTarget.duration)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onError={() => setAudioError(true)}
      />

      <div className="voice-player-topline">
        <div>
          <span className="voice-code">{voice.fileCode.replace('CN_', 'EN / ')}</span>
          <h3>{voice.label}</h3>
        </div>
        {!exerciseMode && (
          <FavoriteButton
            active={isFavorite}
            compact
            label={voice.label}
            onClick={() => toggleVoiceFavorite(voice.id)}
          />
        )}
      </div>

      <div className="audio-controls">
        <button
          type="button"
          className="play-button"
          onClick={togglePlayback}
          aria-label={isPlaying ? '一時停止' : '音声を再生'}
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
          <button type="button" onClick={speakFallback}>
            ブラウザ音声で確認
          </button>
        </div>
      )}

      {!hideText && (
        <div className="voice-transcript">
          <p lang="en">{voice.english}</p>
          {showJapanese && <p lang="ja">{voice.japanese}</p>}
          <button
            type="button"
            className="text-toggle"
            onClick={() => setShowJapanese((current) => !current)}
          >
            {showJapanese ? '日本語訳を隠す' : '日本語訳を表示'}
          </button>
        </div>
      )}
    </article>
  )
}
