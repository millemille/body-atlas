import assert from 'node:assert/strict'
import { test } from 'node:test'
import { hugAnteriorWall, posteriorSeatShift } from './anteriorWall'

test('hugAnteriorWall seats the anterior face on the wall plus a 1cm plate', () => {
  const wall = 0.214
  const half = 0.072
  const z = hugAnteriorWall(wall, half)
  assert.ok(Math.abs(z + half - (wall + 0.01)) < 1e-9)
  assert.ok(z < wall, 'centroid moves behind the wall so the face, not the middle, meets the bone')
})

test('posterior seat closes a float down to the 1cm plate', () => {
  assert.ok(Math.abs(posteriorSeatShift(0.04) - 0.03) < 1e-9)
  assert.ok(Math.abs(posteriorSeatShift(0.01)) < 1e-9)
  assert.ok(posteriorSeatShift(-0.02) < 0)
})
