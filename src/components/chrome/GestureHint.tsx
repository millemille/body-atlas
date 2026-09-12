import { useEffect, useState } from 'react'

const KEY = 'body-atlas-gesture-hint'

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
    <p className="max-w-xl text-center text-[10px] tracking-wide text-muted-ink/80">
      Drag to orbit · click a structure · scroll to zoom
    </p>
  )
}
