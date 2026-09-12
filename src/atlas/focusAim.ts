import { Box3, Mesh, Sphere, Vector3, type Object3D, type PerspectiveCamera } from 'three'
import type { Structure } from './types'

/** Approach from the home-camera side so Focus feels like a dolly, not a cut. */
export const FOCUS_VIEW = new Vector3(0.52, 0.16, 0.84).normalize()

export const FOCUS_MIN_DISTANCE = 0.1
export const EXPLORE_MIN_DISTANCE = 1.2

/** Compact bones (sternum, xiphoid, T12). A whole-body sphere is ignored. */
export const FOCUS_RADIUS_CAP = 0.09

/** Distal bones: heel / phalanx must sit behind this near plane. */
export const FOCUS_NEAR = 0.012

/**
 * Safe Focus dolly — catalog look-at only.
 * Not snapOrbitToPose: no setScale, no min=max, no live-sphere steal.
 * 0.38m left the calcaneus at ~39% of a 38° frame (centered, not fill).
 * 0.18m fills the heel ~82% without crossing the near plane.
 */
export const SAFE_DOLLY_DISTANCE = 0.18
export const SAFE_DOLLY_LONG = 0.32
/** Muscle groups are large; stay well outside heel-fill. */
export const MUSCLE_DOLLY_DISTANCE = 0.72
export const SAFE_DOLLY_NEAR = 0.05
export const SAFE_ORBIT_MIN = 0.08
export const SAFE_ORBIT_MAX = 6

/** Live sphere may steal the look-at only when it sits on this bone. */
export const LIVE_AIM_SLACK = 0.08

export function focusDistanceForRadius(radius: number, fovDeg: number, near = FOCUS_NEAR) {
  const r = Math.min(Math.max(radius, 0.012), FOCUS_RADIUS_CAP)
  const fov = (fovDeg * Math.PI) / 180
  const framed = Math.max((r / Math.sin(fov / 2)) * 1.12, FOCUS_MIN_DISTANCE)
  // Near-clipping the calcaneus leaves a hole; the pelvis then fills the frame.
  return Math.max(framed, near + r + 0.045)
}

export function catalogDollyDistance(selected: Structure) {
  if (selected.system === 'muscle') return MUSCLE_DOLLY_DISTANCE
  const distal =
    selected.region === 'Foot' ||
    selected.region === 'Hand' ||
    selected.region === 'Head' ||
    selected.position[1] < 0.28
  return distal ? SAFE_DOLLY_DISTANCE : SAFE_DOLLY_LONG
}

/** Catalog look-at dolly. Camera stays outside the bone; kit stays in frame. */
export function catalogDolly(selected: Structure): {
  position: Vector3
  target: Vector3
  distance: number
} {
  const target = new Vector3(
    selected.position[0],
    selected.position[1],
    selected.position[2],
  )
  const distance = catalogDollyDistance(selected)
  return {
    position: target.clone().addScaledVector(FOCUS_VIEW, distance),
    target,
    distance,
  }
}

export function focusPose(
  target: Vector3,
  radius: number,
  fovDeg: number,
): { position: Vector3; target: Vector3; distance: number } {
  const distance = focusDistanceForRadius(radius, fovDeg)
  return {
    position: target.clone().addScaledVector(FOCUS_VIEW, distance),
    target: target.clone(),
    distance,
  }
}

export function findAtlasMesh(root: Object3D, id: string): Mesh | null {
  let found: Mesh | null = null
  root.traverse((obj) => {
    if (found) return
    if (obj instanceof Mesh && obj.userData.atlasId === id && !obj.userData.rim) {
      found = obj
    }
  })
  return found
}

export function worldSphereFor(obj: Object3D): Sphere {
  obj.updateWorldMatrix(true, true)
  if (obj instanceof Mesh && obj.geometry) {
    if (!obj.geometry.boundingSphere) obj.geometry.computeBoundingSphere()
    if (obj.geometry.boundingSphere) {
      const sphere = obj.geometry.boundingSphere.clone()
      sphere.applyMatrix4(obj.matrixWorld)
      return sphere
    }
  }
  const box = new Box3().setFromObject(obj)
  const sphere = new Sphere()
  if (box.isEmpty()) {
    obj.getWorldPosition(sphere.center)
    sphere.radius = 0.04
    return sphere
  }
  box.getBoundingSphere(sphere)
  return sphere
}

export const DISTAL_FOCUS_REGIONS = new Set(['Foot', 'Hand', 'Head'])

export function isDistalBone(region: string, catalog: Vector3) {
  return (
    DISTAL_FOCUS_REGIONS.has(region) ||
    catalog.y < 0.28 ||
    catalog.y > 1.42 ||
    Math.abs(catalog.x) > 0.25
  )
}

/**
 * Live mesh sphere wins only when it is on this bone.
 * A pelvis-centered or identity-matrix (origin) sphere is rejected.
 */
export function aimPointForBone(
  catalog: Vector3,
  region: string,
  meshWorld: Vector3 | null,
  sphereCenter: Vector3 | null,
): Vector3 {
  const distal = isDistalBone(region, catalog)
  const slack = distal ? LIVE_AIM_SLACK : 0.2
  if (sphereCenter && sphereCenter.distanceTo(catalog) < slack) return sphereCenter.clone()
  if (meshWorld && meshWorld.distanceTo(catalog) < slack) return meshWorld.clone()
  return catalog.clone()
}

export function poseForStructure(
  selected: Structure,
  scene: Object3D,
  camera: PerspectiveCamera,
) {
  const catalog = new Vector3(
    selected.position[0],
    selected.position[1],
    selected.position[2],
  )
  const distal = isDistalBone(selected.region, catalog)
  const mesh = findAtlasMesh(scene, selected.id)
  if (mesh) {
    const sphere = worldSphereFor(mesh)
    const meshPos = new Vector3()
    mesh.getWorldPosition(meshPos)
    const target = aimPointForBone(catalog, selected.region, meshPos, sphere.center)
    const onBone = sphere.center.distanceTo(catalog) < (distal ? LIVE_AIM_SLACK : 0.2)
    const liveRadius = onBone ? sphere.radius : 0.034
    const radius = distal ? Math.min(liveRadius, 0.034) : liveRadius
    return focusPose(target, radius, camera.fov)
  }
  return focusPose(catalog, distal ? 0.034 : selected.focusDistance * 0.14, camera.fov)
}

