import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { Mesh } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { BASE_OPACITY, CHROME, SABRINA } from './colors'
import { NERVE_MESH_COUNT, NERVE_MESH_PARTS } from './generated/nerveCatalog'
import { VESSEL_MESH_COUNT } from './generated/vesselCatalog'
import { MUSCLE_BYTES } from './muscleLoad'
import { NERVE_BYTES } from './nerveLoad'
import { STRUCTURE_BY_ID, STRUCTURES } from './structures'
import { VESSEL_BYTES } from './vesselLoad'

function rgb(hex: string) {
  const n = hex.replace('#', '')
  return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)]
}

function dist(a: string, b: string) {
  const [ar, ag, ab] = rgb(a)
  const [br, bg, bb] = rgb(b)
  return Math.hypot(ar - br, ag - bg, ab - bb)
}

test('BodyParts3D nerve leaves replace the five placeholder cords', async () => {
  assert.equal(NERVE_MESH_PARTS.length, NERVE_MESH_COUNT)
  assert.equal(NERVE_MESH_COUNT, 35)
  const nerves = STRUCTURES.filter((part) => part.system === 'nerve')
  assert.equal(nerves.length, NERVE_MESH_COUNT)
  for (const id of ['spinal-cord', 'right-optic-nerve', 'left-optic-nerve', 'right-trochlear-nerve', 'nerve-trunk']) {
    const live = STRUCTURE_BY_ID[id]
    assert.equal(live.system, 'nerve')
    assert.equal(live.source, 'bodyparts3d')
    assert.match(live.kind, /mesh/i)
    assert.doesNotMatch(live.blurb, /glyph|stand-in|placeholder|tube|teal/i)
  }
  for (const invented of ['sciatic-nerves', 'median-nerves', 'femoral-nerves', 'brachial-plexus', 'sternocleidomastoid']) {
    assert.equal(STRUCTURE_BY_ID[invented], undefined, invented)
  }
  const cord = STRUCTURE_BY_ID['spinal-cord']
  const optic = STRUCTURE_BY_ID['right-optic-nerve']
  assert.ok(Math.abs(cord.position[0]) < 0.02)
  assert.ok(cord.position[1] > 1.45 && cord.position[1] < 1.7)
  assert.ok(optic.position[1] > 1.45)

  const buf = readFileSync(new URL('../../public/atlas/nerves.glb', import.meta.url))
  assert.equal(buf.byteLength, NERVE_BYTES)
  const jsonLen = buf.readUInt32LE(12)
  const json = buf.subarray(20, 20 + jsonLen).toString('utf8')
  assert.equal(json.includes('"images"'), false)
  const scene = await new Promise<Mesh['parent']>((resolve, reject) => {
    new GLTFLoader().parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '', (gltf) => {
      resolve(gltf.scene)
    }, reject)
  })
  const names = new Set<string>()
  scene?.traverse((obj) => {
    if (obj instanceof Mesh && obj.name) names.add(obj.name)
  })
  assert.equal(names.size, NERVE_MESH_COUNT)
  assert.ok(names.has('spinal-cord'))
  assert.equal(names.has('sciatic-nerves'), false)
})

test('nerve yellow reads apart from the void, arteries, and veins', () => {
  assert.equal(SABRINA.nerveYellow, '#FFE14A')
  assert.ok(dist(SABRINA.nerveYellow, CHROME.void) > 180)
  assert.ok(dist(SABRINA.nerveYellow, SABRINA.vesselRuby) > 120)
  assert.ok(dist(SABRINA.nerveYellow, SABRINA.vesselVein) > 120)
  assert.equal(SABRINA.vesselRuby, '#FF4D42')
  assert.equal(SABRINA.vesselVein, '#3B96FF')
  assert.ok(BASE_OPACITY.nerve >= 0.9)
  const layer = readFileSync(new URL('../components/canvas/layers/NerveLayer.tsx', import.meta.url), 'utf8')
  assert.equal(layer.includes('Tube'), false)
  assert.match(layer, /nerveHot/)
  const muscleBytes = readFileSync(new URL('../../public/atlas/muscles.glb', import.meta.url)).byteLength
  assert.equal(muscleBytes, MUSCLE_BYTES)
  const vesselBytes = readFileSync(new URL('../../public/atlas/vessels.glb', import.meta.url)).byteLength
  assert.equal(vesselBytes, VESSEL_BYTES)
  assert.equal(STRUCTURES.filter((part) => part.system === 'vessel').length, VESSEL_MESH_COUNT)
  const chrome = readFileSync(new URL('../components/chrome/SystemsBar.tsx', import.meta.url), 'utf8')
  assert.equal(chrome.includes('data-atlas-m2'), false)
  assert.equal(chrome.includes('More coverage'), false)
  const toggles = readFileSync(new URL('./hotSystems.ts', import.meta.url), 'utf8')
  assert.equal(toggles.includes('MAX_HOT_SYSTEMS'), false)
})
