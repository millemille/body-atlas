import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Box3, Vector3 } from 'three'
import { makeFanGeometry, makeFusiformGeometry } from './muscleGeom'

test('fusiform is longer than it is wide and thinner at the poles than mid', () => {
  const g = makeFusiformGeometry(0.24, 0.05, 0.012, 8, 12)
  g.computeBoundingBox()
  const box = g.boundingBox ?? new Box3()
  const size = box.getSize(new Vector3())
  assert.ok(size.y > size.x * 1.6, `fusiform ${size.toArray()}`)
  const pos = g.getAttribute('position')
  let maxR = 0
  let endR = 0
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const z = pos.getZ(i)
    const r = Math.hypot(x, z)
    if (r > maxR) maxR = r
    if (Math.abs(y) > 0.11 && r > endR) endR = r
  }
  assert.ok(maxR > endR * 1.8, `mid ${maxR} vs pole ${endR}`)
  g.dispose()
})

test('M2 lite lathe stays a fusiform with fewer rings', () => {
  const g = makeFusiformGeometry(0.2, 0.04, 0.01, 6, 8)
  const pos = g.getAttribute('position')
  const full = makeFusiformGeometry(0.2, 0.04, 0.01, 8, 12)
  assert.ok(pos.count < full.getAttribute('position').count)
  g.dispose()
  full.dispose()
})

test('fan tapers from a wide origin to a narrow insert', () => {
  const g = makeFanGeometry(0.2, 0.16, 0.04, 0.03, 0.018, 0.02)
  const pos = g.getAttribute('position')
  assert.ok(pos.count >= 12)
  const yOf = (i: number) => pos.getY(i)
  let originSpan = 0
  let insertSpan = 0
  for (let i = 0; i < pos.count; i++) {
    const span = Math.abs(pos.getX(i)) * 2
    if (yOf(i) < -0.04) originSpan = Math.max(originSpan, span)
    if (yOf(i) > 0.04) insertSpan = Math.max(insertSpan, span)
  }
  assert.ok(originSpan > insertSpan * 2, `origin ${originSpan} insert ${insertSpan}`)
  g.dispose()
})
