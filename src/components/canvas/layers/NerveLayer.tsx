import { useEffect, useMemo, useState } from 'react'
import { Group, Mesh, type BufferGeometry } from 'three'
import { useAtlas } from '@/atlas/AtlasProvider'
import { NERVE_MESH_PARTS } from '@/atlas/generated/nerveCatalog'
import { fetchNerveGltf, peekCachedNerves } from '@/atlas/nerveLoad'
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
 * Live Nerve path: BodyParts3D cranial nerves and spinal cord from nerves.glb.
 * The layer stays unmounted until Nerve is hot, so Muscle remains first-hit.
 */
export function NerveLayer() {
  const { hotSystems } = useAtlas()
  const nerveHot = hotSystems.includes('nerve')
  const [scene, setScene] = useState<Group | null>(() => peekCachedNerves())

  useEffect(() => {
    const cached = peekCachedNerves()
    if (cached) {
      setScene(cached)
      return
    }
    let dead = false
    fetchNerveGltf()
      .then((next) => {
        if (!dead) setScene(next)
      })
      .catch(() => {
        /* NerveLayer stays empty; muscle and skeleton remain pickable */
      })
    return () => {
      dead = true
    }
  }, [])

  const mounted = useMemo(() => {
    if (!scene) return []
    const byName = geometriesById(scene)
    return NERVE_MESH_PARTS.flatMap((part) => {
      const geometry = byName.get(part.id)
      return geometry ? [{ part, geometry }] : []
    })
  }, [scene])

  if (!scene || !nerveHot) return null

  return (
    <group name="nerve-mesh-layer">
      {mounted.map(({ part, geometry }) => (
        <StructureGroup key={part.id} id={part.id}>
          <AtlasMesh position={part.position} castShadow={false} receiveShadow={false}>
            <primitive object={geometry} attach="geometry" />
            <SystemMaterial kind="nerve" />
          </AtlasMesh>
        </StructureGroup>
      ))}
    </group>
  )
}
