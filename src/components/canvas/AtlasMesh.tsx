import { useLayoutEffect, useRef, type ComponentProps } from 'react'
import { AdditiveBlending, BackSide, type Mesh, type MeshStandardMaterial } from 'three'
import { markPickable, meshRaycast, muscleRaycast, skipRaycast } from '@/atlas/atlasRaycast'
import { useAtlas } from '@/atlas/AtlasProvider'
import { pickAtlasIdOrSelf } from '@/atlas/pickPriority'
import { STRUCTURE_BY_ID } from '@/atlas/structures'
import { isDragging, wasDrag } from '@/atlas/pointerSession'
import { useStructureRender } from './structureState'

type MeshProps = ComponentProps<'mesh'> & {
  /** Local-centered geometry may scale. World-space tubes must not. */
  centered?: boolean
}

/** Soft porcelain-teal halo. Additive, not a hard MeshBasic stroke. */
function SelectedRim({ on, soft }: { on: boolean; soft: boolean }) {
  const rim = useRef<Mesh>(null)

  useLayoutEffect(() => {
    const self = rim.current
    const parent = self?.parent as Mesh | null
    if (!self || !parent || !('isMesh' in parent) || !parent.geometry) return
    self.geometry = parent.geometry
    self.userData.rim = true
    self.userData.skipFade = true
    self.userData.centered = false
  })

  if (!on) return null

  return (
    <mesh ref={rim} renderOrder={3} raycast={skipRaycast} frustumCulled={false}>
      <meshBasicMaterial
        color="#A8F0EA"
        side={BackSide}
        transparent
        opacity={soft ? 0.16 : 0.34}
        depthWrite={false}
        blending={AdditiveBlending}
        toneMapped={false}
        onBeforeCompile={(shader) => {
          shader.vertexShader = shader.vertexShader.replace(
            '#include <begin_vertex>',
            `#include <begin_vertex>
             transformed += normalize(objectNormal) * ${soft ? '0.0034' : '0.0052'};`,
          )
        }}
      />
    </mesh>
  )
}

export function AtlasMesh({ children, centered = true, ...props }: MeshProps) {
  const { select, hotSystems, viewMode } = useAtlas()
  const state = useStructureRender()
  const selected = state?.selected ?? false
  const pickable = state?.pickable ?? true
  const system = state ? STRUCTURE_BY_ID[state.id]?.system : undefined
  const muscleGel = system === 'muscle'
  const mesh = useRef<Mesh>(null)

  const setLeaf = (on: boolean) => {
    const root = mesh.current
    if (root) root.userData.centered = centered
    const mats = root
      ? Array.isArray(root.material)
        ? root.material
        : [root.material]
      : []
    for (const mat of mats) {
      ;(mat as MeshStandardMaterial).userData.leafHover = on
    }
  }

  useLayoutEffect(() => {
    const root = mesh.current
    if (!root) return
    root.userData.centered = centered
    if (state) {
      root.userData.atlasId = state.id
      root.userData.atlasSystem = STRUCTURE_BY_ID[state.id]?.system
      root.userData.source = STRUCTURE_BY_ID[state.id]?.source
    }
    markPickable(root, pickable, muscleGel)
    return () => setLeaf(false)
  }, [centered, muscleGel, pickable, state])

  return (
    <mesh
      {...props}
      ref={(node) => {
        mesh.current = node
        if (!node) return
        node.userData.centered = centered
        if (state) {
          node.userData.atlasId = state.id
          node.userData.atlasSystem = STRUCTURE_BY_ID[state.id]?.system
          node.userData.source = STRUCTURE_BY_ID[state.id]?.source
        }
      }}
      raycast={pickable ? (muscleGel ? muscleRaycast : meshRaycast) : skipRaycast}
      onPointerOver={(e) => {
        if (!pickable || e.buttons !== 0 || isDragging() || selected) return
        e.stopPropagation()
        if (!muscleGel) setLeaf(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        setLeaf(false)
        document.body.style.cursor = 'auto'
      }}
      onPointerUp={(e) => {
        e.stopPropagation()
        if (wasDrag()) return
        const id = pickAtlasIdOrSelf(
          e.intersections,
          hotSystems,
          e.camera.position,
          e.ray?.direction,
          pickable ? state?.id : undefined,
        )
        if (!id) return
        const sys = STRUCTURE_BY_ID[id]?.system
        if (sys && !hotSystems.includes(sys)) return
        setLeaf(false)
        select(id)
      }}
    >
      {children}
      <SelectedRim
        key={viewMode === 'focus' ? 'focus-halo' : 'home-halo'}
        on={selected && !muscleGel}
        soft={viewMode === 'focus'}
      />
    </mesh>
  )
}
