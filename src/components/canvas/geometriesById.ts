import { Group, Mesh, type BufferGeometry } from 'three'

/** Mesh name → geometry for a prepared GLB scene. */
function geometriesById(root: Group): Map<string, BufferGeometry> {
  const map = new Map<string, BufferGeometry>()
  root.traverse((obj) => {
    if (obj instanceof Mesh && obj.name && obj.geometry) {
      map.set(obj.name, obj.geometry)
    }
  })
  return map
}

/** Catalog rows that have a matching mesh in the loaded scene, in catalog order. */
export function geometriesForParts<T extends { id: string }>(
  root: Group | null,
  parts: readonly T[],
): { part: T; geometry: BufferGeometry }[] {
  if (!root) return []
  const byName = geometriesById(root)
  return parts.flatMap((part) => {
    const geometry = byName.get(part.id)
    return geometry ? [{ part, geometry }] : []
  })
}
