import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Vector3 } from 'three'
import { BASE_OPACITY } from './colors'
import {
  BONE_ROUGHNESS,
  MESH_MUSCLE_COLOR,
  MESH_MUSCLE_OPACITY,
  MESH_MUSCLE_ROUGHNESS,
  FOCUS_EXPOSURE,
  HOME_EXPOSURE,
  KEY_POS,
  REST_OPACITY,
  RIM_POS,
} from './studioLook'

test('key sits upper-left at about 35° and rim is opposite', () => {
  const chest = new Vector3(0, 0.95, 0)
  const key = new Vector3(...KEY_POS).sub(chest)
  const elev = (Math.atan2(key.y, Math.hypot(key.x, key.z)) * 180) / Math.PI
  assert.ok(elev > 28 && elev < 42, `key elevation ${elev}`)
  assert.ok(KEY_POS[0] < 0, 'key is on the left')
  assert.ok(RIM_POS[0] > 0 && RIM_POS[2] < 0, 'rim is opposite the key')
})

test('Focus only nudges exposure; rest dim is −40% not a depth-kill', () => {
  assert.ok(FOCUS_EXPOSURE > HOME_EXPOSURE && FOCUS_EXPOSURE <= 1.1)
  assert.equal(REST_OPACITY, 0.6)
  assert.ok(BONE_ROUGHNESS >= 0.45 && BONE_ROUGHNESS <= 0.6)
})

test('live mesh is firmer rose at the muscle opacity that drives pick priority', () => {
  assert.equal(MESH_MUSCLE_COLOR.toLowerCase(), '#c47e76')
  assert.ok(MESH_MUSCLE_OPACITY >= 0.88 && MESH_MUSCLE_OPACITY <= 0.92)
  assert.ok(MESH_MUSCLE_ROUGHNESS >= 0.52 && MESH_MUSCLE_ROUGHNESS <= 0.64)
  assert.equal(BASE_OPACITY.muscle, 0.5)
})
