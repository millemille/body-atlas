import { applyBoneCopy } from './boneCopy'
import { applyHandOrFootLabels } from './classifyBone'
import { applyMuscleCopy } from './muscleCopy'
import { MUSCLE_MESH_PARTS } from './generated/muscleCatalog'
import { SKELETON_MESH_PARTS } from './generated/skeletonCatalog'
import { NERVE_MESH_PARTS } from './generated/nerveCatalog'
import { VESSEL_MESH_PARTS } from './generated/vesselCatalog'
import { L } from './layout'
import type { Structure, SystemId } from './types'

function part(row: Structure): Structure {
  return row
}

/** Interim other-organ glyphs. Live nerves are NERVE_MESH_PARTS. Live muscle is MUSCLE_MESH_PARTS. Live vessels are VESSEL_MESH_PARTS. */
const INTERIM_PARTS: Structure[] = [
  part({
    id: 'brain',
    system: 'other',
    name: 'Brain',
    kind: 'Organ · cranial',
    region: 'Cranial vault',
    function: 'Placeholder mass for “other” cranial tissue.',
    relation: 'Sits inside the cranial bone meshes.',
    blurb:
      'A warm folded mass inside the cranial vault. Hemispheres are hinted, not mapped. Turn Other hot with Skeleton if you want the vault around it.',
    position: L.brain,
    focusDistance: 1.1,
  }),
  part({
    id: 'heart',
    system: 'other',
    name: 'Heart',
    kind: 'Organ · thoracic',
    region: 'Mediastinum (left chest)',
    function: 'Heart-shaped landmark in the left chest.',
    relation: 'Sits inside the rib meshes, left of the venous column.',
    blurb:
      'A viscera-toned wedge in the left chest. Chambers are omitted. An aortic mesh can sit beside it when Vessel is the second hot system.',
    position: L.heart,
    focusDistance: 1.05,
  }),
  part({
    id: 'lungs',
    system: 'other',
    name: 'Lungs',
    kind: 'Organ · paired thoracic',
    region: 'Pleural space (suggested)',
    function: 'Paired volumes filling the rib space.',
    relation: 'Occupy the thoracic basket around the heart wedge.',
    blurb:
      'Soft paired volumes filling the rib space. Lobes and airways are not drawn. Hover lifts the lung under the pointer.',
    position: L.chest,
    focusDistance: 1.3,
  }),
  part({
    id: 'liver',
    system: 'other',
    name: 'Liver',
    kind: 'Organ · upper abdomen',
    region: 'Right upper abdomen',
    function: 'Heavy mass under the right ribs.',
    relation: 'Sits under the right costal margin, right of the stomach sac.',
    blurb:
      'A heavy warm mass under the right ribs. Surfaces and lobes are stylized. Keep the pick on this mass — the abdominal wall gel is shallower so it should not cover it.',
    position: L.liver,
    focusDistance: 1.1,
  }),
  part({
    id: 'stomach',
    system: 'other',
    name: 'Stomach',
    kind: 'Organ · upper abdomen',
    region: 'Left upper abdomen',
    function: 'Curved sac on the left upper abdomen.',
    relation: 'Sits left of the liver mass, under the left costal line.',
    blurb:
      'A curved sac on the left upper abdomen. Greater and lesser curves are suggested by the silhouette only. Hover does not dock a card over the midriff.',
    position: L.stomach,
    focusDistance: 1.05,
  }),
  part({
    id: 'kidneys',
    system: 'other',
    name: 'Kidneys',
    kind: 'Organ · paired retroperitoneal',
    region: 'Flanks / retroperitoneum (suggested)',
    function: 'Left/right bean landmarks behind the mid-abdomen.',
    relation: 'Sit behind the midriff panel, flanking the lumbar stack.',
    blurb:
      'Paired beans behind the mid-abdomen. Either bean selects the pair. Copy here is illustrative placeholder, not a claim about living anatomy.',
    position: [0, 1.02, -0.04],
    focusDistance: 1.15,
  }),
]

export const STRUCTURES: Structure[] = [
  ...SKELETON_MESH_PARTS.map((row) => applyBoneCopy(applyHandOrFootLabels(row))),
  ...MUSCLE_MESH_PARTS.map(applyMuscleCopy),
  ...VESSEL_MESH_PARTS,
  ...NERVE_MESH_PARTS,
  ...INTERIM_PARTS.map(applyMuscleCopy),
]

export const STRUCTURE_BY_ID = Object.fromEntries(
  STRUCTURES.map((s) => [s.id, s]),
) as Record<string, Structure>

export function structuresForSystems(hot: readonly SystemId[]): Structure[] {
  const set = new Set(hot)
  return STRUCTURES.filter((s) => set.has(s.system))
}

export function getStructure(id: string | null): Structure | null {
  if (!id) return null
  return STRUCTURE_BY_ID[id] ?? null
}

export function bonePosition(
  id: string,
  fallback: [number, number, number],
): [number, number, number] {
  const p = STRUCTURE_BY_ID[id]?.position
  return p ? [p[0], p[1], p[2]] : fallback
}
