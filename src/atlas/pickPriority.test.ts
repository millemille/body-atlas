import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  CapsuleGeometry,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Raycaster,
  SphereGeometry,
  Vector2,
  Vector3,
  type Intersection,
  type Object3D,
} from 'three'
import { HOME_CAMERA, HOME_TARGET } from './cameraHome'
import { L, mid } from './layout'
import { m1Placement, m2Placement } from './musclePlacement'
import {
  GEL_SHELL,
  pickAtlasId,
  pickAtlasIdOrSelf,
  rayFromBack,
  resolveAtlasHits,
  skipMuscleOnBackRay,
  skipVentralMuscleHit,
} from './pickPriority'
import type { SystemId } from './types'

function hit(
  system: SystemId,
  id: string,
  distance: number,
  extra: Record<string, unknown> = {},
  point?: { x: number; y: number; z: number },
) {
  return {
    distance,
    point,
    object: { userData: { atlasSystem: system, atlasId: id, ...extra } },
  } as Intersection
}

test('empty and single hits pass through', () => {
  assert.deepEqual(resolveAtlasHits([]), [])
  const only = [hit('muscle', 'biceps-left', 2)]
  assert.equal(pickAtlasId(only), 'biceps-left')
})

test('skips rim and skipPick before deciding', () => {
  const hits = [
    hit('muscle', 'rim', 1, { rim: true }),
    hit('skeleton', 'humerus-left', 1.004),
  ]
  assert.equal(pickAtlasId(hits), 'humerus-left')
})

test('thin gel over bone promotes the skeleton hit', () => {
  const hits = [
    hit('muscle', 'biceps-left', 2.0),
    hit('skeleton', 'humerus-left', 2.0 + 0.004),
  ]
  assert.equal(pickAtlasId(hits), 'humerus-left')
})

test('muscle belly in front of bone stays muscle', () => {
  const hits = [
    hit('muscle', 'biceps-left', 2.0),
    hit('skeleton', 'humerus-left', 2.0 + 0.014),
  ]
  assert.ok(0.014 > GEL_SHELL)
  assert.equal(pickAtlasId(hits), 'biceps-left')
})

test('bone already first is unchanged', () => {
  const hits = [
    hit('skeleton', 'humerus-left', 2.0),
    hit('muscle', 'biceps-left', 2.004),
  ]
  assert.equal(pickAtlasId(hits), 'humerus-left')
})

test('cold muscle hits are dropped so skeleton stays pickable', () => {
  const throughGel = [
    hit('muscle', 'biceps-left', 2.0),
    hit('skeleton', 'humerus-left', 2.014),
  ]
  assert.equal(pickAtlasId(throughGel, ['skeleton']), 'humerus-left')
  assert.equal(pickAtlasId(throughGel, ['skeleton', 'muscle']), 'biceps-left')
})

test('muscle-only hits vanish when Muscle is off', () => {
  const hits = [hit('muscle', 'biceps-left', 2.0)]
  assert.equal(pickAtlasId(hits, ['skeleton']), undefined)
})

test('distant bone behind gel is not stolen (beyond look-behind)', () => {
  const hits = [
    hit('muscle', 'biceps-left', 2.0),
    hit('skeleton', 'femur-left', 2.4),
  ]
  assert.equal(pickAtlasId(hits), 'biceps-left')
})

function shaftMesh(
  from: [number, number, number],
  to: [number, number, number],
  radius: number,
  system: SystemId,
  id: string,
) {
  const a = new Vector3(...from)
  const b = new Vector3(...to)
  const dir = b.clone().sub(a)
  const length = dir.length()
  const cyl = Math.max(0.012, length - radius * 2)
  const mesh = new Mesh(new CapsuleGeometry(radius, cyl, 6, 14), new MeshBasicMaterial())
  mesh.position.copy(a.clone().add(b).multiplyScalar(0.5))
  mesh.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), dir.normalize())
  mesh.userData.atlasSystem = system
  mesh.userData.atlasId = id
  mesh.updateMatrixWorld()
  return mesh
}

function sphereMesh(
  at: [number, number, number],
  radius: number,
  system: SystemId,
  id: string,
) {
  const mesh = new Mesh(new SphereGeometry(radius, 16, 12), new MeshBasicMaterial())
  mesh.position.set(...at)
  mesh.userData.atlasSystem = system
  mesh.userData.atlasId = id
  mesh.updateMatrixWorld()
  return mesh
}

function homeCamera() {
  const cam = new PerspectiveCamera(HOME_CAMERA.fov, 1440 / 900, HOME_CAMERA.near, HOME_CAMERA.far)
  cam.position.set(...HOME_CAMERA.position)
  cam.lookAt(HOME_TARGET.x, HOME_TARGET.y, HOME_TARGET.z)
  cam.updateMatrixWorld()
  return cam
}

function pickThrough(camera: PerspectiveCamera, objects: Object3D[], world: Vector3) {
  const ndc = world.clone().project(camera)
  const raycaster = new Raycaster()
  raycaster.setFromCamera(new Vector2(ndc.x, ndc.y), camera)
  const hits = raycaster.intersectObjects(objects, false)
  return pickAtlasId(hits, undefined, camera.position, raycaster.ray.direction)
}

test('back-camera scapula click does not resolve to pectoralis', () => {
  const hits = [
    hit('muscle', 'pectoralis', 2.0, {}, { x: 0.1, y: 1.36, z: 0.04 }),
    hit('skeleton', 'scapula-left', 2.03, {}, { x: 0.11, y: 1.37, z: 0.03 }),
  ]
  assert.equal(pickAtlasId(hits, ['skeleton', 'muscle'], { x: 0, y: 1.4, z: -2.2 }), 'scapula-left')
})

