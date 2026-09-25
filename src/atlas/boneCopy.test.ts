import assert from 'node:assert/strict'
import { test } from 'node:test'
import { BOILERPLATE_RE, applyBoneCopy, boneCopy } from './boneCopy'
import { SKELETON_MESH_COUNT, SKELETON_MESH_PARTS } from './generated/skeletonCatalog'
import { NERVE_MESH_COUNT } from './generated/nerveCatalog'
import { VESSEL_MESH_COUNT } from './generated/vesselCatalog'
import { STRUCTURE_BY_ID, STRUCTURES } from './structures'

test('every densify bone has real copy, not kit boilerplate', () => {
  assert.equal(SKELETON_MESH_PARTS.length, SKELETON_MESH_COUNT)
  for (const part of SKELETON_MESH_PARTS) {
    const live = STRUCTURE_BY_ID[part.id]
    assert.ok(live, part.id)
    const pack = `${live.function} ${live.relation} ${live.blurb}`
    assert.equal(BOILERPLATE_RE.test(pack), false, part.id)
    assert.equal(/applied at runtime|See boneCopy/.test(pack), false, part.id)
    assert.ok(live.function.length > 20, part.id)
    assert.ok(live.relation.length > 8, part.id)
    assert.ok(live.blurb.length > 30, part.id)
    assert.equal(/^Named bone of the/.test(live.function), false, `fallback ${part.id}`)
  }
})

test('nerves, muscles, and vessels are meshes', () => {
  const muscle = STRUCTURES.find((s) => s.system === 'muscle')
  assert.ok(muscle)
  assert.doesNotMatch(muscle.blurb, /interim placeholder|See boneCopy/i)
  assert.match(muscle.kind, /mesh/i)
  const nerves = STRUCTURES.filter((s) => s.system === 'nerve')
  assert.equal(nerves.length, NERVE_MESH_COUNT)
  assert.ok(nerves.length >= 20)
  for (const nerve of nerves) {
    assert.ok(nerve.source === 'bodyparts3d' || nerve.source === 'open3d')
    assert.match(nerve.kind, /mesh/i)
    assert.equal(BOILERPLATE_RE.test(nerve.function), false)
    assert.doesNotMatch(nerve.blurb, /glyph|stand-in|placeholder|tube/i)
  }
  const vessels = STRUCTURES.filter((s) => s.system === 'vessel')
  assert.equal(vessels.length, VESSEL_MESH_COUNT)
  assert.ok(vessels.length >= 300)
  for (const vessel of vessels) {
    assert.equal(vessel.source, 'bodyparts3d')
    assert.match(vessel.kind, /mesh/i)
    assert.doesNotMatch(vessel.blurb, /glyph|exaggerated|stand-in|placeholder|tube/i)
  }
})

test('calcaneus / femur / little-toe phalanx / sternum are bone-specific', () => {
  const heel = STRUCTURE_BY_ID['calcaneus-left']
  assert.match(heel.function, /heel|Achilles/i)
  assert.match(heel.relation, /left talus/i)
  assert.match(heel.relation, /left cuboid/i)
  assert.doesNotMatch(heel.blurb, /reduced polygon|Focus the camera/i)

  const femur = STRUCTURE_BY_ID['femur-right']
  assert.match(femur.function, /thigh|hip/i)
  assert.match(femur.relation, /right hip bone|right tibia/i)
  assert.match(femur.blurb, /longest bone/i)

  const toe = STRUCTURE_BY_ID['proximal-phalanx-of-little-toe-left']
  assert.equal(toe.region, 'Foot')
  assert.match(toe.function, /little toe/i)
  assert.match(toe.relation, /fifth metatarsal|left fifth metatarsal/i)
  assert.doesNotMatch(toe.function, /finger/i)

  const sternum = STRUCTURE_BY_ID['body-of-sternum']
  assert.match(sternum.function, /ribs|sternal/i)
  assert.match(sternum.relation, /manubrium/i)
  assert.match(sternum.relation, /xiphoid/i)
})

test('left / right stay on the matching side', () => {
  const left = boneCopy('calcaneus-left', 'Calcaneus · left')
  const right = boneCopy('calcaneus-right', 'Calcaneus · right')
  assert.match(left.relation, /\bleft\b/)
  assert.doesNotMatch(left.relation, /\bright\b/)
  assert.match(right.relation, /\bright\b/)
  assert.doesNotMatch(right.relation, /\bleft\b/)
})

test('applyBoneCopy is idempotent on a live row', () => {
  const row = STRUCTURE_BY_ID['manubrium']
  const again = applyBoneCopy(row)
  assert.equal(again.function, row.function)
  assert.equal(again.relation, row.relation)
})
