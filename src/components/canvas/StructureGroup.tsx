import { useFrame } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'
import { Color, Group, MathUtils, Mesh, Vector3, type MeshPhysicalMaterial, type MeshStandardMaterial } from 'three'
import { groupRaycast, markPickable, skipRaycast } from '@/atlas/atlasRaycast'
import { useAtlas } from '@/atlas/AtlasProvider'
import {
  isDragging,
  notePointerDown,
  notePointerMove,
  wasDrag,
} from '@/atlas/pointerSession'
import { hideForIsolate, isPartPickable } from '@/atlas/pickable'
import { pickAtlasIdOrSelf } from '@/atlas/pickPriority'
import {
  FOCUS_SELECTION_ALBEDO_MIX,
  FOCUS_SELECTION_EMISSIVE_INTENSITY,
  HOVER_EMISSIVE_INTENSITY,
  MUSCLE_SELECTION_ALBEDO_MIX,
  MUSCLE_SELECTION_EMISSIVE_INTENSITY,
  SELECTION_EMISSIVE_INTENSITY,
  selectionEmissiveColor,
  tintHoverAlbedo,
  tintSelectedAlbedo,
} from '@/atlas/selectionTint'
import { restDimApplies } from '@/atlas/restKit'
import { REST_LIGHTNESS, REST_OPACITY, REST_SATURATION } from '@/atlas/studioLook'
import { STRUCTURE_BY_ID } from '@/atlas/structures'
import { StructureRenderProvider } from './structureState'

type Material = MeshStandardMaterial | MeshPhysicalMaterial

const hsl = { h: 0, s: 0, l: 0 }
const work = new Color()
const SELECT_GROW = 0.08
const tmpScale = new Vector3()
const paintedMats = new Set<Material>()
const structureTicks = new Set<(dt: number) => void>()

/** One scene tick instead of a useFrame subscription on every bone. */
export function StructureMotion() {
  useFrame((_, dt) => {
    if (structureTicks.size === 0) return
    for (const tick of structureTicks) tick(dt)
  })
  return null
}

function cubicOut(t: number) {
  const x = MathUtils.clamp(t, 0, 1)
  return 1 - (1 - x) ** 3
}

function paintGroup(
  g: Group,
  opacityValue: number,
  opts: { selected: boolean; rest: boolean; pickable: boolean; grow: number; focus: boolean },
) {
  paintedMats.clear()
  g.traverse((obj) => {
    if (!(obj instanceof Mesh)) return
    if (obj.userData.rim || obj.userData.skipFade) return

    if (obj.userData.centered !== false) {
      if (!obj.userData.baseScale) obj.userData.baseScale = obj.scale.clone()
      const base = obj.userData.baseScale as Vector3
      const s = opts.selected && obj.userData.atlasSystem !== 'muscle' ? opts.grow : 1
      tmpScale.copy(base).multiplyScalar(s)
      obj.scale.copy(tmpScale)
    }

    const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
    for (const mat of mats) {
      const m = mat as Material
      if (!m || m.opacity === undefined || m.userData.skipFade) continue
      if (paintedMats.has(m)) continue
      paintedMats.add(m)
      const base = (m.userData.baseOpacity as number | undefined) ?? 1
      const o = opacityValue * base
      m.opacity = o
      if (m.userData.solidBone) {
        m.transparent = o < 0.96
        // −40% rest (0.6) still writes depth so thin bones / heel stay readable.
        m.depthWrite = o >= 0.55
      } else {
        m.transparent = true
      }
      const baseE = (m.userData.baseEmissive as number | undefined) ?? 0.03
      const leaf = Boolean(m.userData.leafHover) && !opts.selected && opts.pickable
      if (m.emissive && !m.userData.baseEmissiveColor) {
        m.userData.baseEmissiveColor = m.emissive.clone()
      }
      if (opts.selected && m.emissive && !m.userData.muscleGel) {
        m.emissive.copy(selectionEmissiveColor())
        m.emissiveIntensity = opts.focus
          ? FOCUS_SELECTION_EMISSIVE_INTENSITY
          : SELECTION_EMISSIVE_INTENSITY
      } else if (opts.selected && m.userData.muscleGel && m.emissive) {
        if (m.userData.baseEmissiveColor) {
          m.emissive.copy(m.userData.baseEmissiveColor as Color)
        }
        m.emissiveIntensity = MUSCLE_SELECTION_EMISSIVE_INTENSITY
      } else if (leaf && m.emissive) {
        m.emissive.copy(selectionEmissiveColor())
        m.emissiveIntensity = HOVER_EMISSIVE_INTENSITY
      } else {
        if (m.emissive && m.userData.baseEmissiveColor) {
          m.emissive.copy(m.userData.baseEmissiveColor as Color)
        }
        m.emissiveIntensity = opts.rest ? 0 : baseE
      }
      if (m.color) {
        if (!m.userData.baseColor) m.userData.baseColor = m.color.clone()
        work.copy(m.userData.baseColor as Color)
        if (opts.selected) {
          tintSelectedAlbedo(
            m.userData.baseColor as Color,
            work,
            m.userData.muscleGel
              ? MUSCLE_SELECTION_ALBEDO_MIX
              : opts.focus
                ? FOCUS_SELECTION_ALBEDO_MIX
                : undefined,
          )
        } else if (leaf) {
          tintHoverAlbedo(m.userData.baseColor as Color, work)
        } else if (opts.rest) {
          work.getHSL(hsl)
          work.setHSL(hsl.h, hsl.s * REST_SATURATION, hsl.l * REST_LIGHTNESS)
        }
        m.color.copy(work)
      }
    }
  })
}

