import type { MuscleCopy } from '../muscleCopy'

/** Copy for Open3D leaves that were not in the BodyParts3D twenty. */
export const OPEN3D_EXTRA_COPY: Record<string, MuscleCopy> = {
  'pectoralis-minor': {
    function: "Draws the scapula forward and down against the rib cage.",
    relation: "Ribs 3\u20135 to the coracoid process of the scapula.",
    blurb: "A small anterior chest leaf under pectoralis major. It is the Open3D pectoralis minor, not a second major.",
  },
  'serratus-anterior': {
    function: "Protracts the scapula and holds it against the chest wall.",
    relation: "Outer surfaces of the upper ribs to the medial border of the scapula.",
    blurb: "Finger-like slips along the lateral ribs. This is the Open3D serratus anterior, mirrored to both sides.",
  },
  'subclavius': {
    function: "Steadies the clavicle in the sternoclavicular joint.",
    relation: "First rib and its cartilage to the underside of the clavicle.",
    blurb: "A short strap under the clavicle from the Open3D trunk kit. It is not a neck muscle.",
  },
  'latissimus': {
    function: "Adducts, extends, and internally rotates the humerus.",
    relation: "Thoracolumbar fascia, iliac crest, and lower ribs to the bicipital groove.",
    blurb: "The broad climbing muscle of the back. Left and right Open3D wings share one leaf. No invented neck strap.",
  },
  'levator-scapulae': {
    function: "Elevates the scapula and tilts the glenoid down.",
    relation: "Transverse processes of C1\u2013C4 to the superior angle of the scapula.",
    blurb: "A strap from the neck of the kit onto the top of the scapula. Sternocleidomastoid is not in this leaf.",
  },
  'rhomboid-major': {
    function: "Retracts and rotates the scapula so the glenoid faces down.",
    relation: "Spinous processes T2\u2013T5 to the medial border of the scapula.",
    blurb: "The larger rhomboid sheet on the upper back, seated on the thorax rather than left floating behind it.",
  },
  'rhomboid-minor': {
    function: "Retracts the scapula with rhomboid major.",
    relation: "Nuchal ligament and C7\u2013T1 spinous processes to the medial scapular border.",
    blurb: "The smaller rhomboid just above major. It is a kit leaf, not a stand-in for a missing neck muscle.",
  },
  'teres-major': {
    function: "Adducts and internally rotates the humerus.",
    relation: "Inferior angle of the scapula to the medial lip of the bicipital groove.",
    blurb: "A posterior axillary leaf beside the latissimus tendon. It is not part of the rotator cuff merge.",
  },
  'quadratus-lumborum': {
    function: "Laterally flexes the lumbar spine and steadies rib 12.",
    relation: "Iliac crest to the twelfth rib and lumbar transverse processes.",
    blurb: "A deep flank column beside the lumbar vertebrae, kept as its own Open3D leaf.",
  },
  'multifidus': {
    function: "Stabilizes the vertebral column across lumbar, thoracic, and cervical spans.",
    relation: "Sacrum, ilium, and transverse processes to spinous processes above.",
    blurb: "The deep multifidus slips from the kit, grouped as one back leaf and seated on the column.",
  },
  'semispinalis': {
    function: "Extends the thoracic and cervical spine and rotates the head toward the opposite side.",
    relation: "Transverse processes to spinous processes several levels above.",
    blurb: "Cervical and thoracic semispinalis from the kit. Capitis is not invented as a separate face muscle.",
  },
  'splenius-capitis': {
    function: "Extends the head and rotates it toward the same side.",
    relation: "Nuchal ligament and upper thoracic spines to the mastoid and occipital bone.",
    blurb: "The kit's splenius capitis on the nape. Sternocleidomastoid is not added beside it.",
  },
  'splenius-cervicis': {
    function: "Extends and rotates the neck toward the same side.",
    relation: "Upper thoracic spinous processes to the cervical transverse processes.",
    blurb: "The narrower splenius cervicis leaf under capitis. It ships with the Open3D back kit.",
  },
  'serratus-posterior-superior': {
    function: "Elevates the upper ribs during a deep breath.",
    relation: "Nuchal ligament and cervical spines to ribs 2\u20135.",
    blurb: "A thin sheet on the upper back from the Open3D kit, seated on the rib cage.",
  },
  'serratus-posterior-inferior': {
    function: "Draws the lower ribs down and back.",
    relation: "Thoracolumbar fascia and lumbar spines to ribs 9\u201312.",
    blurb: "The lower serratus posterior sheet. It is not a latissimus duplicate.",
  },
  'external-oblique': {
    function: "Flexes and rotates the trunk and compresses the abdomen.",
    relation: "Lower ribs to the iliac crest, linea alba, and inguinal ligament.",
    blurb: "The outer abdominal sheet, kept separate from rectus so the chest hug does not flatten the flank.",
  },
  'internal-oblique': {
    function: "Flexes and rotates the trunk with the other flat abdominals.",
    relation: "Iliac crest and inguinal ligament to the lower ribs and linea alba.",
    blurb: "The middle abdominal sheet from Open3D, mirrored to both sides.",
  },
  'transversus-abdominis': {
    function: "Compresses the abdominal contents and tensions the linea alba.",
    relation: "Thoracolumbar fascia, iliac crest, and lower ribs to the linea alba.",
    blurb: "The deepest flat abdominal leaf. It is not merged into the rectus hug.",
  },
  'brachialis': {
    function: "Flexes the elbow under the biceps.",
    relation: "Anterior humerus to the ulnar tuberosity.",
    blurb: "The deep elbow flexor from the Open3D arm, mirrored to both sides.",
  },
  'coracobrachialis': {
    function: "Flexes and adducts the shoulder.",
    relation: "Coracoid process to the medial humerus.",
    blurb: "A short anterior arm leaf beside the short head of biceps.",
  },
  'anconeus': {
    function: "Assists triceps in extending the elbow.",
    relation: "Lateral epicondyle of the humerus to the olecranon.",
    blurb: "A small posterior elbow leaf from the Open3D arm kit.",
  },
  'brachioradialis': {
    function: "Flexes the elbow with the forearm in mid-pronation.",
    relation: "Lateral supracondylar ridge to the distal radius.",
    blurb: "The radial forearm strap. It is not folded into the flexor mass.",
  },
  'pronator-teres': {
    function: "Pronates the forearm and flexes the elbow.",
    relation: "Medial epicondyle and coronoid process to the lateral radius.",
    blurb: "Both Open3D heads of pronator teres, mirrored.",
  },
  'pronator-quadratus': {
    function: "Pronates the forearm at the distal radio-ulnar joint.",
    relation: "Distal anterior ulna to the distal anterior radius.",
    blurb: "The deep square pronator at the wrist from the Open3D forearm.",
  },
  'supinator': {
    function: "Supinates the forearm so the palm turns forward.",
    relation: "Lateral epicondyle and ulna to the proximal radius.",
    blurb: "The deep posterior forearm leaf that turns the palm up.",
  },
  'tibialis-posterior': {
    function: "Plantarflexes and inverts the foot.",
    relation: "Posterior tibia and fibula to the navicular and midfoot.",
    blurb: "The deep posterior leg leaf under soleus, from the Open3D lower limb.",
  },
  'fibularis-longus': {
    function: "Everts the foot and plantarflexes the ankle.",
    relation: "Proximal fibula to the medial cuneiform and first metatarsal.",
    blurb: "The long fibular strap on the lateral leg.",
  },
  'fibularis-brevis': {
    function: "Everts the foot and steadies the lateral arch.",
    relation: "Distal fibula to the fifth metatarsal. Tertius is included on this leaf.",
    blurb: "Fibularis brevis plus the small tertius slip. They are not split into extra invented leaves.",
  },
  'sartorius': {
    function: "Flexes, abducts, and externally rotates the hip, and flexes the knee.",
    relation: "Anterior superior iliac spine to the medial proximal tibia.",
    blurb: "The long strap across the front of the thigh from the Open3D lower limb.",
  },
  'tensor-fasciae-latae': {
    function: "Tenses the iliotibial tract and steadies the knee in stance.",
    relation: "Iliac crest to the iliotibial tract.",
    blurb: "The small lateral hip muscle at the front of the iliac crest.",
  },
  'piriformis': {
    function: "Externally rotates the extended hip and abducts the flexed hip.",
    relation: "Anterior sacrum to the greater trochanter.",
    blurb: "The deep posterior hip leaf that exits the greater sciatic foramen.",
  },
  'obturator-internus': {
    function: "Externally rotates the extended hip.",
    relation: "Inner obturator membrane to the greater trochanter.",
    blurb: "The intrapelvic external rotator from the Open3D pelvis region.",
  },
  'obturator-externus': {
    function: "Externally rotates the hip.",
    relation: "Outer obturator membrane to the trochanteric fossa.",
    blurb: "The external obturator, kept as its own leaf beside the adductors.",
  },
  'gemelli': {
    function: "Externally rotate the hip with obturator internus.",
    relation: "Ischial spine and tuberosity to the greater trochanter.",
    blurb: "Superior and inferior gemellus share one leaf. They are kit muscles, not a gel stand-in.",
  },
  'quadratus-femoris': {
    function: "Externally rotates the hip.",
    relation: "Ischial tuberosity to the intertrochanteric crest.",
    blurb: "A short deep rotator under the gluteus, from the Open3D lower limb.",
  },
  'popliteus': {
    function: "Unlocks the knee by rotating the tibia medially.",
    relation: "Lateral femoral condyle to the posterior proximal tibia.",
    blurb: "The small muscle on the back of the knee. It is not part of gastrocnemius.",
  },
  'plantaris': {
    function: "Weakly plantarflexes the ankle and flexes the knee.",
    relation: "Lateral supracondylar ridge to the calcaneus via a long tendon.",
    blurb: "The slim plantaris belly from Open3D, separate from gastrocnemius and soleus.",
  },
}
