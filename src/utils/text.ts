export function normalizeAnswer(value: string) {
  return value
    .toLocaleLowerCase('en-US')
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9'\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function editDistance(left: string, right: string) {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index)

  for (let row = 1; row <= left.length; row += 1) {
    const current = [row]
    for (let column = 1; column <= right.length; column += 1) {
      const insertion = current[column - 1] + 1
      const deletion = previous[column] + 1
      const substitution =
        previous[column - 1] + (left[row - 1] === right[column - 1] ? 0 : 1)
      current[column] = Math.min(insertion, deletion, substitution)
    }
    previous.splice(0, previous.length, ...current)
  }

  return previous[right.length]
}

export function answerScore(answer: string, expected: string) {
  const normalizedAnswer = normalizeAnswer(answer)
  const normalizedExpected = normalizeAnswer(expected)

  if (!normalizedAnswer) return 0
  if (normalizedAnswer === normalizedExpected) return 100

  const longest = Math.max(normalizedAnswer.length, normalizedExpected.length)
  return Math.max(
    0,
    Math.round((1 - editDistance(normalizedAnswer, normalizedExpected) / longest) * 100),
  )
}
