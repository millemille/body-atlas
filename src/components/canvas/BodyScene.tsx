import { OrbitControls } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef, useState, type RefObject } from 'react'
import { MathUtils, MOUSE, Vector3 } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useAtlas } from '@/atlas/AtlasProvider'
import { CHROME } from '@/atlas/colors'
import {
  chromeInteracted,
  endPointer,
  notePointerDown,
  notePointerMove,
  notePointerUp,
  registerOrbitControls,
  tookAtlasPick,
  wasDrag,
} from '@/atlas/pointerSession'
import { HOME_CAMERA, ORBIT_TARGET_BOUNDS } from '@/atlas/cameraHome'
import { installWebglContextGuard } from '@/atlas/gpuCrash'
import { CANVAS_DPR, MUSCLE_MOUNT_MS } from '@/atlas/muscleReveal'
import { resolveAtlasHits } from '@/atlas/pickPriority'
import { FocusRig } from './FocusRig'
import { SceneReady } from './SceneReady'
import { StudioLights } from './StudioLights'
import { MuscleLayer } from './layers/MuscleLayer'
import { NerveLayer } from './layers/NerveLayer'
import { OtherLayer } from './layers/OtherLayer'
import { SkeletonLayer } from './layers/SkeletonLayer'
import { VesselLayer } from './layers/VesselLayer'
import { SceneErrorBoundary } from './SceneErrorBoundary'

