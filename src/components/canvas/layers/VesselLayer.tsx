import { useEffect, useMemo, useState } from 'react'
import { Group, Mesh, type BufferGeometry } from 'three'
import { VESSEL_MESH_PARTS, VESSEL_SLATE_IDS } from '@/atlas/generated/vesselCatalog'
import { fetchVesselGltf, peekCachedVessels } from '@/atlas/vesselLoad'
import { AtlasMesh } from '../AtlasMesh'
import { SystemMaterial } from '../materials'
import { StructureGroup } from '../StructureGroup'

const SLATE = new Set<string>(VESSEL_SLATE_IDS)

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
 * Live Vessel path: BodyParts3D trunks from vessels.glb.
 * Cold systems stay unpickable in StructureGroup, so Muscle remains first-hit until Vessel is hot.
 */
export function VesselLayer() {
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

  const mounted = useMemo(() => {
    if (!scene) return []
    const byName = geometriesById(scene)
    return VESSEL_MESH_PARTS.flatMap((part) => {
      const geometry = byName.get(part.id)
      return geometry ? [{ part, geometry }] : []
    })
  }, [scene])

  if (!scene) return null

  return (
    <group name="vessel-mesh-layer">
      {mounted.map(({ part, geometry }) => (
        <StructureGroup key={part.id} id={part.id}>
          <AtlasMesh position={part.position} castShadow={false} receiveShadow={false}>
            <primitive object={geometry} attach="geometry" />
            <SystemMaterial kind="vessel" slate={SLATE.has(part.id)} />
          </AtlasMesh>
        </StructureGroup>
      ))}
    </group>
  )
}
