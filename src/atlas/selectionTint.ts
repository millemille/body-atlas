import { Color } from 'three'
import { CHROME } from './colors'

/**
 * Selected-mesh highlight. Jessica/Sabrina teal `#3AD1C7` —
 * reads on ivory porcelain without looking like the magenta debug overlay.
 * Hover stays a warm albedo lift; this tint is select-only.
 */
export const SELECTION_TINT_HEX = CHROME.teal
/** Hard enough that ivory porcelain reads teal, not just “brighter bone”. */
export const SELECTION_ALBEDO_MIX = 0.68
export const SELECTION_EMISSIVE_INTENSITY = 0.62
/** Focus hero: same teal, porcelain still reads (calcaneus must not go solid cyan). */
export const FOCUS_SELECTION_ALBEDO_MIX = 0.32
export const FOCUS_SELECTION_EMISSIVE_INTENSITY = 0.24
/** Hover is half the select treatment — teal, not a warm chalk lift. */
export const HOVER_ALBEDO_MIX = SELECTION_ALBEDO_MIX * 0.5
export const HOVER_EMISSIVE_INTENSITY = SELECTION_EMISSIVE_INTENSITY * 0.5
/**
 * Muscle gel already covers a lot of pixels. Albedo mix only — emissive on a
 * large transparent fan recompiled lighting and spiked fill (mauve Error 9).
 */
export const MUSCLE_SELECTION_ALBEDO_MIX = 0.38
export const MUSCLE_SELECTION_EMISSIVE_INTENSITY = 0

const tint = new Color(SELECTION_TINT_HEX)

export function tintSelectedAlbedo(base: Color, out: Color, mix = SELECTION_ALBEDO_MIX) {
  return out.copy(base).lerp(tint, mix)
}

export function tintHoverAlbedo(base: Color, out: Color) {
  return out.copy(base).lerp(tint, HOVER_ALBEDO_MIX)
}

export function selectionEmissiveColor() {
  return tint
}
