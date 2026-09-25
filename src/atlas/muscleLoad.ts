import type { Group } from 'three'
import { loadStreamingGlb, sceneCache } from './glbLoad'

const MUSCLE_URL = '/atlas/muscles.glb'
export const MUSCLE_BYTES = 7_028_140

const muscles = sceneCache()

export function peekCachedMuscles() {
  return muscles.peek()
}

export async function fetchMuscleGltf(
  onProgress: (loaded: number, total: number) => void,
  signal?: AbortSignal,
): Promise<Group> {
  const hit = muscles.peek()
  if (hit) {
    onProgress(MUSCLE_BYTES, MUSCLE_BYTES)
    return hit
  }
  return muscles.load(() =>
    loadStreamingGlb(MUSCLE_URL, MUSCLE_BYTES, 'muscles.glb', onProgress, signal),
  )
}
