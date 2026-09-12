import type { Intersection, Object3D } from 'three'
import { BASE_OPACITY } from './colors'
import { cameraHemisphere, CORONAL_Z, isLimbPart, isVentralStructure } from './selectLean'
import { getStructure } from './structures'
import type { SystemId } from './types'

/** Search window (world units) for a bone sitting behind gel. */
export const LOOK_BEHIND = 0.15
/**
 * Thin gel overlay vs a muscle bulge.
 * Shaft wrap is ~0.004–0.008; the biceps belly sits ~0.03 outside the humerus.
 * LOOK_BEHIND alone would steal every belly click to bone; keep the shell tight.
 */
export const GEL_SHELL = 0.01

/** Muscle gel this thin should not win over a bone just behind it. */
export const TRANSLUCENT_MUSCLE = BASE_OPACITY.muscle <= 0.55

/** Neighbors that sit over the cuff / adductor and steal the first canvas click. */
export const CUFF_NEIGHBORS = new Set([
  'deltoids',
  'pectoralis',
  'biceps-left',
  'biceps-right',
  'triceps-left',
  'triceps-right',
])
export const ADDUCTOR_NEIGHBORS = new Set(['quadriceps', 'hamstrings'])
/** How far behind a neighbor the named belly may sit and still win. */
export const NAMED_BELLY_WINDOW = 0.14

type AtlasObject = Object3D & {
  userData: {
    atlasSystem?: SystemId
    atlasId?: string
    rim?: boolean
    skipPick?: boolean
    source?: 'bodyparts3d' | 'interim'
  }
}

function hitSource(hit: Intersection): 'bodyparts3d' | 'interim' | undefined {
  const u = atlasOf(hit)
  if (u.source) return u.source
  return u.atlasId ? getStructure(u.atlasId)?.source : undefined
}

function isInterimHit(hit: Intersection) {
  return hitSource(hit) === 'interim'
}

function isInterimId(
  id: string | undefined,
  source?: 'bodyparts3d' | 'interim',
) {
  if (source) return source === 'interim'
  return Boolean(id && getStructure(id)?.source === 'interim')
}

function atlasOf(hit: Intersection): AtlasObject['userData'] {
  return (hit.object as AtlasObject).userData
}

function systemOf(hit: Intersection): SystemId | undefined {
  return atlasOf(hit).atlasSystem
}

function isWorldVisible(obj: Object3D): boolean {
  let node: Object3D | null = obj
  while (node) {
    if (node.visible === false) return false
    node = node.parent
  }
  return true
}

type CameraPos = { x: number; y: number; z: number }
type RayDir = { x?: number; y?: number; z: number }

/**
 * Ray traveling toward +Z is a back-of-body pick.
 * 0.04 still catches oblique full-back orbits without treating a side cuff
 * click (dir.z ≈ 0) as dorsal.
 */
export function rayFromBack(dir?: RayDir | null) {
  return Boolean(dir && dir.z > 0.04)
}

function cameraBehindBody(cameraPos?: CameraPos) {
  if (!cameraPos) return false
  return cameraHemisphere(cameraPos) === 'back' || cameraPos.z < 0
}

/** Wrap / side-shoulder: high |x|, near the coronal plane. */
function wrapShoulderView(cameraPos?: CameraPos) {
  if (!cameraPos) return false
  return Math.abs(cameraPos.x) >= 1.4 && Math.abs(cameraPos.z) <= 0.55
}

/** True back orbit only — side-shoulder cuff sits near coronal and must not use this. */
export function viewingBackStrict(cameraPos?: CameraPos, rayDir?: RayDir | null) {
  if (cameraPos && cameraHemisphere(cameraPos) === 'back') return true
  // King's wrap can graze slightly +Z at the anterior cuff. That is not dorsal —
  // treating it as a back ray skipped cuff gel and named Scapula.
  if (wrapShoulderView(cameraPos)) return false
  return rayFromBack(rayDir)
}

/** Full-back orbit, or a posterior surface click from a non-front camera. */
export function viewingBack(
  cameraPos?: CameraPos,
  rayDir?: RayDir | null,
  hitPoint?: { z: number } | null,
) {
  if (viewingBackStrict(cameraPos, rayDir) || cameraBehindBody(cameraPos)) return true
  if (hitPoint && hitPoint.z < CORONAL_Z && cameraPos && cameraHemisphere(cameraPos) !== 'front') {
    return true
  }
  return false
}

