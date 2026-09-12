import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Vector3 } from 'three'
import { HOME_POS, HOME_TARGET } from './cameraHome'
import { SAFE_DOLLY_DISTANCE } from './focusAim'
import {
  LEAN_HARD_FLOOR,
  LEAN_MS,
  MUSCLE_LEAN_DELAY_FRAMES,
  cameraHemisphere,
  deferLeanFor,
  easeOutCubic,
  isDorsalStructure,
  isLimbPart,
  isVentralStructure,
  leanIsGentlerThanFocus,
  leanOrbitDistance,
  needsHemisphereLean,
  selectLean,
} from './selectLean'
import { STRUCTURE_BY_ID, STRUCTURES } from './structures'

test('select lean on calcaneus is a lean-in, not Focus heel-fill', () => {
  const part = STRUCTURE_BY_ID['calcaneus-left']
  assert.ok(part)
  const pose = selectLean(part, HOME_POS, HOME_TARGET)
  const homeDist = HOME_POS.distanceTo(HOME_TARGET)
  assert.ok(pose.distance < homeDist, 'closer than home')
  assert.ok(
    leanIsGentlerThanFocus(pose.distance),
    `lean ${pose.distance} vs focus ${SAFE_DOLLY_DISTANCE}`,
  )
  assert.ok(pose.target.distanceTo(HOME_TARGET) > 0.04, 'looks a bit toward the bone')
  assert.ok(pose.target.distanceTo(new Vector3(...part.position)) > 0.4, 'must not sit on the heel')
  assert.ok(LEAN_MS >= 250 && LEAN_MS <= 400)
})

test('select always reduces orbit and camera-to-bone vs stash', () => {
  const homeDist = HOME_POS.distanceTo(HOME_TARGET)
  const bones = STRUCTURES.filter((s) => s.system === 'skeleton')
  assert.ok(bones.length > 20)
  for (const part of bones) {
    const catalog = new Vector3(...part.position)
    const pose = selectLean(part, HOME_POS, HOME_TARGET)
    assert.ok(
      pose.distance < homeDist - 0.05,
      `${part.id} orbit ${pose.distance} must drop below ${homeDist}`,
    )
    assert.ok(
      pose.position.distanceTo(catalog) < HOME_POS.distanceTo(catalog) - 0.02,
      `${part.id} must move closer to the bone`,
    )
    assert.ok(pose.distance > SAFE_DOLLY_DISTANCE * 3, `${part.id} must stay above Focus`)
  }
})

test('already-close explore still dollies in and never zooms out', () => {
  const part = STRUCTURE_BY_ID['body-of-sternum']
  assert.ok(part)
  const pos = new Vector3(1.2, 1.1, 1.8)
  const target = HOME_TARGET.clone()
  const before = pos.distanceTo(target)
  const catalog = new Vector3(...part.position)
  const pose = selectLean(part, pos, target)
  assert.ok(pose.distance < before - 0.02, `orbit must drop (${before} → ${pose.distance})`)
  assert.ok(pose.position.distanceTo(catalog) < pos.distanceTo(catalog))
  assert.ok(pose.distance >= LEAN_HARD_FLOOR * 0.95)
})

test('lean orbit helper never returns a longer distance', () => {
  for (const stash of [1.3, 1.5, 2.0, 2.8, 3.83, 5.5]) {
    const next = leanOrbitDistance(stash)
    assert.ok(next < stash, `stash ${stash} → ${next}`)
    assert.ok(next > SAFE_DOLLY_DISTANCE * 3)
  }
})

test('Focus heel-fill and select lean stay distinct', () => {
  const part = STRUCTURE_BY_ID['calcaneus-left']
  assert.ok(part)
  const lean = selectLean(part, HOME_POS, HOME_TARGET)
  assert.equal(SAFE_DOLLY_DISTANCE, 0.18)
  assert.ok(lean.distance >= 2.2 && lean.distance <= 2.8, `lean ${lean.distance}`)
  assert.ok(lean.distance > SAFE_DOLLY_DISTANCE * 5, 'lean must not steal heel-fill')
  assert.ok(lean.target.distanceTo(new Vector3(...part.position)) > 0.5)
})

test('ease-out cubic starts fast and settles', () => {
  assert.equal(easeOutCubic(0), 0)
  assert.equal(easeOutCubic(1), 1)
  assert.ok(easeOutCubic(0.5) > 0.5)
})

