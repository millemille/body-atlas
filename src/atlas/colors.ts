/** Jessica chrome tokens */
export const CHROME = {
  void: '#0B0D10',
  ink: '#E8E4DC',
  muted: '#8A857C',
  teal: '#3AD1C7',
  glass: 'rgb(255 255 255 / 0.08)',
} as const

/** Sabrina locked 3D palette — independent from chrome except shared teal */
export const SABRINA = {
  boneIvory: '#E6DCC8',
  /** Mid porcelain — ivory→shade, warm bias, not yellow plastic. */
  bonePorcelain: '#D4C8B0',
  boneShade: '#C9BBA3',
  muscleRose: '#B86B6B',
  nerveTeal: '#3AD1C7',
  vesselRuby: '#7A1F2B',
  vesselVein: '#3D4E6B',
  organRose: '#B86B6B',
  organCoral: '#C48982',
  skin: '#D8D4CE',
} as const

export const BASE_OPACITY = {
  skeleton: 0.97,
  muscle: 0.5,
  nerve: 0.88,
  vessel: 0.52,
  other: 0.42,
  mannequin: 0.08,
} as const
