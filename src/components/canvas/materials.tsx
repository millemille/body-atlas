import { FrontSide } from 'three'
import { BASE_OPACITY, SABRINA } from '@/atlas/colors'
import {
  BONE_ENV_MAP,
  BONE_ROUGHNESS,
  MESH_MUSCLE_COLOR,
  MESH_MUSCLE_ENV,
  MESH_MUSCLE_OPACITY,
  MESH_MUSCLE_ROUGHNESS,
} from '@/atlas/studioLook'
import type { SystemId } from '@/atlas/types'

type MatKind = SystemId | 'mannequin' | 'vessel-core'

export function SystemMaterial({
  kind,
  slate = false,
}: {
  kind: MatKind
  slate?: boolean
}) {
  const baseOpacity = kind === 'vessel-core' ? 0.55 : BASE_OPACITY[kind]
  const stash = (m: { userData: Record<string, number> }) => {
    m.userData.baseOpacity = baseOpacity
    m.userData.baseEmissive =
      kind === 'nerve'
        ? 0.07
        : kind === 'vessel-core'
          ? 0.22
          : kind === 'vessel'
            ? slate
              ? 0.02
              : 0.05
            : 0.012
  }

  if (kind === 'skeleton') {
    return (
      <meshStandardMaterial
        color={SABRINA.bonePorcelain}
        roughness={BONE_ROUGHNESS}
        metalness={0}
        emissive={SABRINA.boneShade}
        emissiveIntensity={0.016}
        envMapIntensity={BONE_ENV_MAP}
        transparent={false}
        depthWrite
        opacity={1}
        onUpdate={(m) => {
          m.userData.baseOpacity = 1
          m.userData.baseEmissive = 0.016
          m.userData.solidBone = true
        }}
      />
    )
  }

  if (kind === 'muscle') {
    return (
      <meshStandardMaterial
        color={MESH_MUSCLE_COLOR}
        roughness={MESH_MUSCLE_ROUGHNESS}
        metalness={0}
        emissive={MESH_MUSCLE_COLOR}
        emissiveIntensity={0.035}
        envMapIntensity={MESH_MUSCLE_ENV}
        transparent
        opacity={MESH_MUSCLE_OPACITY}
        depthWrite
        side={FrontSide}
        onUpdate={(m) => {
          m.userData.baseOpacity = MESH_MUSCLE_OPACITY
          m.userData.baseEmissive = 0.035
          m.userData.muscleGel = 1
        }}
      />
    )
  }

  if (kind === 'nerve') {
    return (
      <meshPhysicalMaterial
        color={SABRINA.nerveTeal}
        roughness={0.42}
        metalness={0}
        emissive={SABRINA.nerveTeal}
        emissiveIntensity={0.08}
        envMapIntensity={0.18}
        specularIntensity={0.1}
        transparent
        opacity={baseOpacity}
        toneMapped={false}
        onUpdate={stash}
      />
    )
  }

  if (kind === 'vessel-core') {
    return (
      <meshBasicMaterial
        color={SABRINA.vesselRuby}
        transparent
        opacity={baseOpacity}
        depthWrite={false}
        toneMapped={false}
        onUpdate={stash}
      />
    )
  }

  if (kind === 'vessel') {
    const tint = slate ? SABRINA.vesselVein : SABRINA.vesselRuby
    return (
      <meshPhysicalMaterial
        color={tint}
        roughness={0.12}
        metalness={0}
        transmission={0.18}
        thickness={0.12}
        attenuationColor={slate ? '#8A9BB8' : '#C45A62'}
        attenuationDistance={2}
        ior={1.48}
        clearcoat={0.78}
        clearcoatRoughness={0.16}
        specularIntensity={0.62}
        emissive={tint}
        emissiveIntensity={slate ? 0.02 : 0.06}
        envMapIntensity={0.35}
        transparent
        opacity={baseOpacity}
        depthWrite={false}
        onUpdate={stash}
      />
    )
  }

  if (kind === 'other') {
    return (
      <meshPhysicalMaterial
        color={SABRINA.organRose}
        roughness={0.62}
        metalness={0}
        transmission={0.28}
        thickness={0.5}
        attenuationColor={SABRINA.organCoral}
        attenuationDistance={0.8}
        emissive={SABRINA.organCoral}
        emissiveIntensity={0.03}
        envMapIntensity={0.2}
        transparent
        opacity={baseOpacity}
        depthWrite={false}
        onUpdate={stash}
      />
    )
  }

  return (
    <meshPhysicalMaterial
      color={SABRINA.skin}
      roughness={0.55}
      metalness={0}
      transmission={0.78}
      thickness={0.28}
      ior={1.38}
      specularIntensity={0.08}
      emissive="#9aa0a8"
      emissiveIntensity={0.018}
      envMapIntensity={0.2}
      transparent
      opacity={baseOpacity}
      depthWrite={false}
      onUpdate={stash}
    />
  )
}
