import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group, Mesh, MeshPhysicalMaterial } from 'three'
import { useAtlas } from '@/atlas/AtlasProvider'
import { L } from '@/atlas/layout'
import { SystemMaterial } from './materials'

function skipRaycast() {}

function Limb({
  position,
  rotation,
  args,
}: {
  position: [number, number, number]
  rotation?: [number, number, number]
  args: [number, number]
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow raycast={skipRaycast}>
      <capsuleGeometry args={[args[0], args[1], 6, 12]} />
      <SystemMaterial kind="mannequin" />
    </mesh>
  )
}

export function Mannequin() {
  const { isolated, viewMode, selectedId } = useAtlas()
  const group = useRef<Group>(null)
  const opacity = useRef(0.14)

  useFrame((_, dt) => {
    if (isolated) {
      opacity.current = 0
      if (group.current) group.current.visible = false
      return
    }
    if (group.current) group.current.visible = true
    const target =
      viewMode === 'focus' ? 0.06 : selectedId ? 0.06 : 0.14
    opacity.current += (target - opacity.current) * Math.min(1, dt / 0.2)
    group.current?.traverse((obj) => {
      if (!('material' in obj)) return
      const mesh = obj as Mesh
      const mat = mesh.material as MeshPhysicalMaterial
      if (mat && mat.opacity !== undefined) {
        mat.transparent = true
        mat.opacity = opacity.current
        mat.depthWrite = false
      }
    })
  })

  return (
    <group ref={group}>
      <mesh position={L.head} raycast={skipRaycast}>
        <sphereGeometry args={[0.112, 28, 20]} />
        <SystemMaterial kind="mannequin" />
      </mesh>
      <Limb position={L.neck} args={[0.038, 0.055]} />
      <mesh position={L.chest} raycast={skipRaycast}>
        <capsuleGeometry args={[0.15, 0.16, 6, 16]} />
        <SystemMaterial kind="mannequin" />
      </mesh>
      <mesh position={L.abdomen} scale={[0.85, 1, 0.85]} raycast={skipRaycast}>
        <capsuleGeometry args={[0.13, 0.12, 6, 14]} />
        <SystemMaterial kind="mannequin" />
      </mesh>
      <mesh position={L.pelvis} scale={[1.05, 0.7, 0.9]} raycast={skipRaycast}>
        <sphereGeometry args={[0.13, 20, 16]} />
        <SystemMaterial kind="mannequin" />
      </mesh>
      <Limb
        position={[-0.245, 1.23, 0.015]}
        rotation={[0, 0, 0.22]}
        args={[0.04, 0.22]}
      />
      <Limb
        position={[0.245, 1.23, 0.015]}
        rotation={[0, 0, -0.22]}
        args={[0.04, 0.22]}
      />
      <Limb
        position={[-0.285, 0.94, 0.04]}
        rotation={[0.05, 0, 0.08]}
        args={[0.032, 0.2]}
      />
      <Limb
        position={[0.285, 0.94, 0.04]}
        rotation={[0.05, 0, -0.08]}
        args={[0.032, 0.2]}
      />
      <Limb
        position={[-0.105, 0.66, 0.02]}
        rotation={[0.04, 0, 0.04]}
        args={[0.052, 0.28]}
      />
      <Limb
        position={[0.105, 0.66, 0.02]}
        rotation={[0.04, 0, -0.04]}
        args={[0.052, 0.28]}
      />
      <Limb
        position={[-0.105, 0.29, 0.01]}
        rotation={[-0.02, 0, 0.02]}
        args={[0.038, 0.28]}
      />
      <Limb
        position={[0.105, 0.29, 0.01]}
        rotation={[-0.02, 0, -0.02]}
        args={[0.038, 0.28]}
      />
      <mesh position={[-0.1, 0.035, 0.035]} rotation={[1.2, 0, 0]} raycast={skipRaycast}>
        <capsuleGeometry args={[0.028, 0.07, 4, 10]} />
        <SystemMaterial kind="mannequin" />
      </mesh>
      <mesh position={[0.1, 0.035, 0.035]} rotation={[1.2, 0, 0]} raycast={skipRaycast}>
        <capsuleGeometry args={[0.028, 0.07, 4, 10]} />
        <SystemMaterial kind="mannequin" />
      </mesh>
    </group>
  )
}
