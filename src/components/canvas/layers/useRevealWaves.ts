import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { idsThroughWaves } from '@/atlas/muscleReveal'

export function useRevealWaves(
  active: boolean,
  waves: readonly (readonly string[])[],
  idleFrames: number,
  holdFrames = 4,
) {
  const [wave, setWave] = useState(-1)
  const waveRef = useRef(-1)
  const idle = useRef(0)
  const hold = useRef(0)
  useFrame(() => {
    if (!active) {
      hold.current = 0
      return
    }
    if (waveRef.current >= waves.length - 1) return
    if (waveRef.current < 0) {
      hold.current += 1
      if (hold.current < holdFrames) return
      waveRef.current = 0
      setWave(0)
      idle.current = 0
      return
    }
    idle.current += 1
    if (idle.current < idleFrames) return
    idle.current = 0
    waveRef.current += 1
    setWave(waveRef.current)
  })
  const shown = useMemo(() => idsThroughWaves(waves, wave), [wave, waves])
  return { shown, complete: wave >= waves.length - 1 && wave >= 0 }
}