test('front-camera chest click still selects pectoralis, not the far scapula', () => {
  const hits = [
    hit('muscle', 'pectoralis', 2.0, {}, { x: 0, y: 1.3, z: 0.22 }),
    hit('skeleton', 'scapula-left', 2.4, {}, { x: 0.11, y: 1.37, z: 0.03 }),
  ]
  assert.equal(pickAtlasId(hits, ['skeleton', 'muscle'], { x: 1.85, y: 1.18, z: 3.35 }), 'pectoralis')
})

test('back view drops a pecs-only hit so the mesh cannot self-select', () => {
  const only = [hit('muscle', 'pectoralis', 2.0, {}, { x: 0.1, y: 1.36, z: 0.04 })]
  const back = { x: 0, y: 1.4, z: -2.2 }
  const towardFront = { x: 0, y: 0, z: 1 }
  assert.equal(skipVentralMuscleHit('pectoralis', back, towardFront), true)
  assert.equal(rayFromBack(towardFront), true)
  assert.equal(pickAtlasId(only, ['skeleton', 'muscle'], back, towardFront), undefined)
  assert.equal(
    pickAtlasIdOrSelf(only, ['skeleton', 'muscle'], back, towardFront, 'pectoralis'),
    undefined,
  )
})

test('front pec self-fallback still works when the hit list is pecs-only', () => {
  const only = [hit('muscle', 'pectoralis', 2.0, {}, { x: 0, y: 1.3, z: 0.22 })]
  const front = { x: 1.85, y: 1.18, z: 3.35 }
  const towardBack = { x: 0, y: 0, z: -1 }
  assert.equal(skipVentralMuscleHit('pectoralis', front, towardBack), false)
  assert.equal(pickAtlasId(only, ['skeleton', 'muscle'], front, towardBack), 'pectoralis')
  assert.equal(
    pickAtlasIdOrSelf(only, ['skeleton', 'muscle'], front, towardBack, 'pectoralis'),
    'pectoralis',
  )
})

test('back-facing ray through a nearer pec volume still picks scapula', () => {
  const hits = [
    hit('muscle', 'pectoralis', 1.8, {}, { x: -0.1, y: 1.36, z: -0.02 }),
    hit('skeleton', 'scapula-left', 2.2, {}, { x: -0.11, y: 1.37, z: 0.03 }),
    hit('muscle', 'erector-spinae', 2.25, {}, { x: 0, y: 1.18, z: -0.05 }),
  ]
  assert.equal(
    pickAtlasId(hits, ['skeleton', 'muscle'], { x: 0, y: 1.4, z: -3.2 }, { x: 0, y: 0, z: 1 }),
    'scapula-left',
  )
})

test('back ray through infraspinous fossa selects Scapula over deltoid', () => {
  const p = m2Placement()
  const scap = sphereMesh(p.infraL, 0.018, 'skeleton', 'scapula-left')
  const delt = shaftMesh(L.shoulderL, [-0.24, 1.18, 0.02], 0.038, 'muscle', 'deltoids')
  const cam = new PerspectiveCamera(40, 1440 / 900, 0.1, 20)
  cam.position.set(p.infraL[0], p.infraL[1], -2.4)
  cam.lookAt(p.infraL[0], p.infraL[1], p.infraL[2])
  cam.updateMatrixWorld()
  const aim = new Vector3(...p.infraL)
  assert.equal(pickThrough(cam, [delt, scap], aim), 'scapula-left')
})

test('front-oblique ray through medial thigh selects Hip adductors over quads', () => {
  const p = m2Placement()
  const midBelly = [
    (p.adductorFromL[0] + p.adductorToL[0]) / 2,
    (p.adductorFromL[1] + p.adductorToL[1]) / 2,
    (p.adductorFromL[2] + p.adductorToL[2]) / 2,
  ] as [number, number, number]
  const add = sphereMesh(midBelly, 0.028, 'muscle', 'hip-adductors')
  const quad = shaftMesh(L.hipL, L.kneeL, 0.036, 'muscle', 'quadriceps')
  const cam = new PerspectiveCamera(40, 1440 / 900, 0.1, 20)
  cam.position.set(midBelly[0] * 0.4, midBelly[1], 2.4)
  cam.lookAt(...midBelly)
  cam.updateMatrixWorld()
  assert.equal(pickThrough(cam, [quad, add], new Vector3(...midBelly)), 'hip-adductors')
})

test('home-camera ray through distal shaft gel selects Humerus', () => {
  const bone = shaftMesh(L.shoulderL, L.elbowL, 0.028, 'skeleton', 'humerus-left')
  const gel = shaftMesh(mid(L.shoulderL, L.elbowL), L.elbowL, 0.032, 'muscle', 'biceps-left')
  const belly = sphereMesh(mid(L.shoulderL, L.elbowL), 0.042, 'muscle', 'biceps-left')
  const t = 0.78
  const along = new Vector3(...L.shoulderL).lerp(new Vector3(...L.elbowL), t)
  const towardCam = homeCamera().position.clone().sub(along).normalize()
  const aim = along.add(towardCam.multiplyScalar(0.028))
  assert.equal(pickThrough(homeCamera(), [bone, gel, belly], aim), 'humerus-left')
})

