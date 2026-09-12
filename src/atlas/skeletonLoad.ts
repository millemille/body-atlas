import type { Group } from 'three'
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { Mesh } from 'three'

export const SKELETON_URL = '/atlas/skeleton.glb'
export const SKELETON_BYTES = 10_797_000

export type SkeletonLoadPhase = 'download' | 'parse' | 'ready' | 'error'

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

function concat(chunks: Uint8Array[]) {
  const n = chunks.reduce((sum, c) => sum + c.byteLength, 0)
  const out = new Uint8Array(n)
  let o = 0
  for (const c of chunks) {
    out.set(c, o)
    o += c.byteLength
  }
  return out.buffer
}

function parseGlb(buffer: ArrayBuffer): Promise<GLTF> {
  const loader = new GLTFLoader()
  return new Promise((resolve, reject) => {
    loader.parse(buffer, '', resolve, reject)
  })
}

export function prepareSkeletonScene(root: Group) {
  root.traverse((obj) => {
    if (!(obj instanceof Mesh) || !obj.geometry) return
    obj.geometry.computeVertexNormals()
    obj.geometry.computeBoundingSphere()
    obj.castShadow = false
    obj.receiveShadow = false
  })
}

let cachedScene: Group | null = null
let inflight: Promise<Group> | null = null

export function peekCachedSkeleton() {
  return cachedScene
}

export async function fetchSkeletonGltf(
  onProgress: (loaded: number, total: number) => void,
  signal?: AbortSignal,
): Promise<Group> {
  if (cachedScene) {
    onProgress(SKELETON_BYTES, SKELETON_BYTES)
    return cachedScene
  }
  if (inflight) return inflight
  inflight = loadSkeletonGltf(onProgress, signal)
    .then((scene) => {
      cachedScene = scene
      return scene
    })
    .finally(() => {
      inflight = null
    })
  return inflight
}

async function loadSkeletonGltf(
  onProgress: (loaded: number, total: number) => void,
  signal?: AbortSignal,
): Promise<Group> {
  const res = await fetch(SKELETON_URL, { signal, cache: 'force-cache' })
  if (!res.ok) throw new Error(`skeleton.glb ${res.status}`)
  const total = Number(res.headers.get('content-length')) || SKELETON_BYTES
  if (!res.body) {
    const buf = await res.arrayBuffer()
    onProgress(buf.byteLength, total)
    const gltf = await parseGlb(buf)
    prepareSkeletonScene(gltf.scene)
    return gltf.scene
  }
  const reader = res.body.getReader()
  const chunks: Uint8Array[] = []
  let loaded = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    loaded += value.byteLength
    onProgress(loaded, total)
  }
  const gltf = await parseGlb(concat(chunks))
  prepareSkeletonScene(gltf.scene)
  return gltf.scene
}
