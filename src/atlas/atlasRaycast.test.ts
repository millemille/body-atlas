import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Group, Mesh, MeshBasicMaterial, Raycaster, SphereGeometry, Vector3 } from 'three'
import {
  groupRaycast,
  markPickable,
  meshRaycast,
  muscleRaycast,
  raycastFor,
  skipRaycast,
} from './atlasRaycast'
import { isPartPickable } from './pickable'
import { toggleHotSystems } from './hotSystems'
import type { SystemId } from './types'

function play(steps: SystemId[]) {
  let hot: SystemId[] = ['skeleton']
  for (const id of steps) hot = toggleHotSystems(hot, id)
  return hot
}

test('R3F must never get raycast=undefined after a cold→hot toggle', () => {
  const off = raycastFor('mesh', false)
  const on = raycastFor('mesh', true)
  assert.equal(off, skipRaycast)
  assert.equal(on, meshRaycast)
  assert.notEqual(on, skipRaycast)
  assert.notEqual(on, undefined)
  assert.equal(raycastFor('group', true), groupRaycast)
})

test('markPickable restores Mesh.prototype-backed raycast after skip', () => {
  const mesh = new Mesh(new SphereGeometry(0.05), new MeshBasicMaterial())
  markPickable(mesh, false)
  assert.equal(mesh.raycast, skipRaycast)
  assert.equal(mesh.userData.skipPick, true)
  markPickable(mesh, true)
  assert.equal(mesh.raycast, meshRaycast)
  assert.equal(mesh.userData.skipPick, false)
})

test('muscle markPickable uses the ventral-skip raycast', () => {
  const mesh = new Mesh(new SphereGeometry(0.05), new MeshBasicMaterial())
  markPickable(mesh, true, true)
  assert.equal(mesh.raycast, muscleRaycast)
  assert.equal(raycastFor('mesh', true, true), muscleRaycast)
})

test('deltoid and cuff do not register on a back-facing ray', () => {
  for (const id of ['deltoids', 'rotator-cuff']) {
    const mesh = new Mesh(new SphereGeometry(0.08, 16, 12), new MeshBasicMaterial())
    mesh.position.set(-0.12, 1.37, 0)
    mesh.userData.atlasId = id
    mesh.userData.atlasSystem = 'muscle'
    mesh.userData.source = 'interim'
    mesh.updateMatrixWorld()
    markPickable(mesh, true, true)
    const backHits: { distance: number }[] = []
    mesh.raycast(new Raycaster(new Vector3(-0.12, 1.37, -2), new Vector3(0, 0, 1)), backHits as never)
    assert.equal(backHits.length, 0, `${id} registered on a back ray`)
    const frontHits: { distance: number }[] = []
    mesh.raycast(new Raycaster(new Vector3(-0.12, 1.37, 2), new Vector3(0, 0, -1)), frontHits as never)
    assert.ok(frontHits.length > 0, `${id} must still register from the front`)
  }
})

test('oblique back ray still skips pecs and cuff when the camera is behind', () => {
  for (const id of ['pectoralis', 'rotator-cuff']) {
    const mesh = new Mesh(new SphereGeometry(0.1, 16, 12), new MeshBasicMaterial())
    mesh.position.set(id === 'pectoralis' ? 0 : -0.12, 1.34, id === 'pectoralis' ? 0.18 : 0)
    mesh.userData.atlasId = id
    mesh.userData.source = 'interim'
    mesh.updateMatrixWorld()
    markPickable(mesh, true, true)
    const hits: { distance: number }[] = []
    const oblique = new Raycaster(new Vector3(0.2, 1.34, -1.8), new Vector3(-0.1, 0, 0.05))
    mesh.raycast(oblique, hits as never)
    assert.equal(hits.length, 0, `${id} leaked on an oblique back ray`)
  }
})

