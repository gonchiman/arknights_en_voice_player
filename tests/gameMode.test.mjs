import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getAppSectionFromPath,
  getGameModeFromPath,
  getGamePath,
  getModeSwitchPath,
} from '../src/config/gameModes.ts'

test('既存URLをArknightsモードとして維持する', () => {
  assert.equal(getGameModeFromPath('/'), 'arknights')
  assert.equal(getGameModeFromPath('/favorites'), 'arknights')
  assert.equal(getGameModeFromPath('/dictation'), 'arknights')
})

test('Endfield配下のURLからモードと画面を判定する', () => {
  assert.equal(getGameModeFromPath('/endfield'), 'endfield')
  assert.equal(getAppSectionFromPath('/endfield'), 'operators')
  assert.equal(getAppSectionFromPath('/endfield/favorites'), 'favorites')
  assert.equal(getAppSectionFromPath('/endfield/dictation'), 'dictation')
})

test('ゲーム切替時に現在の画面を維持する', () => {
  assert.equal(getModeSwitchPath('endfield', '/favorites'), '/endfield/favorites')
  assert.equal(getModeSwitchPath('arknights', '/endfield/favorites'), '/favorites')
  assert.equal(getModeSwitchPath('endfield', '/dictation'), '/endfield/dictation')
  assert.equal(getGamePath('arknights', 'operators'), '/')
  assert.equal(getGamePath('endfield', 'operators'), '/endfield')
})
