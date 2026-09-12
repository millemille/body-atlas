import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Color } from 'three'
import { SABRINA } from './colors'
import {
  FOCUS_SELECTION_ALBEDO_MIX,
  HOVER_ALBEDO_MIX,
  MUSCLE_SELECTION_ALBEDO_MIX,
  MUSCLE_SELECTION_EMISSIVE_INTENSITY,
  SELECTION_ALBEDO_MIX,
  SELECTION_EMISSIVE_INTENSITY,
  SELECTION_TINT_HEX,
  tintHoverAlbedo,
  tintSelectedAlbedo,
} from './selectionTint'

test('selection tint is teal, not magenta, and shifts ivory', () => {
  assert.equal(SELECTION_TINT_HEX, '#3AD1C7')
  assert.ok(SELECTION_ALBEDO_MIX >= 0.55 && SELECTION_ALBEDO_MIX <= 0.8)
  const ivory = new Color(SABRINA.boneIvory)
  const out = new Color()
  tintSelectedAlbedo(ivory, out)
  assert.ok(out.getHexString() !== ivory.getHexString(), 'ivory must change')
  assert.ok(out.g > out.r, 'teal pull: green channel leads red on ivory')
})

test('hover teal is half the select mix', () => {
  assert.equal(HOVER_ALBEDO_MIX, SELECTION_ALBEDO_MIX * 0.5)
  const ivory = new Color(SABRINA.boneIvory)
  const hover = new Color()
  const select = new Color()
  tintHoverAlbedo(ivory, hover)
  tintSelectedAlbedo(ivory, select)
  const hoverShift = Math.abs(hover.g - ivory.g)
  const selectShift = Math.abs(select.g - ivory.g)
  assert.ok(hoverShift > 0 && hoverShift < selectShift)
})

test('Focus select mix is weaker so porcelain still reads', () => {
  assert.ok(FOCUS_SELECTION_ALBEDO_MIX < SELECTION_ALBEDO_MIX)
  assert.ok(FOCUS_SELECTION_ALBEDO_MIX >= 0.2)
  const ivory = new Color(SABRINA.boneIvory)
  const home = new Color()
  const focus = new Color()
  tintSelectedAlbedo(ivory, home)
  tintSelectedAlbedo(ivory, focus, FOCUS_SELECTION_ALBEDO_MIX)
  assert.ok(Math.abs(focus.g - ivory.g) < Math.abs(home.g - ivory.g))
})

test('muscle rose also picks up the same select tint', () => {
  const rose = new Color(SABRINA.muscleRose)
  const out = new Color()
  tintSelectedAlbedo(rose, out, MUSCLE_SELECTION_ALBEDO_MIX)
  assert.ok(out.getHexString() !== rose.getHexString())
  assert.ok(out.b > rose.b, 'rose shifts toward cyan')
})

test('muscle select treatment is quieter than bone so first pick is not a GPU spike', () => {
  assert.equal(MUSCLE_SELECTION_EMISSIVE_INTENSITY, 0)
  assert.ok(MUSCLE_SELECTION_ALBEDO_MIX < SELECTION_ALBEDO_MIX)
})
