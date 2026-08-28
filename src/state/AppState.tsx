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
  type CloudOperation,
  type UserDataSnapshot,
} from '../lib/cloudState'
import {
  clearSnapshot,
  guestStoragePrefix,
  readShowJapaneseTranslations,
  readSnapshot,
  userStoragePrefix,
  writeShowJapaneseTranslations,
  writeSnapshot,
} from '../lib/localStateStorage'
import {
  appendPendingOperation,
  flushPendingOperationsQueue,
  readPendingOperations,
} from '../lib/pendingOperations'
import { applyOperationsToSnapshot, mergeSnapshots } from '../lib/stateMerge'
import type { DictationAttempt } from '../types/app'
import { AppStateContext, type AppStateValue } from './appStateContext'
import { useAuth } from './useAuth'

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
  const initialSnapshot = useMemo(
    () => readSnapshot(window.localStorage, guestStoragePrefix),
    [],
  )
  const [favoriteOperatorIds, setFavoriteOperatorIds] = useState(
    initialSnapshot.favoriteOperatorIds,
  )
  const [favoriteVoiceIds, setFavoriteVoiceIds] = useState(
    initialSnapshot.favoriteVoiceIds,
  )
  const [attempts, setAttempts] = useState(initialSnapshot.attempts)
  const [showJapaneseTranslations, setShowJapaneseTranslations] = useState(() =>
    readShowJapaneseTranslations(window.localStorage),
  )
  const [syncStatus, setSyncStatus] = useState<AppStateValue['syncStatus']>('local')
  const [syncError, setSyncError] = useState<string | null>(null)
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)
  const activeStoragePrefixRef = useRef(guestStoragePrefix)
  const currentSnapshotRef = useRef(initialSnapshot)
  const userIdRef = useRef<string | null>(user?.id ?? null)
  const sessionVersionRef = useRef(0)
  const syncChainRef = useRef<Promise<void>>(Promise.resolve())
  const latestTaskRef = useRef(0)
  userIdRef.current = user?.id ?? null

  useEffect(() => {
    writeShowJapaneseTranslations(
      window.localStorage,
      showJapaneseTranslations,
    )
  }, [showJapaneseTranslations])

  const setSnapshot = useCallback((snapshot: UserDataSnapshot, prefix: string) => {
    activeStoragePrefixRef.current = prefix
    currentSnapshotRef.current = snapshot
    writeSnapshot(window.localStorage, prefix, snapshot)
    setFavoriteOperatorIds(snapshot.favoriteOperatorIds)
    setFavoriteVoiceIds(snapshot.favoriteVoiceIds)
    setAttempts(snapshot.attempts)
  }, [])

  const flushPendingOperations = useCallback(async (userId: string) => {
    await flushPendingOperationsQueue(
      window.localStorage,
      userId,
      (operation) => applyCloudOperation(userId, operation),
      () => userIdRef.current === userId,
    )
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
      appendPendingOperation(window.localStorage, userId, operation)
      void runCloudTask(userId, () => flushPendingOperations(userId))
    },
    [flushPendingOperations, runCloudTask],
  )

  useEffect(() => {
    const sessionVersion = ++sessionVersionRef.current
    latestTaskRef.current += 1

    if (isAuthLoading) return

    if (!user) {
      setSnapshot(
        readSnapshot(window.localStorage, guestStoragePrefix),
        guestStoragePrefix,
      )
      setSyncStatus('local')
      setSyncError(null)
      setLastSyncedAt(null)
      return
    }

    const userId = user.id
    const prefix = userStoragePrefix(userId)
    const guestState = readSnapshot(window.localStorage, guestStoragePrefix)
    const cachedUserState = readSnapshot(window.localStorage, prefix)
    const visibleState = mergeSnapshots(cachedUserState, guestState)
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

      const finalState = applyOperationsToSnapshot(
        cloudState,
        readPendingOperations(window.localStorage, userId),
      )
      setSnapshot(finalState, prefix)
      clearSnapshot(window.localStorage, guestStoragePrefix)
    })
  }, [flushPendingOperations, isAuthLoading, runCloudTask, setSnapshot, user])

  const commitSnapshot = useCallback((snapshot: UserDataSnapshot) => {
    currentSnapshotRef.current = snapshot
    writeSnapshot(window.localStorage, activeStoragePrefixRef.current, snapshot)
    setFavoriteOperatorIds(snapshot.favoriteOperatorIds)
    setFavoriteVoiceIds(snapshot.favoriteVoiceIds)
    setAttempts(snapshot.attempts)
  }, [])

  const toggleOperatorFavorite = useCallback(
    (operatorId: string) => {
      const currentIds = currentSnapshotRef.current.favoriteOperatorIds
      const enabled = !currentIds.includes(operatorId)
      commitSnapshot({
        ...currentSnapshotRef.current,
        favoriteOperatorIds: toggleId(currentIds, operatorId),
      })
      enqueueOperation({
        id: operationId(),
        type: 'set_operator_favorite',
        itemId: operatorId,
        enabled,
      })
    },
    [commitSnapshot, enqueueOperation],
  )

  const toggleVoiceFavorite = useCallback(
    (voiceId: string) => {
      const currentIds = currentSnapshotRef.current.favoriteVoiceIds
      const enabled = !currentIds.includes(voiceId)
      commitSnapshot({
        ...currentSnapshotRef.current,
        favoriteVoiceIds: toggleId(currentIds, voiceId),
      })
      enqueueOperation({
        id: operationId(),
        type: 'set_voice_favorite',
        itemId: voiceId,
        enabled,
      })
    },
    [commitSnapshot, enqueueOperation],
  )

  const recordAttempt = useCallback(
    (attempt: DictationAttempt) => {
      commitSnapshot({
        ...currentSnapshotRef.current,
        attempts: [attempt, ...currentSnapshotRef.current.attempts].slice(0, 200),
      })
      enqueueOperation({ id: operationId(), type: 'add_attempt', attempt })
    },
    [commitSnapshot, enqueueOperation],
  )

  const clearProgress = useCallback(() => {
    commitSnapshot({ ...currentSnapshotRef.current, attempts: [] })
    enqueueOperation({ id: operationId(), type: 'clear_attempts' })
  }, [commitSnapshot, enqueueOperation])

  const toggleJapaneseTranslations = useCallback(() => {
    setShowJapaneseTranslations((current) => !current)
  }, [])

  const retrySync = useCallback(() => {
    const userId = userIdRef.current
    if (!userId) return
    const prefix = userStoragePrefix(userId)
    void runCloudTask(userId, async () => {
      await flushPendingOperations(userId)
      const cloudState = await loadCloudState(userId)
      const finalState = applyOperationsToSnapshot(
        cloudState,
        readPendingOperations(window.localStorage, userId),
      )
      setSnapshot(finalState, prefix)
    })
  }, [flushPendingOperations, runCloudTask, setSnapshot])

  const value = useMemo<AppStateValue>(
    () => ({
      favoriteOperatorIds,
      favoriteVoiceIds,
      attempts,
      showJapaneseTranslations,
      toggleOperatorFavorite,
      toggleVoiceFavorite,
      toggleJapaneseTranslations,
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
      showJapaneseTranslations,
      syncError,
      syncStatus,
      toggleJapaneseTranslations,
      toggleOperatorFavorite,
      toggleVoiceFavorite,
    ],
  )

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}
