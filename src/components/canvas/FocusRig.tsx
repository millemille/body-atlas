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
import { easeRegionPose, JUMP_BY_ID, JUMP_MS, regionDolly, type JumpRegionId } from '@/atlas/jumpTo'
import { setOrbitHeld } from '@/atlas/pointerSession'
import { LEAN_MS, MUSCLE_LEAN_DELAY_FRAMES, deferLeanFor, easeOutCubic, selectLean } from '@/atlas/selectLean'
import { getStructure } from '@/atlas/structures'

type DampedControls = OrbitControlsImpl & {
  sphericalDelta?: { set: (t: number, p: number, r: number) => void }
  panOffset?: Vector3
  scale?: number
  minDistance: number
  enableDamping: boolean
  setScale?: (scale: number) => void
}

const easePos = new Vector3()
const easeTarget = new Vector3()

type Pose = { pos: Vector3; target: Vector3 }

type LeanAnim = {
  fromPos: Vector3
  fromTarget: Vector3
  toPos: Vector3
  toTarget: Vector3
  start: number
  duration: number
}

/** Catalog Focus re-applies every frame so Orbit cannot restore lean range. Jump eases a region frame once. */

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
  if (camera.near !== SAFE_DOLLY_NEAR || camera.fov !== HOME_CAMERA.fov) {
    camera.near = SAFE_DOLLY_NEAR
    camera.fov = HOME_CAMERA.fov
    camera.updateProjectionMatrix()
  }
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

function prepareRegionEase(c: DampedControls, camera: PerspectiveCamera) {
  camera.near = SAFE_DOLLY_NEAR
  camera.fov = HOME_CAMERA.fov
  camera.updateProjectionMatrix()
  c.minDistance = FOCUS_MIN_DISTANCE
  c.maxDistance = SAFE_ORBIT_MAX
  c.enableDamping = false
  c.sphericalDelta?.set(0, 0, 0)
  c.panOffset?.set(0, 0, 0)
}

function finishRegionEase(c: DampedControls) {
  c.enabled = true
  c.enableDamping = true
  c.minDistance = FOCUS_MIN_DISTANCE
  c.maxDistance = SAFE_ORBIT_MAX
  c.sphericalDelta?.set(0, 0, 0)
  c.panOffset?.set(0, 0, 0)
  if (c.scale !== undefined) c.scale = 1
  c.update()
  c.saveState()
  setOrbitHeld(false)
}

function readPose(c: DampedControls, camera: PerspectiveCamera): Pose {
  return { pos: camera.position.clone(), target: c.target.clone() }
}

function regionFrameFor(id: JumpRegionId, selected: Structure | null) {
  const region = JUMP_BY_ID[id]
  const leaf = getStructure(region.leafId) ?? selected
  if (!leaf) return null
  return regionDolly(region, leaf)
}