test('shoulder-height deltoid+cuff overlap selects Rotator cuff', () => {
  const hits = [
    hit('muscle', 'deltoids', 2.0, {}, { x: -0.12, y: 1.38, z: 0.01 }),
    hit('muscle', 'rotator-cuff', 2.04, {}, { x: -0.12, y: 1.37, z: -0.02 }),
  ]
  assert.equal(pickAtlasId(hits, ['skeleton', 'muscle']), 'rotator-cuff')
})

test('anterior cuff click through biceps still selects Rotator cuff', () => {
  const hits = [
    hit('muscle', 'biceps-left', 1.9, {}, { x: -0.11, y: 1.36, z: 0.04 }),
    hit('muscle', 'rotator-cuff', 1.97, {}, { x: -0.1, y: 1.35, z: 0.03 }),
  ]
  assert.equal(pickAtlasId(hits, ['skeleton', 'muscle']), 'rotator-cuff')
})

test('mid-arm biceps belly is not stolen by a far cuff hit', () => {
  const hits = [
    hit('muscle', 'biceps-left', 2.0, {}, { x: -0.2, y: 1.18, z: 0.05 }),
    hit('muscle', 'rotator-cuff', 2.08, {}, { x: -0.12, y: 1.36, z: 0.02 }),
  ]
  assert.equal(pickAtlasId(hits, ['skeleton', 'muscle']), 'biceps-left')
})

test('lateral deltoid cap stays Deltoids when the cuff is only on the far side', () => {
  const hits = [
    hit('muscle', 'deltoids', 2.0, {}, { x: -0.26, y: 1.28, z: 0.06 }),
    hit('muscle', 'rotator-cuff', 2.1, {}, { x: -0.12, y: 1.36, z: -0.02 }),
  ]
  assert.equal(pickAtlasId(hits, ['skeleton', 'muscle']), 'deltoids')
})

test('wrap-orbit +Z graze still names Rotator cuff, not Scapula', () => {
  const hits = [
    hit('skeleton', 'scapula-right', 1.98, {}, { x: 0.2, y: 1.37, z: 0.02 }),
    hit('muscle', 'deltoids', 2.0, {}, { x: 0.22, y: 1.37, z: 0.02 }),
    hit('muscle', 'rotator-cuff', 2.05, {}, { x: 0.16, y: 1.36, z: -0.02 }),
  ]
  const wrap = { x: 2.45, y: 1.37, z: 0.12 }
  const grazePlusZ = { x: -1, y: 0, z: 0.08 }
  assert.equal(skipMuscleOnBackRay('rotator-cuff', wrap, grazePlusZ), false)
  assert.equal(skipMuscleOnBackRay('deltoids', wrap, grazePlusZ), false)
  assert.equal(pickAtlasId(hits, ['skeleton', 'muscle'], wrap, grazePlusZ), 'rotator-cuff')
  assert.equal(
    pickAtlasIdOrSelf(hits, ['skeleton', 'muscle'], wrap, grazePlusZ, 'scapula-right'),
    'rotator-cuff',
  )
})

test('wrap-orbit scapula-only in the lateral cuff compartment names Rotator cuff', () => {
  const hits = [hit('skeleton', 'scapula-right', 2.0, {}, { x: 0.2, y: 1.37, z: 0.02 })]
  const wrap = { x: 2.45, y: 1.37, z: 0.12 }
  const towardCuff = { x: -1, y: 0, z: -0.04 }
  assert.equal(pickAtlasId(hits, ['skeleton', 'muscle'], wrap, towardCuff), 'rotator-cuff')
})

test('wrap-orbit scapular-spine miss still names Rotator cuff', () => {
  const hits = [hit('skeleton', 'scapula-right', 2.0, {}, { x: 0.066, y: 1.37, z: 0.014 })]
  const wrap = { x: 2.45, y: 1.37, z: 0.12 }
  const towardCuff = { x: -0.999, y: 0, z: -0.044 }
  assert.equal(pickAtlasId(hits, ['skeleton', 'muscle'], wrap, towardCuff), 'rotator-cuff')
  assert.equal(
    pickAtlasId(hits, ['skeleton', 'muscle'], { x: 0, y: 1.32, z: -3.35 }, { x: 0, y: 0, z: 1 }),
    'scapula-right',
  )
})

test('wrap-orbit deltoid over the cuff compartment names Rotator cuff', () => {
  const hits = [
    hit('muscle', 'deltoids', 2.0, {}, { x: 0.22, y: 1.37, z: 0.02 }),
    hit('muscle', 'rotator-cuff', 2.05, {}, { x: 0.16, y: 1.36, z: -0.02 }),
  ]
  const wrap = { x: 2.4, y: 1.36, z: 0.12 }
  const towardCuff = { x: -1, y: 0, z: -0.04 }
  assert.equal(pickAtlasId(hits, ['skeleton', 'muscle'], wrap, towardCuff), 'rotator-cuff')
  assert.equal(
    pickAtlasIdOrSelf(hits, ['skeleton', 'muscle'], wrap, towardCuff, 'deltoids'),
    'rotator-cuff',
  )
})

test('wrap-camera ray through deltoid gel onto cuff still names Rotator cuff', () => {
  const m1 = m1Placement()
  const m2 = m2Placement()
  const delt = shaftMesh(m1.acromionR, m1.deltoidTubR, 0.038, 'muscle', 'deltoids')
  const cuff = sphereMesh(m2.gtR, 0.02, 'muscle', 'rotator-cuff')
  const cam = new PerspectiveCamera(40, 1440 / 900, 0.1, 20)
  cam.position.set(2.35, m2.gtR[1], 0.14)
  cam.lookAt(...m2.gtR)
  cam.updateMatrixWorld()
  assert.equal(pickThrough(cam, [delt, cuff], new Vector3(...m2.gtR)), 'rotator-cuff')
})

