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
  'spinal-cord': ['seventh-cervical-vertebra', 'brachial-plexus'],
  'brachial-plexus': ['spinal-cord', 'median-nerves'],
  'sciatic-nerves': ['hip-left', 'femur-left'],
  'median-nerves': ['ulna-left', 'brachial-plexus'],
  'femoral-nerves': ['femur-left', 'quadriceps'],
  aorta: ['heart', 'vena-cava'],
  'carotid-arteries': ['atlas', 'aorta'],
  'vena-cava': ['aorta', 'heart'],
  'femoral-arteries': ['femur-left', 'aorta'],
  'subclavian-arteries': ['clavicle-left', 'aorta'],
  brain: ['frontal-bone', 'mandible'],
  heart: ['lungs', 'aorta', 'body-of-sternum'],
  lungs: ['body-of-sternum', 'heart'],
  liver: ['stomach', 'abdominal-wall'],
  stomach: ['liver', 'abdominal-wall'],
  kidneys: ['hip-left', 'vena-cava'],
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
