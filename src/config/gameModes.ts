export type GameModeId = 'arknights' | 'endfield'

export type AppSection = 'operators' | 'favorites' | 'dictation'

export type GameMode = {
  id: GameModeId
  name: string
  switchLabel: string
  beta?: boolean
}

export const gameModes: readonly GameMode[] = [
  {
    id: 'arknights',
    name: 'Arknights',
    switchLabel: 'ARKNIGHTS',
  },
  {
    id: 'endfield',
    name: 'Endfield',
    switchLabel: 'ENDFIELD',
    beta: true,
  },
]

export const appSections: readonly { id: AppSection; label: string }[] = [
  { id: 'operators', label: 'ボイス一覧' },
  { id: 'favorites', label: 'お気に入り' },
  { id: 'dictation', label: 'ディクテーション' },
]

export function getGameModeFromPath(pathname: string): GameModeId {
  return pathname.split('/').filter(Boolean)[0] === 'endfield' ? 'endfield' : 'arknights'
}

export function getAppSectionFromPath(pathname: string): AppSection {
  const segments = pathname.split('/').filter(Boolean)
  const sectionSegment = segments[0] === 'endfield' ? segments[1] : segments[0]

  if (sectionSegment === 'favorites' || sectionSegment === 'dictation') {
    return sectionSegment
  }

  return 'operators'
}

export function getGamePath(gameMode: GameModeId, section: AppSection): string {
  const sectionPath = section === 'operators' ? '' : `/${section}`

  if (gameMode === 'endfield') {
    return `/endfield${sectionPath}`
  }

  return sectionPath || '/'
}

export function getModeSwitchPath(gameMode: GameModeId, pathname: string): string {
  return getGamePath(gameMode, getAppSectionFromPath(pathname))
}
