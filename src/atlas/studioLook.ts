/** Sabrina skeleton studio — key + opposite rim, no floor cascade. */

export const KEY_COLOR = '#E8EEF4'
export const KEY_INTENSITY = 1.42
/** Upper-left of the home camera, ~35° elevation. */
export const KEY_POS = [-3.45, 4.1, 2.9] as const

export const RIM_COLOR = '#D2C4A8'
export const RIM_INTENSITY = 0.32
export const RIM_POS = [3.15, 1.12, -2.45] as const

export const FILL_INTENSITY = 0.09
export const IBL_INTENSITY = 0.2

/** Soft frontal wash so rose and porcelain read as volume, under the key. */
export const FRONT_COLOR = '#F4EBE3'
export const FRONT_INTENSITY = 0.26
export const FRONT_POS = [0.85, 2.6, 4.8] as const

export const HOME_EXPOSURE = 1
export const FOCUS_EXPOSURE = 1.08

export const BONE_ROUGHNESS = 0.54
export const BONE_ENV_MAP = 0.22

/** Parked gel satin. The live BodyParts3D mesh does not use these. */
export const MUSCLE_ROUGHNESS = 0.8
export const MUSCLE_ENV_MAP = 0.05

/** Firmer BodyParts3D muscle mesh. Gels stay at MUSCLE_ROUGHNESS / gel opacity. */
export const MESH_MUSCLE_COLOR = '#C47E76'
export const MESH_MUSCLE_ROUGHNESS = 0.58
export const MESH_MUSCLE_OPACITY = 0.9
export const MESH_MUSCLE_ENV = 0.28

export const REST_OPACITY = 0.6
export const REST_SATURATION = 0.85
export const REST_LIGHTNESS = 0.94
