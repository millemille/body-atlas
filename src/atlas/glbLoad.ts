import { Group, Mesh } from 'three'
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'

function concatChunks(chunks: Uint8Array[]) {
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

/** Vertex normals, bounds, and no shadows — same prep for every kit. */
export function prepareAtlasScene(root: Group) {
  root.traverse((obj) => {
    if (!(obj instanceof Mesh) || !obj.geometry) return
    obj.geometry.computeVertexNormals()
    obj.geometry.computeBoundingSphere()
    obj.castShadow = false
    obj.receiveShadow = false
  })
}

/** One in-flight parse per kit. Callers peek before load so a warm cache returns the scene directly. */
export function sceneCache() {
  let cachedScene: Group | null = null
  let inflight: Promise<Group> | null = null
  return {
    peek() {
      return cachedScene
    },
    load(run: () => Promise<Group>) {
      if (cachedScene) return Promise.resolve(cachedScene)
      if (inflight) return inflight
      inflight = run()
        .then((scene) => {
          cachedScene = scene
          return scene
        })
        .finally(() => {
          inflight = null
        })
      return inflight
    },
  }
}

/** Nerve and vessel: one buffered read, no download progress. */
export async function loadWholeGlb(url: string, label: string, signal?: AbortSignal): Promise<Group> {
  const res = await fetch(url, { signal, cache: 'force-cache' })
  if (!res.ok) throw new Error(`${label} ${res.status}`)
  const buf = await res.arrayBuffer()
  const gltf = await parseGlb(buf)
  prepareAtlasScene(gltf.scene)
  return gltf.scene
}

/** Skeleton and muscle: stream bytes so the poster can show progress. */
export async function loadStreamingGlb(
  url: string,
  fallbackBytes: number,
  label: string,
  onProgress: (loaded: number, total: number) => void,
  signal?: AbortSignal,
): Promise<Group> {
  const res = await fetch(url, { signal, cache: 'force-cache' })
  if (!res.ok) throw new Error(`${label} ${res.status}`)
  const total = Number(res.headers.get('content-length')) || fallbackBytes
  let buf: ArrayBuffer
  if (!res.body) {
    buf = await res.arrayBuffer()
    onProgress(buf.byteLength, total)
  } else {
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
    buf = concatChunks(chunks)
  }
  const gltf = await parseGlb(buf)
  prepareAtlasScene(gltf.scene)
  return gltf.scene
}
