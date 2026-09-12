const DRAG_PX = 4

let downX = 0
let downY = 0
let liveDrag = false
let canvasPickSuppress = false
const listeners = new Set<(next: boolean) => void>()

type OrbitLike = {
  enabled: boolean
  domElement?: HTMLElement | null
}

let orbit: OrbitLike | null = null

export function registerOrbitControls(next: OrbitLike | null) {
  orbit = next
}

function emitLive(next: boolean) {
  if (liveDrag === next) return
  liveDrag = next
  listeners.forEach((fn) => fn(next))
}

export function releaseAllCaptures(pointerId?: number) {
  const ids = pointerId != null ? [pointerId] : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
  const all = document.querySelectorAll('*')
  for (const node of all) {
    if (typeof node.hasPointerCapture !== 'function') continue
    for (const id of ids) {
      try {
        if (node.hasPointerCapture(id)) node.releasePointerCapture(id)
      } catch {
        /* not held */
      }
    }
  }
}

function pointInRect(x: number, y: number, r: DOMRect, slop = 0) {
  return x >= r.left - slop && x <= r.right + slop && y >= r.top - slop && y <= r.bottom + slop
}

function overDockStrip(x: number, y: number) {
  void document.body.offsetWidth
  const dock = document.querySelector('[data-atlas-dock]')
  if (!(dock instanceof HTMLElement)) return y > window.innerHeight - 120
  return pointInRect(x, y, dock.getBoundingClientRect(), 4)
}

function overSelectionCard(x: number, y: number) {
  void document.body.offsetWidth
  const cards = document.querySelectorAll('[data-atlas-selection-card]')
  for (const card of cards) {
    if (!(card instanceof HTMLElement)) continue
    const r = card.getBoundingClientRect()
    if (r.width >= 2 && r.height >= 2 && pointInRect(x, y, r, 4)) return true
  }
  return false
}

function overChromeHit(x: number, y: number) {
  return overDockStrip(x, y) || overSelectionCard(x, y)
}

function setStagePointerEvents(on: boolean) {
  const value = on ? 'auto' : 'none'
  document.querySelectorAll('canvas, [data-atlas-canvas-host]').forEach((node) => {
    if (node instanceof HTMLElement) node.style.pointerEvents = value
  })
  if (orbit?.domElement) orbit.domElement.style.pointerEvents = value
}

function setDockHover(over: boolean) {
  if (orbit) orbit.enabled = !over
  setStagePointerEvents(!over)
}

export function clearAllPointerFlags() {
  emitLive(false)
  canvasPickSuppress = false
}

export function notePointerDown(x: number, y: number) {
  downX = x
  downY = y
  clearAllPointerFlags()
}

export function notePointerMove(x: number, y: number, buttons: number) {
  if (buttons === 0) {
    endPointer()
    return
  }
  if (Math.hypot(x - downX, y - downY) <= DRAG_PX) return
  canvasPickSuppress = true
  emitLive(true)
}

export function endPointer(pointerId?: number) {
  emitLive(false)
  releaseAllCaptures(pointerId)
  if (canvasPickSuppress) {
    queueMicrotask(() => {
      canvasPickSuppress = false
      emitLive(false)
    })
  }
}

export function notePointerUp(e?: Event) {
  const id = e instanceof PointerEvent ? e.pointerId : undefined
  endPointer(id)
}

export function wasDrag() {
  return canvasPickSuppress
}

export function isDragging() {
  return liveDrag
}

export function subscribeDrag(fn: (next: boolean) => void) {
  listeners.add(fn)
  fn(liveDrag)
  return () => {
    listeners.delete(fn)
  }
}

let chromeUntil = 0
let pickUntil = 0

/** Mesh pick in this gesture — Canvas onPointerMissed must not clear it. */
export function noteAtlasPick() {
  pickUntil = performance.now() + 400
}

export function tookAtlasPick() {
  return performance.now() < pickUntil
}

export function restoreStagePicks() {
  setStagePointerEvents(true)
  if (orbit) orbit.enabled = true
  clearAllPointerFlags()
}

export function noteChromeInteract() {
  chromeUntil = performance.now() + 500
  clearAllPointerFlags()
}

export function chromeInteracted() {
  return performance.now() < chromeUntil
}

function clientXY(e: Event): { x: number; y: number } | null {
  if (e instanceof PointerEvent || e instanceof MouseEvent) {
    return { x: e.clientX, y: e.clientY }
  }
  return null
}

function onHover(e: Event) {
  const xy = clientXY(e)
  if (!xy) return
  const over = overChromeHit(xy.x, xy.y)
  if (over) {
    releaseAllCaptures(e instanceof PointerEvent ? e.pointerId : undefined)
  }
  setDockHover(over)
}

/** Drag / orbit mute only. Dock hits are owned by public/atlas-dock-capture.js */
export function installPointerGuards() {
  const opts: AddEventListenerOptions = { capture: true }
  window.addEventListener('pointermove', onHover, opts)
  window.addEventListener('mousemove', onHover, opts)
  return () => {
    window.removeEventListener('pointermove', onHover, opts)
    window.removeEventListener('mousemove', onHover, opts)
  }
}
