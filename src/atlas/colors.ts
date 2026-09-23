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
  /** Bright nerve yellow. Teal was the chrome accent and sat too close to the glass. */
  nerveYellow: '#FFE14A',
  /** Bright arterial red. The old ruby sat on the void background. */
  vesselRuby: '#FF4D42',
  /** Bright venous blue. The old slate sat on the void background. */
  vesselVein: '#3B96FF',
  organRose: '#B86B6B',
  organCoral: '#C48982',
  skin: '#D8D4CE',
} as const

export const BASE_OPACITY = {
  skeleton: 0.97,
  muscle: 0.5,
  nerve: 0.94,
  vessel: 0.94,
  other: 0.42,
  mannequin: 0.08,
} as const
