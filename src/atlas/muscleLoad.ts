import type { Group } from 'three'
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { Mesh } from 'three'

export const MUSCLE_URL = '/atlas/muscles.glb'
export const MUSCLE_BYTES = 7_028_140

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

export function prepareMuscleScene(root: Group) {
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

export function peekCachedMuscles() {
  return cachedScene
}

export async function fetchMuscleGltf(
  onProgress: (loaded: number, total: number) => void,
  signal?: AbortSignal,
): Promise<Group> {
  if (cachedScene) {
    onProgress(MUSCLE_BYTES, MUSCLE_BYTES)
    return cachedScene
  }
  if (inflight) return inflight
  inflight = loadMuscleGltf(onProgress, signal)
    .then((scene) => {
      cachedScene = scene
      return scene
    })
    .finally(() => {
      inflight = null
    })
  return inflight
}

async function loadMuscleGltf(
  onProgress: (loaded: number, total: number) => void,
  signal?: AbortSignal,
): Promise<Group> {
  const res = await fetch(MUSCLE_URL, { signal, cache: 'force-cache' })
  if (!res.ok) throw new Error(`muscles.glb ${res.status}`)
  const total = Number(res.headers.get('content-length')) || MUSCLE_BYTES
  if (!res.body) {
    const buf = await res.arrayBuffer()
    onProgress(buf.byteLength, total)
    const gltf = await parseGlb(buf)
    prepareMuscleScene(gltf.scene)
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
  prepareMuscleScene(gltf.scene)
  return gltf.scene
}
