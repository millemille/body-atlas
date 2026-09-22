import { OPEN3D_EXTRA_COPY } from './generated/open3dMuscleCopy'
import { OPEN3D_MUSCLE_IDS } from './generated/muscleIds'

/** Clinical-friendly muscle card copy. Applied to catalog fields; the card just reads them. */

export type MuscleCopy = {
  function: string
  relation: string
  blurb: string
  kind?: string
}

export const LIVE_MUSCLE_IDS = OPEN3D_MUSCLE_IDS

const COPY: Record<string, MuscleCopy> = {
  pectoralis: {
    function: 'Adducts, flexes, and internally rotates the humerus; the main hugging / pushing muscle of the chest.',
    relation: 'Clavicle, sternum, and costal cartilages 1–6 to the lateral lip of the bicipital groove of the humerus.',
    blurb:
      'Pectoralis major is the broad anterior chest wall. This atlas shows paired volumes over the sternum and upper ribs — not separate clavicular and sternocostal heads.',
  },
  'biceps-left': {
    function: 'Flexes the elbow and supinates the forearm; also weakly flexes the shoulder.',
    relation: 'Scapula (coracoid and supraglenoid tubercle) to the radial tuberosity and bicipital aponeurosis.',
    blurb:
      'Left biceps brachii sits on the anterior humerus. Two heads are not split in this pass; the volume marks the belly that flexes the left elbow.',
  },
  'biceps-right': {
    function: 'Flexes the elbow and supinates the forearm; also weakly flexes the shoulder.',
    relation: 'Scapula (coracoid and supraglenoid tubercle) to the radial tuberosity and bicipital aponeurosis.',
    blurb:
      'Right biceps brachii on the anterior humerus. Counterpart to the left belly; two heads are merged in this densify volume.',
  },
  'triceps-left': {
    function: 'Extends the elbow; the long head also adducts and extends the shoulder.',
    relation: 'Scapula (infraglenoid tubercle) and posterior humerus to the olecranon of the ulna.',
    blurb:
      'Left triceps brachii on the back of the arm. Three heads are one volume here. It is the antagonist of the left biceps.',
  },
  'triceps-right': {
    function: 'Extends the elbow; the long head also adducts and extends the shoulder.',
    relation: 'Scapula (infraglenoid tubercle) and posterior humerus to the olecranon of the ulna.',
    blurb:
      'Right triceps brachii on the back of the arm. Three heads are merged. It is the antagonist of the right biceps.',
  },
  deltoids: {
    function: 'Abducts the arm; anterior fibers flex and internally rotate, posterior fibers extend and externally rotate.',
    relation: 'Lateral clavicle, acromion, and scapular spine to the deltoid tuberosity of the humerus.',
    blurb:
      'Paired shoulder caps. They give the silhouette its width and cover the glenohumeral joint. Heads are not split in this pass.',
  },
  'abdominal-wall': {
    function: 'Flexes the trunk, supports the viscera, and raises intra-abdominal pressure.',
    relation: 'Lower costal cartilages and xiphoid to the pubic crest and linea alba; laterals meet the iliac crest.',
    blurb:
      'Anterior abdominal wall as one shallow panel (rectus plus the flat obliques). Linea alba and individual slips are not mapped.',
  },
  quadriceps: {
    function: 'Extends the knee; rectus femoris also flexes the hip.',
    relation: 'Ilium and femur to the tibial tuberosity via the patella and patellar tendon.',
    blurb:
      'Paired anterior thigh volumes over both femurs. Vastus heads and rectus are merged so the group reads as one pick per side of the pair.',
  },
  trapezius: {
    function: 'Elevates, retracts, and rotates the scapula; upper fibers also extend the neck.',
    relation: 'Occiput, nuchal ligament, and spinous processes C7–T12 to the clavicle, acromion, and scapular spine.',
    blurb:
      'Kite-shaped upper-back volume from the neck toward both shoulders. Descending, transverse, and ascending parts are one mesh this pass.',
  },
  latissimus: {
    function: 'Adducts, extends, and internally rotates the humerus; the climbing / rowing muscle of the back.',
    relation: 'Spinous processes T7–L5, thoracolumbar fascia, iliac crest, and lower ribs to the floor of the bicipital groove.',
    blurb:
      'Broad posterior trunk volume. Left and right wings share one id. Fascia and rib slips are not separated.',
  },
  gluteus: {
    function: 'Extends and externally rotates the hip; the main muscle of rising and stair climbing.',
    relation: 'Ilium, sacrum, and coccyx to the gluteal tuberosity of the femur and the iliotibial tract.',
    blurb:
      'Paired gluteus maximus volumes over the posterior pelvis. Medius and minimus are not split out in this densify pass.',
  },
  gastrocnemius: {
    function: 'Plantarflexes the ankle and flexes the knee; the superficial calf.',
    relation: 'Medial and lateral femoral condyles to the calcaneus via the Achilles tendon.',
    blurb:
      'Paired two-head calf volumes from the femoral condyles into the Achilles. Soleus is a separate, deeper pick this pass.',
  },
  hamstrings: {
    function: 'Flexes the knee and extends the hip; the posterior thigh group.',
    relation: 'Ischial tuberosity to the proximal tibia (and fibula for biceps femoris).',
    blurb:
      'Paired posterior thigh volumes. Semimembranosus, semitendinosus, and biceps femoris are one pick per side.',
  },
  soleus: {
    function: 'Plantarflexes the ankle; the deep workhorse of standing and walking.',
    relation: 'Proximal posterior tibia and fibula to the calcaneus via the Achilles tendon.',
    blurb:
      'Paired deep calf volumes under gastrocnemius. Wider and more distal than the two gastroc heads. Not a separate fibular slip.',
  },
  iliopsoas: {
    function: 'Primary hip flexor; also contributes to lumbar stance.',
    relation: 'T12–L5 and the iliac fossa to the lesser trochanter of the femur.',
    blurb:
      'Paired hip-flexor stand-in from the lumbar stack to the proximal femur. Psoas major and iliacus are merged.',
  },
  'forearm-flexors': {
    function: 'Flexes the wrist and fingers; the anterior forearm mass.',
    relation: 'Medial epicondyle of the humerus to the palmar carpus and digits.',
    blurb:
      'Paired anterior forearm volumes. Individual flexor slips and the extensor compartment are not split this pass.',
  },
  'rotator-cuff': {
    function: 'Centers the humeral head on the glenoid; abducts (supra) and rotates the arm.',
    relation: 'Scapular fossae to the greater and lesser tubercles of the humerus.',
    blurb:
      'Paired cuff stand-in: a superior strap (supraspinatus), a posterior fan (infraspinatus + teres minor), and an anterior slip (subscapularis). Slips are merged per side, not four named picks.',
  },
  'erector-spinae': {
    function: 'Extends and laterally bends the spine; the deep back column that holds stance.',
    relation: 'Sacrum, iliac crest, and lumbar fascia to the thoracic transverse processes and ribs.',
    blurb:
      'Iliocostalis, longissimus, and spinalis from the Open3D back kit, as one paraspinal leaf. Multifidus is its own leaf.',
  },
  'hip-adductors': {
    function: 'Adducts the thigh; also assists hip flexion and medial rotation.',
    relation: 'Pubis and ischiopubic ramus to the medial femur (linea aspera) and the pes anserinus region.',
    blurb:
      'Paired medial-thigh volumes. Adductor longus, brevis, magnus, and gracilis are one pick per side.',
  },
  'tibialis-anterior': {
    function: 'Dorsiflexes and inverts the foot; the main muscle of heel-strike clearance.',
    relation: 'Lateral condyle and proximal tibia to the medial cuneiform and first metatarsal.',
    blurb:
      'Paired anterior-leg straps from the proximal tibia to the medial midfoot. Extensor hallucis and digitorum are not split out.',
  },
  ...OPEN3D_EXTRA_COPY,
  'forearm-extensors': {
    function: 'Extends the wrist and fingers; the posterior forearm mass.',
    relation: 'Lateral epicondyle of the humerus to the dorsal carpus and digits.',
    blurb:
      'Paired posterior forearm volumes opposite the flexor mass. Individual extensor slips and anatomical snuffbox tendons are not mapped.',
  },
}

export function muscleCopy(id: string): MuscleCopy | null {
  return COPY[id] ?? null
}

export function applyMuscleCopy<
  T extends {
    id: string
    system: string
    function: string
    relation: string
    blurb: string
    kind: string
    source?: 'bodyparts3d' | 'open3d' | 'interim'
  },
>(part: T): T {
  if (part.system !== 'muscle') return part
  const next = muscleCopy(part.id)
  if (!next) return part
  return {
    ...part,
    function: next.function,
    relation: next.relation,
    blurb: next.blurb,
    kind:
      next.kind ??
      (part.source === 'bodyparts3d' || part.source === 'open3d'
        ? 'Muscle · mesh'
        : 'Muscle · densify volume'),
  }
}
