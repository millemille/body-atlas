import { useLayoutEffect, useMemo } from 'react'
import { CatmullRomCurve3, TubeGeometry, Vector3 } from 'three'
import { AtlasMesh } from './AtlasMesh'
import { SystemMaterial } from './materials'
import type { SystemId } from '@/atlas/types'

export function Tube({
  points,
  radius,
  system,
  slate = false,
  tubular = 40,
  core = false,
}: {
  points: [number, number, number][]
  radius: number
  system: SystemId
  slate?: boolean
  tubular?: number
  /** Thin emissive artery core. */
  core?: boolean
}) {
  const { geometry, coreGeometry } = useMemo(() => {
    const curve = new CatmullRomCurve3(
      points.map((p) => new Vector3(...p)),
      false,
      'catmullrom',
      0.35,
    )
    return {
      geometry: new TubeGeometry(curve, tubular, radius, 8, false),
      coreGeometry: core
        ? new TubeGeometry(curve, tubular, Math.max(0.0012, radius * 0.32), 6, false)
        : null,
    }
  }, [points, radius, tubular, core])

  useLayoutEffect(() => {
    return () => {
      geometry.dispose()
      coreGeometry?.dispose()
    }
  }, [geometry, coreGeometry])

  return (
    <>
      <AtlasMesh centered={false}>
        <primitive object={geometry} attach="geometry" />
        <SystemMaterial kind={system} slate={slate} />
      </AtlasMesh>
      {coreGeometry ? (
        <AtlasMesh centered={false}>
          <primitive object={coreGeometry} attach="geometry" />
          <SystemMaterial kind="vessel-core" />
        </AtlasMesh>
      ) : null}
    </>
  )
}
