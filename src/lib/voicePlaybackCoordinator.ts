export type VoicePlaybackOwner = symbol

type ActiveVoicePlayback = {
  owner: VoicePlaybackOwner
  stop: () => void
}

let activeVoicePlayback: ActiveVoicePlayback | null = null

export function claimVoicePlayback(
  owner: VoicePlaybackOwner,
  stop: () => void,
) {
  const previousPlayback = activeVoicePlayback
  activeVoicePlayback = { owner, stop }

  if (previousPlayback && previousPlayback.owner !== owner) {
    previousPlayback.stop()
  }
}

export function releaseVoicePlayback(owner: VoicePlaybackOwner) {
  if (activeVoicePlayback?.owner === owner) {
    activeVoicePlayback = null
  }
}

export function ownsVoicePlayback(owner: VoicePlaybackOwner) {
  return activeVoicePlayback?.owner === owner
}
