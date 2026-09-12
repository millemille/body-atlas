import assert from 'node:assert/strict'
import { test } from 'node:test'
import { noteAtlasPick, tookAtlasPick } from './pointerSession'

test('a mesh pick suppresses the following Canvas miss', () => {
  assert.equal(tookAtlasPick(), false)
  noteAtlasPick()
  assert.equal(tookAtlasPick(), true)
})
