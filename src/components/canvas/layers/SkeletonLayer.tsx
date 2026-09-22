import { useEffect, useMemo, useRef, useState } from 'react'
import { Group, Mesh, type BufferGeometry } from 'three'
import { useAtlas } from '@/atlas/AtlasProvider'
import { SKELETON_MESH_PARTS } from '@/atlas/generated/skeletonCatalog'
import { fetchSkeletonGltf, peekCachedSkeleton } from '@/atlas/skeletonLoad'
import { AtlasMesh } from '../AtlasMesh'
import { SystemMaterial } from '../materials'
import { StructureGroup } from '../StructureGroup'

function geometriesById(root: Group): Map<string, BufferGeometry> {
  const map = new Map<string, BufferGeometry>()
  root.traverse((obj) => {
    if (obj instanceof Mesh && obj.name && obj.geometry) {
      map.set(obj.name, obj.geometry)
    }
  })
  return map
}

export function SkeletonLayer() {
  const { hotSystems, reportSkeletonLoad, markSceneReady } = useAtlas()
  const [scene, setScene] = useState<Group | null>(() => peekCachedSkeleton())
  const skeletonHot = hotSystems.includes('skeleton')
  const wasHot = useRef(skeletonHot)
  const [mountGen, setMountGen] = useState(0)

  useEffect(() => {
    if (skeletonHot && !wasHot.current) setMountGen((n) => n + 1)
    wasHot.current = skeletonHot
  }, [skeletonHot])

  useEffect(() => {
    const cached = peekCachedSkeleton()
    if (cached) {
      setScene(cached)
      reportSkeletonLoad({
        phase: 'ready',
        loaded: 10_797_000,
        total: 10_797_000,
        error: null,
      })
      markSceneReady()
      return
    }
    let dead = false
    reportSkeletonLoad({ phase: 'download', loaded: 0, total: 10_797_000, error: null })
    fetchSkeletonGltf((loaded, total) => {
      if (!dead) reportSkeletonLoad({ phase: 'download', loaded, total, error: null })
    })
      .then((next) => {
        if (dead) return
        reportSkeletonLoad({
          phase: 'parse',
          loaded: 10_797_000,
          total: 10_797_000,
          error: null,
        })
        setScene(next)
        reportSkeletonLoad({
          phase: 'ready',
          loaded: 10_797_000,
          total: 10_797_000,
          error: null,
        })
        markSceneReady()
      })
      .catch((err: unknown) => {
        if (dead) return
        const message = err instanceof Error ? err.message : 'skeleton.glb failed'
        reportSkeletonLoad({ phase: 'error', loaded: 0, total: 10_797_000, error: message })
      })
    return () => {
      dead = true
    }
  }, [markSceneReady, reportSkeletonLoad])

  const mounted = useMemo(() => {
    if (!scene) return []
    const byName = geometriesById(scene)
    return SKELETON_MESH_PARTS.flatMap((part) => {
      const geometry = byName.get(part.id)
      return geometry ? [{ part, geometry }] : []
    })
  }, [scene])

  if (!scene) return null

  return (
    <group name="skeleton-mesh-layer" visible={skeletonHot}>
      {mounted.map(({ part, geometry }) => (
        <StructureGroup key={`${part.id}-${mountGen}`} id={part.id}>
          <AtlasMesh
            position={part.position}
            castShadow={false}
            receiveShadow={false}
          >
            <primitive object={geometry} attach="geometry" />
            <SystemMaterial kind="skeleton" />
          </AtlasMesh>
        </StructureGroup>
      ))}
    </group>
  )
}