test('medial-thigh quad+adductor overlap selects Hip adductors', () => {
  const hits = [
    hit('muscle', 'quadriceps', 2.0, {}, { x: -0.06, y: 0.7, z: 0.05 }),
    hit('muscle', 'hip-adductors', 2.03, {}, { x: -0.05, y: 0.7, z: 0.04 }),
  ]
  assert.equal(pickAtlasId(hits, ['skeleton', 'muscle']), 'hip-adductors')
})

test('posterior hamstring click is not stolen by adductors', () => {
  const hits = [
    hit('muscle', 'hamstrings', 2.0, {}, { x: -0.1, y: 0.64, z: -0.05 }),
    hit('muscle', 'hip-adductors', 2.05, {}, { x: -0.05, y: 0.7, z: 0.04 }),
  ]
  assert.equal(pickAtlasId(hits, ['skeleton', 'muscle']), 'hamstrings')
})

test('anterior quad cap stays Quadriceps', () => {
  const hits = [
    hit('muscle', 'quadriceps', 2.0, {}, { x: -0.09, y: 0.68, z: 0.14 }),
    hit('muscle', 'hip-adductors', 2.06, {}, { x: -0.05, y: 0.7, z: 0.04 }),
  ]
  assert.equal(pickAtlasId(hits, ['skeleton', 'muscle']), 'quadriceps')
})

test('oblique back ray (dir.z 0.12) still drops pecs self-fallback', () => {
  const only = [hit('muscle', 'pectoralis', 2.0, {}, { x: 0.1, y: 1.36, z: 0.04 })]
  const back = { x: 0.35, y: 1.4, z: -1.6 }
  const oblique = { x: -0.15, y: 0, z: 0.12 }
  assert.equal(skipVentralMuscleHit('pectoralis', back, oblique), true)
  assert.equal(rayFromBack(oblique), true)
  assert.equal(pickAtlasId(only, ['skeleton', 'muscle'], back, oblique), undefined)
  assert.equal(
    pickAtlasIdOrSelf(only, ['skeleton', 'muscle'], back, oblique, 'pectoralis'),
    undefined,
  )
})

test('camera behind the body skips pecs even when the ray is only barely +Z', () => {
  const hits = [
    hit('muscle', 'pectoralis', 1.9, {}, { x: -0.1, y: 1.36, z: 0.02 }),
    hit('skeleton', 'scapula-left', 2.15, {}, { x: -0.11, y: 1.37, z: 0.03 }),
  ]
  assert.equal(
    pickAtlasId(hits, ['skeleton', 'muscle'], { x: 0.2, y: 1.35, z: -0.08 }, { x: 0, y: 0, z: 0.05 }),
    'scapula-left',
  )
})

test('sternum pec click stays Pectoralis, not Rotator cuff', () => {
  const hits = [hit('muscle', 'pectoralis', 2.0, {}, { x: 0, y: 1.32, z: 0.22 })]
  const front = { x: 1.85, y: 1.18, z: 3.35 }
  const towardBack = { x: 0, y: 0, z: -1 }
  assert.equal(pickAtlasId(hits, ['skeleton', 'muscle'], front, towardBack), 'pectoralis')
  assert.equal(
    pickAtlasIdOrSelf(hits, ['skeleton', 'muscle'], front, towardBack, 'pectoralis'),
    'pectoralis',
  )
})

test('front chest through cuff or deltoid still names Pectoralis', () => {
  const hits = [
    hit('muscle', 'rotator-cuff', 1.95, {}, { x: -0.04, y: 1.34, z: 0.18 }),
    hit('muscle', 'deltoids', 1.98, {}, { x: -0.08, y: 1.36, z: 0.14 }),
    hit('muscle', 'pectoralis', 2.04, {}, { x: -0.02, y: 1.32, z: 0.2 }),
  ]
  const front = { x: 0.2, y: 1.3, z: 3.1 }
  const towardBack = { x: 0, y: 0, z: -1 }
  assert.equal(pickAtlasId(hits, ['skeleton', 'muscle'], front, towardBack), 'pectoralis')
})

test('sternum bone under pec gel stays Pectoralis on a front click', () => {
  const hits = [
    hit('muscle', 'pectoralis', 2.0, {}, { x: 0, y: 1.32, z: 0.21 }),
    hit('skeleton', 'body-of-sternum', 2.006, {}, { x: 0, y: 1.31, z: 0.2 }),
  ]
  assert.ok(0.006 <= GEL_SHELL)
  assert.equal(
    pickAtlasId(hits, ['skeleton', 'muscle'], { x: 1.85, y: 1.18, z: 3.35 }, { x: 0, y: 0, z: -1 }),
    'pectoralis',
  )
})

test('sternum-only click with Muscle hot still names Pectoralis', () => {
  const hits = [hit('skeleton', 'body-of-sternum', 2.0, {}, { x: 0, y: 1.31, z: 0.2 })]
  const front = { x: 1.85, y: 1.18, z: 3.35 }
  const towardBack = { x: 0, y: 0, z: -1 }
  assert.equal(pickAtlasId(hits, ['skeleton', 'muscle'], front, towardBack), 'pectoralis')
  assert.equal(pickAtlasId(hits, ['skeleton'], front, towardBack), 'body-of-sternum')
})

