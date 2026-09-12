/** Clinical-friendly skeleton card copy. Applied to catalog fields; the card just reads them. */

export type BoneCopy = {
  function: string
  relation: string
  blurb: string
}

type Side = 'left' | 'right' | null

const ORDINAL: Record<string, number> = {
  first: 1,
  second: 2,
  third: 3,
  fourth: 4,
  fifth: 5,
  sixth: 6,
  seventh: 7,
  eighth: 8,
  ninth: 9,
  tenth: 10,
  eleventh: 11,
  twelfth: 12,
}

const FINGER = {
  thumb: 'thumb',
  'index-finger': 'index finger',
  'middle-finger': 'middle finger',
  'ring-finger': 'ring finger',
  'little-finger': 'little finger',
} as const

const TOE = {
  'big-toe': 'big toe',
  hallux: 'big toe',
  'second-toe': 'second toe',
  'third-toe': 'third toe',
  'fourth-toe': 'fourth toe',
  'little-toe': 'little toe',
} as const

const METACARPAL_DISTAL = [
  'proximal phalanx of the thumb',
  'proximal phalanx of the index finger',
  'proximal phalanx of the middle finger',
  'proximal phalanx of the ring finger',
  'proximal phalanx of the little finger',
]

const METATARSAL_DISTAL = [
  'proximal phalanx of the big toe',
  'proximal phalanx of the second toe',
  'proximal phalanx of the third toe',
  'proximal phalanx of the fourth toe',
  'proximal phalanx of the little toe',
]

export function sideOf(id: string): Side {
  if (id.endsWith('-left')) return 'left'
  if (id.endsWith('-right')) return 'right'
  return null
}

function titleCaseBone(id: string, name: string) {
  const bare = name.replace(/\s*·\s*(left|right)\s*$/i, '').trim()
  return bare || id
}

