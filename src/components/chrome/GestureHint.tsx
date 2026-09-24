import { useEffect, useState } from 'react'

const KEY = 'body-atlas-gesture-hint'
const HINT = 'max-w-xl text-center text-[10px] tracking-wide text-muted-ink/80'

export function GestureHint() {
  const [show, setShow] = useState(() => {
    try {
      return sessionStorage.getItem(KEY) !== '1'
    } catch {
      return true
    }
  })

  useEffect(() => {
    if (!show) return
    const hide = () => {
      try {
        sessionStorage.setItem(KEY, '1')
      } catch {
        /* ignore */
      }
      setShow(false)
    }
    const timer = window.setTimeout(hide, 5200)
    window.addEventListener('pointerdown', hide, { once: true })
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('pointerdown', hide)
    }
  }, [show])

  if (!show) return null

  return (
    <>
      <p className={`hidden ${HINT} md:block`}>
        Drag to orbit · click a structure · scroll to zoom
      </p>
      <p className={`${HINT} md:hidden`}>
        Drag to orbit · tap a structure · pinch to zoom
      </p>
    </>
  )
}
