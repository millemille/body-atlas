export const SYSTEM_IDS = [
  'skeleton',
  'muscle',
  'nerve',
  'vessel',
  'other',
] as const

export type SystemId = (typeof SYSTEM_IDS)[number]

export type ViewMode = 'default' | 'focus'

export type Structure = {
  id: string
  system: SystemId
  name: string
  kind: string
  region: string
  function: string
  relation: string
  blurb: string
  origin?: string
  insertion?: string
  innervation?: string
  position: [number, number, number]
  focusDistance: number
  /** BodyParts3D mesh vs interim capsule/ellipsoid glyph. */
  source?: 'bodyparts3d' | 'interim'
  fma?: string
}

export type SystemMeta = {
  id: SystemId
  label: string
  hint: string
}
