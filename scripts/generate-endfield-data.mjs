import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const sourceRoot = 'https://warfarin.wiki'
const audioSourceRoot = 'https://static.warfarin.wiki/'
const dataApiRoot = 'https://endfield-assets.fffdan.com'
const endministratorMaleId = 'chr_0002_endminm'
const operatorIndexUrl = `${sourceRoot}/en/operators`
const outputPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../src/data/endfieldOperatorData.ts',
)
const elementAccents = {
  Heat: '#e16d4f',
  Cryo: '#68a9ce',
  Electric: '#8b7bd1',
  Nature: '#68a06b',
  Physical: '#bd9655',
}

const namedEntities = {
  amp: '&',
  apos: "'",
  gt: '>',
  lt: '<',
  nbsp: ' ',
  quot: '"',
}

function decodeHtml(value) {
  return value
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, code) => {
      if (code.startsWith('#x')) return String.fromCodePoint(Number.parseInt(code.slice(2), 16))
      if (code.startsWith('#')) return String.fromCodePoint(Number.parseInt(code.slice(1), 10))
      return namedEntities[code.toLowerCase()] ?? entity
    })
    .replace(/\s+/g, ' ')
    .trim()
}

async function fetchText(url, attempt = 1) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Arknights-EN-Voice-Player/1.0 (fan study app data generator)',
    },
  })

  if (response.ok) return response.text()
  if (attempt < 3 && response.status >= 500) return fetchText(url, attempt + 1)
  throw new Error(`${url}: HTTP ${response.status}`)
}

function capture(html, pattern, field, url) {
  const match = html.match(pattern)
  if (!match) throw new Error(`${url}: missing ${field}`)
  return decodeHtml(match[1])
}

function captureOptional(html, pattern, fallback = '') {
  const match = html.match(pattern)
  return match ? decodeHtml(match[1]) : fallback
}

