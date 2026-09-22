import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { Mesh } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { VESSEL_MESH_PARTS } from './generated/vesselCatalog'
import { MUSCLE_BYTES } from './muscleLoad'
import { STRUCTURE_BY_ID, STRUCTURES } from './structures'
import { VESSEL_BYTES } from './vesselLoad'

const IDS = [
  'aorta',
  'carotid-arteries',
  'vena-cava',
  'femoral-arteries',
  'subclavian-arteries',
] as const

async function loadVessels() {
  const buf = readFileSync(new URL('../../public/atlas/vessels.glb', import.meta.url))
  assert.equal(buf.byteLength, VESSEL_BYTES)
  const jsonLen = buf.readUInt32LE(12)
  const json = buf.subarray(20, 20 + jsonLen).toString('utf8')
  assert.equal(json.includes('"images"'), false)
  return new Promise<{ scene: Mesh['parent'] }>((resolve, reject) => {
    new GLTFLoader().parse(
      buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
      '',
      resolve,
      reject,
    )
  })
}

test('the five vessel trunks are untextured BodyParts3D meshes', async () => {
  assert.deepEqual(
    VESSEL_MESH_PARTS.map((part) => part.id),
    IDS,
  )
  const gltf = await loadVessels()
  const names = new Set<string>()
  gltf.scene?.traverse((obj) => {
    if (obj instanceof Mesh && obj.name) names.add(obj.name)
  })
  assert.deepEqual([...names].sort(), [...IDS].sort())
  for (const id of IDS) {
    const live = STRUCTURE_BY_ID[id]
    assert.equal(live.system, 'vessel')
    assert.equal(live.source, 'bodyparts3d')
    assert.match(live.kind, /mesh/i)
    assert.doesNotMatch(live.blurb, /glyph|exaggerated|stand-in|placeholder|tube/i)
  }
  const aorta = STRUCTURE_BY_ID.aorta
  const cava = STRUCTURE_BY_ID['vena-cava']
  assert.ok(aorta.position[1] > 1.15 && aorta.position[1] < 1.35)
  assert.ok(aorta.position[2] > 0.05 && aorta.position[2] < 0.16)
  assert.ok(cava.position[0] > aorta.position[0])
  const carotids = STRUCTURE_BY_ID['carotid-arteries']
  assert.ok(carotids.position[1] > 1.38 && carotids.position[1] < 1.5)
  const femorals = STRUCTURE_BY_ID['femoral-arteries']
  assert.ok(femorals.position[1] > 0.6 && femorals.position[1] < 0.85)
  const subclavians = STRUCTURE_BY_ID['subclavian-arteries']
  assert.ok(subclavians.position[1] > 1.35 && subclavians.position[1] < 1.48)
})

test('nerves stay glyphs and the muscle figure file is unchanged', () => {
  const nerves = STRUCTURES.filter((part) => part.system === 'nerve')
  assert.ok(nerves.length >= 5)
  for (const nerve of nerves) {
    assert.notEqual(nerve.source, 'bodyparts3d')
    assert.match(`${nerve.function} ${nerve.blurb}`, /glyph|stand-in|filament|strand|cord/i)
  }
  assert.equal(STRUCTURES.some((part) => part.id === 'sternocleidomastoid'), false)
  const muscleBytes = readFileSync(new URL('../../public/atlas/muscles.glb', import.meta.url)).byteLength
  assert.equal(muscleBytes, MUSCLE_BYTES)
  const layer = readFileSync(new URL('../components/canvas/layers/VesselLayer.tsx', import.meta.url), 'utf8')
  assert.equal(layer.includes('Tube'), false)
  const chrome = readFileSync(new URL('../components/chrome/SystemsBar.tsx', import.meta.url), 'utf8')
  assert.equal(chrome.includes('data-atlas-m2'), false)
  assert.equal(chrome.includes('More coverage'), false)
})
