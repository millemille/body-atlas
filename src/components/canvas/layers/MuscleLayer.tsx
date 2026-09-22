import { useEffect, useMemo, useRef, useState } from 'react'
import { Group, Mesh, type BufferGeometry } from 'three'
import { useAtlas } from '@/atlas/AtlasProvider'
import { MUSCLE_MESH_PARTS } from '@/atlas/generated/muscleCatalog'
import { fetchMuscleGltf, peekCachedMuscles } from '@/atlas/muscleLoad'
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

/**
 * Live Muscle path: BodyParts3D leaf groups from muscles.glb, first-hit.
 * Procedural gels stay parked — they are not mounted.
 */
export function MuscleLayer() {
  const { hotSystems, enableM2Coverage } = useAtlas()
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
      enableM2Coverage()
      return
    }
    let dead = false
    fetchMuscleGltf(() => {})
      .then((next) => {
        if (dead) return
        setScene(next)
        enableM2Coverage()
      })
      .catch(() => {
        /* MuscleLayer stays empty; skeleton remains pickable */
      })
    return () => {
      dead = true
    }
  }, [enableM2Coverage])

  const mounted = useMemo(() => {
    if (!scene) return []
    const byName = geometriesById(scene)
    return MUSCLE_MESH_PARTS.flatMap((part) => {
      const geometry = byName.get(part.id)
      return geometry ? [{ part, geometry }] : []
    })
  }, [scene])

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
