import { useEffect, useState } from 'react'
import { subscribeToast } from '@/atlas/atlasToast'
import { useAtlas } from '@/atlas/AtlasProvider'

/**
 * Lives in the chrome overlay (inside #root), not on document.body.
 * Preview / computerUse shots capture #root and missed the body portal.
 * Stays up for the whole Focus session so it cannot time out before a screenshot.
 */
export function FocusFiredBanner() {
  const { viewMode } = useAtlas()
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => subscribeToast(setMessage), [])

  if (viewMode !== 'focus' || !message) return null

  return (
    <div
      data-atlas-toast
      data-atlas-focus-fired={message}
      role="status"
      className="pointer-events-none absolute top-3 left-1/2 z-50 -translate-x-1/2 rounded-lg px-5 py-2.5 text-[18px] font-bold tracking-[0.04em] shadow-[0_8px_32px_rgb(0_0_0_/_0.45)]"
      style={{ background: '#3AD1C7', color: '#0B0D10' }}
    >
      {message}
    </div>
  )
}
