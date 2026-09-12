import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Mesh, MeshBasicMaterial, PerspectiveCamera, SphereGeometry, Vector3 } from 'three'
import { HOME_POS, HOME_TARGET, ORBIT_TARGET_BOUNDS } from './cameraHome'
import {
  EXPLORE_MIN_DISTANCE,
  FOCUS_NEAR,
  MUSCLE_DOLLY_DISTANCE,
  SAFE_DOLLY_DISTANCE,
  SAFE_DOLLY_LONG,
  SAFE_DOLLY_NEAR,
  SAFE_ORBIT_MAX,
  SAFE_ORBIT_MIN,
  aimPointForBone,
  catalogDolly,
  findAtlasMesh,
  focusDistanceForRadius,
  focusPose,
  poseForStructure,
} from './focusAim'
import { STRUCTURE_BY_ID } from './structures'

test('focus dolly is much closer than home and inside explore minDistance', () => {
  const home = HOME_POS.distanceTo(HOME_TARGET)
  const rib = focusDistanceForRadius(0.07, 38)
  const phalanx = focusDistanceForRadius(0.012, 38)
  assert.ok(home > 3, `home ${home}`)
  assert.ok(rib < 0.7, `rib frame ${rib}`)
  assert.ok(phalanx < EXPLORE_MIN_DISTANCE, `phalanx ${phalanx} vs clamp ${EXPLORE_MIN_DISTANCE}`)
  assert.ok(rib < home * 0.35)
})

test('focus pose looks at the target from the home-facing side', () => {
  const target = new Vector3(0, 1.65, 0.15)
  const pose = focusPose(target, 0.08, 38)
  assert.ok(pose.position.z > target.z)
  assert.ok(pose.position.distanceTo(target) < 1)
  assert.deepEqual(pose.target.toArray(), target.toArray())
})

test('Body of sternum frames much closer than the home full-figure camera', () => {
  const cam = new PerspectiveCamera(38, 1, 0.1, 60)
  const part = STRUCTURE_BY_ID['body-of-sternum']
  assert.ok(part)
  const mesh = new Mesh(new SphereGeometry(0.06, 12, 8), new MeshBasicMaterial())
  mesh.userData.atlasId = 'body-of-sternum'
  mesh.position.set(...part.position)
  mesh.updateMatrixWorld()
  const pose = poseForStructure(part, mesh, cam)
  const home = HOME_POS.distanceTo(HOME_TARGET)
  assert.ok(pose.distance < 0.4, `sternum frame ${pose.distance} must fill the view`)
  assert.ok(pose.distance < home * 0.2)
  assert.ok(pose.target.distanceTo(new Vector3(...part.position)) < 0.03)
})

function poseAtCatalog(id: string) {
  const cam = new PerspectiveCamera(38, 1, 0.1, 60)
  const part = STRUCTURE_BY_ID[id]
  assert.ok(part, id)
  const mesh = new Mesh(new SphereGeometry(0.03, 10, 8), new MeshBasicMaterial())
  mesh.userData.atlasId = id
  mesh.position.set(...part.position)
  mesh.updateMatrixWorld()
  return { part, pose: poseForStructure(part, mesh, cam) }
}

test('catalog dolly looks at calcaneus Y~0.036 from ~0.18m heel-fill with sane orbit', () => {
  const part = STRUCTURE_BY_ID['calcaneus-left']
  assert.ok(part)
  const pose = catalogDolly(part)
  assert.ok(Math.abs(pose.target.y - 0.03841) < 0.002, `catalog y ${pose.target.y}`)
  assert.ok(pose.target.y < 0.05, `heel y ${pose.target.y}`)
  assert.ok(pose.target.distanceTo(HOME_TARGET) > 0.7, 'must leave the chest')
  assert.equal(pose.distance, SAFE_DOLLY_DISTANCE)
  assert.ok(pose.distance >= 0.16 && pose.distance <= 0.22, `heel fill ${pose.distance}`)
  assert.ok(SAFE_ORBIT_MIN < SAFE_ORBIT_MAX, 'never min=max')
  assert.ok(SAFE_ORBIT_MIN < pose.distance && pose.distance < SAFE_ORBIT_MAX)
  assert.ok(SAFE_DOLLY_NEAR >= 0.04 && SAFE_DOLLY_NEAR <= 0.08)
  assert.ok(pose.position.distanceTo(pose.target) > SAFE_DOLLY_NEAR + 0.08)
  assert.ok(pose.position.z > pose.target.z, 'approach from the home-facing side')
})

test('long-bone Focus stays farther than heel-fill so the camera is not inside the femur', () => {
  const heel = catalogDolly(STRUCTURE_BY_ID['calcaneus-left'])
  const femur = catalogDolly(STRUCTURE_BY_ID['femur-left'])
  assert.equal(heel.distance, SAFE_DOLLY_DISTANCE)
  assert.equal(femur.distance, SAFE_DOLLY_LONG)
  assert.ok(femur.distance > heel.distance)
})

test('muscle Focus frames gentler than heel-fill and does not reuse 0.18m', () => {
  const heel = catalogDolly(STRUCTURE_BY_ID['calcaneus-left'])
  const pec = catalogDolly(STRUCTURE_BY_ID.pectoralis)
  const quad = catalogDolly(STRUCTURE_BY_ID.quadriceps)
  assert.equal(heel.distance, SAFE_DOLLY_DISTANCE)
  assert.equal(pec.distance, MUSCLE_DOLLY_DISTANCE)
  assert.equal(quad.distance, MUSCLE_DOLLY_DISTANCE)
  assert.ok(pec.distance > heel.distance * 3)
  assert.ok(pec.distance < 1.1, 'must still leave the home full-figure camera')
})

