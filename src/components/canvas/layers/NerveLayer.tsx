import { useEffect, useMemo, useState } from 'react'
import { Group } from 'three'
import { useAtlas } from '@/atlas/AtlasProvider'
import { NERVE_MESH_PARTS } from '@/atlas/generated/nerveCatalog'
import { fetchNerveGltf, peekCachedNerves } from '@/atlas/nerveLoad'
import { AtlasMesh } from '../AtlasMesh'
import { geometriesForParts } from '../geometriesById'
import { SystemMaterial } from '../materials'
import { StructureGroup } from '../StructureGroup'

/**
 * Live Nerve path: BodyParts3D cranial nerves plus Open3D limb nerves from nerves.glb.
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

  const mounted = useMemo(
    () => geometriesForParts(scene, NERVE_MESH_PARTS),
    [scene],
  )

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
