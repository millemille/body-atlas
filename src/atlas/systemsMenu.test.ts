import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { SYSTEMS } from './systems'

test('the system menu is skeleton, muscle, nerve, and vessel', () => {
  assert.deepEqual(
    SYSTEMS.map((sys) => sys.label),
    ['Skeleton', 'Muscle', 'Nerve', 'Vessel'],
  )
  assert.deepEqual(
    SYSTEMS.map((sys) => sys.id),
    ['skeleton', 'muscle', 'nerve', 'vessel'],
  )
  const bar = readFileSync(new URL('../components/chrome/SystemsBar.tsx', import.meta.url), 'utf8')
  const card = readFileSync(new URL('../components/chrome/SelectionCard.tsx', import.meta.url), 'utf8')
  assert.match(bar, /SYSTEMS\.map/)
  assert.equal(bar.includes('Other'), false)
  assert.equal(card.includes('Other stays'), false)
})
