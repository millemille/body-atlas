import { Vector3 } from 'three'
import type { Structure } from './types'
import { SAFE_DOLLY_DISTANCE } from './focusAim'

export function deferLeanFor(part: Structure | null | undefined) {
  return part?.system === 'muscle'
}

/** Body faces +Z. Centroids just behind this plane read as dorsal (scapula ~0.03). */
export const CORONAL_Z = 0.08
/** Inside this band the camera is a side view — do not yaw 180°. */
export const SIDE_VIEW_Z = 0.45
/** How far to swing azimuth toward the object's AP hemisphere (not a hard cut). */
export const HEMISPHERE_YAW_MIX = 0.72

const DORSAL_ID =
  /^(scapula-|occipital$|sacrum$|trapezius$|latissimus$|gluteus$|erector-spinae$)/
const VENTRAL_ID = /^(body-of-sternum|manubrium|xiphoid-process|pectoralis|abdominal-wall)$/
const LIMB_REGION = /limb|foot|hand|arm|leg|thigh/i
const DORSAL_REGION = /spine|nuchal|posterior trunk|posterior pelvis|deep back/i
const tmp = new Vector3()

export function isLimbPart(part: Structure) {
  if (LIMB_REGION.test(part.region)) return true
  return /humerus|radius|ulna|femur|tibia|fibula|patella|carpal|metacarpal|phalanx|metatarsal|tarsal|calcaneus|navicular/.test(
    part.id,
  )
}

export function isDorsalStructure(part: Structure) {
  if (isLimbPart(part)) return false
  if (DORSAL_ID.test(part.id)) return true
  if (DORSAL_REGION.test(part.region)) return true
  if (/vertebra/i.test(part.kind)) return true
  return part.position[2] < CORONAL_Z - 0.03
}

export function isVentralStructure(part: Structure) {
  if (isLimbPart(part)) return false
  if (VENTRAL_ID.test(part.id)) return true
  return /anterior/i.test(part.region) || part.position[2] > CORONAL_Z + 0.06
}

export function cameraHemisphere(pos: { z: number }): 'front' | 'back' | 'side' {
  if (pos.z > SIDE_VIEW_Z) return 'front'
  if (pos.z < -0.2) return 'back'
  return 'side'
}

/** True when the stash view ray would dolly through the body toward the wrong AP side. */
export function needsHemisphereLean(part: Structure, explorePos: Vector3) {
  const hemi = cameraHemisphere(explorePos)
  if (hemi === 'side') return false
  if (isDorsalStructure(part) && hemi === 'front') return true
  if (isVentralStructure(part) && hemi === 'back') return true
  return false
}

/** Gentler than Focus (0.18m heel-fill). A lean-in, not a heel-fill. */
export const LEAN_DISTANCE_SCALE = 0.66
export const LEAN_MIN_DISTANCE = 1.5
export const LEAN_TARGET_MIX = 0.1
export const LEAN_MS = 320
/** First muscle pick paints + opens the card; lean waits this many frames. */
export const MUSCLE_LEAN_DELAY_FRAMES = 3

/** Never closer than this — well above catalog dolly (0.18m). */
export const LEAN_HARD_FLOOR = Math.max(SAFE_DOLLY_DISTANCE * 3.2, 1.2)

export function easeOutCubic(t: number) {
  const x = Math.min(1, Math.max(0, t))
  return 1 - (1 - x) ** 3
}

function wrapPi(a: number) {
  let x = a
  while (x > Math.PI) x -= Math.PI * 2
  while (x < -Math.PI) x += Math.PI * 2
  return x
}

/**
 * Yaw toward the object's AP hemisphere and dolly in.
 * Keeps current elevation / some azimuth so it is a lean, not a 180° cut.
 */
export function hemisphereLean(
  selected: Structure,
  explorePos: Vector3,
  exploreTarget: Vector3,
  catalog: Vector3,
): { position: Vector3; target: Vector3; distance: number } {
  const wantBack = isDorsalStructure(selected)
  const pivot = new Vector3(0, catalog.y, CORONAL_Z)
  const rel = explorePos.clone().sub(pivot)
  const radius = Math.max(Math.hypot(rel.x, rel.z), 0.8)
  const curAz = Math.atan2(rel.x, rel.z)
  const targetAz = wantBack ? Math.PI : 0
  const az = curAz + wrapPi(targetAz - curAz) * HEMISPHERE_YAW_MIX
  const nextR = Math.max(radius * LEAN_DISTANCE_SCALE, LEAN_MIN_DISTANCE)
  const position = new Vector3(
    pivot.x + Math.sin(az) * nextR,
    explorePos.y + (catalog.y + 0.1 - explorePos.y) * 0.18,
    pivot.z + Math.cos(az) * nextR,
  )
  const toBone = position.distanceTo(catalog)
  if (toBone < LEAN_HARD_FLOOR) {
    tmp.copy(position).sub(catalog).normalize()
    position.copy(catalog).addScaledVector(tmp, LEAN_HARD_FLOOR)
  }
  const target = exploreTarget.clone().lerp(catalog, LEAN_TARGET_MIX)
  return { position, target, distance: position.distanceTo(target) }
}

/**
 * Dolly in along the current view ray. Look-at eases a little toward the bone.
 * Orbit radius and camera-to-bone both drop vs the pre-select stash — never increase.
 * Back-of-body picks from a front camera yaw toward the posterior hemisphere
 * instead of sliding down the home/front ray into the sternum.
 */
export function selectLean(
  selected: Structure,
  explorePos: Vector3,
  exploreTarget: Vector3,
): { position: Vector3; target: Vector3; distance: number } {
  const catalog = new Vector3(
    selected.position[0],
    selected.position[1],
    selected.position[2],
  )
  if (needsHemisphereLean(selected, explorePos)) {
    return hemisphereLean(selected, explorePos, exploreTarget, catalog)
  }

  const offset = explorePos.clone().sub(exploreTarget)
  const stashDist = Math.max(offset.length(), 0.01)
  const viewDir = offset.normalize()

  const target = exploreTarget.clone().lerp(catalog, LEAN_TARGET_MIX)
  const distance = leanOrbitDistance(stashDist)
  // From the *stashed* look-at so the camera dollies in — it does not truck with the new target.
  const position = exploreTarget.clone().addScaledVector(viewDir, distance)

  const stashToBone = explorePos.distanceTo(catalog)
  if (position.distanceTo(catalog) >= stashToBone - 1e-6) {
    const toward = catalog.clone().sub(explorePos)
    const span = toward.length()
    if (span > 0.05) {
      const pull = Math.min(span * (1 - LEAN_DISTANCE_SCALE), Math.max(0, span - LEAN_HARD_FLOOR))
      if (pull > 0.02) {
        position.copy(explorePos).addScaledVector(toward.normalize(), pull)
      }
    }
  }

  return { position, target, distance: position.distanceTo(target) }
}

/** Always shorter than stash. Floor stays well above Focus. */
export function leanOrbitDistance(stashDist: number) {
  const stash = Math.max(stashDist, 0.01)
  const scaled = stash * LEAN_DISTANCE_SCALE
  const upper = stash * 0.92
  if (stash > LEAN_MIN_DISTANCE) {
    return Math.min(Math.max(scaled, LEAN_MIN_DISTANCE), upper)
  }
  return Math.min(Math.max(scaled, LEAN_HARD_FLOOR), upper)
}

export function leanIsGentlerThanFocus(distance: number) {
  return distance > SAFE_DOLLY_DISTANCE * 3 && distance >= LEAN_HARD_FLOOR * 0.95
}
