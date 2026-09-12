import assert from 'node:assert/strict'
import { test } from 'node:test'
import { LIVE_MUSCLE_IDS } from './muscleCopy'
import { STRUCTURES } from './structures'
import {
  M1_HOLD_FRAMES,
  M1_WAVES,
  M2_HOLD_FRAMES,
  M2_IDLE_FRAMES,
  M2_IDS,
  M2_SETTLE_FRAMES,
  M2_WAVES,
  CANVAS_DPR,
  MUSCLE_HOT_DPR,
  MUSCLE_MOUNT_MS,
  MUSCLE_WAVES,
  SKELETON_DPR_CAP,
  WAVE_IDLE_FRAMES,
  allWaveIds,
  filterStructuresForM2Coverage,
  idsThroughWaves,
  idsThroughWave,
  isM2MuscleId,
  wavesCoverLiveCatalog,
} from './muscleReveal'

test('first muscle frame is a small home silhouette, not the full catalog', () => {
  assert.equal(idsThroughWave(-1).size, 0)
  const first = idsThroughWave(0)
  assert.ok(first.size <= 2, `first wave ${first.size}`)
  assert.ok(first.has('pectoralis'))
  assert.equal(first.has('rotator-cuff'), false)
  assert.ok(allWaveIds().length > first.size)
})

test('reveal waves cover every live muscle id once', () => {
  assert.equal(wavesCoverLiveCatalog(), true)
  assert.equal(allWaveIds().length, LIVE_MUSCLE_IDS.length)
  assert.equal(new Set(allWaveIds()).size, LIVE_MUSCLE_IDS.length)
  assert.equal(idsThroughWave(MUSCLE_WAVES.length - 1).size, LIVE_MUSCLE_IDS.length)
})

test('drawing buffer stays 1x — Muscle ON must not realloc the GPU surface', () => {
  assert.equal(CANVAS_DPR, 1)
  assert.equal(MUSCLE_HOT_DPR, 1)
  assert.equal(SKELETON_DPR_CAP, 1)
  assert.ok(MUSCLE_MOUNT_MS >= 700)
})

test('M2 groups are not in the M1 paint set', () => {
  const m1 = idsThroughWaves(M1_WAVES, M1_WAVES.length - 1)
  for (const id of ['rotator-cuff', 'erector-spinae', 'hip-adductors', 'tibialis-anterior', 'forearm-extensors']) {
    assert.equal(m1.has(id), false, id)
    const wave = M2_WAVES.find((w) => (w as readonly string[]).includes(id))
    assert.ok(wave, id)
    assert.equal(wave.length, 1, id)
  }
  assert.ok(WAVE_IDLE_FRAMES >= 10)
  assert.ok(M1_HOLD_FRAMES >= 18)
  assert.ok(M2_IDLE_FRAMES >= 20)
  assert.ok(M2_SETTLE_FRAMES >= 220)
  assert.ok(M2_HOLD_FRAMES >= 16)
  assert.equal(M2_IDS.length, 5)
})

test('M2 coverage off hides cuff / erectors / adductors from the catalog', () => {
  const hot = STRUCTURES.filter((s) => s.system === 'muscle')
  const gated = filterStructuresForM2Coverage(hot, false)
  const open = filterStructuresForM2Coverage(hot, true)
  for (const id of M2_IDS) {
    assert.equal(isM2MuscleId(id), true)
    assert.equal(gated.some((s) => s.id === id), false, id)
    assert.equal(open.some((s) => s.id === id), true, id)
  }
  assert.ok(gated.some((s) => s.id === 'pectoralis'))
  assert.ok(gated.length < open.length)
  assert.ok(open.findIndex((s) => s.id === 'rotator-cuff') < open.findIndex((s) => s.id === 'pectoralis'))
  assert.ok(open.findIndex((s) => s.id === 'erector-spinae') < open.findIndex((s) => s.id === 'pectoralis'))
  assert.ok(open.findIndex((s) => s.id === 'hip-adductors') < open.findIndex((s) => s.id === 'pectoralis'))
})
