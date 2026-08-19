import type { DictationAttempt } from '../types/app'
import { supabase } from './supabase'

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

function client() {
  if (!supabase) throw new Error('Supabase is not configured.')
  return supabase
}

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message)
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

export async function loadCloudState(userId: string): Promise<UserDataSnapshot> {
  const database = client()
  const [operatorResult, voiceResult, attemptResult] = await Promise.all([
    database
      .from('favorite_operators')
      .select('operator_id')
      .eq('user_id', userId),
    database.from('favorite_voices').select('voice_id').eq('user_id', userId),
    database
      .from('dictation_attempts')
      .select('id, voice_id, score, correct, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(200),
  ])

  throwIfError(operatorResult.error)
  throwIfError(voiceResult.error)
  throwIfError(attemptResult.error)

  return {
    favoriteOperatorIds: (operatorResult.data ?? []).map((row) => row.operator_id),
    favoriteVoiceIds: (voiceResult.data ?? []).map((row) => row.voice_id),
    attempts: (attemptResult.data ?? []).map((row) => ({
      id: row.id,
      voiceId: row.voice_id,
      score: row.score,
      correct: row.correct,
      createdAt: row.created_at,
    })),
  }
}

export async function mergeIntoCloud(
  userId: string,
  localState: UserDataSnapshot,
): Promise<UserDataSnapshot> {
  const database = client()
  const cloudState = await loadCloudState(userId)
  const merged = mergeSnapshots(cloudState, localState)
  const writes: PromiseLike<{ error: { message: string } | null }>[] = []

  if (merged.favoriteOperatorIds.length > 0) {
    writes.push(
      database.from('favorite_operators').upsert(
        merged.favoriteOperatorIds.map((operatorId) => ({
          user_id: userId,
          operator_id: operatorId,
        })),
        { onConflict: 'user_id,operator_id', ignoreDuplicates: true },
      ),
    )
  }
  if (merged.favoriteVoiceIds.length > 0) {
    writes.push(
      database.from('favorite_voices').upsert(
        merged.favoriteVoiceIds.map((voiceId) => ({
          user_id: userId,
          voice_id: voiceId,
        })),
        { onConflict: 'user_id,voice_id', ignoreDuplicates: true },
      ),
    )
  }
  if (merged.attempts.length > 0) {
    writes.push(
      database.from('dictation_attempts').upsert(
        merged.attempts.map((attempt) => ({
          id: attempt.id,
          user_id: userId,
          voice_id: attempt.voiceId,
          score: attempt.score,
          correct: attempt.correct,
          created_at: attempt.createdAt,
        })),
        { onConflict: 'user_id,id', ignoreDuplicates: true },
      ),
    )
  }

  const results = await Promise.all(writes)
  for (const result of results) throwIfError(result.error)
  return merged
}

export async function applyCloudOperation(
  userId: string,
  operation: CloudOperation,
) {
  const database = client()

  if (operation.type === 'set_operator_favorite') {
    const result = operation.enabled
      ? await database.from('favorite_operators').upsert(
          { user_id: userId, operator_id: operation.itemId },
          { onConflict: 'user_id,operator_id', ignoreDuplicates: true },
        )
      : await database
          .from('favorite_operators')
          .delete()
          .eq('user_id', userId)
          .eq('operator_id', operation.itemId)
    throwIfError(result.error)
    return
  }

  if (operation.type === 'set_voice_favorite') {
    const result = operation.enabled
      ? await database.from('favorite_voices').upsert(
          { user_id: userId, voice_id: operation.itemId },
          { onConflict: 'user_id,voice_id', ignoreDuplicates: true },
        )
      : await database
          .from('favorite_voices')
          .delete()
          .eq('user_id', userId)
          .eq('voice_id', operation.itemId)
    throwIfError(result.error)
    return
  }

  if (operation.type === 'add_attempt') {
    const result = await database.from('dictation_attempts').upsert(
      {
        id: operation.attempt.id,
        user_id: userId,
        voice_id: operation.attempt.voiceId,
        score: operation.attempt.score,
        correct: operation.attempt.correct,
        created_at: operation.attempt.createdAt,
      },
      { onConflict: 'user_id,id', ignoreDuplicates: true },
    )
    throwIfError(result.error)
    return
  }

  const result = await database
    .from('dictation_attempts')
    .delete()
    .eq('user_id', userId)
  throwIfError(result.error)
}
