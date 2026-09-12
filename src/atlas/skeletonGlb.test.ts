import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { Box3, Mesh, Vector3 } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { SKELETON_MESH_PARTS } from './generated/skeletonCatalog'
import { prepareSkeletonScene } from './skeletonLoad'
import { STRUCTURE_BY_ID } from './structures'

test('skeleton.glb has 197 named meshes that match the catalog', async () => {
  const buf = readFileSync(new URL('../../public/atlas/skeleton.glb', import.meta.url))
  const gltf = await new Promise<{ scene: Mesh['parent'] }>((resolve, reject) => {
    new GLTFLoader().parse(
      buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
      '',
      resolve,
      reject,
    )
  })

  const names = new Set<string>()
  let tris = 0
  gltf.scene?.traverse((obj) => {
    if (!(obj instanceof Mesh) || !obj.name) return
    names.add(obj.name)
    const idx = obj.geometry.index
    tris += idx ? idx.count / 3 : obj.geometry.attributes.position.count / 3
  })

  assert.equal(names.size, 197)
  assert.equal(SKELETON_MESH_PARTS.length, 197)
  for (const part of SKELETON_MESH_PARTS) {
    assert.ok(names.has(part.id), `missing GLB node ${part.id}`)
  }
  assert.ok(tris > 400_000, `expected a dense kit, got ${tris} tris`)
  prepareSkeletonScene(gltf.scene as import('three').Group)
  let withNorm = 0
  gltf.scene?.traverse((obj) => {
    if (obj instanceof Mesh && obj.geometry.attributes.normal) withNorm++
  })
  assert.equal(withNorm, 197)
})

test('placed bones fill a standing figure, not a stick at the origin', () => {
  const box = new Box3()
  const p = new Vector3()
  for (const part of SKELETON_MESH_PARTS) {
    const pos = STRUCTURE_BY_ID[part.id]?.position
    assert.ok(pos, part.id)
    box.expandByPoint(p.set(pos[0], pos[1], pos[2]))
  }
  const size = box.getSize(new Vector3())
  assert.ok(size.y > 1.2, `figure height ${size.y}`)
  assert.ok(size.x > 0.3, `figure width ${size.x}`)
  assert.ok(box.min.y < 0.15, `feet should be near the floor, minY=${box.min.y}`)
  assert.ok(box.max.y > 1.3, `head/ribs should sit above 1.3m, maxY=${box.max.y}`)
})
