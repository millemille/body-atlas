import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { useAtlas } from '@/atlas/AtlasProvider'

export function SceneReady() {
  const { sceneReady, markSceneReady } = useAtlas()
  const frames = useRef(0)
  const compiled = useRef(false)

  useFrame(({ gl, scene, camera }) => {
    if (sceneReady) return
    if (!compiled.current) {
      compiled.current = true
      gl.compile(scene, camera)
    }
    frames.current += 1
    if (frames.current >= 3) markSceneReady()
  })

  return null
}
