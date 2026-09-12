import { applyBoneCopy } from './boneCopy'
import { applyHandOrFootLabels } from './classifyBone'
import { applyMuscleCopy } from './muscleCopy'
import { MUSCLE_MESH_PARTS } from './generated/muscleCatalog'
import { SKELETON_MESH_PARTS } from './generated/skeletonCatalog'
import { L } from './layout'
import type { Structure, SystemId } from './types'

function part(row: Structure): Structure {
  return row
}

/** Interim nerve / vessel / other glyphs. Live muscle is MUSCLE_MESH_PARTS. */
const INTERIM_PARTS: Structure[] = [
  part({
    id: 'spinal-cord',
    system: 'nerve',
    name: 'Spinal cord',
    kind: 'Central cord · axial',
    region: 'Vertebral canal (suggested)',
    function: 'Glowing cord glyph down the back of the column.',
    relation: 'Runs behind the vertebral stack; feeds the plexus glyphs.',
    blurb:
      'A teal filament down the back of the column. It is a glowing cord glyph, not a segmented cord. Turn Nerve hot to see it; Skeleton can sit beside it as the second hot system.',
    position: [0, 1.2, -0.02],
    focusDistance: 1.4,
  }),
  part({
    id: 'brachial-plexus',
    system: 'nerve',
    name: 'Brachial plexus',
    kind: 'Plexus · upper limb',
    region: 'Neck into both arms',
    function: 'Branching cords from the neck into the upper limbs.',
    relation: 'Leaves the cervical stack toward each arm axis.',
    blurb:
      'Branching cords from the neck into both arms. Roots and trunks are collapsed into a few readable strands. Hover lifts the strand under the pointer; the card still waits for a click.',
    position: [0, 1.36, 0.02],
    focusDistance: 1.2,
  }),
  part({
    id: 'sciatic-nerves',
    system: 'nerve',
    name: 'Sciatic nerves',
    kind: 'Peripheral · lower limb',
    region: 'Posterior pelvis to thighs',
    function: 'Long posterior path from pelvis down each thigh.',
    relation: 'Leaves the pelvic bowl and runs behind each femoral shaft.',
    blurb:
      'Paired teal filaments from the pelvis down each thigh. They mark the famous long path without tibial/peroneal split. Click either strand to select the pair.',
    position: [0, 0.62, -0.02],
    focusDistance: 1.35,
  }),
  part({
    id: 'median-nerves',
    system: 'nerve',
    name: 'Median nerves',
    kind: 'Peripheral · forearm',
    region: 'Anterior forearms',
    function: 'Forearm strands running toward each wrist.',
    relation: 'Companion to the ulna meshes in this figure.',
    blurb:
      'Forearm strands running toward each wrist. A stand-in for the median path. There is no carpal tunnel map. Keep the pick on the strand.',
    position: [0, 0.94, 0.04],
    focusDistance: 1.15,
  }),
  part({
    id: 'femoral-nerves',
    system: 'nerve',
    name: 'Femoral nerves',
    kind: 'Peripheral · anterior thigh',
    region: 'Anterior thighs',
    function: 'Front-of-thigh cords from the groin line downward.',
    relation: 'Anterior counterpart to the sciatic pair; near the femoral arteries.',
    blurb:
      'Anterior thigh cords from the groin line downward. They do not branch into saphenous maps. Select either cord for the pair.',
    position: [0, 0.7, 0.05],
    focusDistance: 1.25,
  }),
  part({
    id: 'aorta',
    system: 'vessel',
    name: 'Aorta',
    kind: 'Great vessel · arterial',
    region: 'Thoracic / upper abdominal axis',
    function: 'Primary arterial trunk through the chest in this figure.',
    relation: 'Arch sits near the heart glyph; descending run follows the trunk.',
    blurb:
      'A ruby arch and descending trunk through the chest. Caliber is exaggerated so the primary arterial axis reads in silhouette. Select the trunk to hard-dim the rest.',
    position: [0.02, 1.2, 0.04],
    focusDistance: 1.25,
  }),
  part({
    id: 'carotid-arteries',
    system: 'vessel',
    name: 'Carotid arteries',
    kind: 'Arterial · neck',
    region: 'Neck',
    function: 'Paired ascent through the neck toward the head.',
    relation: 'Rise beside the cervical stack; sit near the skull base.',
    blurb:
      'Paired ruby tubes in the neck. They suggest carotid ascent without bifurcation. Left and right share one structure id.',
    position: [0, 1.48, 0.03],
    focusDistance: 1.05,
  }),
  part({
    id: 'vena-cava',
    system: 'vessel',
    name: 'Vena cava',
    kind: 'Great vessel · venous',
    region: 'Right trunk',
    function: 'Venous counterpart to the aortic trunk.',
    relation: 'Runs to the right of the aorta along the trunk.',
    blurb:
      'A slate-ruby column on the right of the trunk. Hepatic and renal inflows are omitted. Click the column — nearby liver and heart glyphs should not steal the pick when those layers are off.',
    position: [0.05, 1.12, 0.02],
    focusDistance: 1.25,
  }),
  part({
    id: 'femoral-arteries',
    system: 'vessel',
    name: 'Femoral arteries',
    kind: 'Arterial · lower limb',
    region: 'Anterior thighs',
    function: 'Lower-limb arterial path from each groin down the thigh.',
    relation: 'Follow the anterior thigh near the femoral nerve glyphs.',
    blurb:
      'Ruby lines from each groin down the thigh. No profunda split. Select either line for the pair.',
    position: [0, 0.62, 0.04],
    focusDistance: 1.3,
  }),
  part({
    id: 'subclavian-arteries',
    system: 'vessel',
    name: 'Subclavian arteries',
    kind: 'Arterial · shoulder',
    region: 'Shoulder girdle',
    function: 'Short runs under each clavicle toward the arms.',
    relation: 'Connect neck carotids to the upper-limb vessel glyphs.',
    blurb:
      'Short ruby runs under each clavicle toward the arms. There is no vertebral takeoff. The pick target is the short run itself.',
    position: [0, 1.38, 0.03],
    focusDistance: 1.15,
  }),
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
      'A viscera-toned wedge in the left chest. Chambers and vessels are omitted. The aorta glyph can sit beside it when Vessel is the second hot system.',
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
