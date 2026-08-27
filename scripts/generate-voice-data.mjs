import { writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const gameDataRoot =
  'https://raw.githubusercontent.com/ArknightsAssets/ArknightsGamedata/master'
const audioRepositoryApi =
  'https://api.github.com/repos/PseudoMon/arknights-audio/git/trees'
const audioBranch = 'global-server-voices'
const standardVoiceIdPattern = /^CN_\d+$/

const legacyOperatorIds = new Map([
  ['char_002_amiya', 'amiya'],
  ['char_102_texas', 'texas'],
  ['char_103_angel', 'exusiai'],
  ['char_172_svrash', 'silverash'],
  ['char_148_nearl', 'nearl'],
  ['char_128_plosis', 'ptilopsis'],
  ['char_151_myrtle', 'myrtle'],
  ['char_140_whitew', 'lappland'],
])

const legacyOperatorOrder = new Map(
  [...legacyOperatorIds.keys()].map((charId, index) => [charId, index]),
)

const legacyPresentation = new Map([
  ['char_002_amiya', { initials: 'AM', accent: '#48c7e8' }],
  ['char_102_texas', { initials: 'TX', accent: '#7e9cff' }],
  ['char_103_angel', { initials: 'EX', accent: '#ff695f' }],
  ['char_172_svrash', { initials: 'SA', accent: '#b9c6d0' }],
  ['char_148_nearl', { initials: 'NR', accent: '#f4c45d' }],
  ['char_128_plosis', { initials: 'PT', accent: '#8ce0c3' }],
  ['char_151_myrtle', { initials: 'MY', accent: '#ff9a63' }],
  ['char_140_whitew', { initials: 'LP', accent: '#e1e4e8' }],
])

const professionNames = new Map([
  ['PIONEER', 'Vanguard'],
  ['WARRIOR', 'Guard'],
  ['TANK', 'Defender'],
  ['SNIPER', 'Sniper'],
  ['CASTER', 'Caster'],
  ['MEDIC', 'Medic'],
  ['SUPPORT', 'Supporter'],
  ['SPECIAL', 'Specialist'],
])

const accentPalette = [
  '#67b7dc',
  '#7e9cff',
  '#8ce0c3',
  '#f4c45d',
  '#ff9a63',
  '#e98fa8',
  '#b99be8',
  '#72c6b8',
  '#e4ad65',
  '#8db8ea',
  '#d4a1cb',
  '#a9c86e',
]

const requestHeaders = {
  'User-Agent': 'arknights-en-voice-player-data-generator',
}

const githubHeaders = {
  ...requestHeaders,
  Accept: 'application/vnd.github+json',
  ...(process.env.GITHUB_TOKEN
    ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
    : {}),
}

async function fetchJson(url, { headers = requestHeaders } = {}) {
  let lastError

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(45_000),
      })

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}: ${url}`)
      }

      return await response.json()
    } catch (error) {
      lastError = error
      if (attempt < 3) {
        await new Promise((resolvePromise) =>
          setTimeout(resolvePromise, attempt * 750),
        )
      }
    }
  }

  throw lastError
}

async function fetchEnglishAudioFiles() {
  const rootTree = await fetchJson(
    `${audioRepositoryApi}/${encodeURIComponent(audioBranch)}`,
    { headers: githubHeaders },
  )
  const englishVoiceTree = rootTree.tree?.find(
    (entry) => entry.path === 'voice_en' && entry.type === 'tree',
  )

  if (!englishVoiceTree?.sha) {
    throw new Error(`voice_en tree was not found on ${audioBranch}`)
  }

  const audioTree = await fetchJson(
    `${audioRepositoryApi}/${englishVoiceTree.sha}?recursive=1`,
    { headers: githubHeaders },
  )

  if (audioTree.truncated) {
    throw new Error('The bulk English audio tree response was truncated')
  }

  return new Set(
    (audioTree.tree ?? [])
      .filter(
        (entry) =>
          entry.type === 'blob' &&
          /^char_[^/]+\/CN_\d+\.mp3$/i.test(entry.path),
      )
      .map((entry) => entry.path),
  )
}

function categoryFor(title) {
  if (/Greeting/i.test(title)) return 'Greeting'

  if (
    /Added to Squad|Squad Leader|Depart|Begin Operation|Selecting Operator|Deployment|In Battle|Result|Operation Failure/i.test(
      title,
    )
  ) {
    return 'Battle'
  }

  return 'Talk'
}

function cleanText(value) {
  if (typeof value !== 'string') return ''

  return value
    .replace(/<@[^>]+>/g, '')
    .replace(/<\/>/g, '')
    .replace(/\r\n/g, '\n')
    .trim()
}

function titleCaseIdentifier(value) {
  return String(value ?? '')
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => `${part[0].toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(' ')
}

