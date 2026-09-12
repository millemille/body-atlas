import assert from 'node:assert/strict'
import { test } from 'node:test'
import { FrontSide } from 'three'
import { BASE_OPACITY, SABRINA } from './colors'
import { cloneMuscleMaterial, getMuscleMaterialTemplate } from './muscleMaterial'
import { MUSCLE_ROUGHNESS } from './studioLook'

test('muscle clones share one program template — satin, not candy DoubleSide', () => {
  const a = getMuscleMaterialTemplate()
  const b = cloneMuscleMaterial()
  const c = cloneMuscleMaterial()
  assert.equal(a.color.getHexString(), SABRINA.muscleRose.slice(1).toLowerCase())
  assert.equal(a.roughness, MUSCLE_ROUGHNESS)
  assert.equal(a.side, FrontSide)
  assert.equal(a.transparent, true)
  assert.equal(a.roughnessMap, null)
  assert.equal(BASE_OPACITY.muscle, 0.5)
  assert.notEqual(b, a)
  assert.notEqual(b, c)
  assert.equal(b.roughness, a.roughness)
  b.dispose()
  c.dispose()
})
