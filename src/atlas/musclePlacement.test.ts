import assert from 'node:assert/strict'
import { test } from 'node:test'
import { m1Placement, m2Placement, refineChecks } from './musclePlacement'

test('forearm flexors land on carpal bones, not the mannequin wrist', () => {
  const c = refineChecks()
  assert.ok(c.flexorToScaphoid < 0.03, `scaphoid ${c.flexorToScaphoid}`)
  assert.ok(c.flexorToPisiform < 0.03, `pisiform ${c.flexorToPisiform}`)
  assert.ok(c.flexorToScaphoid < c.flexorToMannequinWrist)
})

test('tibialis anterior inserts on the medial midfoot, not the heel', () => {
  const c = refineChecks()
  assert.ok(c.taToCuneiform < 0.04, `cuneiform ${c.taToCuneiform}`)
  assert.ok(c.taToCuneiform < c.taToCalcaneus)
})

test('adductors insert on the medial femur, not the knee', () => {
  const c = refineChecks()
  assert.ok(c.adductorToFemur < c.adductorToPatella)
  assert.ok(c.adductorToFemur < 0.12, `femur ${c.adductorToFemur}`)
  assert.ok(c.adductorMedialOfFemur > 0.02, `medial ${c.adductorMedialOfFemur}`)
})

test('erectors stay paraspinal; cuff stays on scapula → proximal humerus', () => {
  const c = refineChecks()
  assert.ok(c.erectAbsX < 0.03, `erect x ${c.erectAbsX}`)
  assert.ok(c.cuffOriginToScap < 0.08, `supra ${c.cuffOriginToScap}`)
  assert.ok(c.cuffInsertToHum < 0.12, `gt ${c.cuffInsertToHum}`)
  assert.ok(c.cuffInfraBehindScap > 0.03, `infra z ${c.cuffInfraBehindScap}`)
})

test('M1 and M2 placement expose paired landmarks', () => {
  const a = m1Placement()
  const b = m2Placement()
  assert.ok(a.flexorScaphL[0] < 0)
  assert.ok(a.flexorScaphR[0] > 0)
  assert.ok(b.taToL[2] > b.erectFromL[2])
})
