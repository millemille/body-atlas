import assert from 'node:assert/strict'
import { test } from 'node:test'
import { applyHandOrFootLabels, classifyHandOrFoot } from './classifyBone'
import { SKELETON_MESH_PARTS } from './generated/skeletonCatalog'
import { STRUCTURE_BY_ID } from './structures'

test('little-toe phalanx is Foot, not Hand', () => {
  const hit = classifyHandOrFoot(
    'proximal-phalanx-of-little-toe-left',
    'Proximal phalanx of left little toe · left',
  )
  assert.deepEqual(hit, { kind: 'Foot bone · mesh', region: 'Foot' })
})

test('finger phalanx stays Hand', () => {
  const hit = classifyHandOrFoot(
    'distal-phalanx-of-index-finger-left',
    'Distal phalanx of left index finger · left',
  )
  assert.deepEqual(hit, { kind: 'Hand bone · mesh', region: 'Hand' })
})

test('metatarsal / metacarpal stay on the correct limb', () => {
  assert.equal(classifyHandOrFoot('first-metatarsal-left', 'First metatarsal · left')?.region, 'Foot')
  assert.equal(classifyHandOrFoot('first-metacarpal-left', 'First metacarpal · left')?.region, 'Hand')
})

test('live structures: no toe labeled Hand, no finger labeled Foot', () => {
  for (const part of SKELETON_MESH_PARTS) {
    const live = STRUCTURE_BY_ID[part.id]
    assert.ok(live, part.id)
    const n = `${part.id} ${part.name}`.toLowerCase()
    if (/\btoe\b/.test(n)) {
      assert.equal(live.region, 'Foot', part.id)
      assert.match(live.kind, /Foot bone/i)
    }
    if (/\b(finger|thumb)\b/.test(n)) {
      assert.equal(live.region, 'Hand', part.id)
      assert.match(live.kind, /Hand bone/i)
    }
    const nameLeft = /\bleft\b/.test(part.name.toLowerCase())
    const nameRight = /\bright\b/.test(part.name.toLowerCase())
    if (nameLeft) assert.match(part.id, /-left$/)
    if (nameRight) assert.match(part.id, /-right$/)
  }
})

test('applyHandOrFootLabels rewrites a toe catalog row', () => {
  const row = applyHandOrFootLabels({
    id: 'proximal-phalanx-of-little-toe-left',
    name: 'Proximal phalanx of left little toe · left',
    kind: 'Hand bone · mesh',
    region: 'Hand',
  })
  assert.equal(row.region, 'Foot')
  assert.equal(row.kind, 'Foot bone · mesh')
})
