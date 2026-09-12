import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef, type RefObject } from 'react'
import { Vector3, type PerspectiveCamera } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useAtlas } from '@/atlas/AtlasProvider'
import type { Structure } from '@/atlas/types'
import { HOME_CAMERA, HOME_POS, HOME_TARGET } from '@/atlas/cameraHome'
import {
  FOCUS_MIN_DISTANCE,
  SAFE_DOLLY_NEAR,
  SAFE_ORBIT_MAX,
  SAFE_ORBIT_MIN,
  catalogDolly,
} from '@/atlas/focusAim'
import { LEAN_MS, MUSCLE_LEAN_DELAY_FRAMES, deferLeanFor, easeOutCubic, selectLean } from '@/atlas/selectLean'

type DampedControls = OrbitControlsImpl & {
  sphericalDelta?: { set: (t: number, p: number, r: number) => void }
  panOffset?: Vector3
  minDistance: number
  enableDamping: boolean
  setScale?: (scale: number) => void
}

type Pose = { pos: Vector3; target: Vector3 }

type LeanAnim = {
  fromPos: Vector3
  fromTarget: Vector3
  toPos: Vector3
  toTarget: Vector3
  start: number
  duration: number
}

/** Re-apply catalog dolly for the whole Focus session so OrbitControls cannot restore lean range. */

function snapHome(c: DampedControls, camera: PerspectiveCamera) {
  camera.near = HOME_CAMERA.near
  camera.fov = HOME_CAMERA.fov
  camera.updateProjectionMatrix()
  c.minDistance = FOCUS_MIN_DISTANCE
  c.maxDistance = SAFE_ORBIT_MAX
  c.enableDamping = true
  c.object.position.copy(HOME_POS)
  camera.position.copy(HOME_POS)
  c.target.copy(HOME_TARGET)
  c.sphericalDelta?.set(0, 0, 0)
  c.panOffset?.set(0, 0, 0)
  c.update()
  c.saveState()
}

/**
 * Catalog write. Not snapOrbitToPose — no setScale, saveState, or min=max.
 * Skip controls.update() so leftover Orbit scale cannot inflate the heel-fill.
 */
function applyCatalogDolly(c: DampedControls, camera: PerspectiveCamera, selected: Structure) {
  const pose = catalogDolly(selected)
  camera.near = SAFE_DOLLY_NEAR
  camera.fov = HOME_CAMERA.fov
  camera.updateProjectionMatrix()
  c.minDistance = SAFE_ORBIT_MIN
  c.maxDistance = SAFE_ORBIT_MAX
  c.enableDamping = false
  c.target.copy(pose.target)
  camera.position.copy(pose.position)
  c.object.position.copy(pose.position)
  c.sphericalDelta?.set(0, 0, 0)
  c.panOffset?.set(0, 0, 0)
  camera.lookAt(pose.target)
}

function readPose(c: DampedControls, camera: PerspectiveCamera): Pose {
  return { pos: camera.position.clone(), target: c.target.clone() }
}

export function FocusRig({
  controls,
}: {
  controls: RefObject<OrbitControlsImpl | null>
}) {
  const { selected, viewMode, viewEpoch, focusNonce } = useAtlas()
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const booted = useRef(false)
  const lastEpoch = useRef(viewEpoch)
  const explore = useRef<Pose | null>(null)
  const anim = useRef<LeanAnim | null>(null)
  const leanDelay = useRef(0)
  const pendingLean = useRef<{ from: Pose; to: Pose } | null>(null)
  const viewModeRef = useRef(viewMode)
  const selectedRef = useRef(selected)
  viewModeRef.current = viewMode
  selectedRef.current = selected

  useEffect(() => {
    let cancelled = false

    const startLean = (c: DampedControls, from: Pose, to: Pose) => {
      anim.current = {
        fromPos: from.pos.clone(),
        fromTarget: from.target.clone(),
        toPos: to.pos.clone(),
        toTarget: to.target.clone(),
        start: performance.now(),
        duration: LEAN_MS,
      }
      c.minDistance = FOCUS_MIN_DISTANCE
      c.maxDistance = SAFE_ORBIT_MAX
      c.enableDamping = true
      c.sphericalDelta?.set(0, 0, 0)
      c.panOffset?.set(0, 0, 0)
    }

    const aim = () => {
      if (cancelled) return
      const c = controls.current as DampedControls | null
      if (!c) {
        requestAnimationFrame(aim)
        return
      }

      if (!booted.current) {
        booted.current = true
        snapHome(c, camera)
        lastEpoch.current = viewEpoch
        if (!(viewMode === 'focus' && selected)) return
      }

      const epochChanged = viewEpoch !== lastEpoch.current
      lastEpoch.current = viewEpoch

      if (viewMode === 'focus' && selected) {
        anim.current = null
        leanDelay.current = 0
        pendingLean.current = null
        applyCatalogDolly(c, camera, selected)
        return
      }

      if (viewMode !== 'default') return

      if (epochChanged) {
        snapHome(c, camera)
        try {
          c.reset()
        } catch {
          snapHome(c, camera)
        }
        explore.current = null
        anim.current = null
        leanDelay.current = 0
        pendingLean.current = null
        return
      }

      const now = readPose(c, camera)
      if (selected) {
        if (!explore.current) explore.current = now
        const stash = explore.current
        const lean = selectLean(selected, stash.pos, stash.target)
        const dest = { pos: lean.position, target: lean.target }
        if (deferLeanFor(selected)) {
          pendingLean.current = { from: now, to: dest }
          leanDelay.current = MUSCLE_LEAN_DELAY_FRAMES
          return
        }
        startLean(c, now, dest)
        return
      }

      if (explore.current) {
        leanDelay.current = 0
        pendingLean.current = null
        startLean(c, now, explore.current)
        explore.current = null
      }
    }

    aim()
    return () => {
      cancelled = true
    }
  }, [camera, controls, selected, viewMode, viewEpoch, focusNonce])

  useFrame(() => {
    const c = controls.current as DampedControls | null
    if (!c) return

    const mode = viewModeRef.current
    const part = selectedRef.current
    if (mode === 'focus' && part) {
      anim.current = null
      leanDelay.current = 0
      pendingLean.current = null
      applyCatalogDolly(c, camera, part)
      return
    }

    if (leanDelay.current > 0) {
      leanDelay.current -= 1
      const hold = pendingLean.current
      if (leanDelay.current <= 0 && hold && mode === 'default' && part) {
        pendingLean.current = null
        anim.current = {
          fromPos: hold.from.pos.clone(),
          fromTarget: hold.from.target.clone(),
          toPos: hold.to.pos.clone(),
          toTarget: hold.to.target.clone(),
          start: performance.now(),
          duration: LEAN_MS,
        }
        c.minDistance = FOCUS_MIN_DISTANCE
        c.maxDistance = SAFE_ORBIT_MAX
        c.enableDamping = true
        c.sphericalDelta?.set(0, 0, 0)
        c.panOffset?.set(0, 0, 0)
      }
      return
    }

    const a = anim.current
    if (!a) return
    const t = (performance.now() - a.start) / a.duration
    const e = easeOutCubic(t)
    camera.position.lerpVectors(a.fromPos, a.toPos, e)
    c.object.position.copy(camera.position)
    c.target.lerpVectors(a.fromTarget, a.toTarget, e)
    c.sphericalDelta?.set(0, 0, 0)
    c.update()
    if (t >= 1) anim.current = null
  })

  return null
}
