import { useEffect } from 'react'
import { subscribeDebug } from '@/atlas/atlasDebug'

/** Vanilla #atlas-hud is the source of truth. Keep React in sync if it exists. */
export function AtlasHud() {
  useEffect(() => {
    return subscribeDebug((ev) => {
      const w = window as Window & {
        __atlasLastToolbarEvent?: string
        __atlasLastPointer?: string
        __atlasCaptureMounted?: boolean
        __atlasPaintHud?: () => void
      }
      if (ev.lastToolbarEvent !== 'none' && ev.lastToolbarEvent !== 'capture: mounted') {
        w.__atlasLastToolbarEvent = ev.lastToolbarEvent
      }
      w.__atlasCaptureMounted = true
      w.__atlasPaintHud?.()
    })
  }, [])

  return null
}