test('lateral canvas cuff still names Rotator cuff', () => {
  const hits = [
    hit('muscle', 'deltoids', 2.0, {}, { x: -0.12, y: 1.38, z: 0.01 }),
    hit('muscle', 'rotator-cuff', 2.04, {}, { x: -0.12, y: 1.37, z: -0.02 }),
  ]
  const frontSide = { x: -1.6, y: 1.36, z: 2.2 }
  const towardCuff = { x: 0.4, y: 0, z: -1 }
  assert.equal(pickAtlasId(hits, ['skeleton', 'muscle'], frontSide, towardCuff), 'rotator-cuff')
})

test('side-shoulder cuff is not stolen by Scapula or Pectoralis', () => {
  const hits = [
    hit('muscle', 'deltoids', 2.0, {}, { x: 0.12, y: 1.38, z: 0.01 }),
    hit('muscle', 'pectoralis', 2.02, {}, { x: 0.11, y: 1.36, z: 0.05 }),
    hit('muscle', 'rotator-cuff', 2.04, {}, { x: 0.12, y: 1.37, z: -0.02 }),
    hit('skeleton', 'scapula-right', 2.1, {}, { x: 0.11, y: 1.37, z: 0.03 }),
  ]
  const side = { x: 2.1, y: 1.36, z: 0.3 }
  const towardCuff = { x: -1, y: 0, z: -0.08 }
  assert.equal(pickAtlasId(hits, ['skeleton', 'muscle'], side, towardCuff), 'rotator-cuff')
  assert.equal(
    pickAtlasIdOrSelf(hits, ['skeleton', 'muscle'], side, towardCuff, 'pectoralis'),
    'rotator-cuff',
  )
})

test('side-shoulder cuff is not stolen by a nearer humerus', () => {
  const hits = [
    hit('muscle', 'rotator-cuff', 2.0, {}, { x: 0.16, y: 1.38, z: 0.01 }),
    hit('skeleton', 'humerus-right', 2.006, {}, { x: 0.18, y: 1.37, z: 0.0 }),
  ]
  assert.ok(0.006 <= GEL_SHELL)
  const side = { x: 2.2, y: 1.36, z: 0.35 }
  const towardCuff = { x: -1, y: 0, z: -0.1 }
  assert.equal(pickAtlasId(hits, ['skeleton', 'muscle'], side, towardCuff), 'rotator-cuff')
  assert.equal(
    pickAtlasIdOrSelf(hits, ['skeleton', 'muscle'], side, towardCuff, 'humerus-right'),
    'rotator-cuff',
  )
})

test('side-shoulder cuff is not stolen by T5', () => {
  const hits = [
    hit('skeleton', 'fifth-thoracic-vertebra', 2.0, {}, { x: 0.04, y: 1.36, z: 0.02 }),
    hit('muscle', 'rotator-cuff', 2.08, {}, { x: 0.14, y: 1.37, z: 0.0 }),
    hit('muscle', 'deltoids', 2.09, {}, { x: 0.16, y: 1.38, z: 0.02 }),
  ]
  const side = { x: 2.0, y: 1.36, z: 0.4 }
  const towardCuff = { x: -1, y: 0, z: -0.12 }
  assert.equal(pickAtlasId(hits, ['skeleton', 'muscle'], side, towardCuff), 'rotator-cuff')
  assert.equal(
    pickAtlasIdOrSelf(hits, ['skeleton', 'muscle'], side, towardCuff, 'fifth-thoracic-vertebra'),
    'rotator-cuff',
  )
})

test('proximal humerus in the cuff compartment names Rotator cuff', () => {
  const hits = [hit('skeleton', 'humerus-right', 2.0, {}, { x: 0.18, y: 1.38, z: 0.01 })]
  const side = { x: 2.1, y: 1.36, z: 0.3 }
  const towardCuff = { x: -1, y: 0, z: -0.08 }
  assert.equal(pickAtlasId(hits, ['skeleton', 'muscle'], side, towardCuff), 'rotator-cuff')
})

test('wrap-orbit humerus just outside cuffBoneZone names Rotator cuff', () => {
  const wrap = { x: 2.45, y: 1.37, z: 0.12 }
  const towardCuff = { x: -1, y: 0, z: -0.05 }
  const edgeHits = [
    hit('skeleton', 'humerus-left', 2.0, {}, { x: -0.27, y: 1.28, z: 0.02 }),
    hit('skeleton', 'humerus-left', 2.0, {}, { x: -0.28, y: 1.29, z: 0.01 }),
    hit('skeleton', 'humerus-left', 2.0, {}, { x: -0.22, y: 1.26, z: 0.04 }),
  ]
  for (const only of edgeHits) {
    assert.equal(
      pickAtlasId([only], ['skeleton', 'muscle'], wrap, towardCuff),
      'rotator-cuff',
      `wrap humerus ${JSON.stringify(only.point)}`,
    )
    assert.equal(
      pickAtlasIdOrSelf([only], ['skeleton', 'muscle'], wrap, towardCuff, 'humerus-left'),
      'rotator-cuff',
    )
  }
})

test('wrap thin deltoid over proximal humerus names Rotator cuff, not Humerus', () => {
  const hits = [
    hit('muscle', 'deltoids', 2.0, {}, { x: -0.27, y: 1.28, z: 0.04 }),
    hit('skeleton', 'humerus-left', 2.006, {}, { x: -0.26, y: 1.28, z: 0.02 }),
  ]
  assert.ok(0.006 <= GEL_SHELL)
  const wrap = { x: -2.45, y: 1.37, z: 0.12 }
  const towardCuff = { x: 1, y: 0, z: -0.05 }
  assert.equal(pickAtlasId(hits, ['skeleton', 'muscle'], wrap, towardCuff), 'rotator-cuff')
  assert.equal(
    pickAtlasIdOrSelf(hits, ['skeleton', 'muscle'], wrap, towardCuff, 'humerus-left'),
    'rotator-cuff',
  )
})

