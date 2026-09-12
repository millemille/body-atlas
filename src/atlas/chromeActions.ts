import { showAtlasToast } from './atlasToast'
import { isAtlasDebug } from './debugMode'
import { noteChromeInteract } from './pointerSession'

type Actions = {
  focus: () => void
  reset: () => void
  isolate: () => void
}

type AtlasWindow = Window & {
  __atlasRunTool?: (name: string) => void
  __atlasToolQueue?: string[]
}

let actions: Actions | null = null
let lastName = ''
let lastAt = 0

function once(name: string, fn: () => void) {
  const now = performance.now()
  if (name === lastName && now - lastAt < 800) return
  lastName = name
  lastAt = now
  fn()
}

function flushQueue() {
  const w = window as AtlasWindow
  const q = w.__atlasToolQueue
  if (!q?.length) return
  w.__atlasToolQueue = []
  q.forEach((name) => runTool(name))
}

export function bindChromeActions(next: Actions) {
  actions = next
  const w = window as AtlasWindow
  w.__atlasRunTool = runTool
  flushQueue()
  return () => {
    if (actions === next) actions = null
  }
}

/**
 * One Focus path for card and dock. FIRED banners only with ?debug=1 (or local DEV).
 * Calls requestFocus (enter + re-aim), never a card-only singleton.
 */
export function activateFocus(source: 'toolbar' | 'card') {
  noteChromeInteract()
  if (isAtlasDebug()) {
    const label = source === 'card' ? 'CARD FOCUS FIRED' : 'TOOLBAR FOCUS FIRED'
    showAtlasToast(label)
    console.info(`[atlas] ${label}`)
  }
  actions?.focus()
}

export function runFocus(source: 'toolbar' | 'card') {
  activateFocus(source)
}

export function runReset() {
  once('reset', () => {
    if (isAtlasDebug()) showAtlasToast('TOOLBAR RESET FIRED')
    actions?.reset()
  })
}

export function runIsolate() {
  once('isolate', () => {
    if (isAtlasDebug()) showAtlasToast('TOOLBAR ISOLATE FIRED')
    actions?.isolate()
  })
}

export function runTool(name: string | null) {
  if (name === 'card-focus') activateFocus('card')
  else if (name === 'focus') activateFocus('toolbar')
  else if (name === 'reset') runReset()
  else if (name === 'isolate') runIsolate()
}

const boot = window as AtlasWindow
boot.__atlasRunTool = runTool
if (boot.__atlasToolQueue?.length) queueMicrotask(flushQueue)
