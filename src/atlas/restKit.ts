import { STRUCTURE_BY_ID } from './structures'

/**
 * Rest-dim (−40% opacity + desat) is for bone / glyph select.
 * Applying it on first muscle pick mutates ~197 porcelain materials in one
 * layout tick and flips the skeleton to transparent on top of gel overdraw —
 * the Chrome Error 9 spike Jessica hit on mauve.
 */
export function restDimApplies(selectedId: string | null, selfId: string): boolean {
  if (!selectedId || selectedId === selfId) return false
  const sel = STRUCTURE_BY_ID[selectedId]
  if (!sel) return false
  return sel.system !== 'muscle'
}
