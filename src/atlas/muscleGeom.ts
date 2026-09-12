import { BufferAttribute, BufferGeometry, LatheGeometry, Vector2 } from 'three'

/** Fusiform belly: fat mid, tendon-thin poles. Closed lathe, not a capsule. */
export function makeFusiformGeometry(
  length: number,
  midR: number,
  endR: number,
  radial = 8,
  stacks = 12,
): LatheGeometry {
  const len = Math.max(length, 0.04)
  const mid = Math.max(midR, 0.008)
  const end = Math.max(0.0018, Math.min(endR, mid * 0.55))
  const pts: Vector2[] = [new Vector2(0, -len / 2)]
  for (let i = 1; i < stacks; i++) {
    const t = i / stacks
    const y = (t - 0.5) * len
    const peak = 0.42
    const x = (t - peak) / (t < peak ? peak : 1 - peak)
    const bulge = Math.cos((x * Math.PI) / 2)
    const r = end + (mid - end) * Math.max(0, bulge)
    pts.push(new Vector2(r, y))
  }
  pts.push(new Vector2(0, len / 2))
  const g = new LatheGeometry(pts, radial)
  g.computeVertexNormals()
  return g
}

/**
 * Tapered slab from a wide origin to a narrow insertion.
 * Optional anterior bulge so pecs / lats read as a fan, not a brick.
 */
export function makeFanGeometry(
  length: number,
  originW: number,
  insertW: number,
  originT: number,
  insertT: number,
  bulge = 0,
): BufferGeometry {
  const len = Math.max(length, 0.04)
  const rings = [0, 0.42, 1]
  const positions: number[] = []
  for (const t of rings) {
    const w = originW + (insertW - originW) * t
    const th = originT + (insertT - originT) * t
    const y = (t - 0.5) * len
    const zOff = bulge * Math.sin(t * Math.PI)
    const hw = w / 2
    const ht = th / 2
    positions.push(hw, y, ht + zOff, hw, y, -ht + zOff, -hw, y, -ht + zOff, -hw, y, ht + zOff)
  }
  const index: number[] = []
  const quad = (a: number, b: number, c: number, d: number) => {
    index.push(a, b, c, a, c, d)
  }
  for (let i = 0; i < rings.length - 1; i++) {
    const o = i * 4
    const n = (i + 1) * 4
    quad(o + 0, o + 1, n + 1, n + 0)
    quad(o + 1, o + 2, n + 2, n + 1)
    quad(o + 2, o + 3, n + 3, n + 2)
    quad(o + 3, o + 0, n + 0, n + 3)
  }
  quad(0, 3, 2, 1)
  const last = (rings.length - 1) * 4
  quad(last + 0, last + 1, last + 2, last + 3)

  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3))
  g.setIndex(index)
  g.computeVertexNormals()
  return g
}
