/** 1cm plate so the muscle face meets the bone instead of sinking into it. */
export const ANTERIOR_PLATE_M = 0.01

/**
 * Centroid Z that puts the anterior face on the bone wall plus a 1cm plate.
 * Centroid seating parked half the wrap in front of the chest.
 */
export function hugAnteriorWall(wallZ: number, halfZ: number, plate = ANTERIOR_PLATE_M) {
  return wallZ + plate - halfZ
}

/**
 * Translation that brings a posterior sheet's deep-face gap to the same 1cm plate.
 * Positive gap means the sheet is floating behind the bone.
 */
export function posteriorSeatShift(medianGap: number, plate = ANTERIOR_PLATE_M) {
  return medianGap - plate
}
