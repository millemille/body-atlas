import assert from 'node:assert/strict'
import { test } from 'node:test'
import { BOILERPLATE_RE } from './boneCopy'
import { BASE_OPACITY } from './colors'
import { LIVE_MUSCLE_IDS, applyMuscleCopy, muscleCopy } from './muscleCopy'
import { STRUCTURE_BY_ID, STRUCTURES } from './structures'

test('densify muscles have real Function / Articulates / blurb', () => {
  assert.equal(LIVE_MUSCLE_IDS.length, 21)
  const live = STRUCTURES.filter((s) => s.system === 'muscle')
  assert.equal(live.length, 21)
  for (const id of LIVE_MUSCLE_IDS) {
    const row = STRUCTURE_BY_ID[id]
    assert.ok(row, id)
    assert.equal(row.system, 'muscle')
    const pack = muscleCopy(id)
    assert.ok(pack, id)
    assert.equal(row.function, pack.function)
    assert.equal(row.relation, pack.relation)
    assert.equal(row.blurb, pack.blurb)
    assert.ok(row.function.length > 24, id)
    assert.ok(row.relation.length > 20, id)
    assert.ok(row.blurb.length > 40, id)
    assert.equal(BOILERPLATE_RE.test(`${row.function} ${row.relation} ${row.blurb}`), false, id)
    assert.equal(/applied at runtime|See boneCopy|kit boilerplate/i.test(row.blurb), false, id)
    assert.match(row.kind, /densify volume/i)
  }
})

test('named muscles are not generic kit stubs', () => {
  const pec = STRUCTURE_BY_ID.pectoralis
  assert.match(pec.function, /humerus|chest/i)
  assert.match(pec.relation, /sternum|bicipital/i)
  const bic = STRUCTURE_BY_ID['biceps-left']
  assert.match(bic.function, /flexes the elbow/i)
  const gast = STRUCTURE_BY_ID.gastrocnemius
  assert.match(gast.relation, /Achilles|calcaneus/i)
  const cuff = STRUCTURE_BY_ID['rotator-cuff']
  assert.match(cuff.function, /glenoid|humer/i)
  assert.match(cuff.relation, /scapul|tubercle/i)
  const erect = STRUCTURE_BY_ID['erector-spinae']
  assert.match(erect.function, /spine|stance/i)
  const add = STRUCTURE_BY_ID['hip-adductors']
  assert.match(add.function, /adduct/i)
})

test('applyMuscleCopy is a no-op on bone and unknown muscle ids', () => {
  const bone = STRUCTURE_BY_ID['calcaneus-left']
  assert.equal(applyMuscleCopy(bone), bone)
  const unknown = {
    id: 'obscure-lumbrical',
    system: 'muscle',
    function: 'role copy',
    relation: 'nearby tendons',
    blurb: 'Honest interim role for an unmapped slip.',
    kind: 'Muscle · densify volume',
  }
  assert.equal(applyMuscleCopy(unknown), unknown)
})

test('rose gel stays translucent enough for bone-behind-gel picks', () => {
  assert.ok(BASE_OPACITY.muscle >= 0.32, 'must read as a volume, not empty')
  assert.ok(BASE_OPACITY.muscle <= 0.55, 'must stay under the thin-gel promotion cap')
})
