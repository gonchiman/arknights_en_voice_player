import assert from 'node:assert/strict'
import test from 'node:test'
import {
  applyOperationsToSnapshot,
  mergeSnapshots,
} from '../src/lib/stateMerge.ts'
import {
  appendPendingOperation,
  flushPendingOperationsQueue,
  readPendingOperations,
} from '../src/lib/pendingOperations.ts'
import {
  clearSnapshot,
  guestStoragePrefix,
  readShowJapaneseTranslations,
  readSnapshot,
  userStoragePrefix,
  writeShowJapaneseTranslations,
  writeSnapshot,
} from '../src/lib/localStateStorage.ts'

const empty = {
  favoriteOperatorIds: [],
  favoriteVoiceIds: [],
  attempts: [],
}

const attempt = (id, createdAt, score = 90) => ({
  id,
  voiceId: `voice-${id}`,
  score,
  correct: score >= 90,
  createdAt,
})

const memoryStorage = () => {
  const values = new Map()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  }
}

test('端末とクラウドのお気に入りを統合し、履歴IDを重複排除する', () => {
  const merged = mergeSnapshots(
    {
      favoriteOperatorIds: ['amiya'],
      favoriteVoiceIds: ['voice-a'],
      attempts: [attempt('same', '2026-08-19T00:00:00.000Z', 80)],
    },
    {
      favoriteOperatorIds: ['amiya', 'texas'],
      favoriteVoiceIds: ['voice-b'],
      attempts: [attempt('same', '2026-08-20T00:00:00.000Z', 95)],
    },
  )

  assert.deepEqual(merged.favoriteOperatorIds, ['amiya', 'texas'])
  assert.deepEqual(merged.favoriteVoiceIds, ['voice-a', 'voice-b'])
  assert.equal(merged.attempts.length, 1)
  assert.equal(merged.attempts[0].score, 95)
})

test('未送信の削除操作が古いクラウド値を復活させない', () => {
  const result = applyOperationsToSnapshot(
    { ...empty, favoriteOperatorIds: ['amiya'] },
    [
      {
        id: 'remove-amiya',
        type: 'set_operator_favorite',
        itemId: 'amiya',
        enabled: false,
      },
    ],
  )

  assert.deepEqual(result.favoriteOperatorIds, [])
})

test('送信キューを順番どおり適用する', () => {
  const result = applyOperationsToSnapshot(empty, [
    {
      id: 'add-1',
      type: 'add_attempt',
      attempt: attempt('before-clear', '2026-08-19T00:00:00.000Z'),
    },
    { id: 'clear', type: 'clear_attempts' },
    {
      id: 'add-2',
      type: 'add_attempt',
      attempt: attempt('after-clear', '2026-08-20T00:00:00.000Z'),
    },
    {
      id: 'favorite-on',
      type: 'set_voice_favorite',
      itemId: 'voice-a',
      enabled: true,
    },
    {
      id: 'favorite-off',
      type: 'set_voice_favorite',
      itemId: 'voice-a',
      enabled: false,
    },
  ])

  assert.deepEqual(result.attempts.map((item) => item.id), ['after-clear'])
  assert.deepEqual(result.favoriteVoiceIds, [])
})

test('送信失敗時はキューを保持し、再試行成功後に削除する', async () => {
  const storage = memoryStorage()
  const operation = {
    id: 'pending-favorite',
    type: 'set_operator_favorite',
    itemId: 'texas',
    enabled: true,
  }
  appendPendingOperation(storage, 'user-1', operation)

  await assert.rejects(
    flushPendingOperationsQueue(storage, 'user-1', async () => {
      throw new Error('offline')
    }),
    /offline/,
  )
  assert.deepEqual(readPendingOperations(storage, 'user-1'), [operation])

  const applied = []
  await flushPendingOperationsQueue(storage, 'user-1', async (item) => {
    applied.push(item.id)
  })
  assert.deepEqual(applied, ['pending-favorite'])
  assert.deepEqual(readPendingOperations(storage, 'user-1'), [])
})

test('ゲストとログインユーザーのキャッシュを分離する', () => {
  const storage = memoryStorage()
  const guest = { ...empty, favoriteOperatorIds: ['amiya'] }
  const signedIn = { ...empty, favoriteOperatorIds: ['texas'] }
  const signedInPrefix = userStoragePrefix('user-1')

  writeSnapshot(storage, guestStoragePrefix, guest)
  writeSnapshot(storage, signedInPrefix, signedIn)

  assert.deepEqual(readSnapshot(storage, guestStoragePrefix), guest)
  assert.deepEqual(readSnapshot(storage, signedInPrefix), signedIn)

  clearSnapshot(storage, signedInPrefix)
  assert.deepEqual(readSnapshot(storage, signedInPrefix), empty)
  assert.deepEqual(readSnapshot(storage, guestStoragePrefix), guest)
})

test('日本語訳の表示設定を端末全体で保持する', () => {
  const storage = memoryStorage()

  assert.equal(readShowJapaneseTranslations(storage), true)
  writeShowJapaneseTranslations(storage, false)
  assert.equal(readShowJapaneseTranslations(storage), false)
  writeShowJapaneseTranslations(storage, true)
  assert.equal(readShowJapaneseTranslations(storage), true)

  storage.setItem('akvp.showJapaneseTranslations', JSON.stringify('false'))
  assert.equal(readShowJapaneseTranslations(storage), true)
})
