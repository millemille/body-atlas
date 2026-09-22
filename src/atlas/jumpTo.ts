import { Spherical, Vector3 } from 'three'
import { HOME_CAMERA } from './cameraHome'
import { FOCUS_MIN_DISTANCE, FOCUS_VIEW, catalogDolly } from './focusAim'
import { getStructure } from './structures'
import type { Structure } from './types'

export const JUMP_MS = 820

export const JUMP_REGION_IDS = [
  'head',
  'thorax',
  'abdomen',
  'back',
  'left-arm',
  'right-arm',
  'left-leg',
  'right-leg',
] as const

export type JumpRegionId = (typeof JUMP_REGION_IDS)[number]

export type JumpRegion = {
  id: JumpRegionId
  label: string
  leafId: string
  radius: number
}

/** Eight Jump to regions. Radii frame a region box, not a catalog leaf fill. */
export const JUMP_REGIONS: readonly JumpRegion[] = [
  { id: 'head', label: 'Head', leafId: 'occipital', radius: 0.12 },
  { id: 'thorax', label: 'Thorax', leafId: 'body-of-sternum', radius: 0.19 },
  { id: 'abdomen', label: 'Abdomen', leafId: 'fifth-lumbar-vertebra', radius: 0.2 },
  { id: 'back', label: 'Back', leafId: 'seventh-thoracic-vertebra', radius: 0.18 },
  { id: 'left-arm', label: 'Left arm', leafId: 'humerus-left', radius: 0.14 },
  { id: 'right-arm', label: 'Right arm', leafId: 'humerus-right', radius: 0.14 },
  { id: 'left-leg', label: 'Left leg', leafId: 'femur-left', radius: 0.21 },
  { id: 'right-leg', label: 'Right leg', leafId: 'femur-right', radius: 0.21 },
]

export const JUMP_BY_ID = Object.fromEntries(JUMP_REGIONS.map((r) => [r.id, r])) as Record<
  JumpRegionId,
  JumpRegion
>

export type RegionFrame = {
  position: Vector3
  target: Vector3
  distance: number
  radius: number
  leafId: string
  regionId: JumpRegionId
}

/** Uncapped sphere fill — do not reuse FOCUS_RADIUS_CAP (that misfames a region as a bone). */
export function regionDollyDistance(radius: number, fovDeg = HOME_CAMERA.fov) {
  const r = Math.max(radius, 0.012)
  const fov = (fovDeg * Math.PI) / 180
  return Math.max((r / Math.sin(fov / 2)) * 1.12, FOCUS_MIN_DISTANCE)
}

export function viewForJump(id: JumpRegionId): Vector3 {
  if (id === 'back') return new Vector3(0.52, 0.16, -0.84).normalize()
  if (id === 'left-arm' || id === 'left-leg') return new Vector3(-0.52, 0.16, 0.84).normalize()
  if (id === 'right-arm' || id === 'right-leg') return new Vector3(0.52, 0.16, 0.84).normalize()
  return FOCUS_VIEW.clone()
}

export function regionDolly(region: JumpRegion, leaf: Structure = leafFor(region)): RegionFrame {
  const target = new Vector3(leaf.position[0], leaf.position[1], leaf.position[2])
  const distance = regionDollyDistance(region.radius)
  const view = viewForJump(region.id)
  return {
    position: target.clone().addScaledVector(view, distance),
    target,
    distance,
    radius: region.radius,
    leafId: region.leafId,
    regionId: region.id,
  }
}

export function leafFor(region: JumpRegion): Structure {
  const leaf = getStructure(region.leafId)
  if (!leaf) throw new Error(`Jump to missing leaf ${region.leafId}`)
  return leaf
}

export function regionFrameFor(id: JumpRegionId): RegionFrame {
  return regionDolly(JUMP_BY_ID[id])
}

/** Catalog leaf dolly is a tighter snap; Jump must stay on the larger region box. */
export function regionIsGentlerThanCatalog(region: JumpRegion, leaf = leafFor(region)) {
  return regionDolly(region, leaf).distance > catalogDolly(leaf).distance + 0.04
}

const fromSpherical = new Spherical()
const toSpherical = new Spherical()
const arcSpherical = new Spherical()
const arcOffset = new Vector3()

/**
 * 820ms region dolly samples this with easeOutCubic.
 * Offset is a spherical arc so the camera stays outside the body instead of
 * cutting the chord between the two frames.
 */
export function easeRegionPose(
  fromPos: Vector3,
  fromTarget: Vector3,
  toPos: Vector3,
  toTarget: Vector3,
  t: number,
  outPos: Vector3,
  outTarget: Vector3,
) {
  const e = t <= 0 ? 0 : t >= 1 ? 1 : t
  outTarget.lerpVectors(fromTarget, toTarget, e)
  fromSpherical.setFromVector3(arcOffset.copy(fromPos).sub(fromTarget))
  toSpherical.setFromVector3(arcOffset.copy(toPos).sub(toTarget))
  let dTheta = toSpherical.theta - fromSpherical.theta
  if (dTheta > Math.PI) dTheta -= Math.PI * 2
  else if (dTheta < -Math.PI) dTheta += Math.PI * 2
  arcSpherical.radius = fromSpherical.radius + (toSpherical.radius - fromSpherical.radius) * e
  arcSpherical.phi = fromSpherical.phi + (toSpherical.phi - fromSpherical.phi) * e
  arcSpherical.theta = fromSpherical.theta + dTheta * e
  arcOffset.setFromSpherical(arcSpherical)
  outPos.copy(outTarget).add(arcOffset)
}