function parseOperatorSlugs(html) {
  return [
    ...new Set(
      [...html.matchAll(/href="\/en\/operators\/([^"?#]+)"/g)].map(
        (match) => match[1],
      ),
    ),
  ]
}

function parseVoiceRows(html, locale) {
  const rows = new Map()
  const rowPattern = /<li class="flex items-start gap-3">([\s\S]*?)<\/li>/g

  for (const rowMatch of html.matchAll(rowPattern)) {
    const row = rowMatch[1]
    const audioMatch = row.match(
      new RegExp(
        `href="(https://static\\.warfarin\\.wiki/v\\d+/audio/${locale}/char/([^/]+)/([^"/]+)\\.mp3)"`,
      ),
    )
    if (!audioMatch) continue

    const labelMatch = row.match(/<span class="font-semibold">([\s\S]*?)<\/span>/)
    const textMatch = row.match(
      /<span class="text-muted-foreground">([\s\S]*?)<\/span>/,
    )
    if (!labelMatch || !textMatch) continue

    rows.set(audioMatch[3], {
      audioUrl: audioMatch[1],
      charId: audioMatch[2],
      fileCode: audioMatch[3],
      label: decodeHtml(labelMatch[1]),
      text: decodeHtml(textMatch[1]),
    })
  }

  return rows
}

function parseJsonWithStringIds(value) {
  return JSON.parse(
    value.replace(/("id"\s*:\s*)(-?\d+)/g, '$1"$2"'),
  )
}

function audioVersionFromUrl(url) {
  const match = url.match(/^https:\/\/static\.warfarin\.wiki\/(v\d+)\//)
  if (!match) throw new Error(`unknown audio URL version: ${url}`)
  return match[1]
}

async function fetchEndministratorMaleRows(audioVersion) {
  const [recordText, englishDictText, japaneseDictText] = await Promise.all([
    fetchText(`${dataApiRoot}/table/CharacterTable/${endministratorMaleId}`),
    fetchText(
      `${dataApiRoot}/i18n/dict/EN/table/CharacterTable/${endministratorMaleId}`,
    ),
    fetchText(
      `${dataApiRoot}/i18n/dict/JP/table/CharacterTable/${endministratorMaleId}`,
    ),
  ])
  const record = parseJsonWithStringIds(recordText)
  const englishDict = JSON.parse(englishDictText)
  const japaneseDict = JSON.parse(japaneseDictText)

  return record.profileVoice.map((voice) => {
    const label = englishDict[voice.voiceTitle.id]
    const english = englishDict[voice.voiceDesc.id]
    const japanese = japaneseDict[voice.voiceDesc.id]
    if (!label || !english || !japanese) {
      throw new Error(`missing Endministrator localization: ${voice.voId}`)
    }

    return {
      english: {
        audioUrl: `${audioSourceRoot}${audioVersion}/audio/en/char/${endministratorMaleId}/${voice.voId}.mp3`,
        charId: endministratorMaleId,
        fileCode: voice.voId,
        label,
        text: english,
      },
      japanese: {
        charId: endministratorMaleId,
        fileCode: voice.voId,
        label: japaneseDict[voice.voiceTitle.id] ?? label,
        text: japanese,
      },
    }
  })
}

function categoryFor(label) {
  if (
    /Combat|Battle|Tactical|Final Strike|Injured|Danger|Encouragement|0 HP/i.test(
      label,
    )
  ) {
    return 'Battle'
  }
  if (/Greeting|Reporting for Duty|Standing by/i.test(label)) return 'Greeting'
  return 'Talk'
}

function initialsFor(name) {
  const words = name.match(/[A-Za-z0-9]+/g) ?? []
  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase()
  return (words[0] ?? 'EF').slice(0, 2).toUpperCase()
}

function voiceVariant(charId) {
  if (charId.endsWith('_endminm')) return { code: 'EN-M', value: 'male' }
  if (charId.endsWith('_endminf')) return { code: 'EN-F', value: 'female' }
  return null
}

async function parseOperator(slug) {
  const englishUrl = `${sourceRoot}/en/operators/${slug}`
  const japaneseUrl = `${sourceRoot}/jp/operators/${slug}`
  const [englishHtml, japaneseHtml] = await Promise.all([
    fetchText(englishUrl),
    fetchText(japaneseUrl),
  ])

  const englishRows = parseVoiceRows(englishHtml, 'en')
  const japaneseRows = parseVoiceRows(japaneseHtml, 'jp')
  if (slug === 'endministrator') {
    const firstAudioUrl = englishRows.values().next().value?.audioUrl
    if (!firstAudioUrl) throw new Error(`${englishUrl}: missing audio version`)
    const maleRows = await fetchEndministratorMaleRows(
      audioVersionFromUrl(firstAudioUrl),
    )
    for (const row of maleRows) {
      englishRows.set(row.english.fileCode, row.english)
      japaneseRows.set(row.japanese.fileCode, row.japanese)
    }
  }
  const selectedRows = [...englishRows.values()]
  if (selectedRows.length === 0) throw new Error(`${englishUrl}: no dialogue rows found`)

  const name = capture(englishHtml, /<title>([\s\S]*?)<\/title>/, 'name', englishUrl)
  const japaneseName = capture(
    japaneseHtml,
    /<title>([\s\S]*?)<\/title>/,
    'Japanese name',
    japaneseUrl,
  )
  const rarity = Number(
    capture(
      englishHtml,
      /<th[^>]*>Rarity<\/th><td[^>]*>([\s\S]*?)<\/td>/,
      'rarity',
      englishUrl,
    ).replace(/\D/g, ''),
  )
  const operatorClass = capture(
    englishHtml,
    /<th[^>]*>Class<\/th><td[^>]*>([\s\S]*?)<\/td>/,
    'class',
    englishUrl,
  ).replace(/^Support$/, 'Supporter')
  const element = capture(
    englishHtml,
    /<th[^>]*>Element<\/th><td[^>]*>([\s\S]*?)<\/td>/,
    'element',
    englishUrl,
  )
  const pageVoiceActor = captureOptional(
    englishHtml,
    /<th[^>]*>English<\/th><td[^>]*>([\s\S]*?)<\/td>/,
    '—',
  )
  const voiceActor =
    slug === 'endministrator'
      ? `${pageVoiceActor} (F) / Hyoie O'Grady (M)`
      : pageVoiceActor
  const faction = captureOptional(
    englishHtml,
    /<h3[^>]*>Faction<\/h3>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/,
    '—',
  )
  const description = captureOptional(
    japaneseHtml,
    /<meta name="description" content="([^"]*)"\s*\/?>/,
    captureOptional(
      englishHtml,
      /<meta name="description" content="([^"]*)"\s*\/?>/,
      '',
    ),
  )
  const charId = selectedRows[0].charId
  const operatorId = `endfield:${charId}`
  const hasVoiceVariants = new Set(selectedRows.map((row) => row.charId)).size > 1
  const voiceNumberByCharId = new Map()
  const voices = selectedRows.flatMap((englishRow, index) => {
    const japaneseRow = japaneseRows.get(englishRow.fileCode)
    if (!japaneseRow?.text) return []

    const variant = hasVoiceVariants ? voiceVariant(englishRow.charId) : null
    const voiceNumber = (voiceNumberByCharId.get(englishRow.charId) ?? 0) + 1
    voiceNumberByCharId.set(englishRow.charId, voiceNumber)

    return [
      {
        id: `endfield:${englishRow.charId}:${englishRow.fileCode}`,
        operatorId,
        fileCode: englishRow.fileCode,
        displayCode: `${variant?.code ?? 'EN'} / ${String(
          variant ? voiceNumber : index + 1,
        ).padStart(2, '0')}`,
        label: englishRow.label,
        category: categoryFor(englishRow.label),
        english: englishRow.text,
        japanese: japaneseRow.text,
        audioUrl: englishRow.audioUrl,
        playbackMode: 'audio',
        voiceVariant: variant?.value,
      },
    ]
  })

  if (voices.length === 0) throw new Error(`${englishUrl}: no aligned EN/JP dialogue rows`)

  return {
    id: operatorId,
    charId,
    name,
    japaneseName,
    rarity,
    operatorClass,
    subclass: element,
    faction,
    voiceActor,
    initials: initialsFor(name),
    accent: elementAccents[element] ?? '#7d8790',
    description,
    voices,
  }
}

