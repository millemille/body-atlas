import { Group, Mesh, type Intersection, type Object3D, type Raycaster } from 'three'
import { skipMuscleOnBackRay } from './pickPriority'

/**
 * Three.js r185 walks children even when a parent is invisible.
 * Returning false from raycast is the only way to stop that walk.
 */
export function skipRaycast() {
  return false
}

/** Always pass a function — R3F applyProps ignores `raycast={undefined}`. */
export function meshRaycast(
  this: Mesh,
  raycaster: Raycaster,
  intersects: Intersection[],
) {
  return Mesh.prototype.raycast.call(this, raycaster, intersects)
}

/** Anterior gels do not register on a back-facing ray — scapula / erectors can. */
export function muscleRaycast(
  this: Mesh,
  raycaster: Raycaster,
  intersects: Intersection[],
) {
  const id = this.userData.atlasId as string | undefined
  const source = this.userData.source as 'bodyparts3d' | 'interim' | undefined
  if (skipMuscleOnBackRay(id, raycaster.ray.origin, raycaster.ray.direction, undefined, source)) {
    return
  }
  return Mesh.prototype.raycast.call(this, raycaster, intersects)
}

export function groupRaycast(
  this: Group,
  raycaster: Raycaster,
  intersects: Intersection[],
) {
  return Group.prototype.raycast.call(this, raycaster, intersects)
}

export function raycastFor(
  kind: 'mesh' | 'group',
  pickable: boolean,
  muscle = false,
) {
  if (!pickable) return skipRaycast
  if (kind === 'mesh' && muscle) return muscleRaycast
  return kind === 'mesh' ? meshRaycast : groupRaycast
}

export function markPickable(
  obj: Object3D | null,
  pickable: boolean,
  muscle = false,
) {
  if (!obj) return
  obj.userData.skipPick = !pickable
  obj.raycast = raycastFor(obj instanceof Mesh ? 'mesh' : 'group', pickable, muscle)
}
