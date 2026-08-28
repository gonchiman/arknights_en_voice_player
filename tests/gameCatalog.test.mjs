import assert from 'node:assert/strict'
import test from 'node:test'
import {
  endfieldDataMetadata,
  endfieldOperators,
} from '../src/data/endfieldOperatorData.ts'
import {
  isVoiceConfiguredForPlayback,
  isVoicePlayable,
} from '../src/lib/voicePlayback.ts'
import { operatorCatalog } from '../src/data/operatorCatalog.ts'
import { operatorVoiceRecords } from '../src/data/operatorVoices.ts'

const endfieldClasses = ['Guard', 'Defender', 'Supporter', 'Caster', 'Vanguard', 'Striker']
const endfieldRarities = [6, 5, 4]
const endfieldVoiceLines = endfieldOperators.flatMap((operator) => operator.voices)

test('EndfieldカタログのIDと英日台詞が整合する', () => {
  const operatorIds = new Set(endfieldOperators.map((operator) => operator.id))
  const voiceIds = new Set(endfieldVoiceLines.map((voice) => voice.id))

  assert.equal(operatorIds.size, endfieldOperators.length)
  assert.equal(voiceIds.size, endfieldVoiceLines.length)
  assert.equal(endfieldOperators.length, endfieldDataMetadata.operatorCount)
  assert.equal(endfieldVoiceLines.length, endfieldDataMetadata.voiceCount)
  for (const operator of endfieldOperators) {
    assert.ok(endfieldClasses.includes(operator.operatorClass))
    assert.ok(endfieldRarities.includes(operator.rarity))
    for (const voice of operator.voices) {
      assert.equal(voice.operatorId, operator.id)
      assert.ok(voice.english.length > 0)
      assert.ok(voice.japanese.length > 0)
    }
  }
})

test('Endfieldデータを名前空間化し、音声ファイルを含めずTTSで再生する', () => {
  assert.equal(endfieldOperators.length, 30)
  assert.equal(endfieldVoiceLines.length, 360)
  assert.ok(endfieldOperators.every((operator) => operator.voices.length === 12))
  assert.ok(endfieldOperators.every((operator) => operator.id.startsWith('endfield:')))
  assert.ok(endfieldVoiceLines.every((voice) => voice.id.startsWith('endfield:')))
  assert.ok(endfieldVoiceLines.every((voice) => voice.audioUrl === null))
  assert.ok(endfieldVoiceLines.every((voice) => voice.playbackMode === 'tts'))
})

test('作品間でオペレーターIDとボイスIDが衝突しない', () => {
  const arknightsOperatorIds = new Set(operatorCatalog.map((operator) => operator.id))
  const arknightsVoiceIds = new Set(
    Object.entries(operatorVoiceRecords).flatMap(([operatorId, voices]) =>
      voices.map((voice) => `${operatorId}-${voice.fileCode.toLowerCase()}`),
    ),
  )

  assert.ok(
    endfieldOperators.every((operator) => !arknightsOperatorIds.has(operator.id)),
  )
  assert.ok(endfieldVoiceLines.every((voice) => !arknightsVoiceIds.has(voice.id)))
})

test('実行環境とデータの両方を満たす音声だけを再生可能と判定する', () => {
  const ttsVoice = endfieldVoiceLines[0]
  const invalidAudioVoice = {
    ...ttsVoice,
    playbackMode: 'audio',
    audioUrl: null,
  }

  assert.equal(isVoiceConfiguredForPlayback(ttsVoice), true)
  assert.equal(isVoiceConfiguredForPlayback(invalidAudioVoice), false)
  assert.equal(isVoicePlayable(ttsVoice), false)
})
