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

test('Endfieldデータを名前空間化し、公開元の英語音声をストリーミングする', () => {
  const audioUrls = endfieldVoiceLines.map((voice) => voice.audioUrl)
  assert.equal(endfieldOperators.length, 30)
  assert.equal(endfieldVoiceLines.length, 2454)
  assert.ok(endfieldOperators.every((operator) => operator.voices.length >= 79))
  assert.ok(endfieldOperators.every((operator) => operator.id.startsWith('endfield:')))
  assert.ok(endfieldVoiceLines.every((voice) => voice.id.startsWith('endfield:')))
  assert.ok(
    endfieldVoiceLines.every((voice) =>
      voice.audioUrl?.startsWith('https://static.warfarin.wiki/'),
    ),
  )
  assert.equal(new Set(audioUrls).size, endfieldVoiceLines.length)
  assert.ok(
    endfieldVoiceLines.every((voice) => /^EN(?:-[FM])? \/ /.test(voice.displayCode)),
  )
  assert.ok(endfieldVoiceLines.every((voice) => voice.playbackMode === 'audio'))
})

test('管理人の女性版と男性版を別IDの各55件として保持する', () => {
  const endministrator = endfieldOperators.find(
    (operator) => operator.name === 'Endministrator',
  )
  assert.ok(endministrator)

  const femaleVoices = endministrator.voices.filter(
    (voice) => voice.voiceVariant === 'female',
  )
  const maleVoices = endministrator.voices.filter(
    (voice) => voice.voiceVariant === 'male',
  )
  assert.equal(femaleVoices.length, 55)
  assert.equal(maleVoices.length, 55)
  assert.ok(femaleVoices.every((voice) => voice.displayCode?.startsWith('EN-F / ')))
  assert.ok(maleVoices.every((voice) => voice.displayCode?.startsWith('EN-M / ')))
  assert.ok(femaleVoices.every((voice) => voice.id.includes('chr_0003_endminf')))
  assert.ok(maleVoices.every((voice) => voice.id.includes('chr_0002_endminm')))
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
  const audioVoice = endfieldVoiceLines[0]
  const ttsVoice = {
    ...audioVoice,
    playbackMode: 'tts',
    audioUrl: null,
  }
  const invalidAudioVoice = {
    ...audioVoice,
    playbackMode: 'audio',
    audioUrl: null,
  }

  assert.equal(isVoiceConfiguredForPlayback(audioVoice), true)
  assert.equal(isVoicePlayable(audioVoice), true)
  assert.equal(isVoiceConfiguredForPlayback(ttsVoice), true)
  assert.equal(isVoiceConfiguredForPlayback(invalidAudioVoice), false)
  assert.equal(isVoicePlayable(ttsVoice), false)
})
