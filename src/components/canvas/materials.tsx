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

export function SystemMaterial({
  kind,
  slate = false,
}: {
  kind: SystemId
  slate?: boolean
}) {
  const baseOpacity = BASE_OPACITY[kind]
  const stash = (m: { userData: Record<string, number> }) => {
    m.userData.baseOpacity = baseOpacity
    m.userData.baseEmissive = 0.012
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
    const glow = 0.4
    return (
      <meshStandardMaterial
        color={SABRINA.nerveYellow}
        roughness={0.42}
        metalness={0}
        emissive={SABRINA.nerveYellow}
        emissiveIntensity={glow}
        envMapIntensity={0.15}
        transparent
        opacity={baseOpacity}
        depthWrite
        toneMapped={false}
        onUpdate={(m) => {
          m.userData.baseOpacity = baseOpacity
          m.userData.baseEmissive = glow
        }}
      />
    )
  }

  if (kind === 'vessel') {
    const tint = slate ? SABRINA.vesselVein : SABRINA.vesselRuby
    const glow = slate ? 0.42 : 0.38
    return (
      <meshStandardMaterial
        color={tint}
        roughness={0.42}
        metalness={0}
        emissive={tint}
        emissiveIntensity={glow}
        envMapIntensity={0.15}
        transparent
        opacity={baseOpacity}
        depthWrite
        toneMapped={false}
        onUpdate={(m) => {
          m.userData.baseOpacity = baseOpacity
          m.userData.baseEmissive = glow
        }}
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
}
