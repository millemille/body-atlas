import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { catalogDolly } from './focusAim'
import {
  JUMP_BY_ID,
  JUMP_MS,
  JUMP_REGIONS,
  JUMP_REGION_IDS,
  leafFor,
  regionDolly,
  regionDollyDistance,
  regionIsGentlerThanCatalog,
} from './jumpTo'
import { easeOutCubic } from './selectLean'
import { STRUCTURE_BY_ID } from './structures'

const srcRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

test('Jump to has eight named regions with spec leaves and radii', () => {
  assert.equal(JUMP_REGIONS.length, 8)
  assert.deepEqual(
    JUMP_REGIONS.map((r) => r.id),
    [...JUMP_REGION_IDS],
  )
  assert.deepEqual(
    JUMP_REGIONS.map((r) => r.label),
    ['Head', 'Thorax', 'Abdomen', 'Back', 'Left arm', 'Right arm', 'Left leg', 'Right leg'],
  )
  assert.equal(JUMP_BY_ID.head.leafId, 'occipital')
  assert.equal(JUMP_BY_ID.thorax.leafId, 'body-of-sternum')
  assert.equal(JUMP_BY_ID.abdomen.leafId, 'fifth-lumbar-vertebra')
  assert.equal(JUMP_BY_ID.back.leafId, 'seventh-thoracic-vertebra')
  assert.equal(JUMP_BY_ID['left-arm'].leafId, 'humerus-left')
  assert.equal(JUMP_BY_ID['right-arm'].leafId, 'humerus-right')
  assert.equal(JUMP_BY_ID['left-leg'].leafId, 'femur-left')
  assert.equal(JUMP_BY_ID['right-leg'].leafId, 'femur-right')
  assert.equal(JUMP_BY_ID.head.radius, 0.12)
  assert.equal(JUMP_BY_ID.thorax.radius, 0.19)
  assert.equal(JUMP_BY_ID.abdomen.radius, 0.2)
  assert.equal(JUMP_BY_ID.back.radius, 0.18)
  assert.equal(JUMP_BY_ID['left-arm'].radius, 0.14)
  assert.equal(JUMP_BY_ID['right-arm'].radius, 0.14)
  assert.equal(JUMP_BY_ID['left-leg'].radius, 0.21)
  assert.equal(JUMP_BY_ID['right-leg'].radius, 0.21)
})

test('Jump leaves exist in the kit so the card can name them', () => {
  for (const region of JUMP_REGIONS) {
    const leaf = STRUCTURE_BY_ID[region.leafId]
    assert.ok(leaf, region.leafId)
    assert.equal(leafFor(region).id, region.leafId)
    assert.ok(leaf.name.length > 1)
  }
  assert.equal(STRUCTURE_BY_ID.occipital.name, 'Occipital bone')
  assert.equal(STRUCTURE_BY_ID['body-of-sternum'].name, 'Body of sternum')
  assert.equal(STRUCTURE_BY_ID['fifth-lumbar-vertebra'].name, 'Fifth lumbar vertebra')
  assert.equal(STRUCTURE_BY_ID['seventh-thoracic-vertebra'].name, 'Seventh thoracic vertebra')
})

test('region-box dolly is 820ms easeOutCubic, not a catalog snap', () => {
  assert.equal(JUMP_MS, 820)
  assert.equal(easeOutCubic(0), 0)
  assert.equal(easeOutCubic(1), 1)
  assert.ok(easeOutCubic(0.5) > 0.5)
  for (const region of JUMP_REGIONS) {
    const leaf = leafFor(region)
    const pose = regionDolly(region, leaf)
    const catalog = catalogDolly(leaf)
    assert.equal(pose.distance, regionDollyDistance(region.radius))
    assert.ok(
      regionIsGentlerThanCatalog(region, leaf),
      `${region.id} region ${pose.distance} must beat catalog ${catalog.distance}`,
    )
    assert.ok(pose.target.distanceTo(catalog.target) < 1e-6, region.id)
  }
})

test('Back looks from behind; arms and legs bias to their side', () => {
  const back = regionDolly(JUMP_BY_ID.back)
  assert.ok(back.position.z < back.target.z, 'posterior dolly')
  const leftArm = regionDolly(JUMP_BY_ID['left-arm'])
  const rightArm = regionDolly(JUMP_BY_ID['right-arm'])
  assert.ok(leftArm.position.x < leftArm.target.x)
  assert.ok(rightArm.position.x > rightArm.target.x)
  const thorax = regionDolly(JUMP_BY_ID.thorax)
  assert.ok(thorax.position.z > thorax.target.z, 'anterior thorax')
})

test('Jump chrome is in-flow with zero body pins', () => {
  const ui = readFileSync(join(srcRoot, 'components/chrome/JumpTo.tsx'), 'utf8')
  const rig = readFileSync(join(srcRoot, 'components/canvas/FocusRig.tsx'), 'utf8')
  assert.equal(ui.includes('data-atlas-pin'), false)
  assert.equal(ui.includes('data-atlas-dock'), false)
  assert.equal(/absolute/.test(ui), false)
  assert.equal(/z-50/.test(ui), false)
  assert.match(ui, /data-atlas-jump-list/)
  assert.match(rig, /JUMP_MS/)
  assert.match(rig, /regionFrame/)
})
