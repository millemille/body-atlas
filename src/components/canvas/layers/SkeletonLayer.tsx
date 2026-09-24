import { useEffect, useMemo, useRef, useState } from 'react'
import { Group } from 'three'
import { useAtlas } from '@/atlas/AtlasProvider'
import { SKELETON_MESH_PARTS } from '@/atlas/generated/skeletonCatalog'
import { SKELETON_BYTES, fetchSkeletonGltf, peekCachedSkeleton } from '@/atlas/skeletonLoad'
import { AtlasMesh } from '../AtlasMesh'
import { geometriesForParts } from '../geometriesById'
import { SystemMaterial } from '../materials'
import { StructureGroup } from '../StructureGroup'

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
        loaded: SKELETON_BYTES,
        total: SKELETON_BYTES,
        error: null,
      })
      markSceneReady()
      return
    }
    let dead = false
    reportSkeletonLoad({ phase: 'download', loaded: 0, total: SKELETON_BYTES, error: null })
    fetchSkeletonGltf((loaded, total) => {
      if (!dead) reportSkeletonLoad({ phase: 'download', loaded, total, error: null })
    })
      .then((next) => {
        if (dead) return
        reportSkeletonLoad({
          phase: 'parse',
          loaded: SKELETON_BYTES,
          total: SKELETON_BYTES,
          error: null,
        })
        setScene(next)
        reportSkeletonLoad({
          phase: 'ready',
          loaded: SKELETON_BYTES,
          total: SKELETON_BYTES,
          error: null,
        })
        markSceneReady()
      })
      .catch((err: unknown) => {
        if (dead) return
        const message = err instanceof Error ? err.message : 'skeleton.glb failed'
        reportSkeletonLoad({ phase: 'error', loaded: 0, total: SKELETON_BYTES, error: message })
      })
    return () => {
      dead = true
    }
  }, [markSceneReady, reportSkeletonLoad])

  const mounted = useMemo(
    () => geometriesForParts(scene, SKELETON_MESH_PARTS),
    [scene],
  )

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
