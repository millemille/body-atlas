import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { Mesh } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { CHROME, SABRINA, BASE_OPACITY } from './colors'
import { VESSEL_MESH_COUNT, VESSEL_MESH_PARTS, VESSEL_VEIN_IDS } from './generated/vesselCatalog'
import { MUSCLE_BYTES } from './muscleLoad'
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

test('BodyParts3D arteries and veins are many untextured leaves', async () => {
  assert.equal(VESSEL_MESH_PARTS.length, VESSEL_MESH_COUNT)
  assert.ok(VESSEL_MESH_COUNT >= 300, `only ${VESSEL_MESH_COUNT} leaves`)
  assert.ok(VESSEL_VEIN_IDS.length >= 40)
  assert.ok(VESSEL_MESH_COUNT - VESSEL_VEIN_IDS.length >= 200)
  const gltf = await loadVessels()
  const names = new Set<string>()
  gltf.scene?.traverse((obj) => {
    if (obj instanceof Mesh && obj.name) names.add(obj.name)
  })
  assert.equal(names.size, VESSEL_MESH_COUNT)
  for (const id of [
    'arch-of-aorta',
    'ascending-aorta',
    'abdominal-aorta',
    'superior-vena-cava',
    'inferior-vena-cava',
    'left-common-carotid-artery',
    'right-common-carotid-artery',
    'left-femoral-artery',
    'right-femoral-artery',
    'left-subclavian-artery',
    'right-subclavian-artery',
    'pulmonary-trunk',
  ]) {
    assert.ok(names.has(id), id)
    const live = STRUCTURE_BY_ID[id]
    assert.equal(live.system, 'vessel')
    assert.equal(live.source, 'bodyparts3d')
    assert.match(live.kind, /mesh/i)
    assert.doesNotMatch(live.blurb, /glyph|exaggerated|stand-in|placeholder|tube/i)
  }
  const veins = new Set<string>(VESSEL_VEIN_IDS)
  assert.equal(STRUCTURE_BY_ID['superior-vena-cava'].kind.includes('Venous'), true)
  assert.ok(veins.has('superior-vena-cava'))
  assert.equal(veins.has('arch-of-aorta'), false)
  const arch = STRUCTURE_BY_ID['arch-of-aorta']
  const svc = STRUCTURE_BY_ID['superior-vena-cava']
  assert.ok(arch.position[1] > 1.3 && arch.position[1] < 1.45)
  assert.ok(arch.position[2] > 0.04)
  assert.ok(svc.position[0] > arch.position[0])
  const vessels = STRUCTURES.filter((part) => part.system === 'vessel')
  assert.equal(vessels.length, VESSEL_MESH_COUNT)
})

test('vessel colors read on the dark background and the muscle figure is unchanged', () => {
  assert.ok(dist(SABRINA.vesselRuby, CHROME.void) > 180)
  assert.ok(dist(SABRINA.vesselVein, CHROME.void) > 180)
  assert.ok(dist(SABRINA.vesselRuby, SABRINA.vesselVein) > 180)
  assert.equal(SABRINA.vesselRuby, '#FF4D42')
  assert.equal(SABRINA.vesselVein, '#3B96FF')
  assert.ok(BASE_OPACITY.vessel >= 0.9)
  const nerves = STRUCTURES.filter((part) => part.system === 'nerve')
  assert.ok(nerves.length >= 5)
  for (const nerve of nerves) {
    assert.notEqual(nerve.source, 'bodyparts3d')
  }
  assert.equal(STRUCTURES.some((part) => part.id === 'sternocleidomastoid'), false)
  const muscleBytes = readFileSync(new URL('../../public/atlas/muscles.glb', import.meta.url)).byteLength
  assert.equal(muscleBytes, MUSCLE_BYTES)
  const layer = readFileSync(new URL('../components/canvas/layers/VesselLayer.tsx', import.meta.url), 'utf8')
  assert.equal(layer.includes('Tube'), false)
  assert.match(layer, /vesselHot/)
  const chrome = readFileSync(new URL('../components/chrome/SystemsBar.tsx', import.meta.url), 'utf8')
  assert.equal(chrome.includes('data-atlas-m2'), false)
  assert.equal(chrome.includes('More coverage'), false)
})