/** Shoulder gels that punch through a full-back scapula / deep-back click. */
export const SHOULDER_STEAL = new Set([
  'deltoids',
  'rotator-cuff',
  'biceps-left',
  'biceps-right',
  'triceps-left',
  'triceps-right',
])

/**
 * Cuff / delts sit on the coronal plane — do not use hit.z or camera.z < 0
 * or a side-shoulder click dies. Only a true back ray or back hemisphere.
 */
function skipShoulderGelOnBack(
  id: string | undefined,
  cameraPos?: CameraPos,
  rayDir?: RayDir | null,
) {
  if (!id || !SHOULDER_STEAL.has(id)) return false
  return viewingBackStrict(cameraPos, rayDir)
}

/** Pecs / abs / shoulder gels must not eat a dorsal scapula click. */
export function skipMuscleOnBackRay(
  id: string | undefined,
  cameraPos?: CameraPos,
  rayDir?: RayDir | null,
  hitPoint?: { z: number } | null,
  source?: 'bodyparts3d' | 'interim',
) {
  if (!isInterimId(id, source)) return false
  if (skipVentralMuscleHit(id, cameraPos, rayDir, hitPoint, source)) return true
  return skipShoulderGelOnBack(id, cameraPos, rayDir)
}

/** Pecs / abs must not eat a dorsal click. Limb gels stay pickable. */
export function skipVentralMuscleHit(
  id: string | undefined,
  cameraPos?: CameraPos,
  rayDir?: RayDir | null,
  hitPoint?: { z: number } | null,
  source?: 'bodyparts3d' | 'interim',
) {
  if (!id || !isInterimId(id, source)) return false
  const part = getStructure(id)
  if (!part || part.system !== 'muscle' || !isVentralStructure(part)) return false
  if (rayFromBack(rayDir)) return true
  if (cameraBehindBody(cameraPos)) return true
  if (hitPoint && hitPoint.z < CORONAL_Z && cameraPos && cameraHemisphere(cameraPos) !== 'front') {
    return true
  }
  return false
}

function structureOf(hit: Intersection) {
  const id = atlasOf(hit).atlasId
  return id ? getStructure(id) : null
}

function promote(usable: Intersection[], winner: Intersection): Intersection[] {
  return [winner, ...usable.filter((h) => h !== winner)]
}

/**
 * From a back view, pecs / abs must not steal a scapula or deep-back hit.
 * Front views still keep the chest gel when the scapula is only on the far side.
 */
export function preferDorsalOnBackView(
  usable: Intersection[],
  cameraPos?: CameraPos,
  rayDir?: RayDir | null,
): Intersection[] {
  if (usable.length === 0) return usable
  const first = usable[0]
  const firstId = atlasOf(first).atlasId
  if (skipMuscleOnBackRay(firstId, cameraPos, rayDir, first.point, hitSource(first))) {
    const rest = usable.filter(
      (h) => !skipMuscleOnBackRay(atlasOf(h).atlasId, cameraPos, rayDir, h.point, hitSource(h)),
    )
    if (rest.length === 0) return []
    const dorsal = rest.find(isScapulaHit) ?? rest.find(preferDorsalTarget)
    return dorsal ? promote(rest, dorsal) : rest
  }
  if (usable.length < 2) return usable
  const firstPart = structureOf(first)
  if (!firstPart || !isVentralStructure(firstPart)) return usable

  const dorsal = usable.find(preferDorsalTarget)
  if (!dorsal) return usable

  return viewingBackStrict(cameraPos, rayDir) ? promote(usable, dorsal) : usable
}

function isScapulaHit(hit: Intersection) {
  const id = atlasOf(hit).atlasId
  return Boolean(id && id.startsWith('scapula-'))
}

function isDeepBackGel(hit: Intersection) {
  const id = atlasOf(hit).atlasId
  return id === 'trapezius' || id === 'latissimus' || id === 'erector-spinae'
}

function isVertebraId(id?: string) {
  return Boolean(id && /(vertebra|sacrum)/.test(id))
}

/** Blade / fossa — not the midline spinous process and not the lateral cuff. */
function scapulaZone(point?: { x: number; y: number; z: number } | null) {
  if (!point) return false
  if (point.y < 1.18 || point.y > 1.52) return false
  if (Math.abs(point.x) < 0.05) return false
  if (Math.abs(point.x) > 0.22) return false
  return point.z < 0.08
}

