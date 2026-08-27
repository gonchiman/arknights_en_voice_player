import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const audioRoot =
  'https://raw.githubusercontent.com/PseudoMon/arknights-audio/global-server-voices/voice_en'
const allowedCategories = new Set(['Talk', 'Battle', 'Greeting'])
const catalogTextFields = [
  'id',
  'charId',
  'name',
  'japaneseName',
  'operatorClass',
  'subclass',
  'faction',
  'voiceActor',
  'initials',
  'accent',
  'description',
]
const defaultAudioOptions = {
  concurrency: 20,
  requestTimeoutMs: 15_000,
  maxAttempts: 3,
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== ''
}

function normalizedKey(value) {
  return value.trim().toLocaleLowerCase('en-US')
}

function addRequiredTextErrors(errors, value, fields, context) {
  for (const field of fields) {
    if (!isNonEmptyString(value[field])) {
      errors.push(`${context}: ${field} is empty`)
    }
  }
}

/**
 * Validates generated operator data without making network requests.
 */
export function validateVoiceData({ operatorCatalog, operatorVoiceRecords }) {
  const errors = []
  const warnings = []
  const playableVoices = []
  const unavailableVoices = []
  const catalogById = new Map()
  const catalogIds = new Map()
  const characterIds = new Map()

  if (!Array.isArray(operatorCatalog)) {
    errors.push('operatorCatalog must be an array')
  } else if (operatorCatalog.length === 0) {
    errors.push('operatorCatalog is empty')
  } else {
    for (const [index, operator] of operatorCatalog.entries()) {
      const context = `operatorCatalog[${index}]`

      if (!isRecord(operator)) {
        errors.push(`${context}: operator must be an object`)
        continue
      }

      addRequiredTextErrors(errors, operator, catalogTextFields, context)

      if (
        !Number.isInteger(operator.rarity) ||
        operator.rarity < 1 ||
        operator.rarity > 6
      ) {
        errors.push(`${context}: rarity must be an integer from 1 to 6`)
      }

      if (isNonEmptyString(operator.id)) {
        const idKey = normalizedKey(operator.id)
        const previousIndex = catalogIds.get(idKey)

        if (previousIndex !== undefined) {
          errors.push(
            `${context}: duplicate operator ID ${operator.id} (already used at operatorCatalog[${previousIndex}])`,
          )
        } else {
          catalogIds.set(idKey, index)
          catalogById.set(operator.id, operator)
        }

        if (operator.id !== operator.id.trim()) {
          errors.push(`${context}: id must not have surrounding whitespace`)
        }
      }

      if (isNonEmptyString(operator.charId)) {
        const charIdKey = normalizedKey(operator.charId)
        const previous = characterIds.get(charIdKey)

        if (previous) {
          errors.push(
            `${context}: duplicate character ID ${operator.charId} (already used by ${previous})`,
          )
        } else {
          characterIds.set(charIdKey, operator.id || context)
        }
      }
    }
  }

  if (!isRecord(operatorVoiceRecords)) {
    errors.push('operatorVoiceRecords must be an object')
    return {
      errors,
      warnings,
      playableVoices,
      unavailableVoices,
      stats: {
        operators: Array.isArray(operatorCatalog) ? operatorCatalog.length : 0,
        records: 0,
        playable: 0,
        unavailable: 0,
      },
    }
  }

  const voiceOperatorIds = Object.keys(operatorVoiceRecords)
  const voiceOperatorIdKeys = new Map(
    voiceOperatorIds.map((id) => [normalizedKey(id), id]),
  )

  for (const operatorId of catalogById.keys()) {
    if (!voiceOperatorIdKeys.has(normalizedKey(operatorId))) {
      errors.push(`${operatorId}: operatorVoiceRecords entry is missing`)
    }
  }

  const globalVoiceIds = new Map()
  const audioPaths = new Map()
  let recordCount = 0

  for (const [operatorId, records] of Object.entries(operatorVoiceRecords)) {
    const operator = catalogById.get(operatorId)

    if (!operator) {
      const caseVariant = catalogIds.has(normalizedKey(operatorId))
      errors.push(
        `${operatorId}: operatorVoiceRecords has no ${caseVariant ? 'case-matching ' : ''}operatorCatalog entry`,
      )
    }

    if (!Array.isArray(records) || records.length === 0) {
      errors.push(`${operatorId}: voice records are empty`)
      continue
    }

    const operatorVoiceIds = new Map()

    for (const [index, record] of records.entries()) {
      recordCount += 1
      const fallbackCode = isRecord(record) ? record.fileCode : null
      const context = `${operatorId}/${fallbackCode || `record[${index}]`}`

      if (!isRecord(record)) {
        errors.push(`${context}: voice record must be an object`)
        continue
      }

      addRequiredTextErrors(
        errors,
        record,
        ['fileCode', 'label', 'category', 'english'],
        context,
      )

      if (!allowedCategories.has(record.category)) {
        errors.push(
          `${context}: category must be Talk, Battle, or Greeting`,
        )
      }

      if (typeof record.japanese !== 'string') {
        errors.push(`${context}: japanese must be a string`)
      } else if (record.japanese.trim() === '') {
        warnings.push(`${context}: japanese translation is empty`)
      }

      if (isNonEmptyString(record.fileCode)) {
        const fileCodeKey = normalizedKey(record.fileCode)
        const previousIndex = operatorVoiceIds.get(fileCodeKey)

        if (previousIndex !== undefined) {
          errors.push(
            `${context}: duplicate voice ID ${record.fileCode} (already used at record[${previousIndex}])`,
          )
        } else {
          operatorVoiceIds.set(fileCodeKey, index)
        }

        const voiceId = `${normalizedKey(operatorId)}-${fileCodeKey}`
        const previousVoice = globalVoiceIds.get(voiceId)

        if (previousVoice) {
          errors.push(
            `${context}: duplicate generated voice ID ${voiceId} (already used by ${previousVoice})`,
          )
        } else {
          globalVoiceIds.set(voiceId, context)
        }
      }

      if (record.audioPath === null) {
        unavailableVoices.push({ operatorId, fileCode: record.fileCode })
        continue
      }

      if (!isNonEmptyString(record.audioPath)) {
        errors.push(`${context}: audioPath must be a non-empty string or null`)
        continue
      }

      if (
        record.audioPath.startsWith('/') ||
        record.audioPath.includes('\\') ||
        record.audioPath.split('/').includes('..') ||
        /^[a-z][a-z\d+.-]*:/i.test(record.audioPath)
      ) {
        errors.push(`${context}: audioPath must be a safe relative URL path`)
      }

      if (!record.audioPath.toLocaleLowerCase('en-US').endsWith('.mp3')) {
        errors.push(`${context}: audioPath must point to an MP3 file`)
      }

      const audioPathKey = normalizedKey(record.audioPath.replaceAll('\\', '/'))
      const previousAudio = audioPaths.get(audioPathKey)

      if (previousAudio) {
        errors.push(
          `${context}: duplicate audioPath ${record.audioPath} (already used by ${previousAudio})`,
        )
      } else {
        audioPaths.set(audioPathKey, context)
      }

      playableVoices.push({
        operatorId,
        fileCode: record.fileCode,
        url: `${audioRoot}/${record.audioPath}`,
      })
    }
  }

  return {
    errors,
    warnings,
    playableVoices,
    unavailableVoices,
    stats: {
      operators: Array.isArray(operatorCatalog) ? operatorCatalog.length : 0,
      records: recordCount,
      playable: playableVoices.length,
      unavailable: unavailableVoices.length,
    },
  }
}

