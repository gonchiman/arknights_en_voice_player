export type OperatorInitialGroup =
  | 'a'
  | 'ka'
  | 'sa'
  | 'ta'
  | 'na'
  | 'ha'
  | 'ma'
  | 'ya'
  | 'ra'
  | 'wa'
  | 'latin'
  | 'numeric'
  | 'other'

const kanaGroups: ReadonlyArray<{
  value: Exclude<OperatorInitialGroup, 'latin' | 'numeric' | 'other'>
  characters: string
}> = [
  { value: 'a', characters: 'ぁあぃいぅうぇえぉおゔァアィイゥウェエォオヴ' },
  { value: 'ka', characters: 'かがきぎくぐけげこごゕゖカガキギクグケゲコゴヵヶ' },
  { value: 'sa', characters: 'さざしじすずせぜそぞサザシジスズセゼソゾ' },
  { value: 'ta', characters: 'ただちぢっつづてでとどタダチヂッツヅテデトド' },
  { value: 'na', characters: 'なにぬねのナニヌネノ' },
  { value: 'ha', characters: 'はばぱひびぴふぶぷへべぺほぼぽハバパヒビピフブプヘベペホボポ' },
  { value: 'ma', characters: 'まみむめもマミムメモ' },
  { value: 'ya', characters: 'ゃやゅゆょよャヤュユョヨ' },
  { value: 'ra', characters: 'らりるれろラリルレロ' },
  { value: 'wa', characters: 'ゎわゐゑをんヮワヰヱヲンヷヸヹヺ' },
]

export function getOperatorInitialGroup(name: string): OperatorInitialGroup {
  const initial = [...name.trim().normalize('NFKC')][0]

  if (!initial) return 'other'
  if (/^[A-Z]$/iu.test(initial)) return 'latin'
  if (/^[0-9]$/u.test(initial)) return 'numeric'

  return (
    kanaGroups.find((group) => group.characters.includes(initial))?.value ??
    'other'
  )
}
