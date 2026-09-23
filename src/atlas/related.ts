import { SKELETON_MESH_PARTS } from './generated/skeletonCatalog'
import { getStructure } from './structures'

const SOFT: Record<string, string[]> = {
  pectoralis: ['body-of-sternum', 'deltoids', 'heart'],
  'biceps-left': ['humerus-left', 'deltoids'],
  'biceps-right': ['humerus-right', 'deltoids'],
  deltoids: ['humerus-left', 'humerus-right', 'scapula-left'],
  'abdominal-wall': ['stomach', 'liver', 'xiphoid-process'],
  quadriceps: ['femur-left', 'femur-right', 'patella-left'],
  trapezius: ['seventh-cervical-vertebra', 'scapula-left'],
  'triceps-left': ['humerus-left', 'biceps-left'],
  'triceps-right': ['humerus-right', 'biceps-right'],
  latissimus: ['scapula-left', 'humerus-left'],
  gluteus: ['hip-left', 'femur-left'],
  gastrocnemius: ['tibia-left', 'calcaneus-left'],
  hamstrings: ['hip-left', 'femur-left'],
  soleus: ['tibia-left', 'calcaneus-left'],
  iliopsoas: ['twelfth-thoracic-vertebra', 'femur-left'],
  'forearm-flexors': ['ulna-left', 'humerus-left'],
  'rotator-cuff': ['scapula-left', 'humerus-left', 'deltoids'],
  'erector-spinae': ['sacrum', 'twelfth-thoracic-vertebra'],
  'hip-adductors': ['hip-left', 'femur-left'],
  'tibialis-anterior': ['tibia-left', 'calcaneus-left'],
  'forearm-extensors': ['radius-left', 'humerus-left'],
  'spinal-cord': ['seventh-cervical-vertebra', 'right-optic-nerve'],
  'right-optic-nerve': ['left-optic-nerve', 'spinal-cord'],
  'left-optic-nerve': ['right-optic-nerve', 'left-trochlear-nerve'],
  'nerve-trunk': ['spinal-cord', 'right-optic-nerve'],
  'ascending-aorta': ['heart', 'superior-vena-cava'],
  'arch-of-aorta': ['heart', 'left-common-carotid-artery'],
  'superior-vena-cava': ['arch-of-aorta', 'heart'],
  'inferior-vena-cava': ['abdominal-aorta', 'heart'],
  'right-femoral-artery': ['femur-right', 'right-external-iliac-artery'],
  'left-common-carotid-artery': ['atlas', 'arch-of-aorta'],
  brain: ['frontal-bone', 'mandible'],
  heart: ['lungs', 'ascending-aorta', 'body-of-sternum'],
  lungs: ['body-of-sternum', 'heart'],
  liver: ['stomach', 'abdominal-wall'],
  stomach: ['liver', 'abdominal-wall'],
  kidneys: ['hip-left', 'inferior-vena-cava'],
}

const REGION_INDEX = new Map<string, string[]>()
for (const p of SKELETON_MESH_PARTS) {
  const list = REGION_INDEX.get(p.region) ?? []
  list.push(p.id)
  REGION_INDEX.set(p.region, list)
}

export const RELATED: Record<string, string[]> = { ...SOFT }

export function nextRelatedId(currentId: string): string | null {
  const explicit = RELATED[currentId] ?? []
  for (const id of explicit) {
    if (getStructure(id)) return id
  }
  const cur = getStructure(currentId)
  if (!cur) return null
  const peers = REGION_INDEX.get(cur.region) ?? []
  const next = peers.find((id) => id !== currentId)
  return next ?? null
}