test('wrap mid-arm humerus stays Humerus', () => {
  const hits = [hit('skeleton', 'humerus-left', 2.0, {}, { x: -0.2, y: 1.18, z: 0.05 })]
  const wrap = { x: -2.45, y: 1.37, z: 0.12 }
  const towardArm = { x: 1, y: 0, z: -0.05 }
  assert.equal(pickAtlasId(hits, ['skeleton', 'muscle'], wrap, towardArm), 'humerus-left')
})

test('wrap +X through-body left humerus names Rotator cuff, not Humerus · left', () => {
  const hits = [hit('skeleton', 'humerus-left', 2.0, {}, { x: -0.2, y: 1.18, z: 0.05 })]
  const wrap = { x: 2.45, y: 1.37, z: 0.12 }
  const towardCuff = { x: -1, y: 0, z: -0.05 }
  assert.equal(pickAtlasId(hits, ['skeleton', 'muscle'], wrap, towardCuff), 'rotator-cuff')
  assert.equal(
    pickAtlasIdOrSelf(hits, ['skeleton', 'muscle'], wrap, towardCuff, 'humerus-left'),
    'rotator-cuff',
  )
})

test('front camera distal humerus outside cuffBoneZone stays Humerus', () => {
  const hits = [hit('skeleton', 'humerus-left', 2.0, {}, { x: -0.27, y: 1.28, z: 0.04 })]
  const front = { x: 0.2, y: 1.3, z: 2.4 }
  const towardBack = { x: 0, y: 0, z: -1 }
  assert.equal(pickAtlasId(hits, ['skeleton', 'muscle'], front, towardBack), 'humerus-left')
})

test('wrap distal deltoid cap still names Rotator cuff, not Humerus', () => {
  const hits = [
    hit('muscle', 'deltoids', 2.0, {}, { x: -0.26, y: 1.28, z: 0.06 }),
    hit('muscle', 'rotator-cuff', 2.1, {}, { x: -0.12, y: 1.36, z: -0.02 }),
  ]
  const wrap = { x: -2.4, y: 1.36, z: 0.12 }
  const towardCuff = { x: 1, y: 0, z: -0.04 }
  assert.equal(pickAtlasId(hits, ['skeleton', 'muscle'], wrap, towardCuff), 'rotator-cuff')
})

test('midline T5 without a cuff hit stays the vertebra', () => {
  const hits = [hit('skeleton', 'fifth-thoracic-vertebra', 2.0, {}, { x: 0, y: 1.36, z: 0.03 })]
  const front = { x: 0.2, y: 1.36, z: 2.4 }
  const towardBack = { x: 0, y: 0, z: -1 }
  assert.equal(pickAtlasId(hits, ['skeleton', 'muscle'], front, towardBack), 'fifth-thoracic-vertebra')
})

test('lateral pecs in the cuff compartment name Rotator cuff', () => {
  const hits = [hit('muscle', 'pectoralis', 2.0, {}, { x: -0.12, y: 1.38, z: 0.04 })]
  const front = { x: 1.85, y: 1.18, z: 3.35 }
  const towardBack = { x: 0, y: 0, z: -1 }
  assert.equal(pickAtlasId(hits, ['skeleton', 'muscle'], front, towardBack), 'rotator-cuff')
  assert.equal(
    pickAtlasIdOrSelf(hits, ['skeleton', 'muscle'], front, towardBack, 'pectoralis'),
    'rotator-cuff',
  )
})

test('scapula-area fifth rib remaps to Scapula on a back click', () => {
  const hits = [hit('skeleton', 'fifth-rib-left', 2.0, {}, { x: -0.1, y: 1.34, z: -0.02 })]
  const back = { x: 0, y: 1.35, z: -2.5 }
  const towardFront = { x: 0, y: 0, z: 1 }
  assert.equal(pickAtlasId(hits, ['skeleton', 'muscle'], back, towardFront), 'scapula-left')
  assert.equal(
    pickAtlasIdOrSelf(hits, ['skeleton', 'muscle'], back, towardFront, 'fifth-rib-left'),
    'scapula-left',
  )
})

test('back ray cuff/delt first still resolves to Scapula', () => {
  const hits = [
    hit('muscle', 'rotator-cuff', 1.9, {}, { x: -0.12, y: 1.37, z: -0.02 }),
    hit('muscle', 'deltoids', 1.94, {}, { x: -0.14, y: 1.36, z: -0.01 }),
    hit('skeleton', 'scapula-left', 2.1, {}, { x: -0.11, y: 1.37, z: 0.03 }),
  ]
  const back = { x: 0, y: 1.4, z: -2.6 }
  const towardFront = { x: 0, y: 0, z: 1 }
  assert.equal(pickAtlasId(hits, ['skeleton', 'muscle'], back, towardFront), 'scapula-left')
  assert.equal(
    pickAtlasIdOrSelf(hits, ['skeleton', 'muscle'], back, towardFront, 'rotator-cuff'),
    'scapula-left',
  )
})

