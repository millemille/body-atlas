/** QA chrome: HUD, dock outline, FIRED toasts. Off in production unless `?debug=1`. */
export function isAtlasDebug(): boolean {
  if (import.meta.env.DEV) return true
  if (typeof window === 'undefined') return false
  try {
    return new URLSearchParams(window.location.search).get('debug') === '1'
  } catch {
    return false
  }
}

export function syncAtlasDebugFlag() {
  const w = window as Window & { __ATLAS_DEBUG__?: boolean }
  w.__ATLAS_DEBUG__ = isAtlasDebug()
  return w.__ATLAS_DEBUG__
}