test('muscle lean waits a few frames so first belly pick is paint + card only', () => {
  assert.ok(MUSCLE_LEAN_DELAY_FRAMES >= 2)
  assert.equal(deferLeanFor(STRUCTURE_BY_ID.pectoralis), true)
  assert.equal(deferLeanFor(STRUCTURE_BY_ID['calcaneus-left']), false)
})

test('scapula and back gels are dorsal; sternum and limbs are not', () => {
  assert.equal(isDorsalStructure(STRUCTURE_BY_ID['scapula-left']), true)
  assert.equal(isDorsalStructure(STRUCTURE_BY_ID.trapezius), true)
  assert.equal(isDorsalStructure(STRUCTURE_BY_ID['erector-spinae']), true)
  assert.equal(isDorsalStructure(STRUCTURE_BY_ID['hip-adductors']), false)
  assert.equal(isDorsalStructure(STRUCTURE_BY_ID.sacrum), true)
  assert.equal(isVentralStructure(STRUCTURE_BY_ID['body-of-sternum']), true)
  assert.equal(isVentralStructure(STRUCTURE_BY_ID.pectoralis), true)
  assert.equal(isLimbPart(STRUCTURE_BY_ID['femur-left']), true)
  assert.equal(isLimbPart(STRUCTURE_BY_ID['calcaneus-left']), true)
  assert.equal(isDorsalStructure(STRUCTURE_BY_ID['femur-left']), false)
  assert.equal(needsHemisphereLean(STRUCTURE_BY_ID['scapula-left'], HOME_POS), true)
  assert.equal(needsHemisphereLean(STRUCTURE_BY_ID['body-of-sternum'], HOME_POS), false)
  assert.equal(needsHemisphereLean(STRUCTURE_BY_ID['femur-left'], HOME_POS), false)
  assert.equal(cameraHemisphere(HOME_POS), 'front')
})

test('from home, a scapula lean approaches the back instead of the sternum', () => {
  const part = STRUCTURE_BY_ID['scapula-left']
  assert.ok(part)
  const catalog = new Vector3(...part.position)
  const pose = selectLean(part, HOME_POS, HOME_TARGET)
  assert.ok(pose.position.z < catalog.z - 0.4, `cam z ${pose.position.z} must sit behind scapula ${catalog.z}`)
  assert.ok(pose.position.z < HOME_POS.z - 1.5, 'must leave the front home camera')
  assert.ok(pose.position.distanceTo(catalog) < HOME_POS.distanceTo(catalog) - 0.02)
  assert.ok(leanIsGentlerThanFocus(pose.distance))
  const sternum = new Vector3(...STRUCTURE_BY_ID['body-of-sternum'].position)
  assert.ok(
    pose.position.distanceTo(catalog) < pose.position.distanceTo(sternum) + 0.35,
    'must not dive at the sternum',
  )
})

test('from home, a front bone still leans in from the front', () => {
  const part = STRUCTURE_BY_ID['body-of-sternum']
  const catalog = new Vector3(...part.position)
  const pose = selectLean(part, HOME_POS, HOME_TARGET)
  assert.ok(pose.position.z > catalog.z + 0.8, `cam z ${pose.position.z} must stay anterior`)
  assert.ok(pose.position.distanceTo(catalog) < HOME_POS.distanceTo(catalog) - 0.02)
})

test('from a back camera, scapula stays in the back and sternum swings forward', () => {
  const backCam = new Vector3(-1.6, 1.2, -3.1)
  const backTarget = HOME_TARGET.clone()
  const scap = STRUCTURE_BY_ID['scapula-right']
  const sternum = STRUCTURE_BY_ID['body-of-sternum']
  const scapPose = selectLean(scap, backCam, backTarget)
  assert.equal(needsHemisphereLean(scap, backCam), false)
  assert.ok(scapPose.position.z < 0, 'back view of scapula must not flip to +Z')
  const sternumPose = selectLean(sternum, backCam, backTarget)
  assert.equal(needsHemisphereLean(sternum, backCam), true)
  assert.ok(sternumPose.position.z > sternum.position[2] + 0.4, 'sternum from the back approaches from the front')
})

test('side view of a scapula does not yaw to the opposite hemisphere', () => {
  const sideCam = new Vector3(3.6, 1.2, 0.05)
  const part = STRUCTURE_BY_ID['scapula-right']
  assert.equal(cameraHemisphere(sideCam), 'side')
  assert.equal(needsHemisphereLean(part, sideCam), false)
  const pose = selectLean(part, sideCam, HOME_TARGET)
  assert.ok(pose.position.x > 1.2, `side lean must keep +X, got ${pose.position.x}`)
})
