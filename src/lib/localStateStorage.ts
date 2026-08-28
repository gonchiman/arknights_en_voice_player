import type { UserDataSnapshot } from './stateMerge'

type StateStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export const guestStoragePrefix = 'akvp'
const showJapaneseTranslationsKey = `${guestStoragePrefix}.showJapaneseTranslations`

function readStored<T>(storage: StateStorage, key: string, fallback: T): T {
  try {
    const stored = storage.getItem(key)
    return stored ? (JSON.parse(stored) as T) : fallback
  } catch {
    return fallback
  }
}

function storageKeys(prefix: string) {
  return {
    favoriteOperators: `${prefix}.favoriteOperators`,
    favoriteVoices: `${prefix}.favoriteVoices`,
    attempts: `${prefix}.dictationAttempts`,
  }
}

export function userStoragePrefix(userId: string) {
  return `akvp.user.${userId}`
}

export function readShowJapaneseTranslations(storage: StateStorage): boolean {
  const stored = readStored<unknown>(storage, showJapaneseTranslationsKey, true)
  return typeof stored === 'boolean' ? stored : true
}

export function writeShowJapaneseTranslations(
  storage: StateStorage,
  showJapaneseTranslations: boolean,
) {
  storage.setItem(
    showJapaneseTranslationsKey,
    JSON.stringify(showJapaneseTranslations),
  )
}

export function readSnapshot(
  storage: StateStorage,
  prefix: string,
): UserDataSnapshot {
  const keys = storageKeys(prefix)
  return {
    favoriteOperatorIds: readStored<string[]>(storage, keys.favoriteOperators, []),
    favoriteVoiceIds: readStored<string[]>(storage, keys.favoriteVoices, []),
    attempts: readStored(storage, keys.attempts, []),
  }
}

export function writeSnapshot(
  storage: StateStorage,
  prefix: string,
  snapshot: UserDataSnapshot,
) {
  const keys = storageKeys(prefix)
  storage.setItem(
    keys.favoriteOperators,
    JSON.stringify(snapshot.favoriteOperatorIds),
  )
  storage.setItem(keys.favoriteVoices, JSON.stringify(snapshot.favoriteVoiceIds))
  storage.setItem(keys.attempts, JSON.stringify(snapshot.attempts))
}

export function clearSnapshot(storage: StateStorage, prefix: string) {
  const keys = storageKeys(prefix)
  storage.removeItem(keys.favoriteOperators)
  storage.removeItem(keys.favoriteVoices)
  storage.removeItem(keys.attempts)
}
