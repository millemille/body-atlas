import { KIT_EXTRA_WAVES } from './generated/muscleWaves'
import { LIVE_MUSCLE_IDS } from './muscleCopy'

/** Iron-era majors. Painted before any M2 geometry exists. */
export const M1_WAVES = [
  ['pectoralis'],
  ['deltoids'],
  ['abdominal-wall'],
  ['quadriceps'],
  ['biceps-left', 'biceps-right'],
  ['trapezius'],
  ['triceps-left', 'triceps-right'],
  ['gluteus'],
  ['hamstrings'],
  ['gastrocnemius'],
  ['soleus'],
  ['iliopsoas'],
  ['forearm-flexors'],
  ...KIT_EXTRA_WAVES,
] as const

/** Later mount waves. They are part of the kit, not a coverage toggle. */
export const M2_WAVES = [
  ['rotator-cuff'],
  ['erector-spinae'],
  ['hip-adductors'],
  ['tibialis-anterior'],
  ['forearm-extensors'],
] as const

export const MUSCLE_WAVES = [...M1_WAVES, ...M2_WAVES]
export const M2_IDS = M2_WAVES.flatMap((w) => [...w])
const M2_ID_SET = new Set<string>(M2_IDS)

/**
 * Drawing-buffer size is locked. Antimony flipped 1.5 → 1 on Muscle ON and
 * reallocated the GPU buffer in the same tick as the first gel compile (Error 9).
 */
export const CANVAS_DPR = 1
export const MUSCLE_HOT_DPR = 1
export const SKELETON_DPR_CAP = 1
/** Wait after ivory is ready before any gel mesh exists. */
export const MUSCLE_MOUNT_MS = 800
/** Idle frames between M1 waves. */
export const WAVE_IDLE_FRAMES = 12
/** Frames to wait after MuscleLayer mounts before the first M1 gel. */
export const M1_HOLD_FRAMES = 24
/** Idle frames between M2 waves — slower than M1. */
export const M2_IDLE_FRAMES = 24
/** Extra frames after M1 complete before the later waves. */
export const M2_SETTLE_FRAMES = 240
/** Frames after M2 layer mounts before cuff. */
export const M2_HOLD_FRAMES = 20

export function isM2MuscleId(id: string): boolean {
  return M2_ID_SET.has(id)
}

export function idsThroughWaves(waves: readonly (readonly string[])[], wave: number): Set<string> {
  const ids = new Set<string>()
  const last = Math.min(Math.max(wave, -1), waves.length - 1)
  for (let i = 0; i <= last; i++) {
    for (const id of waves[i]) ids.add(id)
  }
  return ids
}

export function idsThroughWave(wave: number): Set<string> {
  return idsThroughWaves(MUSCLE_WAVES, wave)
}

export function allWaveIds(): string[] {
  return MUSCLE_WAVES.flatMap((w) => [...w])
}

const WAVE_SET = new Set(allWaveIds())

export function wavesCoverLiveCatalog() {
  return (
    LIVE_MUSCLE_IDS.length === WAVE_SET.size &&
    LIVE_MUSCLE_IDS.every((id) => WAVE_SET.has(id))
  )
}