export function FocusRig({
  controls,
}: {
  controls: RefObject<OrbitControlsImpl | null>
}) {
  const { selected, viewMode, viewEpoch, focusNonce, jumpRegionId } = useAtlas()
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const gl = useThree((s) => s.gl)
  const booted = useRef(false)
  const held = useRef<Pose | null>(null)
  const lastEpoch = useRef(viewEpoch)
  const explore = useRef<Pose | null>(null)
  const anim = useRef<LeanAnim | null>(null)
  const leanDelay = useRef(0)
  const pendingLean = useRef<{ from: Pose; to: Pose } | null>(null)
  const viewModeRef = useRef(viewMode)
  const selectedRef = useRef(selected)
  const jumpRegionIdRef = useRef(jumpRegionId)
  const wasFocus = useRef(false)
  viewModeRef.current = viewMode
  selectedRef.current = selected
  jumpRegionIdRef.current = jumpRegionId

  useEffect(() => {
    const el = gl.domElement
    const release = () => {
      held.current = null
    }
    el.addEventListener('pointerdown', release)
    el.addEventListener('wheel', release, { passive: true })
    return () => {
      el.removeEventListener('pointerdown', release)
      el.removeEventListener('wheel', release)
    }
  }, [gl])

  useEffect(() => {
    let cancelled = false

    const startLean = (c: DampedControls, from: Pose, to: Pose, duration = LEAN_MS) => {
      anim.current = {
        fromPos: from.pos.clone(),
        fromTarget: from.target.clone(),
        toPos: to.pos.clone(),
        toTarget: to.target.clone(),
        start: performance.now(),
        duration,
      }
      c.minDistance = FOCUS_MIN_DISTANCE
      c.maxDistance = SAFE_ORBIT_MAX
      c.enableDamping = duration === JUMP_MS ? false : true
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
        wasFocus.current = viewMode === 'focus'
        if (!(viewMode === 'focus' && selected)) return
      }

      const epochChanged = viewEpoch !== lastEpoch.current
      lastEpoch.current = viewEpoch
      const leavingFocus = wasFocus.current && viewMode === 'default'
      wasFocus.current = viewMode === 'focus'

      if (viewMode === 'focus' && jumpRegionId) {
        held.current = null
        const regionFrame = regionFrameFor(jumpRegionId, selected)
        if (regionFrame) {
          leanDelay.current = 0
          pendingLean.current = null
          prepareRegionEase(c, camera)
          setOrbitHeld(true)
          c.enabled = false
          const now = readPose(c, camera)
          startLean(
            c,
            now,
            { pos: regionFrame.position, target: regionFrame.target },
            JUMP_MS,
          )
          return
        }
      }

      setOrbitHeld(false)
      c.enabled = true

      if (viewMode === 'focus' && selected) {
        held.current = null
        anim.current = null
        leanDelay.current = 0
        pendingLean.current = null
        applyCatalogDolly(c, camera, selected)
        return
      }

      if (viewMode !== 'default') return

      const freezeCamera = () => {
        const pose = readPose(c, camera)
        explore.current = null
        anim.current = null
        leanDelay.current = 0
        pendingLean.current = null
        c.enableDamping = true
        c.minDistance = FOCUS_MIN_DISTANCE
        c.maxDistance = SAFE_ORBIT_MAX
        c.setScale?.(1)
        if (c.scale !== undefined) c.scale = 1
        c.sphericalDelta?.set(0, 0, 0)
        c.panOffset?.set(0, 0, 0)
        c.update()
        camera.position.copy(pose.pos)
        c.object.position.copy(pose.pos)
        c.target.copy(pose.target)
        camera.lookAt(pose.target)
        c.update()
        held.current = pose
        c.saveState()
      }

      if (epochChanged) {
        held.current = null
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

      // Card close and leaving Focus keep the current camera. Reset is the home snap.
      if (leavingFocus || !selected) {
        freezeCamera()
        return
      }

      const now = readPose(c, camera)
      if (selected) {
        held.current = null
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
      }
    }

    aim()
    return () => {
      cancelled = true
      setOrbitHeld(false)
    }
  }, [camera, controls, selected, viewMode, viewEpoch, focusNonce, jumpRegionId])

  // Priority stays 0. A positive useFrame priority makes R3F skip gl.render.
  useFrame(() => {
    const c = controls.current as DampedControls | null
    if (!c) return

    const mode = viewModeRef.current
    const part = selectedRef.current
    const jumpId = jumpRegionIdRef.current

    if (held.current && mode !== 'focus') {
      anim.current = null
      leanDelay.current = 0
      pendingLean.current = null
      camera.position.copy(held.current.pos)
      c.target.copy(held.current.target)
      camera.lookAt(held.current.target)
      c.sphericalDelta?.set(0, 0, 0)
      c.panOffset?.set(0, 0, 0)
      return
    }

    if (mode === 'focus' && jumpId) {
      leanDelay.current = 0
      pendingLean.current = null
      const a = anim.current
      if (!a) return
      c.enabled = false
      const t = (performance.now() - a.start) / a.duration
      const e = easeOutCubic(t > 1 ? 1 : t)
      easeRegionPose(a.fromPos, a.fromTarget, a.toPos, a.toTarget, e, easePos, easeTarget)
      camera.position.copy(easePos)
      c.target.copy(easeTarget)
      camera.lookAt(easeTarget)
      c.sphericalDelta?.set(0, 0, 0)
      c.panOffset?.set(0, 0, 0)
      if (c.scale !== undefined) c.scale = 1
      if (t >= 1) {
        anim.current = null
        finishRegionEase(c)
      }
      return
    }

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
    const e = easeOutCubic(t > 1 ? 1 : t)
    camera.position.lerpVectors(a.fromPos, a.toPos, e)
    c.target.lerpVectors(a.fromTarget, a.toTarget, e)
    camera.lookAt(c.target)
    c.sphericalDelta?.set(0, 0, 0)
    c.panOffset?.set(0, 0, 0)
    if (t >= 1) {
      anim.current = null
      if (c.scale !== undefined) c.scale = 1
      c.update()
    }
  })

  return null
}
