import { useLayoutEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { ACESFilmicToneMapping, PMREMGenerator } from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { useAtlas } from '@/atlas/AtlasProvider'
import { CHROME } from '@/atlas/colors'
import {
  FILL_INTENSITY,
  FOCUS_EXPOSURE,
  HOME_EXPOSURE,
  IBL_INTENSITY,
  KEY_COLOR,
  KEY_INTENSITY,
  KEY_POS,
  RIM_COLOR,
  RIM_INTENSITY,
  RIM_POS,
} from '@/atlas/studioLook'

/** Dark RoomEnvironment PMREM — studio spec only, no outdoor HDR fetch. */
function StudioIbl() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)

  useLayoutEffect(() => {
    const pmrem = new PMREMGenerator(gl)
    const envScene = new RoomEnvironment()
    const env = pmrem.fromScene(envScene, 0.04).texture
    scene.environment = env
    scene.environmentIntensity = IBL_INTENSITY
    envScene.dispose()
    return () => {
      scene.environment = null
      env.dispose()
      pmrem.dispose()
    }
  }, [gl, scene])

  return null
}

function FocusExposure() {
  const { viewMode } = useAtlas()
  const gl = useThree((s) => s.gl)

  useLayoutEffect(() => {
    gl.toneMapping = ACESFilmicToneMapping
    gl.toneMappingExposure = viewMode === 'focus' ? FOCUS_EXPOSURE : HOME_EXPOSURE
  }, [gl, viewMode])

  return null
}

export function StudioLights() {
  return (
    <>
      <color attach="background" args={[CHROME.void]} />
      <fog attach="fog" args={[CHROME.void, 14, 24]} />
      <ambientLight color="#12110f" intensity={FILL_INTENSITY} />
      <directionalLight
        position={[...KEY_POS]}
        intensity={KEY_INTENSITY}
        color={KEY_COLOR}
        castShadow={false}
      />
      <directionalLight
        position={[...RIM_POS]}
        intensity={RIM_INTENSITY}
        color={RIM_COLOR}
        castShadow={false}
      />
      <StudioIbl />
      <FocusExposure />
    </>
  )
}
