import assert from 'node:assert/strict'
import { test } from 'node:test'
import { toggleHotSystems } from './hotSystems'
import {
  dropSelectionIfCold,
  hideForIsolate,
  isIsolating,
  isPartPickable,
} from './pickable'

test('turning Muscle off never drops Skeleton from the default pair', () => {
  const next = toggleHotSystems(['skeleton', 'muscle'], 'muscle')
  assert.deepEqual(next, ['skeleton'])
  assert.ok(next.includes('skeleton'))
})

test('default hot set is skeleton so the mesh kit is the first silhouette', () => {
  const next = toggleHotSystems(['skeleton'], 'muscle')
  assert.deepEqual(next, ['skeleton', 'muscle'])
})

test('max-two replace drops the oldest system, not a silent leftover', () => {
  const next = toggleHotSystems(['skeleton', 'muscle'], 'nerve')
  assert.deepEqual(next, ['muscle', 'nerve'])
  assert.equal(next.includes('skeleton'), false)
})

test('orphan isolate does not freeze hot bones', () => {
  assert.equal(isIsolating(true, null), false)
  assert.equal(isPartPickable(true, true, null, 'humerus-left'), true)
  assert.equal(hideForIsolate(true, null, 'humerus-left'), false)
})

test('live isolate still locks non-selected parts', () => {
  assert.equal(isIsolating(true, 'biceps-left'), true)
  assert.equal(isPartPickable(true, true, 'biceps-left', 'humerus-left'), false)
  assert.equal(isPartPickable(true, true, 'biceps-left', 'biceps-left'), true)
  assert.equal(hideForIsolate(true, 'biceps-left', 'humerus-left'), true)
})

test('cold system stays unpickable even when isolate is orphaned', () => {
  assert.equal(isPartPickable(false, true, null, 'biceps-left'), false)
})

test('Muscle-off drops a muscle selection and keeps a bone selection', () => {
  const hot = ['skeleton'] as const
  assert.equal(dropSelectionIfCold(hot, 'biceps-left'), null)
  assert.equal(dropSelectionIfCold(hot, 'humerus-left'), 'humerus-left')
  assert.equal(dropSelectionIfCold(hot, null), null)
})

test('turning Muscle off drops a cuff pick the same way as any other muscle', () => {
  const hot = ['skeleton'] as const
  assert.equal(dropSelectionIfCold(hot, 'rotator-cuff'), null)
  assert.equal(dropSelectionIfCold(hot, 'erector-spinae'), null)
  assert.equal(dropSelectionIfCold(['skeleton', 'muscle'], 'rotator-cuff'), 'rotator-cuff')
})
