/** Chrome Error 9 / Aw Snap: the GPU process died. JS cannot recover that. */
export const GPU_CRASH_HINT = /Aw,\s*Snap|error code:\s*9|STATUS_ACCESS_VIOLATION|CONTEXT_LOST/i

export type GpuGuardHandlers = {
  onLost?: () => void
  onRestored?: () => void
}

/**
 * Recoverable WebGL context loss only. Aw Snap Error 9 kills the GPU process
 * before this fires — do not treat this as a substitute for cheaper Muscle ON.
 */
export function installWebglContextGuard(canvas: HTMLCanvasElement, handlers: GpuGuardHandlers = {}) {
  const onLost = (event: Event) => {
    event.preventDefault()
    handlers.onLost?.()
  }
  const onRestored = () => {
    handlers.onRestored?.()
  }
  canvas.addEventListener('webglcontextlost', onLost, false)
  canvas.addEventListener('webglcontextrestored', onRestored, false)
  return () => {
    canvas.removeEventListener('webglcontextlost', onLost, false)
    canvas.removeEventListener('webglcontextrestored', onRestored, false)
  }
}

export function looksLikeGpuCrash(text: string | null | undefined) {
  return Boolean(text && GPU_CRASH_HINT.test(text))
}
