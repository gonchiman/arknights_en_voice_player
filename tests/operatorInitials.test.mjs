import assert from 'node:assert/strict'
import test from 'node:test'

import { getOperatorInitialGroup } from '../src/lib/operatorInitials.ts'

test('日本語名を五十音の行へ分類する', () => {
  const examples = [
    ['アーミヤ', 'a'],
    ['ガヴィル', 'ka'],
    ['ズィマー', 'sa'],
    ['テキサス', 'ta'],
    ['ニアール', 'na'],
    ['パフューマー', 'ha'],
    ['ミヅキ', 'ma'],
    ['ユーネクテス', 'ya'],
    ['リード', 'ra'],
    ['ワルファリン', 'wa'],
  ]

  for (const [name, expected] of examples) {
    assert.equal(getOperatorInitialGroup(name), expected, name)
  }
})

test('英字・数字・その他を分類し、半角カナを正規化する', () => {
  assert.equal(getOperatorInitialGroup('Ash'), 'latin')
  assert.equal(getOperatorInitialGroup('12F'), 'numeric')
  assert.equal(getOperatorInitialGroup('九色鹿'), 'other')
  assert.equal(getOperatorInitialGroup('ｴｸｼｱ'), 'a')
  assert.equal(getOperatorInitialGroup(''), 'other')
})