test('cuff-only hit on a back ray does not self-select Rotator cuff', () => {
  const only = [hit('muscle', 'rotator-cuff', 2.0, {}, { x: -0.12, y: 1.37, z: -0.02 })]
  const back = { x: 0, y: 1.4, z: -2.4 }
  const towardFront = { x: 0, y: 0, z: 1 }
  assert.equal(skipMuscleOnBackRay('rotator-cuff', back, towardFront), true)
  assert.equal(pickAtlasId(only, ['skeleton', 'muscle'], back, towardFront), undefined)
  assert.equal(
    pickAtlasIdOrSelf(only, ['skeleton', 'muscle'], back, towardFront, 'rotator-cuff'),
    undefined,
  )
})

test('side camera still ray-picks cuff; back hemisphere does not', () => {
  const side = { x: -2.1, y: 1.36, z: 0.25 }
  const back = { x: 0, y: 1.4, z: -2.4 }
  assert.equal(skipMuscleOnBackRay('rotator-cuff', side, { x: 1, y: 0, z: -0.05 }), false)
  assert.equal(skipMuscleOnBackRay('rotator-cuff', back, { x: 0, y: 0, z: 0.02 }), true)
  assert.equal(skipMuscleOnBackRay('deltoids', back, { x: 0, y: 0, z: 1 }), true)
})

test('wider medial-thigh quad click still names Hip adductors', () => {
  const hits = [hit('muscle', 'quadriceps', 2.0, {}, { x: -0.13, y: 0.72, z: 0.06 })]
  const front = { x: 0.4, y: 0.7, z: 2.2 }
  const towardBack = { x: 0, y: 0, z: -1 }
  assert.equal(pickAtlasId(hits, ['skeleton', 'muscle'], front, towardBack), 'hip-adductors')
  assert.equal(
    pickAtlasIdOrSelf(hits, ['skeleton', 'muscle'], front, towardBack, 'quadriceps'),
    'hip-adductors',
  )
})

test('front-oblique inner-thigh quad click names Hip adductors', () => {
  const hits = [hit('muscle', 'quadriceps', 2.0, {}, { x: -0.15, y: 0.68, z: 0.1 })]
  const front = { x: 0.8, y: 0.7, z: 2.0 }
  const towardBack = { x: -0.2, y: 0, z: -1 }
  assert.equal(pickAtlasId(hits, ['skeleton', 'muscle'], front, towardBack), 'hip-adductors')
  assert.equal(
    pickAtlasIdOrSelf(hits, ['skeleton', 'muscle'], front, towardBack, 'quadriceps'),
    'hip-adductors',
  )
})

test('full-back scapula click is not stolen by Deltoids', () => {
  const hits = [
    hit('muscle', 'deltoids', 2.0, {}, { x: -0.14, y: 1.36, z: -0.02 }),
    hit('skeleton', 'scapula-left', 2.07, {}, { x: -0.12, y: 1.36, z: 0.03 }),
  ]
  const back = { x: 0, y: 1.4, z: -2.4 }
  const towardFront = { x: 0, y: 0, z: 1 }
  assert.equal(pickAtlasId(hits, ['skeleton', 'muscle'], back, towardFront), 'scapula-left')
  assert.equal(
    pickAtlasIdOrSelf(hits, ['skeleton', 'muscle'], back, towardFront, 'deltoids'),
    'scapula-left',
  )
})

test('full-back scapula-area click is not stolen by T8', () => {
  const hits = [
    hit('skeleton', 'eighth-thoracic-vertebra', 2.0, {}, { x: -0.02, y: 1.27, z: -0.02 }),
    hit('skeleton', 'scapula-left', 2.08, {}, { x: -0.11, y: 1.37, z: 0.03 }),
  ]
  const back = { x: 0, y: 1.35, z: -2.6 }
  const towardFront = { x: 0, y: 0, z: 1 }
  assert.equal(pickAtlasId(hits, ['skeleton', 'muscle'], back, towardFront), 'scapula-left')
  assert.equal(
    pickAtlasIdOrSelf(hits, ['skeleton', 'muscle'], back, towardFront, 'eighth-thoracic-vertebra'),
    'scapula-left',
  )
})

test('full-back scapula-area click is not stolen by Latissimus', () => {
  const hits = [
    hit('muscle', 'latissimus', 1.92, {}, { x: -0.08, y: 1.28, z: -0.04 }),
    hit('skeleton', 'eighth-thoracic-vertebra', 2.0, {}, { x: -0.01, y: 1.27, z: 0.02 }),
    hit('skeleton', 'scapula-left', 2.1, {}, { x: -0.11, y: 1.36, z: 0.03 }),
  ]
  assert.equal(
    pickAtlasId(hits, ['skeleton', 'muscle'], { x: 0, y: 1.35, z: -2.8 }, { x: 0, y: 0, z: 1 }),
    'scapula-left',
  )
})

test('midline T8 without scapula in the list stays the vertebra', () => {
  const hits = [hit('skeleton', 'eighth-thoracic-vertebra', 2.0, {}, { x: 0, y: 1.27, z: -0.02 })]
  assert.equal(
    pickAtlasId(hits, ['skeleton', 'muscle'], { x: 0, y: 1.27, z: -2.4 }, { x: 0, y: 0, z: 1 }),
    'eighth-thoracic-vertebra',
  )
})

test('full-back deep-back click prefers erectors over Deltoids when scapula is absent', () => {
  const hits = [
    hit('muscle', 'deltoids', 2.0, {}, { x: -0.08, y: 1.28, z: -0.03 }),
    hit('muscle', 'erector-spinae', 2.05, {}, { x: -0.02, y: 1.22, z: -0.05 }),
  ]
  assert.equal(
    pickAtlasId(hits, ['skeleton', 'muscle'], { x: 0, y: 1.35, z: -2.6 }, { x: 0, y: 0, z: 1 }),
    'erector-spinae',
  )
})