test('wrap-camera +Z graze still registers cuff gel', () => {
  const mesh = new Mesh(new SphereGeometry(0.08, 16, 12), new MeshBasicMaterial())
  mesh.position.set(0.16, 1.37, 0.1)
  mesh.userData.atlasId = 'rotator-cuff'
  mesh.updateMatrixWorld()
  markPickable(mesh, true, true)
  const origin = new Vector3(2.45, 1.37, -0.02)
  const dir = new Vector3(0.16, 1.37, 0.1).sub(origin).normalize()
  assert.ok(dir.z > 0.04, `wrap graze dir.z ${dir.z}`)
  const hits: { distance: number }[] = []
  mesh.raycast(new Raycaster(origin, dir), hits as never)
  assert.ok(hits.length > 0, 'wrap +Z graze must not skip cuff')
})

test('side-camera cuff ray still registers', () => {
  const mesh = new Mesh(new SphereGeometry(0.08, 16, 12), new MeshBasicMaterial())
  mesh.position.set(-0.12, 1.37, 0)
  mesh.userData.atlasId = 'rotator-cuff'
  mesh.updateMatrixWorld()
  markPickable(mesh, true, true)
  const hits: { distance: number }[] = []
  mesh.raycast(new Raycaster(new Vector3(-2.1, 1.37, 0.25), new Vector3(1, 0, -0.12).normalize()), hits as never)
  assert.ok(hits.length > 0)
})

test('pectoralis does not register on a back-facing ray', () => {
  const mesh = new Mesh(new SphereGeometry(0.12, 16, 12), new MeshBasicMaterial())
  mesh.position.set(0, 1.3, 0.22)
  mesh.userData.atlasId = 'pectoralis'
  mesh.userData.atlasSystem = 'muscle'
  mesh.userData.source = 'interim'
  mesh.updateMatrixWorld()
  markPickable(mesh, true, true)
  const hits: { distance: number }[] = []
  const fromBack = new Raycaster(new Vector3(0, 1.3, -2), new Vector3(0, 0, 1))
  mesh.raycast(fromBack, hits as never)
  assert.equal(hits.length, 0)
  const obliqueBack = new Raycaster(new Vector3(0.4, 1.3, -1.8), new Vector3(-0.15, 0, 0.12).normalize())
  mesh.raycast(obliqueBack, hits as never)
  assert.equal(hits.length, 0)
  const fromFront = new Raycaster(new Vector3(0, 1.3, 2), new Vector3(0, 0, -1))
  mesh.raycast(fromFront, hits as never)
  assert.ok(hits.length > 0)
})

test('markPickable restores Group raycast after skip', () => {
  const g = new Group()
  markPickable(g, false)
  assert.equal(g.raycast, skipRaycast)
  markPickable(g, true)
  assert.equal(g.raycast, groupRaycast)
})

test('Mille: Muscle on → Skeleton off → Skeleton on → bones pickable', () => {
  const hot = play(['muscle', 'skeleton', 'skeleton'])
  assert.deepEqual(hot, ['muscle', 'skeleton'])
  assert.equal(isPartPickable(hot.includes('skeleton'), false, null, 'humerus-left'), true)
  assert.equal(isPartPickable(hot.includes('muscle'), false, null, 'biceps-left'), true)
})

test('Skeleton off → Skeleton on → bones pickable', () => {
  const off = play(['muscle', 'skeleton'])
  assert.equal(off.includes('skeleton'), false)
  const on = toggleHotSystems(off, 'skeleton')
  assert.ok(on.includes('skeleton'))
  assert.equal(isPartPickable(true, false, null, 'body-of-sternum'), true)
})

test('Muscle on → Muscle off → bones pickable', () => {
  const hot = play(['muscle', 'muscle'])
  assert.deepEqual(hot, ['skeleton'])
  assert.equal(isPartPickable(true, false, null, 'humerus-left'), true)
})

test('Both on → Skeleton off → Muscle off is blocked; Skeleton on still pickable', () => {
  let hot = play(['muscle', 'skeleton'])
  assert.deepEqual(hot, ['muscle'])
  hot = toggleHotSystems(hot, 'muscle')
  assert.deepEqual(hot, ['muscle'], 'last hot system cannot turn off')
  hot = toggleHotSystems(hot, 'skeleton')
  assert.ok(hot.includes('skeleton'))
  assert.equal(isPartPickable(hot.includes('skeleton'), false, null, 'first-rib-right'), true)
})
