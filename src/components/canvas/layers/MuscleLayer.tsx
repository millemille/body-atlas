import { useEffect, useMemo, useRef, useState } from 'react'
import { Group } from 'three'
import { useAtlas } from '@/atlas/AtlasProvider'
import { MUSCLE_MESH_PARTS } from '@/atlas/generated/muscleCatalog'
import { fetchMuscleGltf, peekCachedMuscles } from '@/atlas/muscleLoad'
import { AtlasMesh } from '../AtlasMesh'
import { geometriesForParts } from '../geometriesById'
import { SystemMaterial } from '../materials'
import { StructureGroup } from '../StructureGroup'

/**
 * Live Muscle path: Open3D leaves from muscles.glb, first-hit. Latissimus included.
 */
export function MuscleLayer() {
  const { hotSystems } = useAtlas()
  const [scene, setScene] = useState<Group | null>(() => peekCachedMuscles())
  const muscleHot = hotSystems.includes('muscle')
  const wasHot = useRef(muscleHot)
  const [mountGen, setMountGen] = useState(0)

  useEffect(() => {
    if (muscleHot && !wasHot.current) setMountGen((n) => n + 1)
    wasHot.current = muscleHot
  }, [muscleHot])

  useEffect(() => {
    const cached = peekCachedMuscles()
    if (cached) {
      setScene(cached)
      return
    }
    let dead = false
    fetchMuscleGltf(() => {})
      .then((next) => {
        if (dead) return
        setScene(next)
      })
      .catch(() => {
        /* MuscleLayer stays empty; skeleton remains pickable */
      })
    return () => {
      dead = true
    }
  }, [])

  const mounted = useMemo(
    () => geometriesForParts(scene, MUSCLE_MESH_PARTS),
    [scene],
  )

  if (!scene) return null

  return (
    <group name="muscle-mesh-layer" visible={muscleHot}>
      {mounted.map(({ part, geometry }) => (
        <StructureGroup key={`${part.id}-${mountGen}`} id={part.id}>
          <AtlasMesh
            position={part.position}
            castShadow={false}
            receiveShadow={false}
          >
            <primitive object={geometry} attach="geometry" />
            <SystemMaterial kind="muscle" />
          </AtlasMesh>
        </StructureGroup>
      ))}
    </group>
  )
}
