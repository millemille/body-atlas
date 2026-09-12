import { useEffect } from 'react'
import { useAtlas } from '@/atlas/AtlasProvider'
import { SYSTEM_IDS } from '@/atlas/types'

export function KeyboardShortcuts() {
  const {
    toggleSystem,
    select,
    resetView,
    toggleFocus,
    exitFocus,
    toggleIsolate,
    viewMode,
    selected,
  } = useAtlas()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLButtonElement ||
        (e.target instanceof Element && e.target.closest('[data-atlas-tool]'))
      ) {
        return
      }
      if (e.key === 'Escape') {
        if (viewMode === 'focus') exitFocus()
        else select(null)
        return
      }
      if (e.key === 'r' || e.key === 'R') {
        resetView()
        return
      }
      if ((e.key === 'f' || e.key === 'F') && selected) {
        toggleFocus()
        return
      }
      if ((e.key === 'i' || e.key === 'I') && selected) {
        toggleIsolate()
        return
      }
      const idx = Number(e.key) - 1
      if (idx >= 0 && idx < SYSTEM_IDS.length) {
        toggleSystem(SYSTEM_IDS[idx])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [
    exitFocus,
    resetView,
    select,
    selected,
    toggleFocus,
    toggleIsolate,
    toggleSystem,
    viewMode,
  ])

  return null
}