function Figure() {
  const { hotSystems, skeletonLoad } = useAtlas()
  const [muscleMounted, setMuscleMounted] = useState(false)
  const muscleOn = hotSystems.includes('muscle')
  const ivoryReady = skeletonLoad.phase === 'ready'
  useEffect(() => {
    if (!muscleOn) {
      setMuscleMounted(false)
      return
    }
    if (!ivoryReady || muscleMounted) return
    let cancelled = false
    const t = window.setTimeout(() => {
      if (!cancelled) setMuscleMounted(true)
    }, MUSCLE_MOUNT_MS)
    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [ivoryReady, muscleMounted, muscleOn])
  useEffect(() => {
    if (muscleMounted) document.documentElement.dataset.atlasMuscle = 'on'
    else delete document.documentElement.dataset.atlasMuscle
  }, [muscleMounted])
  return (
    <group>
      <VesselLayer />
      <NerveLayer />
      <OtherLayer />
      <SkeletonLayer />
      {muscleMounted ? <MuscleLayer /> : null}
    </group>
  )
}

function ClampOrbit({
  controls,
}: {
  controls: RefObject<OrbitControlsImpl | null>
}) {
  const { viewMode } = useAtlas()
  useFrame(() => {
    const c = controls.current
    if (!c || viewMode === 'focus') return
    const b = ORBIT_TARGET_BOUNDS
    c.target.x = MathUtils.clamp(c.target.x, b.x[0], b.x[1])
    c.target.y = MathUtils.clamp(c.target.y, b.y[0], b.y[1])
    c.target.z = MathUtils.clamp(c.target.z, b.z[0], b.z[1])
  })
  return null
}

/** Lock DPR. Do not resize the drawing buffer when Muscle turns on. */
function MuscleGpuGuard() {
  const gl = useThree((s) => s.gl)
  useEffect(() => {
    gl.setPixelRatio(CANVAS_DPR)
    return installWebglContextGuard(gl.domElement, {
      onLost: () => {
        document.documentElement.dataset.atlasGpu = 'lost'
      },
      onRestored: () => {
        document.documentElement.dataset.atlasGpu = 'ok'
      },
    })
  }, [gl])
  return null
}

function BindPickPriority() {
  const { hotSystems } = useAtlas()
  const setEvents = useThree((s) => s.setEvents)
  useEffect(() => {
    const hot = [...hotSystems]
    setEvents({
      filter: (hits, state) =>
        resolveAtlasHits(hits, hot, state.camera.position, state.raycaster.ray.direction),
    })
  }, [setEvents, hotSystems])
  return null
}

function qaEnabled() {
  if (typeof window === 'undefined') return false
  try {
    return new URLSearchParams(window.location.search).has('qa')
  } catch {
    return false
  }
}

/** Self-QA only (`?qa=1`): set orbit + project world points. Does not change pick. */
function BindQA({
  controls,
}: {
  controls: RefObject<OrbitControlsImpl | null>
}) {
  const camera = useThree((s) => s.camera)
  const gl = useThree((s) => s.gl)
  useEffect(() => {
    if (!qaEnabled()) return
    const w = window as Window & {
      __atlasQA?: {
        setOrbit: (pos: [number, number, number], target: [number, number, number]) => boolean
        project: (world: [number, number, number]) => { x: number; y: number; visible: boolean }
        camera: () => { x: number; y: number; z: number }
      }
    }
    w.__atlasQA = {
      setOrbit(pos, target) {
        const c = controls.current
        if (!c) return false
        c.enableDamping = false
        camera.position.set(pos[0], pos[1], pos[2])
        c.object.position.set(pos[0], pos[1], pos[2])
        c.target.set(target[0], target[1], target[2])
        camera.lookAt(target[0], target[1], target[2])
        camera.updateMatrixWorld(true)
        c.update()
        return true
      },
      project(world) {
        const v = new Vector3(world[0], world[1], world[2])
        v.project(camera)
        const rect = gl.domElement.getBoundingClientRect()
        return {
          x: rect.left + (v.x * 0.5 + 0.5) * rect.width,
          y: rect.top + (-v.y * 0.5 + 0.5) * rect.height,
          visible: Math.abs(v.x) <= 1.15 && Math.abs(v.y) <= 1.15 && v.z >= -1 && v.z <= 1,
        }
      },
      camera() {
        return { x: camera.position.x, y: camera.position.y, z: camera.position.z }
      },
    }
    return () => {
      delete w.__atlasQA
    }
  }, [camera, controls, gl])
  return null
}

function BindOrbit({
  controls,
}: {
  controls: RefObject<OrbitControlsImpl | null>
}) {
  useEffect(() => {
    const bind = () => {
      registerOrbitControls(controls.current)
    }
    bind()
    const id = window.setInterval(bind, 400)
    return () => {
      window.clearInterval(id)
      registerOrbitControls(null)
    }
  }, [controls])
  return null
}

export function BodyScene() {
  const { select, viewEpoch } = useAtlas()
  const controls = useRef<OrbitControlsImpl>(null)

  return (
    <SceneErrorBoundary resetKey={viewEpoch}>
      <Canvas
        dpr={CANVAS_DPR}
        camera={HOME_CAMERA}
        gl={{
          antialias: false,
          alpha: false,
          stencil: false,
          powerPreference: 'default',
          failIfMajorPerformanceCaveat: false,
        }}
        style={{
          background: CHROME.void,
          width: '100%',
          height: '100%',
          touchAction: 'none',
          userSelect: 'none',
        }}
        onCreated={({ gl }) => {
          gl.setPixelRatio(CANVAS_DPR)
          gl.setClearColor(CHROME.void, 1)
          gl.setClearAlpha(1)
        }}
        onPointerDown={(e) => {
          notePointerDown(e.clientX, e.clientY)
        }}
        onPointerMove={(e) => {
          notePointerMove(e.clientX, e.clientY, e.buttons)
        }}
        onPointerUp={() => notePointerUp()}
        onPointerCancel={() => notePointerUp()}
        onPointerMissed={(e) => {
          if (wasDrag() || chromeInteracted() || tookAtlasPick()) return
          if (e.target instanceof Element && e.target.closest('[data-atlas-chrome]')) return
          select(null)
        }}
      >
        <StudioLights />
        <MuscleGpuGuard />
        <BindPickPriority />
        <Figure />
        <OrbitControls
          ref={controls}
          makeDefault
          enableDamping
          dampingFactor={0.05}
          rotateSpeed={0.52}
          zoomSpeed={0.8}
          enablePan
          screenSpacePanning
          minDistance={0.1}
          maxDistance={6}
          minPolarAngle={0.1}
          maxPolarAngle={Math.PI * 0.92}
          mouseButtons={{
            LEFT: MOUSE.ROTATE,
            MIDDLE: MOUSE.DOLLY,
            RIGHT: MOUSE.PAN,
          }}
          onEnd={() => endPointer()}
        />
        <BindOrbit controls={controls} />
        <BindQA controls={controls} />
        <ClampOrbit controls={controls} />
        <FocusRig controls={controls} />
        <SceneReady />
      </Canvas>
    </SceneErrorBoundary>
  )
}
