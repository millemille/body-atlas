import type { Group } from 'three'
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { Mesh } from 'three'

export const NERVE_URL = '/atlas/nerves.glb'
export const NERVE_BYTES = 988_452

function parseGlb(buffer: ArrayBuffer): Promise<GLTF> {
  const loader = new GLTFLoader()
  return new Promise((resolve, reject) => {
    loader.parse(buffer, '', resolve, reject)
  })
}

export function prepareNerveScene(root: Group) {
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

export function peekCachedNerves() {
  return cachedScene
}

export async function fetchNerveGltf(signal?: AbortSignal): Promise<Group> {
  if (cachedScene) return cachedScene
  if (inflight) return inflight
  inflight = loadNerveGltf(signal)
    .then((scene) => {
      cachedScene = scene
      return scene
    })
    .finally(() => {
      inflight = null
    })
  return inflight
}

async function loadNerveGltf(signal?: AbortSignal): Promise<Group> {
  const res = await fetch(NERVE_URL, { signal, cache: 'force-cache' })
  if (!res.ok) throw new Error(`nerves.glb ${res.status}`)
  const buf = await res.arrayBuffer()
  const gltf = await parseGlb(buf)
  prepareNerveScene(gltf.scene)
  return gltf.scene
}