function isScapulaNeighbor(id?: string) {
  return Boolean(
    id &&
      (isRibId(id) ||
        isVertebraId(id) ||
        id === 'latissimus' ||
        id === 'trapezius' ||
        id === 'erector-spinae'),
  )
}

function scapulaIdForPoint(point?: { x: number } | null) {
  return point && point.x > 0 ? 'scapula-right' : 'scapula-left'
}

/** Rib / T-spine / lats in the scapular blade remap when the scapula mesh missed. */
function scapulaWinsOver(
  id: string | undefined,
  point?: { x: number; y: number; z: number } | null,
  cameraPos?: CameraPos,
  rayDir?: RayDir | null,
) {
  if (!viewingBackStrict(cameraPos, rayDir)) return false
  return Boolean(id && isScapulaNeighbor(id) && scapulaZone(point))
}

function isRibId(id?: string) {
  return Boolean(id && /rib/.test(id))
}

function isChestBone(id?: string) {
  return Boolean(id && (isRibId(id) || /^(body-of-sternum|manubrium|xiphoid-process)$/.test(id)))
}

/** Sternum / front chest — not the lateral cuff compartment. */
function pecZone(point?: { x: number; y: number; z: number } | null) {
  if (!point) return false
  if (point.y < 1.18 || point.y > 1.5) return false
  if (Math.abs(point.x) > 0.15) return false
  return point.z >= 0.1
}

function pecStealer(id?: string) {
  return Boolean(
    id && (id === 'deltoids' || id === 'rotator-cuff' || id === 'abdominal-wall' || isChestBone(id)),
  )
}

function pecWinsOver(
  id: string | undefined,
  point?: { x: number; y: number; z: number } | null,
  cameraPos?: CameraPos,
  rayDir?: RayDir | null,
  muscleHot = true,
) {
  if (!muscleHot || viewingBack(cameraPos, rayDir, point)) return false
  return Boolean(id && pecStealer(id) && pecZone(point))
}

function isLimbHit(hit: Intersection) {
  const part = structureOf(hit)
  return Boolean(part && isLimbPart(part))
}

/** Back-orbit trunk picks only — a medial-thigh or side-cuff click must not use this. */
function viewingDorsalTrunk(
  cameraPos?: CameraPos,
  rayDir?: RayDir | null,
  first?: Intersection,
) {
  if (first && isLimbHit(first)) return false
  return viewingBackStrict(cameraPos, rayDir)
}

function isScapulaStealer(id?: string) {
  if (!id) return false
  return (
    isRibId(id) ||
    SHOULDER_STEAL.has(id) ||
    id === 'pectoralis' ||
    id === 'abdominal-wall'
  )
}

function preferDorsalTarget(hit: Intersection) {
  return isScapulaHit(hit) || isDeepBackGel(hit)
}

/**
 * Deltoids / cuff are not ventral, so pecs-skip leaves them first on a back
 * scapula click. Promote scapula (not a nearby rib) or trap/lat/erector.
 */
export function preferDorsalOverShoulderGel(
  usable: Intersection[],
  cameraPos?: CameraPos,
  rayDir?: RayDir | null,
): Intersection[] {
  if (usable.length < 2) return usable
  const first = usable[0]
  if (!viewingDorsalTrunk(cameraPos, rayDir, first)) return usable
  const firstId = atlasOf(first).atlasId
  const scap = usable.find(isScapulaHit)
  if (scap && !isScapulaHit(first) && isScapulaNeighbor(firstId)) {
    return promote(usable, scap)
  }
  if (scap && !isScapulaHit(first) && scapulaZone(first.point)) {
    return promote(usable, scap)
  }
  if (isScapulaHit(first) || isDeepBackGel(first)) return usable
  if (!isScapulaStealer(firstId) && !isScapulaNeighbor(firstId)) return usable
  const deep = usable.find(isDeepBackGel)
  return deep ? promote(usable, deep) : usable
}

function gapBehind(first: Intersection, later: Intersection) {
  return later.distance - first.distance
}

function cuffZone(point?: { x: number; y: number; z: number } | null) {
  if (!point) return false
  if (point.y < 1.3 || point.y > 1.48) return false
  const ax = Math.abs(point.x)
  if (ax < 0.09) return false
  if (ax < 0.14 && point.z > 0.08) return false
  if (ax > 0.235) return false
  return true
}