function positiveInteger(value, flag) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${flag} must be a positive integer`)
  }
  return parsed
}

export function parseCliArguments(argv) {
  const options = {
    checkAudio: false,
    verbose: false,
    ...defaultAudioOptions,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]

    if (argument === '--audio' || argument === '--network') {
      options.checkAudio = true
    } else if (argument === '--verbose') {
      options.verbose = true
    } else if (argument === '--concurrency') {
      options.concurrency = positiveInteger(argv[++index], argument)
    } else if (argument === '--timeout-ms') {
      options.requestTimeoutMs = positiveInteger(argv[++index], argument)
    } else if (argument === '--attempts') {
      options.maxAttempts = positiveInteger(argv[++index], argument)
    } else if (argument === '--help' || argument === '-h') {
      options.help = true
    } else {
      throw new Error(`Unknown argument: ${argument}`)
    }
  }

  return options
}

async function validateAudio(voice, options) {
  let lastError

  for (let attempt = 1; attempt <= options.maxAttempts; attempt += 1) {
    try {
      const response = await options.fetchImpl(voice.url, {
        method: 'HEAD',
        redirect: 'follow',
        signal: AbortSignal.timeout(options.requestTimeoutMs),
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
      if (attempt < options.maxAttempts) {
        await options.wait(attempt * 500)
      }
    }
  }

  const message =
    lastError instanceof Error ? lastError.message : String(lastError)
  return `${voice.operatorId}/${voice.fileCode}: ${message} (${voice.url})`
}

export async function validateAudioFiles(voices, suppliedOptions = {}) {
  const options = {
    ...defaultAudioOptions,
    fetchImpl: fetch,
    wait: (milliseconds) =>
      new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds)),
    onProgress: () => {},
    ...suppliedOptions,
  }
  const failures = []
  let cursor = 0
  let completed = 0

  async function worker() {
    while (cursor < voices.length) {
      const index = cursor
      cursor += 1
      const failure = await validateAudio(voices[index], options)
      if (failure) failures.push(failure)
      completed += 1
      options.onProgress(completed, voices.length)
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(options.concurrency, voices.length) },
      () => worker(),
    ),
  )
  return failures
}

function printItems(title, items, verbose) {
  if (items.length === 0) return

  const visibleItems = verbose ? items : items.slice(0, 20)
  console.warn(`${title} (${items.length}):`)
  for (const item of visibleItems) console.warn(`- ${item}`)
  if (visibleItems.length < items.length) {
    console.warn(
      `- ... ${items.length - visibleItems.length} more (use --verbose to list all)`,
    )
  }
}

async function loadGeneratedData() {
  const catalogUrl = new URL('../src/data/operatorCatalog.ts', import.meta.url)
  const voicesUrl = new URL('../src/data/operatorVoices.ts', import.meta.url)
  const [{ operatorCatalog }, { operatorVoiceRecords }] = await Promise.all([
    import(catalogUrl.href),
    import(voicesUrl.href),
  ])
  return { operatorCatalog, operatorVoiceRecords }
}

function printHelp() {
  console.log(`Usage: node scripts/validate-voice-data.mjs [options]

