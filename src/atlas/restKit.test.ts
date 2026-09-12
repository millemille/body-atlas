import assert from 'node:assert/strict'
import { test } from 'node:test'
import { restDimApplies } from './restKit'

test('bone select still rest-dims the rest of the kit', () => {
  assert.equal(restDimApplies('calcaneus-left', 'humerus-left'), true)
  assert.equal(restDimApplies('calcaneus-left', 'pectoralis'), true)
  assert.equal(restDimApplies('calcaneus-left', 'calcaneus-left'), false)
})

test('muscle select does not rest-dim bones or sibling gels', () => {
  assert.equal(restDimApplies('pectoralis', 'calcaneus-left'), false)
  assert.equal(restDimApplies('pectoralis', 'humerus-left'), false)
  assert.equal(restDimApplies('pectoralis', 'biceps-left'), false)
  assert.equal(restDimApplies('pectoralis', 'pectoralis'), false)
})

test('empty selection never rest-dims', () => {
  assert.equal(restDimApplies(null, 'calcaneus-left'), false)
})
