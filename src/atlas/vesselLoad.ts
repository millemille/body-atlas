import type { Group } from 'three'
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { Mesh } from 'three'

export const VESSEL_URL = '/atlas/vessels.glb'
export const VESSEL_BYTES = 14_185_620

function parseGlb(buffer: ArrayBuffer): Promise<GLTF> {
  const loader = new GLTFLoader()
  return new Promise((resolve, reject) => {
    loader.parse(buffer, '', resolve, reject)
  })
}

export function prepareVesselScene(root: Group) {
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

export function peekCachedVessels() {
  return cachedScene
}

export async function fetchVesselGltf(signal?: AbortSignal): Promise<Group> {
  if (cachedScene) return cachedScene
  if (inflight) return inflight
  inflight = loadVesselGltf(signal)
    .then((scene) => {
      cachedScene = scene
      return scene
    })
    .finally(() => {
      inflight = null
    })
  return inflight
}

async function loadVesselGltf(signal?: AbortSignal): Promise<Group> {
  const res = await fetch(VESSEL_URL, { signal, cache: 'force-cache' })
  if (!res.ok) throw new Error(`vessels.glb ${res.status}`)
  const buf = await res.arrayBuffer()
  const gltf = await parseGlb(buf)
  prepareVesselScene(gltf.scene)
  return gltf.scene
}
