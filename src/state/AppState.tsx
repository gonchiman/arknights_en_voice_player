import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  applyCloudOperation,
  loadCloudState,
  mergeIntoCloud,
  mergeSnapshots,
  type CloudOperation,
  type UserDataSnapshot,
} from '../lib/cloudState'
import type { DictationAttempt } from '../types/app'
import { AppStateContext, type AppStateValue } from './appStateContext'
import { useAuth } from './useAuth'

const guestStoragePrefix = 'akvp'

function readStored<T>(key: string, fallback: T): T {
  try {
    const stored = window.localStorage.getItem(key)
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

function userStoragePrefix(userId: string) {
  return `akvp.user.${userId}`
}

function readSnapshot(prefix: string): UserDataSnapshot {
  const keys = storageKeys(prefix)
  return {
    favoriteOperatorIds: readStored<string[]>(keys.favoriteOperators, []),
    favoriteVoiceIds: readStored<string[]>(keys.favoriteVoices, []),
    attempts: readStored<DictationAttempt[]>(keys.attempts, []),
  }
}

function writeSnapshot(prefix: string, snapshot: UserDataSnapshot) {
  const keys = storageKeys(prefix)
  window.localStorage.setItem(
    keys.favoriteOperators,
    JSON.stringify(snapshot.favoriteOperatorIds),
  )
  window.localStorage.setItem(
    keys.favoriteVoices,
    JSON.stringify(snapshot.favoriteVoiceIds),
  )
  window.localStorage.setItem(keys.attempts, JSON.stringify(snapshot.attempts))
}

function clearSnapshot(prefix: string) {
  const keys = storageKeys(prefix)
  window.localStorage.removeItem(keys.favoriteOperators)
  window.localStorage.removeItem(keys.favoriteVoices)
  window.localStorage.removeItem(keys.attempts)
}

function pendingOperationsKey(userId: string) {
  return `akvp.user.${userId}.pendingOperations`
}

function readPendingOperations(userId: string) {
  return readStored<CloudOperation[]>(pendingOperationsKey(userId), [])
}

function writePendingOperations(userId: string, operations: CloudOperation[]) {
  window.localStorage.setItem(pendingOperationsKey(userId), JSON.stringify(operations))
}

function operationId() {
  return typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function toggleId(ids: string[], id: string) {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'クラウド同期に失敗しました。'
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: isAuthLoading } = useAuth()
  const initialSnapshot = useMemo(() => readSnapshot(guestStoragePrefix), [])
  const [favoriteOperatorIds, setFavoriteOperatorIds] = useState(
    initialSnapshot.favoriteOperatorIds,
  )
  const [favoriteVoiceIds, setFavoriteVoiceIds] = useState(
    initialSnapshot.favoriteVoiceIds,
  )
  const [attempts, setAttempts] = useState(initialSnapshot.attempts)
  const [syncStatus, setSyncStatus] = useState<AppStateValue['syncStatus']>('local')
  const [syncError, setSyncError] = useState<string | null>(null)
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)
  const activeStoragePrefixRef = useRef(guestStoragePrefix)
  const currentSnapshotRef = useRef(initialSnapshot)
  const userIdRef = useRef<string | null>(user?.id ?? null)
  const sessionVersionRef = useRef(0)
  const syncChainRef = useRef<Promise<void>>(Promise.resolve())
  const latestTaskRef = useRef(0)
  const localRevisionRef = useRef(0)
  userIdRef.current = user?.id ?? null

  const setSnapshot = useCallback((snapshot: UserDataSnapshot, prefix: string) => {
    activeStoragePrefixRef.current = prefix
    currentSnapshotRef.current = snapshot
    writeSnapshot(prefix, snapshot)
    setFavoriteOperatorIds(snapshot.favoriteOperatorIds)
    setFavoriteVoiceIds(snapshot.favoriteVoiceIds)
    setAttempts(snapshot.attempts)
  }, [])

  const flushPendingOperations = useCallback(async (userId: string) => {
    while (userIdRef.current === userId) {
      const operations = readPendingOperations(userId)
      const operation = operations[0]
      if (!operation) return
      await applyCloudOperation(userId, operation)
      const latestOperations = readPendingOperations(userId)
      writePendingOperations(
        userId,
        latestOperations.filter((item) => item.id !== operation.id),
      )
    }
  }, [])

  const runCloudTask = useCallback(
    (userId: string, task: () => Promise<void>) => {
      const taskNumber = ++latestTaskRef.current
      setSyncStatus('syncing')
      setSyncError(null)

      const scheduled = syncChainRef.current
        .catch(() => undefined)
        .then(async () => {
          if (userIdRef.current !== userId) return
          await task()
        })
      syncChainRef.current = scheduled

      void scheduled
        .then(() => {
          if (userIdRef.current !== userId || latestTaskRef.current !== taskNumber) return
          setSyncStatus('synced')
          setLastSyncedAt(new Date().toISOString())
        })
        .catch((taskError: unknown) => {
          if (userIdRef.current !== userId || latestTaskRef.current !== taskNumber) return
          setSyncStatus('error')
          setSyncError(errorMessage(taskError))
        })

      return scheduled
    },
    [],
  )

  const enqueueOperation = useCallback(
    (operation: CloudOperation) => {
      const userId = userIdRef.current
      if (!userId) return
      writePendingOperations(userId, [
        ...readPendingOperations(userId),
        operation,
      ])
      void runCloudTask(userId, () => flushPendingOperations(userId))
    },
    [flushPendingOperations, runCloudTask],
  )

  useEffect(() => {
    const sessionVersion = ++sessionVersionRef.current
    latestTaskRef.current += 1

    if (isAuthLoading) return

    if (!user) {
      setSnapshot(readSnapshot(guestStoragePrefix), guestStoragePrefix)
      setSyncStatus('local')
      setSyncError(null)
      setLastSyncedAt(null)
      return
    }

    const userId = user.id
    const prefix = userStoragePrefix(userId)
    const guestState = readSnapshot(guestStoragePrefix)
    const cachedUserState = readSnapshot(prefix)
    const visibleState = mergeSnapshots(cachedUserState, guestState)
    const revisionAtStart = localRevisionRef.current
    setSnapshot(visibleState, prefix)

    void runCloudTask(userId, async () => {
      await mergeIntoCloud(userId, guestState)
      await flushPendingOperations(userId)
      const cloudState = await loadCloudState(userId)
      if (
        sessionVersionRef.current !== sessionVersion ||
        userIdRef.current !== userId
      ) {
        return
      }

      const finalState =
        localRevisionRef.current === revisionAtStart
          ? cloudState
          : mergeSnapshots(cloudState, currentSnapshotRef.current)
      setSnapshot(finalState, prefix)
      clearSnapshot(guestStoragePrefix)
    })
  }, [flushPendingOperations, isAuthLoading, runCloudTask, setSnapshot, user])

  const commitSnapshot = useCallback((snapshot: UserDataSnapshot) => {
    localRevisionRef.current += 1
    currentSnapshotRef.current = snapshot
    writeSnapshot(activeStoragePrefixRef.current, snapshot)
    setFavoriteOperatorIds(snapshot.favoriteOperatorIds)
    setFavoriteVoiceIds(snapshot.favoriteVoiceIds)
    setAttempts(snapshot.attempts)
  }, [])

  const toggleOperatorFavorite = useCallback(
    (operatorId: string) => {
      const enabled = !favoriteOperatorIds.includes(operatorId)
      commitSnapshot({
        ...currentSnapshotRef.current,
        favoriteOperatorIds: toggleId(favoriteOperatorIds, operatorId),
      })
      enqueueOperation({
        id: operationId(),
        type: 'set_operator_favorite',
        itemId: operatorId,
        enabled,
      })
    },
    [commitSnapshot, enqueueOperation, favoriteOperatorIds],
  )

  const toggleVoiceFavorite = useCallback(
    (voiceId: string) => {
      const enabled = !favoriteVoiceIds.includes(voiceId)
      commitSnapshot({
        ...currentSnapshotRef.current,
        favoriteVoiceIds: toggleId(favoriteVoiceIds, voiceId),
      })
      enqueueOperation({
        id: operationId(),
        type: 'set_voice_favorite',
        itemId: voiceId,
        enabled,
      })
    },
    [commitSnapshot, enqueueOperation, favoriteVoiceIds],
  )

  const recordAttempt = useCallback(
    (attempt: DictationAttempt) => {
      commitSnapshot({
        ...currentSnapshotRef.current,
        attempts: [attempt, ...attempts].slice(0, 200),
      })
      enqueueOperation({ id: operationId(), type: 'add_attempt', attempt })
    },
    [attempts, commitSnapshot, enqueueOperation],
  )

  const clearProgress = useCallback(() => {
    commitSnapshot({ ...currentSnapshotRef.current, attempts: [] })
    enqueueOperation({ id: operationId(), type: 'clear_attempts' })
  }, [commitSnapshot, enqueueOperation])

  const retrySync = useCallback(() => {
    const userId = userIdRef.current
    if (!userId) return
    const prefix = userStoragePrefix(userId)
    const revisionAtStart = localRevisionRef.current
    void runCloudTask(userId, async () => {
      await flushPendingOperations(userId)
      const cloudState = await loadCloudState(userId)
      const finalState =
        localRevisionRef.current === revisionAtStart
          ? cloudState
          : mergeSnapshots(cloudState, currentSnapshotRef.current)
      setSnapshot(finalState, prefix)
    })
  }, [flushPendingOperations, runCloudTask, setSnapshot])

  const value = useMemo<AppStateValue>(
    () => ({
      favoriteOperatorIds,
      favoriteVoiceIds,
      attempts,
      toggleOperatorFavorite,
      toggleVoiceFavorite,
      recordAttempt,
      clearProgress,
      syncStatus,
      syncError,
      lastSyncedAt,
      retrySync,
    }),
    [
      attempts,
      clearProgress,
      favoriteOperatorIds,
      favoriteVoiceIds,
      lastSyncedAt,
      recordAttempt,
      retrySync,
      syncError,
      syncStatus,
      toggleOperatorFavorite,
      toggleVoiceFavorite,
    ],
  )

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}
