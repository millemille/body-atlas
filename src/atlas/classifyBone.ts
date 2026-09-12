/** Hand vs foot labels for the densify kit. */

const FOOT = { kind: 'Foot bone · mesh', region: 'Foot' } as const
const HAND = { kind: 'Hand bone · mesh', region: 'Hand' } as const

const FOOT_RE =
  /\b(toe|toes|metatarsal|talus|calcaneus|cuboid|cuneiform|tarsal|hallux)\b|navicular[- ]of[- ]foot/
const HAND_RE =
  /\b(finger|thumb|metacarpal|scaphoid|lunate|triquetrum|pisiform|trapezium|trapezoid|capitate|hamate|carpal)\b|navicular[- ]of[- ]hand/

/**
 * The densify classifier treated every “phalanx” as a hand bone, so toe
 * phalanges shipped as HAND BONE · HAND. Foot tokens win over generic phalanx.
 */
export function classifyHandOrFoot(
  id: string,
  name: string,
): { kind: string; region: string } | null {
  const n = `${id} ${name}`.toLowerCase()
  const foot = FOOT_RE.test(n)
  const hand = HAND_RE.test(n)
  if (foot) return FOOT
  if (hand) return HAND
  return null
}

export function applyHandOrFootLabels<T extends { id: string; name: string; kind: string; region: string }>(
  part: T,
): T {
  const next = classifyHandOrFoot(part.id, part.name)
  if (!next || (next.kind === part.kind && next.region === part.region)) return part
  return { ...part, kind: next.kind, region: next.region }
}
