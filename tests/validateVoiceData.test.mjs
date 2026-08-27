import assert from 'node:assert/strict'
import test from 'node:test'
import {
  parseCliArguments,
  validateAudioFiles,
  validateVoiceData,
} from '../scripts/validate-voice-data.mjs'

const operator = (overrides = {}) => ({
  id: 'amiya',
  charId: 'char_002_amiya',
  name: 'Amiya',
  japaneseName: 'アーミヤ',
  rarity: 5,
  operatorClass: 'Caster',
  subclass: 'Core Caster',
  faction: 'Rhodes Island',
  voiceActor: 'Emma Ballantine',
  initials: 'AM',
  accent: '#48c7e8',
  description: 'Rhodes Islandのリーダー。',
  ...overrides,
})

const voice = (overrides = {}) => ({
  fileCode: 'CN_001',
  label: 'Appointed as Assistant',
  category: 'Talk',
  english: 'You work so hard, Doctor.',
  japanese: 'ドクター、お仕事お疲れ様です。',
  audioPath: 'char_002_amiya/CN_001.mp3',
  ...overrides,
})

test('正しいカタログと音声データを通信なしで検証する', () => {
  const result = validateVoiceData({
    operatorCatalog: [operator()],
    operatorVoiceRecords: { amiya: [voice()] },
  })

  assert.deepEqual(result.errors, [])
  assert.deepEqual(result.warnings, [])
  assert.deepEqual(result.stats, {
    operators: 1,
    records: 1,
    playable: 1,
    unavailable: 0,
  })
  assert.equal(result.playableVoices[0].url.endsWith('/CN_001.mp3'), true)
})

test('カタログの重複IDと音声側との不整合を検出する', () => {
  const result = validateVoiceData({
    operatorCatalog: [
      operator(),
      operator({ id: 'AMIYA', name: 'Duplicate Amiya' }),
      operator({
        id: 'texas',
        charId: 'CHAR_002_AMIYA',
        name: 'Texas',
      }),
    ],
    operatorVoiceRecords: {
      amiya: [voice()],
      unknown: [
        voice({
          audioPath: null,
        }),
      ],
    },
  })

  assert.equal(
    result.errors.some((error) => error.includes('duplicate operator ID AMIYA')),
    true,
  )
  assert.equal(
    result.errors.some((error) =>
      error.includes('duplicate character ID CHAR_002_AMIYA'),
    ),
    true,
  )
  assert.equal(
    result.errors.some((error) =>
      error.includes('texas: operatorVoiceRecords entry is missing'),
    ),
    true,
  )
  assert.equal(
    result.errors.some((error) =>
      error.includes('unknown: operatorVoiceRecords has no operatorCatalog entry'),
    ),
    true,
  )
})

test('音声ID・audioPathの重複と必須テキスト欠損を検出する', () => {
  const result = validateVoiceData({
    operatorCatalog: [operator()],
    operatorVoiceRecords: {
      amiya: [
        voice(),
        voice({
          fileCode: 'cn_001',
          label: '',
          category: 'Other',
          english: ' ',
          japanese: '',
          audioPath: 'CHAR_002_AMIYA/cn_001.MP3',
        }),
      ],
    },
  })

  assert.equal(
    result.errors.some((error) => error.includes('duplicate voice ID cn_001')),
    true,
  )
  assert.equal(
    result.errors.some((error) =>
      error.includes('duplicate generated voice ID amiya-cn_001'),
    ),
    true,
  )
  assert.equal(
    result.errors.some((error) => error.includes('duplicate audioPath')),
    true,
  )
  assert.equal(
    result.errors.some((error) => error.includes('label is empty')),
    true,
  )
  assert.equal(
    result.errors.some((error) => error.includes('english is empty')),
    true,
  )
  assert.equal(
    result.errors.some((error) => error.includes('category must be')),
    true,
  )
  assert.equal(
    result.warnings.some((warning) =>
      warning.includes('japanese translation is empty'),
    ),
    true,
  )
})

test('通常実行は構造検証のみ、audioオプションで通信検証を有効化する', () => {
  assert.equal(parseCliArguments([]).checkAudio, false)
  assert.equal(parseCliArguments(['--audio']).checkAudio, true)
  assert.equal(parseCliArguments(['--network']).checkAudio, true)
  assert.throws(
    () => parseCliArguments(['--concurrency', '0']),
    /positive integer/,
  )
})

test('音声通信検証はHEADを使い、失敗URLを返す', async () => {
  const calls = []
  const voices = [
    { operatorId: 'amiya', fileCode: 'CN_001', url: 'https://example.test/a.mp3' },
    { operatorId: 'texas', fileCode: 'CN_001', url: 'https://example.test/b.mp3' },
  ]
  const failures = await validateAudioFiles(voices, {
    concurrency: 2,
    maxAttempts: 1,
    fetchImpl: async (url, init) => {
      calls.push({ url, init })
      const ok = url.endsWith('/a.mp3')
      return {
        ok,
        status: ok ? 200 : 404,
        headers: new Headers({
          'content-type': 'audio/mpeg',
          'content-length': '1234',
        }),
      }
    },
  })

  assert.equal(calls.length, 2)
  assert.equal(calls.every(({ init }) => init.method === 'HEAD'), true)
  assert.equal(failures.length, 1)
  assert.match(failures[0], /texas\/CN_001: HTTP 404/)
})