/** Wrap / side deltoid that still sits on the cuff, not the distal cap. */
function cuffWrapZone(point?: { x: number; y: number; z: number } | null) {
  if (!point) return false
  if (point.y < 1.32 || point.y > 1.46) return false
  const ax = Math.abs(point.x)
  if (ax < 0.1 || ax > 0.245) return false
  return point.z < 0.1
}

function isCuffBoneStealer(id?: string) {
  return Boolean(
    id &&
      (/^humerus-/.test(id) ||
        /^clavicle-/.test(id) ||
        id.startsWith('scapula-') ||
        isVertebraId(id) ||
        isRibId(id)),
  )
}

/** Proximal humerus / T-spine process in the shoulder compartment. */
function cuffBoneZone(point?: { x: number; y: number; z: number } | null) {
  if (!point) return false
  if (point.y < 1.3 || point.y > 1.48) return false
  const ax = Math.abs(point.x)
  if (ax < 0.08 || ax > 0.26) return false
  if (ax < 0.14 && point.z > 0.08) return false
  return true
}

/**
 * Wrap / lateral proximal humerus — includes the flint miss just outside
 * cuffBoneZone (|x| > 0.26 or y just under 1.3). Same-side mid-arm (y < 1.20) stays shaft.
 */
function wrapCuffBone(point?: { x: number; y: number; z: number } | null) {
  if (!point) return false
  if (point.y < 1.2 || point.y > 1.55) return false
  const ax = Math.abs(point.x)
  if (ax < 0.04 || ax > 0.4) return false
  return point.z >= -0.28 && point.z <= 0.32
}

/** Wrap +X through the thorax onto the left shaft — flint named Humerus · left. */
function wrapFarHumerus(
  id: string | undefined,
  point?: { x: number; y: number; z: number } | null,
  cameraPos?: CameraPos,
) {
  if (!cameraPos || !wrapShoulderView(cameraPos) || !point || !id || !/^humerus-/.test(id)) {
    return false
  }
  if (point.y < 1.05 || point.y > 1.58) return false
  if (Math.abs(point.x) < 0.04) return false
  return Math.sign(point.x) !== Math.sign(cameraPos.x)
}

function cuffWinsOver(
  id: string | undefined,
  point?: { x: number; y: number; z: number } | null,
  cameraPos?: CameraPos,
  rayDir?: RayDir | null,
) {
  if (viewingBackStrict(cameraPos, rayDir)) return false
  if (!id) return false
  if (CUFF_NEIGHBORS.has(id) && (cuffZone(point) || cuffWrapZone(point))) return true
  if (isCuffBoneStealer(id) && cuffBoneZone(point)) return true
  // Wrap rays often miss thin cuff gel and strike the scapular spine at |x|~0.06.
  if (
    wrapShoulderView(cameraPos) &&
    id.startsWith('scapula-') &&
    point &&
    point.y >= 1.22 &&
    point.y <= 1.52
  ) {
    return true
  }
  // Flint: wrap/lateral canvas struck proximal humerus (or a neighbor gel just
  // outside cuffBoneZone) and named Humerus. Remap wrap-only — front shaft
  // and full-back scapula stay on their locked paths.
  if (wrapShoulderView(cameraPos) && wrapCuffBone(point)) {
    if (/^humerus-/.test(id) || CUFF_NEIGHBORS.has(id)) return true
  }
  if (wrapFarHumerus(id, point, cameraPos)) return true
  return false
}

function adductorWinsOver(
  id: string | undefined,
  point?: { x: number; y: number; z: number } | null,
) {
  return Boolean(id && ADDUCTOR_NEIGHBORS.has(id) && adductorZone(point))
}

function adductorZone(point?: { x: number; y: number; z: number } | null) {
  if (!point) return false
  if (point.y < 0.42 || point.y > 1.0) return false
  const ax = Math.abs(point.x)
  if (ax >= 0.17) return false
  if (point.z < -0.02) return false
  if (point.z >= 0.14 && ax >= 0.08) return false
  if (point.z >= 0.165) return false
  return true
}

