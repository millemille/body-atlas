import { recordToolbarEvent } from './atlasDebug'
import { isAtlasDebug } from './debugMode'

type ToastFn = (message: string) => void

const listeners = new Set<ToastFn>()

export function subscribeToast(fn: ToastFn) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

export function showAtlasToast(message: string) {
  if (!isAtlasDebug()) return
  recordToolbarEvent(message)
  listeners.forEach((fn) => fn(message))
  paintDomToast(message)
}

let hideToast = 0

/** Debug-only. Production must not show CARD/TOOLBAR FOCUS FIRED. */
function paintDomToast(message: string) {
  if (typeof document === 'undefined') return
  if (!isAtlasDebug()) return
  let el = document.getElementById('atlas-focus-toast')
  if (!el) {
    el = document.createElement('div')
    el.id = 'atlas-focus-toast'
    el.setAttribute('data-atlas-toast', '')
    document.body.appendChild(el)
  }
  el.textContent = message
  el.style.cssText =
    'position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:2147483647;pointer-events:none;border-radius:8px;background:#3AD1C7;color:#0B0D10;padding:12px 20px;font-size:18px;font-weight:700;letter-spacing:0.04em;box-shadow:0 8px 32px rgb(0 0 0 / 0.45);font-family:ui-sans-serif,system-ui,sans-serif'
  el.style.display = 'block'
  document.title = `${message} — Body Atlas`
  window.clearTimeout(hideToast)
  hideToast = window.setTimeout(() => {
    el!.style.display = 'none'
    if (document.title.startsWith(message)) document.title = 'Body Atlas'
  }, 12000)
}
