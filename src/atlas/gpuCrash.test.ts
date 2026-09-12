import assert from 'node:assert/strict'
import { test } from 'node:test'
import { installWebglContextGuard, looksLikeGpuCrash } from './gpuCrash'

test('Aw Snap / Error 9 copy is recognized as a GPU process death', () => {
  assert.equal(looksLikeGpuCrash('Aw, Snap! Error code: 9'), true)
  assert.equal(looksLikeGpuCrash('STATUS_ACCESS_VIOLATION'), true)
  assert.equal(looksLikeGpuCrash('Pectoralis'), false)
})

test('context-lost guard prevents default so WebGL can restore', () => {
  const listeners = new Map<string, EventListener>()
  const canvas = {
    addEventListener(type: string, fn: EventListener) {
      listeners.set(type, fn)
    },
    removeEventListener(type: string) {
      listeners.delete(type)
    },
  }
  let lost = 0
  let restored = 0
  const stop = installWebglContextGuard(canvas as unknown as HTMLCanvasElement, {
    onLost: () => {
      lost += 1
    },
    onRestored: () => {
      restored += 1
    },
  })
  let prevented = false
  listeners.get('webglcontextlost')?.({
    preventDefault() {
      prevented = true
    },
  } as Event)
  listeners.get('webglcontextrestored')?.(new Event('webglcontextrestored'))
  assert.equal(prevented, true)
  assert.equal(lost, 1)
  assert.equal(restored, 1)
  stop()
  assert.equal(listeners.size, 0)
})
