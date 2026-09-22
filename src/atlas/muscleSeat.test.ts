import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { Box3, Mesh } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { hugAnteriorWall } from './anteriorWall'
import { MUSCLE_MESH_PARTS } from './generated/muscleCatalog'
import { STRUCTURE_BY_ID } from './structures'

async function load(url: string) {
  const buf = readFileSync(new URL(url, import.meta.url))
  return new Promise<{ scene: Mesh['parent'] }>((resolve, reject) => {
    new GLTFLoader().parse(
      buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
      '',
      resolve,
      reject,
    )
  })
}

function namedMesh(root: Mesh['parent'], name: string) {
  let mesh: Mesh | undefined
  root?.traverse((obj) => {
    if (obj instanceof Mesh && obj.name === name) mesh = obj
  })
  assert.ok(mesh, name)
  return mesh
}

function localZ(root: Mesh['parent'], name: string) {
  const mesh = namedMesh(root, name)
  mesh.geometry.computeBoundingBox()
  const box = mesh.geometry.boundingBox ?? new Box3()
  return { min: box.min.z, max: box.max.z }
}

const SCAPULA_X_MIN = 0.05
const SCAPULA_X_MAX = 0.14
const SCAPULA_Y_MIN = 1.18
const SCAPULA_Y_MAX = 1.52
const SCAPULA_Z_MAX = 0.08

function worldCentroids(root: Mesh['parent'], name: string, origin: readonly [number, number, number]) {
  const mesh = namedMesh(root, name)
  const pos = mesh.geometry.getAttribute('position')
  const index = mesh.geometry.getIndex()
  const out: { x: number; y: number; z: number }[] = []
  const tri = (i: number) => {
    const vi = index ? index.getX(i) : i
    return { x: pos.getX(vi) + origin[0], y: pos.getY(vi) + origin[1], z: pos.getZ(vi) + origin[2] }
  }
  const count = index ? index.count : pos.count
  for (let i = 0; i + 2 < count; i += 3) {
    const a = tri(i)
    const b = tri(i + 1)
    const c = tri(i + 2)
    out.push({ x: (a.x + b.x + c.x) / 3, y: (a.y + b.y + c.y) / 3, z: (a.z + b.z + c.z) / 3 })
  }
  return out
}

test('Open3D kit seats pecs and abs on the anterior wall and keeps the back on the trunk', async () => {
  const muscles = await load('../../public/atlas/muscles.glb')
  const skeleton = await load('../../public/atlas/skeleton.glb')
  const names = new Set<string>()
  muscles.scene?.traverse((obj) => {
    if (obj instanceof Mesh && obj.name) names.add(obj.name)
  })
  assert.equal(names.size, 57)
  assert.equal(MUSCLE_MESH_PARTS.length, 57)
  for (const part of MUSCLE_MESH_PARTS) assert.ok(names.has(part.id), part.id)
  assert.equal(names.has('sternocleidomastoid'), false)
  assert.equal(names.has('latissimus'), true)

  const pec = localZ(muscles.scene, 'pectoralis')
  const abs = localZ(muscles.scene, 'abdominal-wall')
  const sternum = localZ(skeleton.scene, 'body-of-sternum')
  const xiphoid = localZ(skeleton.scene, 'xiphoid-process')
  const l5 = localZ(skeleton.scene, 'fifth-lumbar-vertebra')
  const t7 = localZ(skeleton.scene, 'seventh-thoracic-vertebra')

  const pecPart = STRUCTURE_BY_ID.pectoralis
  const absPart = STRUCTURE_BY_ID['abdominal-wall']
  const sternumPart = STRUCTURE_BY_ID['body-of-sternum']
  const xiphoidPart = STRUCTURE_BY_ID['xiphoid-process']
  const l5Part = STRUCTURE_BY_ID['fifth-lumbar-vertebra']
  const t7Part = STRUCTURE_BY_ID['seventh-thoracic-vertebra']
  const lat = STRUCTURE_BY_ID.latissimus

  const sternumWall = sternumPart.position[2] + sternum.max
  const pecFace = pecPart.position[2] + pec.max
  const pecHalf = (pec.max - pec.min) / 2
  assert.ok(Math.abs(pecPart.position[2] - hugAnteriorWall(sternumWall, pecHalf)) < 1e-3)
  assert.ok(Math.abs(pecFace - (sternumWall + 0.01)) < 1e-3, `pec face ${pecFace} wall ${sternumWall}`)

  const xiphoidWall = xiphoidPart.position[2] + xiphoid.max
  const l5Wall = l5Part.position[2] + l5.max
  const absFace = absPart.position[2] + abs.max
  assert.ok(Math.abs(absFace - (xiphoidWall + 0.01)) < 1e-3, `abs face ${absFace} xiphoid ${xiphoidWall}`)
  assert.ok(absFace > l5Wall + 0.05, `abs face ${absFace} sank onto L5 ${l5Wall}`)

  const rectus = worldCentroids(muscles.scene, 'abdominal-wall', absPart.position)
  assert.ok(rectus.some((c) => Math.abs(c.x) < 0.005), 'rectus covers the front midline')

  for (const id of ['external-oblique', 'internal-oblique', 'transversus-abdominis'] as const) {
    const part = STRUCTURE_BY_ID[id]
    const cents = worldCentroids(muscles.scene, id, part.position)
    const medial = cents.filter((c) => Math.abs(c.x) < 0.06)
    assert.equal(medial.length, 0, `${id} stays lateral`)
  }

  const t7Back = t7Part.position[2] + t7.min
  assert.ok(lat.position[2] > t7Back - 0.03, `latissimus z ${lat.position[2]} behind T7 ${t7Back}`)
  const latZ = localZ(muscles.scene, 'latissimus')
  const latFace = lat.position[2] + latZ.max
  const absDeep = absPart.position[2] + abs.min
  assert.ok(latFace < absDeep, `latissimus face ${latFace} is in front of rectus ${absDeep}`)

  let scapulaRight = 0
  let scapulaLeft = 0
  let cuffLateral = 0
  for (const part of MUSCLE_MESH_PARTS) {
    const cents = worldCentroids(muscles.scene, part.id, part.position)
    for (const c of cents) {
      const ax = Math.abs(c.x)
      if (
        ax >= SCAPULA_X_MIN &&
        ax <= SCAPULA_X_MAX &&
        c.y >= SCAPULA_Y_MIN &&
        c.y <= SCAPULA_Y_MAX &&
        c.z < SCAPULA_Z_MAX
      ) {
        if (c.x > 0) scapulaRight += 1
        else scapulaLeft += 1
      }
      if (part.id === 'rotator-cuff' && ax > 0.16) cuffLateral += 1
    }
  }
  assert.ok(scapulaRight > 20, `right scapula cover ${scapulaRight}`)
  assert.ok(scapulaLeft > 20, `left scapula cover ${scapulaLeft}`)
  assert.ok(cuffLateral > 100, `lateral cuff triangles ${cuffLateral}`)
})
