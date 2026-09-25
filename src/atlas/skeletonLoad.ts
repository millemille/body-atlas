import type { Group } from 'three'
import { loadStreamingGlb, prepareAtlasScene, sceneCache } from './glbLoad'

const SKELETON_URL = '/atlas/skeleton.glb'
export const SKELETON_BYTES = 10_797_000

type SkeletonLoadPhase = 'download' | 'parse' | 'ready' | 'error'

export type SkeletonLoadState = {
  phase: SkeletonLoadPhase
  loaded: number
  total: number
  error: string | null
}

export const INITIAL_SKELETON_LOAD: SkeletonLoadState = {
  phase: 'download',
  loaded: 0,
  total: SKELETON_BYTES,
  error: null,
}

export function prepareSkeletonScene(root: Group) {
  prepareAtlasScene(root)
}

const skeleton = sceneCache()

export function peekCachedSkeleton() {
  return skeleton.peek()
}

export async function fetchSkeletonGltf(
  onProgress: (loaded: number, total: number) => void,
  signal?: AbortSignal,
): Promise<Group> {
  const hit = skeleton.peek()
  if (hit) {
    onProgress(SKELETON_BYTES, SKELETON_BYTES)
    return hit
  }
  return skeleton.load(() =>
    loadStreamingGlb(SKELETON_URL, SKELETON_BYTES, 'skeleton.glb', onProgress, signal),
  )
}
