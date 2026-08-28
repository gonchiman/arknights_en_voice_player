import type { VoiceLine } from '../types/app'

export function canUseBrowserTts() {
  return (
    typeof window !== 'undefined' &&
    typeof window.speechSynthesis?.speak === 'function' &&
    typeof SpeechSynthesisUtterance !== 'undefined'
  )
}

export function isVoiceConfiguredForPlayback(voice: VoiceLine) {
  if (voice.playbackMode === 'audio') return Boolean(voice.audioUrl)
  if (voice.playbackMode === 'tts') return voice.english.trim().length > 0
  return false
}

export function isVoicePlayable(voice: VoiceLine) {
  if (!isVoiceConfiguredForPlayback(voice)) return false
  return voice.playbackMode !== 'tts' || canUseBrowserTts()
}

export function voiceDisplayCode(voice: VoiceLine) {
  return voice.displayCode ?? voice.fileCode.replace('CN_', 'EN / ')
}
