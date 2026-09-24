import type { Group } from 'three'
import { loadWholeGlb, sceneCache } from './glbLoad'

const VESSEL_URL = '/atlas/vessels.glb'
export const VESSEL_BYTES = 14_185_620

const vessels = sceneCache()

export function peekCachedVessels() {
  return vessels.peek()
}

export async function fetchVesselGltf(signal?: AbortSignal): Promise<Group> {
  const hit = vessels.peek()
  if (hit) return hit
  return vessels.load(() => loadWholeGlb(VESSEL_URL, 'vessels.glb', signal))
}
