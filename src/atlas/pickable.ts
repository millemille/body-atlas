import { getStructure } from './structures'
import type { SystemId } from './types'

/**
 * Isolate only locks picks when a live selection exists.
 * Orphan isolate (Isolate on, selection cleared by turning that system off)
 * must not leave hot bones with pickable=false.
 */
export function isIsolating(isolated: boolean, selectedId: string | null): boolean {
  return isolated && selectedId != null
}

export function isPartPickable(
  systemHot: boolean,
  isolated: boolean,
  selectedId: string | null,
  id: string,
): boolean {
  if (!systemHot) return false
  if (isIsolating(isolated, selectedId) && selectedId !== id) return false
  return true
}

export function hideForIsolate(
  isolated: boolean,
  selectedId: string | null,
  id: string,
): boolean {
  return isIsolating(isolated, selectedId) && selectedId !== id
}

/** Drop the current part if its system is no longer hot. */
export function dropSelectionIfCold(
  hot: readonly SystemId[],
  selectedId: string | null,
): string | null {
  if (!selectedId) return null
  const part = getStructure(selectedId)
  if (part && !hot.includes(part.system)) return null
  return selectedId
}
