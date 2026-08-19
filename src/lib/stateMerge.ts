import type { DictationAttempt } from '../types/app'

export type UserDataSnapshot = {
  favoriteOperatorIds: string[]
  favoriteVoiceIds: string[]
  attempts: DictationAttempt[]
}

export type CloudOperation =
  | {
      id: string
      type: 'set_operator_favorite'
      itemId: string
      enabled: boolean
    }
  | {
      id: string
      type: 'set_voice_favorite'
      itemId: string
      enabled: boolean
    }
  | {
      id: string
      type: 'add_attempt'
      attempt: DictationAttempt
    }
  | {
      id: string
      type: 'clear_attempts'
    }

function mergeIds(...collections: string[][]) {
  return Array.from(new Set(collections.flat()))
}

function mergeAttempts(...collections: DictationAttempt[][]) {
  const attempts = new Map<string, DictationAttempt>()
  for (const attempt of collections.flat()) attempts.set(attempt.id, attempt)
  return Array.from(attempts.values())
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, 200)
}

export function mergeSnapshots(...snapshots: UserDataSnapshot[]): UserDataSnapshot {
  return {
    favoriteOperatorIds: mergeIds(
      ...snapshots.map((snapshot) => snapshot.favoriteOperatorIds),
    ),
    favoriteVoiceIds: mergeIds(
      ...snapshots.map((snapshot) => snapshot.favoriteVoiceIds),
    ),
    attempts: mergeAttempts(...snapshots.map((snapshot) => snapshot.attempts)),
  }
}

export function applyOperationsToSnapshot(
  snapshot: UserDataSnapshot,
  operations: CloudOperation[],
): UserDataSnapshot {
  const favoriteOperatorIds = new Set(snapshot.favoriteOperatorIds)
  const favoriteVoiceIds = new Set(snapshot.favoriteVoiceIds)
  let attempts = [...snapshot.attempts]

  for (const operation of operations) {
    if (operation.type === 'set_operator_favorite') {
      if (operation.enabled) favoriteOperatorIds.add(operation.itemId)
      else favoriteOperatorIds.delete(operation.itemId)
      continue
    }

    if (operation.type === 'set_voice_favorite') {
      if (operation.enabled) favoriteVoiceIds.add(operation.itemId)
      else favoriteVoiceIds.delete(operation.itemId)
      continue
    }

    if (operation.type === 'add_attempt') {
      attempts = mergeAttempts(attempts, [operation.attempt])
      continue
    }

    attempts = []
  }

  return {
    favoriteOperatorIds: Array.from(favoriteOperatorIds),
    favoriteVoiceIds: Array.from(favoriteVoiceIds),
    attempts,
  }
}
