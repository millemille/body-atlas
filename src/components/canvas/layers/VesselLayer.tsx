import { useEffect, useMemo, useState } from 'react'
import { Group } from 'three'
import { useAtlas } from '@/atlas/AtlasProvider'
import { VESSEL_MESH_PARTS, VESSEL_VEIN_IDS } from '@/atlas/generated/vesselCatalog'
import { fetchVesselGltf, peekCachedVessels } from '@/atlas/vesselLoad'
import { AtlasMesh } from '../AtlasMesh'
import { geometriesForParts } from '../geometriesById'
import { SystemMaterial } from '../materials'
import { StructureGroup } from '../StructureGroup'

const VEINS = new Set<string>(VESSEL_VEIN_IDS)

/**
 * Live Vessel path: BodyParts3D arteries and veins from vessels.glb.
 * The layer stays unmounted until Vessel is hot, so Muscle remains first-hit.
 */
export function VesselLayer() {
  const { hotSystems } = useAtlas()
  const vesselHot = hotSystems.includes('vessel')
  const [scene, setScene] = useState<Group | null>(() => peekCachedVessels())

  useEffect(() => {
    const cached = peekCachedVessels()
    if (cached) {
      setScene(cached)
      return
    }
    let dead = false
    fetchVesselGltf()
      .then((next) => {
        if (!dead) setScene(next)
      })
      .catch(() => {
        /* VesselLayer stays empty; muscle and skeleton remain pickable */
      })
    return () => {
      dead = true
    }
  }, [])

  const mounted = useMemo(
    () => geometriesForParts(scene, VESSEL_MESH_PARTS),
    [scene],
  )

  if (!scene || !vesselHot) return null

  return (
    <group name="vessel-mesh-layer">
      {mounted.map(({ part, geometry }) => (
        <StructureGroup key={part.id} id={part.id}>
          <AtlasMesh position={part.position} castShadow={false} receiveShadow={false}>
            <primitive object={geometry} attach="geometry" />
            <SystemMaterial kind="vessel" slate={VEINS.has(part.id)} />
          </AtlasMesh>
        </StructureGroup>
      ))}
    </group>
  )
}
