import { Vector3 } from 'three'

export const HOME_POS = new Vector3(1.85, 1.18, 3.35)
export const HOME_TARGET = new Vector3(0, 0.95, 0)
export const HOME_CAMERA = {
  position: [HOME_POS.x, HOME_POS.y, HOME_POS.z] as [number, number, number],
  fov: 38,
  near: 0.02,
  far: 60,
}

/** Standing figure — not a chest box. Feet, hands, and skull must stay reachable. */
export const ORBIT_TARGET_BOUNDS = {
  x: [-0.95, 0.95] as const,
  y: [-0.08, 2.05] as const,
  z: [-0.55, 0.55] as const,
}