test('back-view cuff remap does not override a scapula hit', () => {
  const hits = [
    hit('muscle', 'deltoids', 2.0, {}, { x: -0.12, y: 1.38, z: 0.01 }),
    hit('muscle', 'rotator-cuff', 2.03, {}, { x: -0.12, y: 1.37, z: -0.02 }),
    hit('skeleton', 'scapula-left', 2.08, {}, { x: -0.11, y: 1.37, z: 0.03 }),
  ]
  assert.equal(
    pickAtlasId(hits, ['skeleton', 'muscle'], { x: 0, y: 1.4, z: -2.8 }, { x: 0, y: 0, z: 1 }),
    'scapula-left',
  )
})

test('full-back scapula click is not stolen by a nearer sixth rib', () => {
  const hits = [
    hit('skeleton', 'sixth-rib-left', 2.0, {}, { x: -0.1, y: 1.32, z: -0.02 }),
    hit('skeleton', 'scapula-left', 2.06, {}, { x: -0.12, y: 1.36, z: 0.03 }),
  ]
  assert.equal(
    pickAtlasId(hits, ['skeleton', 'muscle'], { x: 0, y: 1.4, z: -2.5 }, { x: 0, y: 0, z: 1 }),
    'scapula-left',
  )
})

test('thin gel over a rib still yields Scapula on a back click', () => {
  const hits = [
    hit('muscle', 'deltoids', 2.0, {}, { x: -0.13, y: 1.34, z: -0.01 }),
    hit('skeleton', 'sixth-rib-left', 2.006, {}, { x: -0.1, y: 1.3, z: 0.02 }),
    hit('skeleton', 'scapula-left', 2.08, {}, { x: -0.12, y: 1.36, z: 0.03 }),
  ]
  assert.ok(0.006 <= GEL_SHELL)
  assert.equal(
    pickAtlasId(hits, ['skeleton', 'muscle'], { x: 0, y: 1.38, z: -2.2 }, { x: 0, y: 0, z: 1 }),
    'scapula-left',
  )
})

test('back-view abs or pecs do not beat Scapula', () => {
  const hits = [
    hit('muscle', 'abdominal-wall', 1.95, {}, { x: -0.04, y: 1.2, z: -0.01 }),
    hit('muscle', 'pectoralis', 1.98, {}, { x: -0.08, y: 1.32, z: -0.02 }),
    hit('skeleton', 'scapula-left', 2.12, {}, { x: -0.12, y: 1.36, z: 0.03 }),
  ]
  assert.equal(
    pickAtlasId(hits, ['skeleton', 'muscle'], { x: 0, y: 1.4, z: -2.8 }, { x: 0, y: 0, z: 1 }),
    'scapula-left',
  )
})

test('lower posterior rib without scapula in the list stays the rib', () => {
  const hits = [hit('skeleton', 'sixth-rib-left', 2.0, {}, { x: -0.1, y: 1.12, z: -0.03 })]
  assert.equal(
    pickAtlasId(hits, ['skeleton', 'muscle'], { x: 0, y: 1.2, z: -2.4 }, { x: 0, y: 0, z: 1 }),
    'sixth-rib-left',
  )
})

test('medial-thigh quad click names Hip adductors even if the adductor mesh missed', () => {
  const hits = [hit('muscle', 'quadriceps', 2.0, {}, { x: -0.06, y: 0.7, z: 0.05 })]
  const front = { x: 1.2, y: 0.7, z: 2.4 }
  const towardBack = { x: 0, y: 0, z: -1 }
  assert.equal(pickAtlasId(hits, ['skeleton', 'muscle'], front, towardBack), 'hip-adductors')
  assert.equal(
    pickAtlasIdOrSelf(hits, ['skeleton', 'muscle'], front, towardBack, 'quadriceps'),
    'hip-adductors',
  )
})

test('named-belly promote does not undo Crit dorsal pec skip', () => {
  const hits = [
    hit('muscle', 'pectoralis', 1.8, {}, { x: -0.1, y: 1.36, z: -0.02 }),
    hit('skeleton', 'scapula-left', 2.2, {}, { x: -0.11, y: 1.37, z: 0.03 }),
    hit('muscle', 'rotator-cuff', 2.22, {}, { x: -0.12, y: 1.36, z: -0.03 }),
  ]
  assert.equal(
    pickAtlasId(hits, ['skeleton', 'muscle'], { x: 0, y: 1.4, z: -3.2 }, { x: 0, y: 0, z: 1 }),
    'scapula-left',
  )
})

test('home-camera ray at biceps belly selects Biceps', () => {
  const bone = shaftMesh(L.shoulderL, L.elbowL, 0.028, 'skeleton', 'humerus-left')
  const gel = shaftMesh(mid(L.shoulderL, L.elbowL), L.elbowL, 0.032, 'muscle', 'biceps-left')
  const midPt = mid(L.shoulderL, L.elbowL)
  const belly = sphereMesh(midPt, 0.042, 'muscle', 'biceps-left')
  const towardCam = homeCamera().position.clone().sub(new Vector3(...midPt)).normalize()
  const aim = new Vector3(...midPt).add(towardCam.multiplyScalar(0.042))
  assert.equal(pickThrough(homeCamera(), [bone, gel, belly], aim), 'biceps-left')
})