Validates catalog/voice structure locally by default. Network checks are opt-in.

Options:
  --audio, --network      HEAD-check every configured audio URL
  --concurrency NUMBER    Concurrent audio requests (default: 20)
  --timeout-ms NUMBER     Per-request timeout (default: 15000)
  --attempts NUMBER       Attempts per audio URL (default: 3)
  --verbose               List every warning and unavailable voice
  --help, -h              Show this help`)
}

export async function main(argv = process.argv.slice(2)) {
  const options = parseCliArguments(argv)
  if (options.help) {
    printHelp()
    return 0
  }

  const data = await loadGeneratedData()
  const result = validateVoiceData(data)
  const { stats } = result

  console.log(
    `Data: ${stats.operators} operators / ${stats.records} records / ${stats.playable} playable / ${stats.unavailable} unavailable`,
  )
  printItems('Warnings', result.warnings, options.verbose)

  if (result.errors.length > 0) {
    printItems('Voice data validation failed', result.errors, options.verbose)
    return 1
  }

  if (!options.checkAudio) {
    console.log(
      'OK: structural validation passed. Run npm run validate:voices:audio for network validation.',
    )
    return 0
  }

  let lastReported = 0
  const audioFailures = await validateAudioFiles(result.playableVoices, {
    concurrency: options.concurrency,
    requestTimeoutMs: options.requestTimeoutMs,
    maxAttempts: options.maxAttempts,
    onProgress: (completed, total) => {
      if (completed === total || completed - lastReported >= 250) {
        lastReported = completed
        console.log(`Audio: ${completed}/${total}`)
      }
    },
  })

  if (audioFailures.length > 0) {
    printItems('Audio validation failed', audioFailures, options.verbose)
    return 1
  }

  console.log(
    `OK: all ${stats.playable} configured voice files are available; ${stats.unavailable} record(s) are marked unavailable.`,
  )
  return 0
}

const entryPath = process.argv[1] ? resolve(process.argv[1]) : null
if (entryPath && pathToFileURL(entryPath).href === import.meta.url) {
  try {
    process.exitCode = await main()
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