test('Focus on a foot bone aims at the calcaneus, not the chest', () => {
  const { part, pose } = poseAtCatalog('calcaneus-left')
  assert.ok(pose.target.y < 0.2, `foot y ${pose.target.y}`)
  assert.ok(pose.target.distanceTo(HOME_TARGET) > 0.7, 'must leave the chest home target')
  assert.ok(pose.target.distanceTo(new Vector3(...part.position)) < 0.04)
  assert.ok(pose.distance < 0.5)
})

test('Focus on a hand phalanx and frontal bone leave the torso', () => {
  const phalanx = poseAtCatalog('distal-phalanx-of-index-finger-left')
  const skull = poseAtCatalog('frontal')
  assert.ok(phalanx.pose.target.x < -0.2, `phalanx x ${phalanx.pose.target.x}`)
  assert.ok(skull.pose.target.y > 1.45, `frontal y ${skull.pose.target.y}`)
  assert.ok(phalanx.pose.target.distanceTo(HOME_TARGET) > 0.35)
  assert.ok(skull.pose.target.distanceTo(HOME_TARGET) > 0.5)
})

test('orbit target bounds include feet, hands, and skull', () => {
  const foot = STRUCTURE_BY_ID['calcaneus-left'].position
  const hand = STRUCTURE_BY_ID['distal-phalanx-of-index-finger-left'].position
  const skull = STRUCTURE_BY_ID['frontal'].position
  const inside = (p: [number, number, number]) =>
    p[0] >= ORBIT_TARGET_BOUNDS.x[0] &&
    p[0] <= ORBIT_TARGET_BOUNDS.x[1] &&
    p[1] >= ORBIT_TARGET_BOUNDS.y[0] &&
    p[1] <= ORBIT_TARGET_BOUNDS.y[1] &&
    p[2] >= ORBIT_TARGET_BOUNDS.z[0] &&
    p[2] <= ORBIT_TARGET_BOUNDS.z[1]
  assert.ok(inside(foot), 'calcaneus')
  assert.ok(inside(hand), 'phalanx')
  assert.ok(inside(skull), 'frontal')
  assert.equal(
    HOME_TARGET.y > 0.7 && HOME_TARGET.y < 1.22 && HOME_TARGET.y !== foot[1],
    true,
  )
})

test('calcaneus Focus rejects a pelvis-centered live sphere', () => {
  const cam = new PerspectiveCamera(38, 1, 0.1, 60)
  const part = STRUCTURE_BY_ID['calcaneus-left']
  assert.ok(part)
  const catalog = new Vector3(...part.position)
  const pelvis = new Vector3(0, 0.95, 0)
  const foot = catalog.clone()
  const aim = aimPointForBone(catalog, 'Foot', pelvis, pelvis)
  assert.ok(aim.distanceTo(pelvis) > 0.5, 'must not steal the torso')
  assert.ok(aim.distanceTo(catalog) < 0.02)

  const mesh = new Mesh(new SphereGeometry(0.9, 8, 6), new MeshBasicMaterial())
  mesh.userData.atlasId = 'calcaneus-left'
  mesh.position.copy(pelvis)
  mesh.updateMatrixWorld()
  const pose = poseForStructure(part, mesh, cam)
  assert.ok(pose.target.y < 0.2, `target y ${pose.target.y}`)
  assert.ok(pose.target.distanceTo(catalog) < 0.05)
  assert.ok(pose.distance < 0.4)
  const closest = pose.distance - 0.034
  assert.ok(closest > FOCUS_NEAR, `heel would clip: dist ${pose.distance} near ${FOCUS_NEAR}`)

  const fromFoot = aimPointForBone(catalog, 'Foot', foot, foot)
  assert.ok(fromFoot.distanceTo(catalog) < 0.02)
})

test('calcaneus ignores an identity-matrix sphere at the origin', () => {
  const catalog = new Vector3(...STRUCTURE_BY_ID['calcaneus-left'].position)
  const origin = new Vector3(0, 0, 0)
  const aim = aimPointForBone(catalog, 'Foot', origin, origin)
  assert.ok(aim.distanceTo(catalog) < 0.02)
  assert.ok(aim.distanceTo(origin) > 0.08)
})

test('poseForStructure uses the live mesh sphere, not a 1.2m catalog guess', () => {
  const cam = new PerspectiveCamera(38, 1, 0.1, 60)
  const mesh = new Mesh(new SphereGeometry(0.05, 12, 8), new MeshBasicMaterial())
  mesh.userData.atlasId = 'humerus-left'
  mesh.position.set(-0.19, 1.27, 0.07)
  mesh.updateMatrixWorld()
  const part = STRUCTURE_BY_ID['humerus-left']
  assert.ok(part)
  const pose = poseForStructure(part, mesh, cam)
  assert.equal(findAtlasMesh(mesh, 'humerus-left'), mesh)
  assert.ok(pose.distance < EXPLORE_MIN_DISTANCE, `must beat Orbit minDistance, got ${pose.distance}`)
  assert.ok(pose.target.distanceTo(mesh.position) < 0.02)
})
