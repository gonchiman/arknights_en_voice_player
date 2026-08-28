import type { Operator } from '../types/app'

const japaneseNameCollator = new Intl.Collator('ja', {
  numeric: true,
  sensitivity: 'base',
})
const englishNameCollator = new Intl.Collator('en', {
  numeric: true,
  sensitivity: 'base',
})

export function sortOperatorsByJapaneseName(
  sourceOperators: readonly Operator[],
): Operator[] {
  return [...sourceOperators].sort((left, right) => {
    const japaneseNameDifference = japaneseNameCollator.compare(
      left.japaneseName,
      right.japaneseName,
    )

    return (
      japaneseNameDifference ||
      englishNameCollator.compare(left.name, right.name)
    )
  })
}