function operatorIdFor(charId) {
  return legacyOperatorIds.get(charId) ?? charId
}

function rarityFor(value, charId) {
  const match = /^TIER_([1-6])$/.exec(value ?? '')

  if (!match) {
    throw new Error(`Unsupported rarity for ${charId}: ${String(value)}`)
  }

  return Number(match[1])
}

function classFor(profession, charId) {
  const operatorClass = professionNames.get(profession)

  if (!operatorClass) {
    throw new Error(`Unsupported profession for ${charId}: ${profession}`)
  }

  return operatorClass
}

function initialsFor(name) {
  const words = name.match(/[\p{L}\p{N}]+/gu) ?? []

  if (words.length > 1) {
    return words
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase()
  }

  return (words[0] ?? 'OP').slice(0, 2).toUpperCase()
}

function accentFor(charId) {
  let hash = 2166136261

  for (const character of charId) {
    hash ^= character.codePointAt(0)
    hash = Math.imul(hash, 16777619)
  }

  return accentPalette[(hash >>> 0) % accentPalette.length]
}

function powerNameFor(character, handbookTeams) {
  const power = character.mainPower ?? character
  const powerIds = [
    power.teamId ?? character.teamId,
    power.groupId ?? character.groupId,
    power.nationId ?? character.nationId,
  ]

  for (const powerId of powerIds) {
    const metadata = handbookTeams[powerId]
    const name = cleanText(metadata?.powerName ?? metadata?.powerCode)
    if (name) return name
  }

  return 'Unknown'
}

function englishVoiceActorFor(charId, voiceLangDict) {
  const names = voiceLangDict[charId]?.dict?.EN?.cvName

  if (!Array.isArray(names)) return 'Unknown'

  const voiceActor = names.map(cleanText).filter(Boolean).join(' / ')
  return voiceActor || 'Unknown'
}

function japaneseDescriptionFor(character, japaneseName) {
  const description = cleanText(
    character?.itemUsage ??
      character?.itemDesc ??
      character?.description ??
      '',
  )

  return description || `${japaneseName}の英語ボイスを収録しています。`
}

function compareOperators([leftId, left], [rightId, right]) {
  const leftLegacyOrder = legacyOperatorOrder.get(leftId)
  const rightLegacyOrder = legacyOperatorOrder.get(rightId)

  if (leftLegacyOrder !== undefined || rightLegacyOrder !== undefined) {
    if (leftLegacyOrder === undefined) return 1
    if (rightLegacyOrder === undefined) return -1
    return leftLegacyOrder - rightLegacyOrder
  }

  const rarityDifference =
    rarityFor(right.rarity, rightId) - rarityFor(left.rarity, leftId)
  if (rarityDifference !== 0) return rarityDifference

  const sortIndexDifference =
    Number(left.sortIndex ?? Number.MAX_SAFE_INTEGER) -
    Number(right.sortIndex ?? Number.MAX_SAFE_INTEGER)
  if (sortIndexDifference !== 0) return sortIndexDifference

  return String(left.name).localeCompare(String(right.name), 'en')
}

const [
  englishCharacters,
  japaneseCharacters,
  englishData,
  japaneseData,
  moduleData,
  handbookTeams,
  availableAudioFiles,
] = await Promise.all([
  fetchJson(`${gameDataRoot}/en/gamedata/excel/character_table.json`),
  fetchJson(`${gameDataRoot}/jp/gamedata/excel/character_table.json`),
  fetchJson(`${gameDataRoot}/en/gamedata/excel/charword_table.json`),
  fetchJson(`${gameDataRoot}/jp/gamedata/excel/charword_table.json`),
  fetchJson(`${gameDataRoot}/en/gamedata/excel/uniequip_table.json`),
  fetchJson(`${gameDataRoot}/en/gamedata/excel/handbook_team_table.json`),
  fetchEnglishAudioFiles(),
])

const registeredOperators = Object.entries(englishCharacters)
  .filter(
    ([charId, character]) =>
      charId.startsWith('char_') &&
      character.isNotObtainable === false &&
      character.profession !== 'TOKEN',
  )
  .sort(compareOperators)

const registeredCharIds = new Set(
  registeredOperators.map(([charId]) => charId),
)
const englishWordsByCharId = new Map(
  [...registeredCharIds].map((charId) => [charId, []]),
)

for (const line of Object.values(englishData.charWords ?? {})) {
  if (
    registeredCharIds.has(line.charId) &&
    line.wordKey === line.charId &&
    standardVoiceIdPattern.test(line.voiceId)
  ) {
    englishWordsByCharId.get(line.charId).push(line)
  }
}

