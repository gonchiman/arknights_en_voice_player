import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const audioRoot =
  'https://raw.githubusercontent.com/PseudoMon/arknights-audio/global-server-voices/voice_en'
const sourceMarker =
  'export const operatorVoiceRecords: Record<string, OperatorVoiceRecord[]> = '
const concurrency = 10
const requestTimeoutMs = 15_000
const maxAttempts = 3

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const dataPath = resolve(scriptDirectory, '../src/data/operatorVoices.ts')
const source = await readFile(dataPath, 'utf8')
const markerIndex = source.indexOf(sourceMarker)

if (markerIndex === -1) {
  throw new Error(`Generated data marker was not found: ${dataPath}`)
}

const operatorVoiceRecords = JSON.parse(
  source.slice(markerIndex + sourceMarker.length),
)
const validationErrors = []
const voices = []
const unavailableVoices = []

for (const [operatorId, records] of Object.entries(operatorVoiceRecords)) {
  if (!Array.isArray(records) || records.length === 0) {
    validationErrors.push(`${operatorId}: voice records are empty`)
    continue
  }

  const voiceIds = new Set()

  for (const record of records) {
    const requiredFields = ['fileCode', 'label', 'category']
    if (record.audioPath !== null) {
      requiredFields.push('english', 'japanese')
    }

    for (const field of requiredFields) {
      if (typeof record[field] !== 'string' || record[field].trim() === '') {
        validationErrors.push(
          `${operatorId}/${record.fileCode ?? 'unknown'}: ${field} is empty`,
        )
      }
    }

    if (voiceIds.has(record.fileCode)) {
      validationErrors.push(
        `${operatorId}: duplicate voice ID ${record.fileCode}`,
      )
    }
    voiceIds.add(record.fileCode)

    if (record.audioPath === null) {
      unavailableVoices.push({ operatorId, fileCode: record.fileCode })
    } else if (
      typeof record.audioPath !== 'string' ||
      record.audioPath.trim() === ''
    ) {
      validationErrors.push(
        `${operatorId}/${record.fileCode}: audioPath must be a string or null`,
      )
    } else {
      voices.push({
        operatorId,
        fileCode: record.fileCode,
        url: `${audioRoot}/${record.audioPath}`,
      })
    }
  }
}

if (validationErrors.length > 0) {
  console.error('Voice data validation failed:')
  for (const error of validationErrors) console.error(`- ${error}`)
  process.exitCode = 1
} else {
  console.log(
    `Data: ${Object.keys(operatorVoiceRecords).length} operators / ${voices.length + unavailableVoices.length} records / ${voices.length} playable / ${unavailableVoices.length} unavailable`,
  )
  for (const voice of unavailableVoices) {
    console.warn(`Unavailable: ${voice.operatorId}/${voice.fileCode}`)
  }
}

async function validateAudio(voice) {
  let lastError

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(voice.url, {
        method: 'HEAD',
        redirect: 'follow',
        signal: AbortSignal.timeout(requestTimeoutMs),
        headers: { 'User-Agent': 'arknights-en-voice-player-validator' },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const contentType = response.headers.get('content-type') ?? ''
      if (!contentType.startsWith('audio/')) {
        throw new Error(`unexpected content type: ${contentType || 'missing'}`)
      }

      const contentLength = Number(response.headers.get('content-length'))
      if (!Number.isFinite(contentLength) || contentLength <= 0) {
        throw new Error('content length is missing or empty')
      }

      return null
    } catch (error) {
      lastError = error
      if (attempt < maxAttempts) {
        await new Promise((resolvePromise) =>
          setTimeout(resolvePromise, attempt * 500),
        )
      }
    }
  }

  const message = lastError instanceof Error ? lastError.message : String(lastError)
  return `${voice.operatorId}/${voice.fileCode}: ${message} (${voice.url})`
}

async function validateWithConcurrency(items) {
  const failures = []
  let cursor = 0
  let completed = 0

  async function worker() {
    while (cursor < items.length) {
      const index = cursor
      cursor += 1
      const failure = await validateAudio(items[index])
      if (failure) failures.push(failure)
      completed += 1

      if (completed % 25 === 0 || completed === items.length) {
        console.log(`Audio: ${completed}/${items.length}`)
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
  )
  return failures
}

if (validationErrors.length === 0) {
  const audioFailures = await validateWithConcurrency(voices)

  if (audioFailures.length > 0) {
    console.error(`Audio validation failed (${audioFailures.length}):`)
    for (const failure of audioFailures) console.error(`- ${failure}`)
    process.exitCode = 1
  } else {
    console.log(
      `OK: all ${voices.length} configured voice files are available; ${unavailableVoices.length} record(s) are marked unavailable.`,
    )
  }
}
