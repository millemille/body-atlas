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

function localZ(root: Mesh['parent'], name: string) {
  let mesh: Mesh | undefined
  root?.traverse((obj) => {
    if (obj instanceof Mesh && obj.name === name) mesh = obj
  })
  assert.ok(mesh, name)
  mesh.geometry.computeBoundingBox()
  const box = mesh.geometry.boundingBox ?? new Box3()
  return { min: box.min.z, max: box.max.z }
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

  const absWall =
    0.5 * (xiphoidPart.position[2] + xiphoid.max + (l5Part.position[2] + l5.max))
  const absFace = absPart.position[2] + abs.max
  const absHalf = (abs.max - abs.min) / 2
  assert.ok(Math.abs(absPart.position[2] - hugAnteriorWall(absWall, absHalf)) < 1e-3)
  assert.ok(Math.abs(absFace - (absWall + 0.01)) < 1e-3, `abs face ${absFace}`)

  const t7Back = t7Part.position[2] + t7.min
  assert.ok(lat.position[2] > t7Back - 0.03, `latissimus z ${lat.position[2]} behind T7 ${t7Back}`)
})
