export type DebugEvent = {
  lastToolbarEvent: string
  at: number
  captureMounted: boolean
  lastPointer: string
}

const start: DebugEvent = {
  lastToolbarEvent: 'none',
  at: 0,
  captureMounted: false,
  lastPointer: '—',
}
let state: DebugEvent = { ...start }
const listeners = new Set<(next: DebugEvent) => void>()

function paintWindow() {
  const w = window as Window & {
    __atlasLastToolbarEvent?: string
    __atlasLastPointer?: string
    __atlasCaptureMounted?: boolean
    __atlasPaintHud?: () => void
  }
  w.__atlasLastToolbarEvent = state.lastToolbarEvent
  if (state.lastPointer !== '—') w.__atlasLastPointer = state.lastPointer
  w.__atlasCaptureMounted = true
  w.__atlasPaintHud?.()
}

export function subscribeDebug(fn: (next: DebugEvent) => void) {
  listeners.add(fn)
  fn(state)
  return () => {
    listeners.delete(fn)
  }
}

function emit() {
  listeners.forEach((fn) => fn(state))
  paintWindow()
}

export function markCaptureMounted() {
  state = { ...state, captureMounted: true, lastToolbarEvent: state.lastToolbarEvent === 'none' ? 'capture: mounted' : state.lastToolbarEvent }
  emit()
}

export function recordToolbarEvent(label: string) {
  state = { ...state, lastToolbarEvent: label, at: Date.now() }
  emit()
}