async function mapWithConcurrency(values, concurrency, mapper) {
  const results = new Array(values.length)
  let nextIndex = 0

  async function worker() {
    while (nextIndex < values.length) {
      const index = nextIndex
      nextIndex += 1
      results[index] = await mapper(values[index], index)
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()))
  return results
}

function validateOperators(operators) {
  const operatorIds = new Set()
  const voiceIds = new Set()

  for (const operator of operators) {
    if (operatorIds.has(operator.id)) throw new Error(`duplicate operator ID: ${operator.id}`)
    operatorIds.add(operator.id)
    if (!operator.id.startsWith('endfield:')) throw new Error(`invalid operator ID: ${operator.id}`)

    for (const voice of operator.voices) {
      if (voiceIds.has(voice.id)) throw new Error(`duplicate voice ID: ${voice.id}`)
      voiceIds.add(voice.id)
      if (!voice.english || !voice.japanese) throw new Error(`missing dialogue: ${voice.id}`)
      if (!voice.audioUrl?.startsWith(audioSourceRoot)) {
        throw new Error(`invalid audio URL: ${voice.id}`)
      }
      if (voice.playbackMode !== 'audio') throw new Error(`invalid playback mode: ${voice.id}`)
    }
  }
}

async function main() {
  const indexHtml = await fetchText(operatorIndexUrl)
  const slugs = parseOperatorSlugs(indexHtml)
  if (slugs.length === 0) throw new Error(`${operatorIndexUrl}: no operators found`)

  const operators = await mapWithConcurrency(slugs, 3, async (slug, index) => {
    const operator = await parseOperator(slug)
    console.log(`[${index + 1}/${slugs.length}] ${operator.name}: ${operator.voices.length} records`)
    return operator
  })
  validateOperators(operators)

  const voiceCount = operators.reduce((sum, operator) => sum + operator.voices.length, 0)
  const generatedAt = new Date().toISOString()
  const output = `// Generated by scripts/generate-endfield-data.mjs from Warfarin Wiki.\n// Audio is streamed from the source URL and is not copied into this repository.\n// Original game text, audio, and related intellectual property belong to their respective rights holders.\nimport type { Operator } from '../types/app'\n\nexport const endfieldDataMetadata = ${JSON.stringify(
    {
      sourceUrl: operatorIndexUrl,
      supplementalSourceUrl: `${dataApiRoot}/table/CharacterTable/${endministratorMaleId}`,
      generatedAt,
      operatorCount: operators.length,
      voiceCount,
      voiceCoverage: 'all-aligned-profile-voice-lines',
    },
    null,
    2,
  )} as const\n\nexport const endfieldOperators: Operator[] = ${JSON.stringify(operators, null, 2)}\n`

  await writeFile(outputPath, output, 'utf8')
  console.log(`Saved ${operators.length} operators / ${voiceCount} records to ${outputPath}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
