import type { Group } from 'three'
import { loadWholeGlb, sceneCache } from './glbLoad'

const NERVE_URL = '/atlas/nerves.glb'
export const NERVE_BYTES = 20_381_796

const nerves = sceneCache()

export function peekCachedNerves() {
  return nerves.peek()
}

export async function fetchNerveGltf(signal?: AbortSignal): Promise<Group> {
  const hit = nerves.peek()
  if (hit) return hit
  return nerves.load(() => loadWholeGlb(NERVE_URL, 'nerves.glb', signal))
}