const japaneseWordsById = new Map(
  Object.values(japaneseData.charWords ?? {}).map((line) => [
    line.charWordId,
    line,
  ]),
)
const japaneseWordsByVoice = new Map(
  Object.values(japaneseData.charWords ?? {})
    .filter(
      (line) =>
        line.wordKey === line.charId &&
        standardVoiceIdPattern.test(line.voiceId),
    )
    .map((line) => [`${line.charId}:${line.voiceId}`, line]),
)

const operatorCatalog = []
const operatorVoiceRecords = {}
let playableVoiceCount = 0
let unavailableVoiceCount = 0
let operatorsWithoutAudio = 0

for (const [charId, englishCharacter] of registeredOperators) {
  const operatorId = operatorIdFor(charId)
  const japaneseCharacter = japaneseCharacters[charId]
  const name = cleanText(englishCharacter.name) || charId
  const japaneseName = cleanText(japaneseCharacter?.name) || name
  const subProfessionId = englishCharacter.subProfessionId
  const subclass =
    cleanText(moduleData.subProfDict?.[subProfessionId]?.subProfessionName) ||
    titleCaseIdentifier(subProfessionId) ||
    'Unknown'
  const presentation = legacyPresentation.get(charId)

  operatorCatalog.push({
    id: operatorId,
    charId,
    name,
    japaneseName,
    rarity: rarityFor(englishCharacter.rarity, charId),
    operatorClass: classFor(englishCharacter.profession, charId),
    subclass,
    faction: powerNameFor(englishCharacter, handbookTeams),
    voiceActor: englishVoiceActorFor(charId, englishData.voiceLangDict ?? {}),
    initials: presentation?.initials ?? initialsFor(name),
    accent: presentation?.accent ?? accentFor(charId),
    description: japaneseDescriptionFor(japaneseCharacter, japaneseName),
  })

  const lines = englishWordsByCharId.get(charId).sort((left, right) =>
    left.voiceId.localeCompare(right.voiceId, 'en', { numeric: true }),
  )
  const voiceIds = new Set()
  const records = []
  let operatorPlayableCount = 0

  for (const line of lines) {
    if (voiceIds.has(line.voiceId)) {
      console.warn(`${operatorId}: skipped duplicate voice ${line.voiceId}`)
      continue
    }
    voiceIds.add(line.voiceId)

    const japaneseLine =
      japaneseWordsById.get(line.charWordId) ??
      japaneseWordsByVoice.get(`${charId}:${line.voiceId}`)
    const audioPath = `${charId}/${line.voiceId}.mp3`
    const hasAudio = availableAudioFiles.has(audioPath)

    if (hasAudio) {
      playableVoiceCount += 1
      operatorPlayableCount += 1
    } else {
      unavailableVoiceCount += 1
    }

    records.push({
      fileCode: line.voiceId,
      label: cleanText(line.voiceTitle) || line.voiceId,
      category: categoryFor(line.voiceTitle ?? ''),
      english: cleanText(line.voiceText),
      japanese: cleanText(japaneseLine?.voiceText),
      audioPath: hasAudio ? audioPath : null,
    })
  }

  if (operatorPlayableCount === 0) operatorsWithoutAudio += 1
  operatorVoiceRecords[operatorId] = records

  console.log(
    `${operatorId}: ${operatorPlayableCount}/${records.length} playable`,
  )
}

const operatorCatalogSource = `// This file is generated by scripts/generate-voice-data.mjs.\n// Do not edit it by hand.\n\nimport type { OperatorCatalogRecord } from '../types/app'\n\nexport const operatorCatalog: OperatorCatalogRecord[] = ${JSON.stringify(operatorCatalog, null, 2)}\n`

const operatorVoicesSource = `// This file is generated by scripts/generate-voice-data.mjs.\n// Do not edit it by hand.\n\nexport type OperatorVoiceRecord = {\n  fileCode: string\n  label: string\n  category: 'Talk' | 'Battle' | 'Greeting'\n  english: string\n  japanese: string\n  audioPath: string | null\n}\n\nexport const operatorVoiceRecords: Record<string, OperatorVoiceRecord[]> = ${JSON.stringify(operatorVoiceRecords, null, 2)}\n`

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const catalogDestination = resolve(
  scriptDirectory,
  '../src/data/operatorCatalog.ts',
)
const voicesDestination = resolve(
  scriptDirectory,
  '../src/data/operatorVoices.ts',
)

await Promise.all([
  writeFile(catalogDestination, operatorCatalogSource, 'utf8'),
  writeFile(voicesDestination, operatorVoicesSource, 'utf8'),
])

console.log(
  `Generated ${operatorCatalog.length} operators / ${playableVoiceCount + unavailableVoiceCount} records / ${playableVoiceCount} playable / ${unavailableVoiceCount} unavailable / ${operatorsWithoutAudio} operators without playable audio`,
)