/** Front chest: pecs beat cuff / delts / ribs / sternum. Dorsal rules stay separate. */
export function preferPecsOnFrontChest(
  usable: Intersection[],
  cameraPos?: CameraPos,
  rayDir?: RayDir | null,
): Intersection[] {
  if (usable.length < 2) return usable
  const first = usable[0]
  if (viewingBack(cameraPos, rayDir, first.point)) return usable
  const firstId = atlasOf(first).atlasId
  if (!pecStealer(firstId) || !pecZone(first.point)) return usable
  const pec = usable.find((h) => atlasOf(h).atlasId === 'pectoralis')
  return pec ? promote(usable, pec) : usable
}

/**
 * Soft / undersized M2 bellies lose distance sort to fatter M1 neighbors.
 * When the click is in the named compartment, the named group wins.
 */
export function preferNamedBelly(
  usable: Intersection[],
  cameraPos?: CameraPos,
  rayDir?: RayDir | null,
): Intersection[] {
  if (usable.length < 2) return usable
  const first = usable[0]
  const firstId = atlasOf(first).atlasId
  if (!firstId) return usable

  if (!viewingBackStrict(cameraPos, rayDir) && CUFF_NEIGHBORS.has(firstId)) {
    const cuff = usable.find((h) => atlasOf(h).atlasId === 'rotator-cuff')
    if (
      cuff &&
      gapBehind(first, cuff) <= NAMED_BELLY_WINDOW &&
      (cuffZone(first.point ?? cuff.point) || cuffWrapZone(first.point ?? cuff.point))
    ) {
      return promote(usable, cuff)
    }
  }
  if (!viewingBackStrict(cameraPos, rayDir) && isCuffBoneStealer(firstId)) {
    const cuff = usable.find((h) => atlasOf(h).atlasId === 'rotator-cuff')
    const zone =
      cuffZone(first.point) ||
      cuffBoneZone(first.point) ||
      cuffZone(cuff?.point) ||
      (wrapShoulderView(cameraPos) && wrapCuffBone(first.point)) ||
      wrapFarHumerus(firstId, first.point, cameraPos)
    if (cuff && gapBehind(first, cuff) <= NAMED_BELLY_WINDOW && zone) {
      return promote(usable, cuff)
    }
  }
  if (ADDUCTOR_NEIGHBORS.has(firstId)) {
    const add = usable.find((h) => atlasOf(h).atlasId === 'hip-adductors')
    if (add && gapBehind(first, add) <= NAMED_BELLY_WINDOW && adductorZone(first.point ?? add.point)) {
      return promote(usable, add)
    }
  }
  return usable
}

export function resolveAtlasHits(
  hits: Intersection[],
  hotSystems?: readonly SystemId[],
  cameraPos?: CameraPos,
  rayDir?: RayDir | null,
): Intersection[] {
  if (hits.length === 0) return hits
  const hot = hotSystems ? new Set(hotSystems) : null
  const usable = hits.filter((h) => {
    const u = atlasOf(h)
    if (u.rim || u.skipPick) return false
    if (hot && u.atlasSystem && !hot.has(u.atlasSystem)) return false
    if (h.object && !isWorldVisible(h.object)) return false
    if (skipMuscleOnBackRay(u.atlasId, cameraPos, rayDir, h.point, u.source)) return false
    return true
  })
  if (usable.length === 0) return []
  if (usable.length === 1) return usable
  if (!isInterimHit(usable[0])) return usable

  const first = usable[0]
  if (systemOf(first) === 'muscle' && TRANSLUCENT_MUSCLE && isInterimHit(first)) {
    let bone = usable.find((h) => systemOf(h) === 'skeleton')
    if (
      bone &&
      viewingDorsalTrunk(cameraPos, rayDir, first) &&
      isRibId(atlasOf(bone).atlasId)
    ) {
      const scap = usable.find(isScapulaHit)
      if (scap && gapBehind(first, scap) <= LOOK_BEHIND) bone = scap
    }
    if (
      bone &&
      atlasOf(first).atlasId === 'pectoralis' &&
      isChestBone(atlasOf(bone).atlasId) &&
      !viewingBack(cameraPos, rayDir, first.point)
    ) {
      bone = undefined
    }
    if (
      bone &&
      !viewingBackStrict(cameraPos, rayDir) &&
      isCuffBoneStealer(atlasOf(bone).atlasId) &&
      (cuffZone(first.point) ||
        cuffBoneZone(first.point) ||
        (wrapShoulderView(cameraPos) && wrapCuffBone(first.point)) ||
        wrapFarHumerus(atlasOf(bone).atlasId, first.point, cameraPos) ||
        wrapFarHumerus(atlasOf(bone).atlasId, bone.point, cameraPos))
    ) {
      bone = undefined
    }
    if (bone) {
      const gap = bone.distance - first.distance
      if (gap >= 0 && gap <= LOOK_BEHIND && gap <= GEL_SHELL) {
        return preferNamedBelly(
          preferPecsOnFrontChest(
            preferDorsalOverShoulderGel(
              preferDorsalOnBackView(promote(usable, bone), cameraPos, rayDir),
              cameraPos,
              rayDir,
            ),
            cameraPos,
            rayDir,
          ),
          cameraPos,
          rayDir,
        )
      }
    }
  }
  return preferNamedBelly(
    preferPecsOnFrontChest(
      preferDorsalOverShoulderGel(preferDorsalOnBackView(usable, cameraPos, rayDir), cameraPos, rayDir),
      cameraPos,
      rayDir,
    ),
    cameraPos,
    rayDir,
  )
}

