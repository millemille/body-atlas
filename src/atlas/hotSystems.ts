import type { SystemId } from './types'

export const MAX_HOT_SYSTEMS = 2

export function toggleHotSystems(
  current: readonly SystemId[],
  next: SystemId,
  max = MAX_HOT_SYSTEMS,
): SystemId[] {
  if (current.includes(next)) {
    if (current.length <= 1) return [...current]
    return current.filter((id) => id !== next)
  }
  if (current.length < max) return [...current, next]
  return [...current.slice(1), next]
}
