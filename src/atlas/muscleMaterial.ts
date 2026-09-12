import { FrontSide, MeshStandardMaterial } from 'three'
import { BASE_OPACITY, SABRINA } from './colors'
import { MUSCLE_ENV_MAP, MUSCLE_ROUGHNESS } from './studioLook'

let template: MeshStandardMaterial | null = null

/**
 * One MeshStandard program for every muscle clone.
 * Cove compiled a unique transparent + DoubleSide + roughnessMap material
 * per belly — that shader spike matches Chrome Error code 9 (GPU process death).
 */
export function getMuscleMaterialTemplate() {
  if (!template) {
    template = new MeshStandardMaterial({
      color: SABRINA.muscleRose,
      roughness: MUSCLE_ROUGHNESS,
      metalness: 0,
      emissive: SABRINA.muscleRose,
      emissiveIntensity: 0.018,
      envMapIntensity: MUSCLE_ENV_MAP,
      transparent: true,
      opacity: BASE_OPACITY.muscle,
      depthWrite: false,
      side: FrontSide,
    })
    template.userData.baseOpacity = BASE_OPACITY.muscle
    template.userData.baseEmissive = 0.012
    template.userData.muscleGel = true
  }
  return template
}

export function cloneMuscleMaterial() {
  const m = getMuscleMaterialTemplate().clone()
  m.userData.baseOpacity = BASE_OPACITY.muscle
  m.userData.baseEmissive = 0.012
  m.userData.muscleGel = true
  return m
}