function joinAnd(items: string[]) {
  if (items.length <= 1) return items[0] ?? ''
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`
}

function sided(side: Side, nouns: string[]) {
  if (!side) return joinAnd(nouns)
  return joinAnd(nouns.map((n) => (n.startsWith('the ') ? `the ${side} ${n.slice(4)}` : `${side} ${n}`)))
}

function copy(fn: string, relation: string, blurb: string): BoneCopy {
  return { function: fn, relation, blurb }
}

function ordinalIn(id: string): { word: string; n: number } | null {
  for (const [word, n] of Object.entries(ORDINAL)) {
    if (id.includes(`${word}-`) || id.startsWith(`${word}-`)) return { word, n }
  }
  return null
}

function fingerKey(id: string): keyof typeof FINGER | null {
  for (const key of Object.keys(FINGER) as (keyof typeof FINGER)[]) {
    if (id.includes(key)) return key
  }
  return null
}

function toeKey(id: string): keyof typeof TOE | null {
  for (const key of Object.keys(TOE) as (keyof typeof TOE)[]) {
    if (id.includes(key)) return key
  }
  return null
}

function isFootToken(id: string, name: string) {
  const n = `${id} ${name}`.toLowerCase()
  return /\b(toe|toes|metatarsal|talus|calcaneus|cuboid|cuneiform|tarsal|hallux)\b|navicular[- ]of[- ]foot/.test(
    n,
  )
}

export function boneCopy(id: string, name: string): BoneCopy {
  const side = sideOf(id)
  const n = id.toLowerCase()

  if (n === 'manubrium') {
    return copy(
      'Upper sternum; braces the clavicles and first ribs.',
      'Clavicles, first ribs, and the body of the sternum.',
      'Broad sternal plate at the base of the neck. It receives both clavicles at the sternoclavicular joints.',
    )
  }
  if (n === 'body-of-sternum') {
    return copy(
      'Central sternal plate that anchors the true ribs.',
      'Manubrium, xiphoid process, and costal cartilages of ribs 2–7.',
      'Long middle segment of the breastbone. Most of the true ribs meet it through costal cartilage.',
    )
  }
  if (n === 'xiphoid-process') {
    return copy(
      'Inferior sternal tip; attachment for the diaphragm and abdominal wall.',
      'Body of the sternum.',
      'Small midline process below the sternal body. It is cartilaginous in youth and later ossifies.',
    )
  }

  if (/-rib-/.test(n) || /^(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth)-rib-/.test(n)) {
    const ord = ordinalIn(n)
    const num = ord?.n ?? 0
    const label = ord ? `${ord.word} rib` : 'rib'
    const vertebra = num ? `T${num} vertebra` : 'matching thoracic vertebra'
    if (num === 1) {
      return copy(
        'Forms the thoracic inlet and supports the sternoclavicular region.',
        sided(side, ['T1 vertebra', 'manubrium (via first costal cartilage)']),
        `Shortest, most curved rib. It roofs the lung apex and carries the groove for the subclavian vessels.`,
      )
    }
    if (num === 2) {
      return copy(
        'Second true rib; expands the upper chest wall in breathing.',
        sided(side, ['T2 vertebra', 'sternum via second costal cartilage']),
        `True rib of the upper thorax. Its tubercle for serratus anterior is a useful surface landmark.`,
      )
    }
    if (num >= 3 && num <= 7) {
      return copy(
        `True rib that widens the thorax during inspiration.`,
        sided(side, [`T${num} vertebra`, 'sternum via costal cartilage']),
        `${titleCaseBone(id, name)} is a true rib. Its head meets the matching thoracic vertebra; the front end reaches the sternum through cartilage.`,
      )
    }
    if (num >= 8 && num <= 10) {
      return copy(
        'False rib that lengthens the costal margin.',
        sided(side, [`T${num} vertebra`, 'costal cartilage of the rib above']),
        `${titleCaseBone(id, name)} does not reach the sternum directly. It joins the costal margin through the cartilage of the rib above.`,
      )
    }
    if (num === 11 || num === 12) {
      return copy(
        'Floating rib that guards the posterior abdominal wall.',
        sided(side, [`T${num} vertebra`]),
        `${titleCaseBone(id, name)} has a free anterior end. It does not join the costal margin.`,
      )
    }
    return copy(
      'Chest-wall rib that expands the thorax in breathing.',
      sided(side, [vertebra, 'sternum or costal margin']),
      `${titleCaseBone(id, name)} is a thoracic rib of the ${label}.`,
    )
  }

  if (n === 'atlas') {
    return copy(
      'C1 vertebra; supports the skull and permits nodding.',
      'Occipital bone and the axis (C2).',
      'Ring-shaped first cervical vertebra. It has no body; the skull nods on its superior facets.',
    )
  }
  if (n === 'axis') {
    return copy(
      'C2 vertebra; its dens is the pivot for head rotation.',
      'Atlas (C1) and C3.',
      'Second cervical vertebra. The dens projects into the atlas and is held by the transverse ligament.',
    )
  }
  if (n.includes('cervical-vertebra')) {
    const ord = ordinalIn(n)
    const num = ord?.n ?? 0
    const label = num ? `C${num}` : 'cervical vertebra'
    const above = num === 3 ? 'axis (C2)' : num ? `C${num - 1}` : 'the vertebra above'
    const below = num === 7 ? 'T1' : num ? `C${num + 1}` : 'the vertebra below'
    return copy(
      `${label} bears the neck and allows flexion, extension, and rotation.`,
      `${above} and ${below}.`,
      `${titleCaseBone(id, name)} is a typical cervical vertebra with a transverse foramen for the vertebral artery.`,
    )
  }
  if (n.includes('thoracic-vertebra')) {
    const ord = ordinalIn(n)
    const num = ord?.n ?? 0
    const label = num ? `T${num}` : 'thoracic vertebra'
    const above = num === 1 ? 'C7' : num ? `T${num - 1}` : 'the vertebra above'
    const below = num === 12 ? 'L1' : num ? `T${num + 1}` : 'the vertebra below'
    const ribs = num ? `ribs ${num}` : 'its rib pair'
    return copy(
      `${label} anchors a rib pair and stiffens the thorax.`,
      `${above}, ${below}, and ${ribs}.`,
      `${titleCaseBone(id, name)} has costal facets for the matching ribs. The thoracic column is the least mobile spinal region.`,
    )
  }
  if (n.includes('lumbar-vertebra')) {
    const ord = ordinalIn(n)
    const num = ord?.n ?? 0
    const label = num ? `L${num}` : 'lumbar vertebra'
    const above = num === 1 ? 'T12' : num ? `L${num - 1}` : 'the vertebra above'
    const below = num === 5 ? 'sacrum' : num ? `L${num + 1}` : 'the vertebra below'
    return copy(
      `${label} bears axial load and allows flexion and extension.`,
      `${above} and ${below}.`,
      `${titleCaseBone(id, name)} has a large body and stout pedicles. The lumbar column carries most of the trunk weight.`,
    )
  }
  if (n === 'sacrum') {
    return copy(
      'Fused sacral vertebrae that transmit trunk load into the pelvis.',
      'L5 and both hip bones (sacroiliac joints).',
      'Five fused vertebrae forming the posterior pelvis. The auricular surfaces lock to the ilia.',
    )
  }

  if (n.startsWith('clavicle-')) {
    return copy(
      'Strut that holds the scapula off the thorax.',
      sided(side, ['manubrium (sternoclavicular joint)', 'acromion of the scapula']),
      'S-shaped collar bone. It is the only bony link between the upper limb and the axial skeleton.',
    )
  }
  if (n.startsWith('scapula-')) {
    return copy(
      'Mobile platform for the shoulder joint and rotator cuff.',
      sided(side, ['clavicle', 'humerus (glenohumeral joint)']),
      'Triangular shoulder blade. The glenoid fossa meets the humeral head; the acromion meets the clavicle.',
    )
  }
  if (n.startsWith('hip-')) {
    return copy(
      'Pelvic bone; forms the acetabulum and the pelvic brim.',
      sided(side, ['sacrum (sacroiliac joint)', 'femur']) + ', and the contralateral pubis at the pubic symphysis.',
      'Fused ilium, ischium, and pubis. The cup-shaped acetabulum receives the femoral head.',
    )
  }

  if (n.startsWith('humerus-')) {
    return copy(
      'Arm bone; lever at the shoulder and the elbow.',
      sided(side, ['scapula', 'radius', 'ulna']),
      'Long bone of the arm. Its head sits in the glenoid; the distal condyles form the elbow hinge.',
    )
  }
  if (n.startsWith('radius-')) {
    return copy(
      'Lateral forearm bone; rotates around the ulna in pronation and supination.',
      sided(side, ['humerus', 'ulna', 'scaphoid', 'lunate']),
      'The radial head spins on the capitulum. Distally it carries most of the wrist joint with the carpus.',
    )
  }
  if (n.startsWith('ulna-')) {
    return copy(
      'Medial forearm bone; forms the hinge of the elbow.',
      sided(side, ['humerus', 'radius']) + ', and the carpus via the articular disc.',
      'Its olecranon locks into the humerus in extension. Distally it does not meet the carpals directly.',
    )
  }

  if (n.startsWith('scaphoid-')) {
    return copy(
      'Proximal carpal that links the radius to the distal row.',
      sided(side, ['radius', 'lunate', 'trapezium', 'trapezoid', 'capitate']),
      'Boat-shaped radial carpal. Waist fractures risk avascular necrosis of the proximal pole.',
    )
  }
  if (n.startsWith('lunate-')) {
    return copy(
      'Central proximal carpal of the radiocarpal joint.',
      sided(side, ['radius', 'scaphoid', 'triquetrum', 'capitate', 'hamate']),
      'Crescent-shaped keystone of the proximal carpal row. It sits in the lunate fossa of the radius.',
    )
  }
  if (n.startsWith('pisiform-')) {
    return copy(
      'Sesamoid in flexor carpi ulnaris; deepens Guyon’s canal.',
      sided(side, ['triquetrum']),
      'Pea-shaped ulnar carpal that sits on the palmar surface of the triquetrum.',
    )
  }
  if (n.startsWith('trapezium-')) {
    return copy(
      'Distal carpal that forms the saddle joint of the thumb.',
      sided(side, ['scaphoid', 'trapezoid', 'first metacarpal', 'second metacarpal']),
      'The trapeziometacarpal joint is what lets the thumb oppose the fingers.',
    )
  }
  if (n.startsWith('trapezoid-')) {
    return copy(
      'Distal carpal under the index metacarpal.',
      sided(side, ['scaphoid', 'trapezium', 'capitate', 'second metacarpal']),
      'Wedge-shaped bone of the distal carpal row. It is the least mobile of that row.',
    )
  }
  if (n.startsWith('capitate-')) {
    return copy(
      'Largest carpal; keystone of the distal row.',
      sided(side, ['scaphoid', 'lunate', 'trapezoid', 'hamate', 'metacarpals 2–4']),
      'Its head sits in the concavity of the scaphoid and lunate. Axial load from the middle column passes through it.',
    )
  }
  if (n.startsWith('hamate-')) {
    return copy(
      'Distal ulnar carpal; its hook shelters the ulnar nerve and artery.',
      sided(side, ['lunate', 'triquetrum', 'capitate', 'fourth metacarpal', 'fifth metacarpal']),
      'The hook of the hamate is a palpable ulnar-palm landmark and a common fracture site in racket sports.',
    )
  }

  if (n.includes('metacarpal')) {
    const ord = ordinalIn(n)
    const num = ord?.n ?? 0
    const distal = num ? METACARPAL_DISTAL[num - 1] : 'matching proximal phalanx'
    if (num === 1) {
      return copy(
        'Thumb metacarpal; enables opposition.',
        sided(side, ['trapezium', distal]),
        'Shortest, most mobile metacarpal. It is set at a right angle to the palm.',
      )
    }
    const neighbors =
      num === 2
        ? ['trapezoid', 'trapezium', 'capitate', 'third metacarpal', distal]
        : num === 3
          ? ['capitate', 'second metacarpal', 'fourth metacarpal', distal]
          : num === 4
            ? ['hamate', 'capitate', 'third metacarpal', 'fifth metacarpal', distal]
            : ['hamate', 'fourth metacarpal', distal]
    const role =
      num === 2
        ? 'Index metacarpal; stiffens the radial palm.'
        : num === 3
          ? 'Middle metacarpal; central beam of the palm.'
          : num === 4
            ? 'Ring metacarpal of the ulnar palm.'
            : 'Little-finger metacarpal; most mobile of the medial four.'
    return copy(role, sided(side, neighbors), `${titleCaseBone(id, name)} is a long bone of the palm.`)
  }

  if (n.includes('phalanx') && isFootToken(id, name)) {
    return toePhalanxCopy(n, side, id, name)
  }
  if (n.includes('phalanx')) {
    return fingerPhalanxCopy(n, side, id, name)
  }

  if (n.startsWith('femur-')) {
    return copy(
      'Thigh bone; transmits body weight to the tibia and levers the hip.',
      sided(side, ['hip bone (acetabulum)', 'patella', 'tibia']),
      'Longest bone in the body. The head sits in the acetabulum; the condyles form the knee with the tibia.',
    )
  }
  if (n.startsWith('tibia-')) {
    return copy(
      'Weight-bearing bone of the leg.',
      sided(side, ['femur', 'fibula', 'talus']),
      'Medial long bone of the leg. Its plateau takes femoral load; the distal plafond forms the ankle mortise.',
    )
  }
  if (n.startsWith('fibula-')) {
    return copy(
      'Lateral leg bone; stabilizes the ankle mortise.',
      sided(side, ['tibia', 'talus']),
      'Slender non-weight-bearing shaft. The lateral malleolus is the outer wall of the ankle joint.',
    )
  }
  if (n.startsWith('patella-')) {
    return copy(
      'Sesamoid that improves quadriceps leverage at the knee.',
      sided(side, ['femur (patellofemoral joint)']),
      'Triangular kneecap in the quadriceps tendon. It does not articulate with the tibia.',
    )
  }

  if (n.startsWith('talus-')) {
    return copy(
      'Ankle bone; transmits tibial load into the hindfoot.',
      sided(side, ['tibia', 'fibula', 'calcaneus', 'navicular']),
      'No muscle inserts on the talus. Its trochlea sits in the ankle mortise; the head meets the navicular.',
    )
  }
  if (n.startsWith('calcaneus-')) {
    return copy(
      'Heel bone; lever for the Achilles tendon and posterior pillar of the foot.',
      sided(side, ['talus', 'cuboid']),
      'Largest tarsal. The Achilles inserts on its tuberosity; the superior facets carry the talus.',
    )
  }
  if (n.includes('navicular-of-foot') || (n.includes('navicular') && isFootToken(id, name))) {
    return copy(
      'Midfoot bone that keys the medial longitudinal arch.',
      sided(side, ['talus', 'medial cuneiform', 'intermediate cuneiform', 'lateral cuneiform']),
      'Boat-shaped tarsal on the medial column. Tibialis posterior inserts on its tuberosity.',
    )
  }
  if (n.startsWith('medial-cuneiform-')) {
    return copy(
      'Medial midfoot bone under the first metatarsal.',
      sided(side, ['navicular', 'intermediate cuneiform', 'first metatarsal', 'second metatarsal']),
      'Largest cuneiform. It is a keystone of the medial longitudinal arch.',
    )
  }
  if (n.startsWith('intermediate-cuneiform-')) {
    return copy(
      'Middle cuneiform of the medial column.',
      sided(side, ['navicular', 'medial cuneiform', 'lateral cuneiform', 'second metatarsal']),
      'Smallest cuneiform. It sits recessed, which helps lock the second metatarsal as a keystone.',
    )
  }
  if (n.startsWith('lateral-cuneiform-')) {
    return copy(
      'Lateral cuneiform of the midfoot.',
      sided(side, ['navicular', 'intermediate cuneiform', 'cuboid', 'metatarsals 2–4']),
      'Wedge that completes the distal tarsal row on the lateral side of the medial column.',
    )
  }
  if (n.startsWith('cuboid-')) {
    return copy(
      'Lateral midfoot bone under the fourth and fifth metatarsals.',
      sided(side, ['calcaneus', 'lateral cuneiform', 'fourth metatarsal', 'fifth metatarsal']),
      'Cube-shaped tarsal of the lateral column. Peroneus longus grooves its plantar surface.',
    )
  }

  if (n.includes('metatarsal')) {
    const ord = ordinalIn(n)
    const num = ord?.n ?? 0
    const distal = num ? METATARSAL_DISTAL[num - 1] : 'matching proximal phalanx'
    if (num === 1) {
      return copy(
        'Hallux metatarsal; main push-off bone of the medial column.',
        sided(side, ['medial cuneiform', distal, 'second metatarsal']),
        'Shortest, stoutest metatarsal. It carries much of the load at toe-off.',
      )
    }
    if (num === 5) {
      return copy(
        'Fifth metatarsal; its tuberosity takes peroneus brevis.',
        sided(side, ['cuboid', 'fourth metatarsal', distal]),
        'Lateral-column metatarsal. The base tuberosity is a common avulsion site.',
      )
    }
    const neighbors =
      num === 2
        ? ['intermediate cuneiform', 'medial cuneiform', 'lateral cuneiform', 'first metatarsal', 'third metatarsal', distal]
        : num === 3
          ? ['lateral cuneiform', 'second metatarsal', 'fourth metatarsal', distal]
          : ['cuboid', 'third metatarsal', 'fifth metatarsal', distal]
    const role =
      num === 2
        ? 'Second metatarsal; longest, and a keystone of the transverse arch.'
        : num === 3
          ? 'Third metatarsal of the central forefoot.'
          : 'Fourth metatarsal of the lateral column.'
    return copy(role, sided(side, neighbors), `${titleCaseBone(id, name)} is a long bone of the forefoot.`)
  }

  if (n === 'frontal') {
    return copy(
      'Forms the forehead and the roofs of the orbits.',
      'Parietal bones, sphenoid, ethmoid, zygomatic bones, nasal bones, maxillae, and lacrimal bones.',
      'Unpaired vault bone. The supraorbital margins are its anterior edge.',
    )
  }
  if (n === 'occipital') {
    return copy(
      'Forms the posterior vault and the foramen magnum.',
      'Parietal bones, temporal bones, sphenoid, and the atlas (C1).',
      'The occipital condyles nod on the atlas. The spinal cord leaves the skull through the foramen magnum.',
    )
  }
  if (n === 'sphenoid') {
    return copy(
      'Central cranial bone spanning the middle cranial fossa.',
      'Occipital, temporal, parietal, frontal, and ethmoid bones, plus both zygomatics, palatines, and the vomer.',
      'Butterfly-shaped bone. The sella turcica holds the pituitary; the greater wings reach the temples.',
    )
  }
  if (n.startsWith('temporal-')) {
    return copy(
      'Houses the ear and the mandibular fossa of the TMJ.',
      sided(side, ['occipital bone', 'parietal bone', 'sphenoid', 'zygomatic bone']) + ', and the mandible.',
      'The zygomatic process completes the zygomatic arch. The petrous part contains the inner ear.',
    )
  }
  if (n === 'ethmoid') {
    return copy(
      'Forms the upper nasal septum and the medial orbital walls.',
      'Frontal, sphenoid, nasal, maxillary, lacrimal, and palatine bones, and the vomer.',
      'Delicate midline bone. The cribriform plate transmits olfactory filaments.',
    )
  }
  if (n === 'vomer') {
    return copy(
      'Inferior plate of the bony nasal septum.',
      'Sphenoid, ethmoid, palatine bones, and maxillae.',
      'Thin plow-shaped bone in the midline of the nasal cavity.',
    )
  }
  if (n === 'mandible') {
    return copy(
      'Mobile lower jaw for mastication and speech.',
      'Left and right temporal bones (temporomandibular joints).',
      'Horseshoe-shaped bone that holds the lower teeth. The condyles sit in the mandibular fossae.',
    )
  }
  if (n === 'hyoid') {
    return copy(
      'Suspends the tongue and larynx; the only bone without a bony joint.',
      'No bony articulations — ligaments and muscles from the styloid processes and thyroid cartilage.',
      'U-shaped bone in the anterior neck. It is a floating attachment for the supra- and infrahyoid muscles.',
    )
  }
  if (n.startsWith('parietal-')) {
    return copy(
      'Forms the lateral cranial vault.',
      sided(side, ['frontal bone', 'occipital bone', 'temporal bone', 'sphenoid']) +
        `, and the contralateral parietal bone.`,
      'Paired vault plate. The sagittal suture joins the two parietals in the midline.',
    )
  }
  if (n.startsWith('zygomatic-')) {
    return copy(
      'Cheek bone; forms the lateral orbital rim.',
      sided(side, ['frontal bone', 'temporal bone', 'sphenoid', 'maxilla']),
      'The zygomatic arch is the palpable ridge from cheek to ear.',
    )
  }
  if (n.startsWith('lacrimal-')) {
    return copy(
      'Small medial orbital bone that holds the lacrimal sac.',
      sided(side, ['frontal bone', 'ethmoid', 'maxilla']),
      'Thinnest facial bone. Tears drain beside it into the nasolacrimal canal.',
    )
  }
  if (n.startsWith('nasal-')) {
    return copy(
      'Forms the bony bridge of the nose.',
      sided(side, ['frontal bone', 'maxilla', 'ethmoid']) + ', and the contralateral nasal bone.',
      'Paired rectangular plate. The two nasals meet in the midline under the glabella.',
    )
  }
  if (n.startsWith('maxilla-')) {
    return copy(
      'Upper jaw; holds the upper teeth and forms the orbital floor.',
      sided(side, ['frontal bone', 'nasal bone', 'zygomatic bone', 'lacrimal bone', 'palatine bone']) +
        ', the vomer, ethmoid, and the contralateral maxilla.',
      'The maxillary sinus fills most of its body. The alveolar process carries the upper dental arch.',
    )
  }
  if (n.startsWith('palatine-')) {
    return copy(
      'Forms the posterior hard palate and part of the nasal cavity.',
      sided(side, ['maxilla', 'sphenoid', 'ethmoid']) + ', the vomer, and the contralateral palatine bone.',
      'L-shaped bone. Horizontal plates meet in the midline to complete the hard palate.',
    )
  }

  const label = titleCaseBone(id, name)
  return copy(
    `Named bone of the ${side ?? 'midline'} skeleton.`,
    'Adjacent bones of the same region.',
    `${label} is a segmented skeletal element in this atlas.`,
  )
}

function fingerPhalanxCopy(id: string, side: Side, rawId: string, name: string): BoneCopy {
  const digit = fingerKey(id)
  const digitName = digit ? FINGER[digit] : 'finger'
  const ray = digit === 'thumb' ? 1 : digit === 'index-finger' ? 2 : digit === 'middle-finger' ? 3 : digit === 'ring-finger' ? 4 : 5
  if (id.includes('proximal-phalanx')) {
    const proximal =
      digit === 'thumb'
        ? sided(side, ['first metacarpal', 'distal phalanx of the thumb'])
        : sided(side, [`${ordinalWord(ray)} metacarpal`, `middle phalanx of the ${digitName}`])
    return copy(
      `Proximal phalanx of the ${digitName}; flexes at the metacarpophalangeal joint.`,
      proximal,
      `${titleCaseBone(rawId, name)} is the near bone of the ${digitName}. It takes the flexor and extensor tendons of that ray.`,
    )
  }
  if (id.includes('middle-phalanx')) {
    return copy(
      `Middle phalanx of the ${digitName}; flexes at the proximal interphalangeal joint.`,
      sided(side, [`proximal phalanx of the ${digitName}`, `distal phalanx of the ${digitName}`]),
      `The thumb has no middle phalanx. This bone sits between the two interphalangeal joints of the ${digitName}.`,
    )
  }
  const distalRel =
    digit === 'thumb'
      ? sided(side, ['proximal phalanx of the thumb'])
      : sided(side, [`middle phalanx of the ${digitName}`])
  return copy(
    `Distal phalanx of the ${digitName}; bears the nail bed and pulp.`,
    distalRel,
    `${titleCaseBone(rawId, name)} is the terminal bone of the ${digitName}. The flexor digitorum profundus (or flexor pollicis longus) inserts here.`,
  )
}

function toePhalanxCopy(id: string, side: Side, rawId: string, name: string): BoneCopy {
  const digit = toeKey(id)
  const digitName = digit ? TOE[digit] : 'toe'
  const ray =
    digit === 'big-toe' || digit === 'hallux'
      ? 1
      : digit === 'second-toe'
        ? 2
        : digit === 'third-toe'
          ? 3
          : digit === 'fourth-toe'
            ? 4
            : 5
  if (id.includes('proximal-phalanx')) {
    const proximal =
      ray === 1
        ? sided(side, ['first metatarsal', 'distal phalanx of the big toe'])
        : sided(side, [`${ordinalWord(ray)} metatarsal`, `middle phalanx of the ${digitName}`])
    return copy(
      `Proximal phalanx of the ${digitName}; flexes at the metatarsophalangeal joint.`,
      proximal,
      `${titleCaseBone(rawId, name)} is the near bone of the ${digitName}. It is the main flexing segment at the ball of the foot.`,
    )
  }
  if (id.includes('middle-phalanx')) {
    return copy(
      `Middle phalanx of the ${digitName}; flexes at the proximal interphalangeal joint.`,
      sided(side, [`proximal phalanx of the ${digitName}`, `distal phalanx of the ${digitName}`]),
      `The big toe has no middle phalanx. This short bone sits in the ${digitName} between the two interphalangeal joints.`,
    )
  }
  const distalRel =
    ray === 1
      ? sided(side, ['proximal phalanx of the big toe'])
      : sided(side, [`middle phalanx of the ${digitName}`])
  return copy(
    `Distal phalanx of the ${digitName}; bears the nail bed and pulp.`,
    distalRel,
    `${titleCaseBone(rawId, name)} is the terminal bone of the ${digitName}.`,
  )
}

function ordinalWord(n: number) {
  return (
    Object.entries(ORDINAL).find(([, v]) => v === n)?.[0] ??
    `${n}`
  )
}

export function applyBoneCopy<T extends { id: string; name: string; function: string; relation: string; blurb: string }>(
  part: T,
): T {
  const next = boneCopy(part.id, part.name)
  if (
    next.function === part.function &&
    next.relation === part.relation &&
    next.blurb === part.blurb
  ) {
    return part
  }
  return { ...part, function: next.function, relation: next.relation, blurb: next.blurb }
}

export const BOILERPLATE_RE =
  /Named skeletal element in the segmented BodyParts3D kit|reduced polygon stand-in|Neighboring bones in the BodyParts3D skeleton set/
