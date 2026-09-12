import { createContext, useContext, useLayoutEffect, useMemo, type ReactNode } from 'react'
import { Quaternion, Vector3, type MeshStandardMaterial } from 'three'
import { makeFanGeometry, makeFusiformGeometry } from '@/atlas/muscleGeom'
import { cloneMuscleMaterial } from '@/atlas/muscleMaterial'
import { AtlasMesh } from './AtlasMesh'
import { StructureGroup } from './StructureGroup'

const MuscleMatCtx = createContext<MeshStandardMaterial | null>(null)

/** One clone per structure — meshes in the group share it. Not disposed on Muscle toggle. */
export function MusclePart({ id, children }: { id: string; children: ReactNode }) {
  const material = useMemo(() => cloneMuscleMaterial(), [])
  useLayoutEffect(() => () => material.dispose(), [material])
  return (
    <MuscleMatCtx.Provider value={material}>
      <StructureGroup id={id}>{children}</StructureGroup>
    </MuscleMatCtx.Provider>
  )
}

const FLAT: [number, number] = [1, 1]

function alignY(from: [number, number, number], to: [number, number, number]) {
  const a = new Vector3(...from)
  const b = new Vector3(...to)
  const dir = b.clone().sub(a)
  const length = Math.max(dir.length(), 0.04)
  return {
    position: a.clone().add(b).multiplyScalar(0.5),
    quaternion: new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), dir.normalize()),
    length,
  }
}

function useMuscleMaterial() {
  const shared = useContext(MuscleMatCtx)
  const fallback = useMemo(() => (shared ? null : cloneMuscleMaterial()), [shared])
  useLayoutEffect(() => {
    if (!fallback) return
    return () => fallback.dispose()
  }, [fallback])
  return shared ?? fallback!
}

/** Tapered muscle belly along origin → insertion. */
export function MuscleFusiform({
  from,
  to,
  midRadius,
  endRadius,
  flatten = FLAT,
  radial = 6,
  stacks = 8,
}: {
  from: [number, number, number]
  to: [number, number, number]
  midRadius: number
  endRadius?: number
  flatten?: [number, number]
  /** M2 extras use a coarser lathe so Muscle-on compile stays cheap. */
  radial?: number
  stacks?: number
}) {
  const pose = useMemo(
    () => alignY(from, to),
    [from[0], from[1], from[2], to[0], to[1], to[2]],
  )
  const geometry = useMemo(
    () => makeFusiformGeometry(pose.length, midRadius, endRadius ?? midRadius * 0.28, radial, stacks),
    [pose.length, midRadius, endRadius, radial, stacks],
  )
  const material = useMuscleMaterial()
  useLayoutEffect(() => () => geometry.dispose(), [geometry])
  return (
    <AtlasMesh position={pose.position} quaternion={pose.quaternion} scale={[flatten[0], 1, flatten[1]]}>
      <primitive object={geometry} attach="geometry" />
      <primitive object={material} attach="material" />
    </AtlasMesh>
  )
}

/** Wide-origin / narrow-insert fan (pec, lat, trap, glute). */
export function MuscleFan({
  from,
  to,
  originWidth,
  insertWidth,
  originThick,
  insertThick,
  bulge = 0,
}: {
  from: [number, number, number]
  to: [number, number, number]
  originWidth: number
  insertWidth: number
  originThick: number
  insertThick: number
  bulge?: number
}) {
  const pose = useMemo(
    () => alignY(from, to),
    [from[0], from[1], from[2], to[0], to[1], to[2]],
  )
  const geometry = useMemo(
    () =>
      makeFanGeometry(pose.length, originWidth, insertWidth, originThick, insertThick, bulge),
    [pose.length, originWidth, insertWidth, originThick, insertThick, bulge],
  )
  const material = useMuscleMaterial()
  useLayoutEffect(() => () => geometry.dispose(), [geometry])
  return (
    <AtlasMesh position={pose.position} quaternion={pose.quaternion}>
      <primitive object={geometry} attach="geometry" />
      <primitive object={material} attach="material" />
    </AtlasMesh>
  )
}

/** Shallow wall (rectus / obliques as one panel). */
export function MuscleSlab({
  from,
  to,
  width,
  thick,
}: {
  from: [number, number, number]
  to: [number, number, number]
  width: number
  thick: number
}) {
  return (
    <MuscleFan
      from={from}
      to={to}
      originWidth={width}
      insertWidth={width * 0.78}
      originThick={thick}
      insertThick={thick * 0.85}
      bulge={thick * 0.35}
    />
  )
}
