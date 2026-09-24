import type { SystemId } from './types'

/** Each system pill is its own switch. Turning one on never turns another off. */
export function toggleHotSystems(current: readonly SystemId[], next: SystemId): SystemId[] {
  if (current.includes(next)) {
    if (current.length <= 1) return [...current]
    return current.filter((id) => id !== next)
  }
  return [...current, next]
}