export function StructureGroup({
  id,
  children,
}: {
  id: string
  children: ReactNode
}) {
  const { selectedId, isolated, viewMode, hotSystems, select, enterFocus } = useAtlas()
  const structure = STRUCTURE_BY_ID[id]
  const pivot = structure.position
  const root = useRef<Group>(null)
  const opacity = useRef(hotSystems.includes(structure.system) ? 1 : 0)
  const scaleT = useRef(0)

  const selected = selectedId === id
  const rest = restDimApplies(selectedId, id)
  const systemHot = hotSystems.includes(structure.system)
  const pickable = isPartPickable(systemHot, isolated, selectedId, id)
  const isolatedAway = hideForIsolate(isolated, selectedId, id)

  useLayoutEffect(() => {
    const g = root.current
    if (!g) return
    markPickable(g, pickable)
    if (!systemHot || isolatedAway) {
      g.visible = false
      g.scale.setScalar(isolatedAway ? 0.001 : 1)
      // Do not paint opacity 0. Hidden groups with faded porcelain never
      // recovered — useFrame early-returned after opacity snapped back to 1.
      if (!isolatedAway) opacity.current = 1
      else opacity.current = 0
      return
    }
    opacity.current = 1
    g.visible = true
    g.scale.setScalar(1)
    paintGroup(g, 1, {
      selected,
      rest,
      pickable,
      grow: 1,
      focus: viewMode === 'focus',
    })
  }, [isolatedAway, pickable, rest, selected, structure.system, systemHot, viewMode])

  const targetOpacity = useMemo(() => {
    if (!systemHot) return 0
    if (isolatedAway) return 0
    // Focus keeps the kit solid. Rest-dim (0.2 / transparent) depth-killed the heel.
    if (viewMode === 'focus') return 1
    if (rest) return REST_OPACITY
    return 1
  }, [isolatedAway, rest, systemHot, viewMode])

  useEffect(() => {
    if (structure.system === 'muscle' || !systemHot || isolatedAway) return
    const idle =
      !selected &&
      !rest &&
      Math.abs(opacity.current - targetOpacity) < 0.004 &&
      scaleT.current <= 0.01
    if (idle) return

    let stop = false
    const tick = (dt: number) => {
      if (stop) return
      const g = root.current
      if (!g) return
      const fadeK = Math.min(1, dt / 0.2)
      opacity.current += (targetOpacity - opacity.current) * fadeK
      scaleT.current = MathUtils.clamp(scaleT.current + (selected ? dt : -dt) / 0.32, 0, 1)
      const grow = 1 + SELECT_GROW * cubicOut(scaleT.current)
      const opacitySettled = Math.abs(opacity.current - targetOpacity) <= 0.004
      const scaleSettled = selected ? scaleT.current >= 1 : scaleT.current <= 0.01
      g.scale.setScalar(1)
      g.visible = true
      paintGroup(g, opacity.current, {
        selected,
        rest,
        pickable,
        grow,
        focus: viewMode === 'focus',
      })
      if (opacitySettled && scaleSettled) {
        stop = true
        structureTicks.delete(tick)
      }
    }
    structureTicks.add(tick)
    return () => {
      stop = true
      structureTicks.delete(tick)
    }
  }, [isolatedAway, pickable, rest, selected, structure.system, systemHot, targetOpacity, viewMode])

  return (
    <StructureRenderProvider value={{ id, selected, hovered: false, pickable }}>
      <group position={pivot}>
        <group
          ref={root}
          name={id}
          raycast={pickable ? groupRaycast : skipRaycast}
          onPointerDown={(e) => {
            if (!pickable) return
            notePointerDown(e.clientX, e.clientY)
          }}
          onPointerMove={(e) => {
            notePointerMove(e.clientX, e.clientY, e.buttons)
            if (isDragging()) document.body.style.cursor = 'grabbing'
          }}
          onDoubleClick={(e) => {
            e.stopPropagation()
            if (wasDrag()) return
            const next = pickAtlasIdOrSelf(
              e.intersections,
              hotSystems,
              e.camera.position,
              e.ray?.direction,
              pickable ? id : undefined,
            )
            if (!next) return
            const sys = STRUCTURE_BY_ID[next]?.system
            if (sys && !hotSystems.includes(sys)) return
            select(next)
            enterFocus()
          }}
        >
          <group position={[-pivot[0], -pivot[1], -pivot[2]]}>{children}</group>
        </group>
      </group>
    </StructureRenderProvider>
  )
}