/** Id to select after R3F (or a raw Three) hit list is priority-sorted. */
function noteQaPick(
  picked: string | undefined,
  first: Intersection | undefined,
  cameraPos?: CameraPos,
  rayDir?: RayDir | null,
) {
  if (typeof window === 'undefined') return
  const w = window as Window & { __atlasQA?: { last?: unknown } }
  if (!w.__atlasQA) return
  const pt = first?.point
  w.__atlasQA.last = {
    picked,
    firstId: first ? atlasOf(first).atlasId : undefined,
    point: pt ? { x: pt.x, y: pt.y, z: pt.z } : undefined,
    camera: cameraPos,
    dir: rayDir,
  }
}

export function pickAtlasId(
  hits: Intersection[],
  hotSystems?: readonly SystemId[],
  cameraPos?: CameraPos,
  rayDir?: RayDir | null,
): string | undefined {
  const muscleHot = !hotSystems || hotSystems.includes('muscle')
  const resolved = resolveAtlasHits(hits, hotSystems, cameraPos, rayDir)
  let picked: string | undefined
  for (const h of resolved) {
    const id = atlasOf(h).atlasId
    if (isInterimHit(h)) {
      if (cuffWinsOver(id, h.point, cameraPos, rayDir)) {
        picked = 'rotator-cuff'
        break
      }
      if (adductorWinsOver(id, h.point)) {
        picked = 'hip-adductors'
        break
      }
      if (pecWinsOver(id, h.point, cameraPos, rayDir, muscleHot)) {
        picked = 'pectoralis'
        break
      }
      if (scapulaWinsOver(id, h.point, cameraPos, rayDir)) {
        picked = scapulaIdForPoint(h.point)
        break
      }
    }
    if (id) {
      picked = id
      break
    }
  }
  noteQaPick(picked, resolved[0], cameraPos, rayDir)
  return picked
}

/** Mesh onPointerUp must not fall back to pecs on a back-view click. */
export function pickAtlasIdOrSelf(
  hits: Intersection[],
  hotSystems: readonly SystemId[] | undefined,
  cameraPos: CameraPos | undefined,
  rayDir: RayDir | null | undefined,
  selfId: string | undefined,
): string | undefined {
  const picked = pickAtlasId(hits, hotSystems, cameraPos, rayDir)
  if (picked) return picked
  const selfSource = hits[0] ? hitSource(hits[0]) : undefined
  if (!selfId || skipMuscleOnBackRay(selfId, cameraPos, rayDir, hits[0]?.point, selfSource)) {
    return undefined
  }
  if (isInterimId(selfId, selfSource)) {
    if (cuffWinsOver(selfId, hits[0]?.point, cameraPos, rayDir)) return 'rotator-cuff'
    if (adductorWinsOver(selfId, hits[0]?.point)) return 'hip-adductors'
    const muscleHot = !hotSystems || hotSystems.includes('muscle')
    if (pecWinsOver(selfId, hits[0]?.point, cameraPos, rayDir, muscleHot)) return 'pectoralis'
    if (scapulaWinsOver(selfId, hits[0]?.point, cameraPos, rayDir)) {
      return scapulaIdForPoint(hits[0]?.point)
    }
  }
  return selfId
}
