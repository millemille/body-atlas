#!/usr/bin/env python3
"""Bake public/atlas/muscles.glb from Open3Dmodel regional GLBs.

Source: AnatomyTOOL Open3Dmodel (CC BY-SA 4.0). Textures are dropped —
several muscle maps are NC — and the atlas shades the mesh itself.

Right-side Open3D meshes sit on atlas-left (−X). Bilateral leaves are mirrored.
A rigid translation from shared midline bones seats the kit on the BodyParts3D
skeleton. Pectoralis then uses hugAnteriorWall on the sternum. Rectus keeps its
own slope from the xiphoid down to L5 height and seats its anterior face on the
xiphoid wall — the L5 vertebral body is not the belly surface. Obliques lose
the midline aponeurosis so they stay lateral. Posterior leaves shift only when
they float behind the skeleton.

The existing trapezius peak is seated on the superior nuchal line. Upper-back
leaves keep their triangles over both scapulae. Does not invent SCM, face, or
deep-neck leaves the kit does not ship.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

import numpy as np
import trimesh

ROOT = Path(__file__).resolve().parents[1]
THORAX = Path("/tmp/open3d/thorax.glb")
UPPER = Path("/tmp/open3d/upper.glb")
LOWER = Path("/tmp/open3d/lower.glb")
SKEL_GLB = ROOT / "public/atlas/skeleton.glb"
SKEL_TS = ROOT / "src/atlas/generated/skeletonCatalog.ts"
OUT_GLB = ROOT / "public/atlas/muscles.glb"
OUT_MANIFEST = ROOT / "public/atlas/muscles-manifest.json"
OUT_CATALOG = ROOT / "src/atlas/generated/muscleCatalog.ts"
OUT_IDS = ROOT / "src/atlas/generated/muscleIds.ts"
OUT_COPY = ROOT / "src/atlas/generated/open3dMuscleCopy.ts"
OUT_WAVES = ROOT / "src/atlas/generated/muscleWaves.ts"
OUT_LIC = ROOT / "public/atlas/LICENSE-Open3D.txt"

PLATE = 0.01
MAX_POSTERIOR_SHIFT = 0.04
# Rectus spans about ±0.08. Inside this, the front midline stays rectus.
OBLIQUE_MEDIAL_X = 0.07
LATERAL_ABDOMEN = {"external-oblique", "internal-oblique", "transversus-abdominis"}
# Medial trapezius peak only. Below the hinge is the shoulder kite.
NAPE_HINGE_Y = 1.50
NAPE_X_MAX = 0.05
NAPE_PLATE = 0.008
NAPE_LIFT = 0.006

# id, name, region, side, seat, source mesh names
# side: both | left | right. Open3D ".r" is atlas left.
LEAVES: list[tuple] = [
    ("pectoralis", "Pectoralis", "Anterior thorax", "both", "pec", ["Pectoralis major.r"]),
    ("pectoralis-minor", "Pectoralis minor", "Anterior thorax", "both", None, ["Pectoralis minor.r"]),
    ("serratus-anterior", "Serratus anterior", "Lateral thorax", "both", None, ["Serratus anterior muscle.r"]),
    ("subclavius", "Subclavius", "Anterior thorax", "both", None, ["Subclavius muscle.r"]),
    ("deltoids", "Deltoids", "Shoulders", "both", None, ["Deltoid muscle.r"]),
    ("trapezius", "Trapezius", "Nuchal / upper back", "both", "back", ["Trapezius muscle.r"]),
    ("latissimus", "Latissimus dorsi", "Posterior trunk", "both", "back", ["Latissimus dorsi.r"]),
    ("levator-scapulae", "Levator scapulae", "Posterior trunk", "both", "back", ["Levator scapulae.r"]),
    ("rhomboid-major", "Rhomboid major", "Posterior trunk", "both", "back", ["Rhomboid major muscle.r"]),
    ("rhomboid-minor", "Rhomboid minor", "Posterior trunk", "both", "back", ["Rhomboid minor muscle.r"]),
    ("teres-major", "Teres major", "Posterior trunk", "both", "back", ["Teres major muscle.r"]),
    (
        "rotator-cuff",
        "Rotator cuff",
        "Shoulder cuff",
        "both",
        None,
        [
            "Supraspinatus muscle.r",
            "Infraspinatus muscle.r",
            "Subscapularis muscle.r",
            "Teres minor muscle.r",
        ],
    ),
    ("quadratus-lumborum", "Quadratus lumborum", "Posterior trunk", "both", "back", ["Quadratus lumborum muscle.r"]),
    (
        "erector-spinae",
        "Erector spinae",
        "Deep back",
        "both",
        "back",
        [
            "Iliocostalis cervicis muscle.r",
            "Iliocostalis lumborum muscle.r",
            "Iliocostalis thoracis muscle.r",
            "Longissimus capitis muscle.r",
            "Longissimus cervicis muscle.r",
            "Longissimus thoracis muscle.r",
            "Spinalis cervicis muscle.r",
            "Spinalis thoracis muscle.r",
        ],
    ),
    (
        "multifidus",
        "Multifidus",
        "Deep back",
        "both",
        "back",
        ["Multifidus cervicis.r", "Multifidus lumborum.r", "Multifidus thoracis.r"],
    ),
    (
        "semispinalis",
        "Semispinalis",
        "Deep back",
        "both",
        "back",
        ["Semispinalis cervicis muscle.r", "Semispinalis thoracis muscle.r"],
    ),
    ("splenius-capitis", "Splenius capitis", "Nuchal / upper back", "both", "back", ["Splenius capitis muscle.r"]),
    ("splenius-cervicis", "Splenius cervicis", "Nuchal / upper back", "both", "back", ["Splenius cervicis muscle.r"]),
    (
        "serratus-posterior-superior",
        "Serratus posterior superior",
        "Posterior trunk",
        "both",
        "back",
        ["Serratus posterior superior muscle.r"],
    ),
    (
        "serratus-posterior-inferior",
        "Serratus posterior inferior",
        "Posterior trunk",
        "both",
        "back",
        ["Serratus posterior inferior muscle.r"],
    ),
    (
        "abdominal-wall",
        "Abdominal wall",
        "Anterior abdomen",
        "both",
        "abs",
        ["Rectus abdominal muscle.r", "Pyramidalis muscle.r"],
    ),
    ("external-oblique", "External oblique", "Lateral abdomen", "both", None, ["External abdominal oblique muscle.r"]),
    ("internal-oblique", "Internal oblique", "Lateral abdomen", "both", None, ["Internal abdominal oblique muscle.r"]),
    ("transversus-abdominis", "Transversus abdominis", "Lateral abdomen", "both", None, ["Transverse abdominal muscle.r"]),
    (
        "iliopsoas",
        "Iliopsoas",
        "Hip flexors",
        "both",
        None,
        ["Iliacus muscle.r", "Psoas major.r", "Psoas minor.r"],
    ),
    (
        "biceps-left",
        "Biceps · left",
        "Left upper arm",
        "left",
        None,
        ["Long head of biceps brachii.r", "Short head of biceps brachii.r"],
    ),
    (
        "biceps-right",
        "Biceps · right",
        "Right upper arm",
        "right",
        None,
        ["Long head of biceps brachii.r", "Short head of biceps brachii.r"],
    ),
    (
        "triceps-left",
        "Triceps · left",
        "Left upper arm",
        "left",
        None,
        [
            "Long head of triceps brachii.r",
            "Lateral head of triceps brachii.r",
            "Medial head of triceps brachii.r",
        ],
    ),
    (
        "triceps-right",
        "Triceps · right",
        "Right upper arm",
        "right",
        None,
        [
            "Long head of triceps brachii.r",
            "Lateral head of triceps brachii.r",
            "Medial head of triceps brachii.r",
        ],
    ),
    ("brachialis", "Brachialis", "Upper arm", "both", None, ["Brachialis muscle.r"]),
    ("coracobrachialis", "Coracobrachialis", "Upper arm", "both", None, ["Coracobrachialis muscle.r"]),
    ("anconeus", "Anconeus", "Upper arm", "both", None, ["Anconeus muscle.r"]),
    ("brachioradialis", "Brachioradialis", "Forearm", "both", None, ["Brachioradialis muscle.r"]),
    (
        "forearm-flexors",
        "Forearm flexors",
        "Anterior forearms",
        "both",
        None,
        [
            "Flexor carpi radialis.r",
            "Humeral head of flexor carpi ulnaris.r",
            "Ulnar head of flexor carpi ulnaris.r",
            "Flexor digitorum profundus.r",
            "Flexor digitorum superficialis humero-ulnar head.r",
            "Flexor digitorum superficialis radial head.r",
            "Flexor pollicis longus.r",
            "Palmaris longus muscle.r",
        ],
    ),
    (
        "forearm-extensors",
        "Forearm extensors",
        "Posterior forearms",
        "both",
        None,
        [
            "Extensor carpi radialis brevis.r",
            "Extensor carpi radialis longus.r",
            "Extensor digiti minimi.r",
            "Extensor digitorum.r",
            "Extensor indicis.r",
            "Extensor pollicis brevis.r",
            "Extensor pollicis longus.r",
            "Humeral head of extensor carpi ulnaris.r",
            "Ulnar head of extensor carpi ulnaris.r",
            "Abductor pollicis longus.r",
        ],
    ),
    (
        "pronator-teres",
        "Pronator teres",
        "Anterior forearms",
        "both",
        None,
        ["Humeral head of pronator teres.r", "Ulnar head of pronator teres.r"],
    ),
    ("pronator-quadratus", "Pronator quadratus", "Anterior forearms", "both", None, ["Pronator quadratus.r"]),
    ("supinator", "Supinator", "Posterior forearms", "both", None, ["Supinator.r"]),
    (
        "quadriceps",
        "Quadriceps",
        "Anterior thighs",
        "both",
        None,
        [
            "Rectus femoris.r",
            "Vastus intermedius muscle.r",
            "Vastus lateralis muscle.r",
            "Vastus medialis muscle.r",
        ],
    ),
    (
        "hamstrings",
        "Hamstrings",
        "Posterior thighs",
        "both",
        None,
        [
            "Long head of biceps femoris.r",
            "Short head of biceps femoris.r",
            "Semimembranosus muscle.r",
            "Semitendinosus muscle.r",
        ],
    ),
    (
        "hip-adductors",
        "Hip adductors",
        "Medial thighs",
        "both",
        None,
        [
            "Adductor longus.r",
            "Adductor brevis.r",
            "Adductor magnus.r",
            "Gracilis muscle.r",
            "Pectineus muscle.r",
        ],
    ),
    (
        "gluteus",
        "Gluteus",
        "Posterior pelvis",
        "both",
        "back",
        ["Gluteus maximus muscle.r", "Gluteus medius muscle.r", "Gluteus minimus muscle.r"],
    ),
    (
        "gastrocnemius",
        "Gastrocnemius",
        "Posterior legs",
        "both",
        None,
        ["Lateral head of gastrocnemius.r", "Medial head of gastrocnemius.r"],
    ),
    ("soleus", "Soleus", "Posterior legs", "both", None, ["Soleus muscle.r"]),
    ("tibialis-anterior", "Tibialis anterior", "Anterior legs", "both", None, ["Tibialis anterior muscle.r"]),
    ("tibialis-posterior", "Tibialis posterior", "Posterior legs", "both", None, ["Tibialis posterior muscle.r"]),
    ("fibularis-longus", "Fibularis longus", "Lateral legs", "both", None, ["Fibularis longus muscle.r"]),
    (
        "fibularis-brevis",
        "Fibularis brevis",
        "Lateral legs",
        "both",
        None,
        ["Fibularis brevis muscle.r", "Fibularis tertius muscle.r"],
    ),
    ("sartorius", "Sartorius", "Anterior thighs", "both", None, ["Sartorius muscle.r"]),
    ("tensor-fasciae-latae", "Tensor fasciae latae", "Lateral thighs", "both", None, ["Tensor fasciae latae.r"]),
    ("piriformis", "Piriformis", "Posterior pelvis", "both", "back", ["Piriformis muscle.r"]),
    ("obturator-internus", "Obturator internus", "Posterior pelvis", "both", None, ["Obturator internus.r"]),
    ("obturator-externus", "Obturator externus", "Medial thighs", "both", None, ["Obturator externus.r"]),
    (
        "gemelli",
        "Gemelli",
        "Posterior pelvis",
        "both",
        None,
        ["Superior gemellus muscle.r", "Inferior gemellus muscle.r"],
    ),
    ("quadratus-femoris", "Quadratus femoris", "Posterior pelvis", "both", None, ["Quadratus femoris muscle.r"]),
    ("popliteus", "Popliteus", "Posterior legs", "both", None, ["Popliteus muscle.r"]),
    ("plantaris", "Plantaris", "Posterior legs", "both", None, ["Plantaris muscle.r"]),
]

EXTRA_COPY = {
    "pectoralis-minor": (
        "Draws the scapula forward and down against the rib cage.",
        "Ribs 3–5 to the coracoid process of the scapula.",
        "A small anterior chest leaf under pectoralis major. It is the Open3D pectoralis minor, not a second major.",
    ),
    "serratus-anterior": (
        "Protracts the scapula and holds it against the chest wall.",
        "Outer surfaces of the upper ribs to the medial border of the scapula.",
        "Finger-like slips along the lateral ribs. This is the Open3D serratus anterior, mirrored to both sides.",
    ),
    "subclavius": (
        "Steadies the clavicle in the sternoclavicular joint.",
        "First rib and its cartilage to the underside of the clavicle.",
        "A short strap under the clavicle from the Open3D trunk kit. It is not a neck muscle.",
    ),
    "latissimus": (
        "Adducts, extends, and internally rotates the humerus.",
        "Thoracolumbar fascia, iliac crest, and lower ribs to the bicipital groove.",
        "The broad climbing muscle of the back. Left and right Open3D wings share one leaf. No invented neck strap.",
    ),
    "levator-scapulae": (
        "Elevates the scapula and tilts the glenoid down.",
        "Transverse processes of C1–C4 to the superior angle of the scapula.",
        "A strap from the neck of the kit onto the top of the scapula. Sternocleidomastoid is not in this leaf.",
    ),
    "rhomboid-major": (
        "Retracts and rotates the scapula so the glenoid faces down.",
        "Spinous processes T2–T5 to the medial border of the scapula.",
        "The larger rhomboid sheet on the upper back, seated on the thorax rather than left floating behind it.",
    ),
    "rhomboid-minor": (
        "Retracts the scapula with rhomboid major.",
        "Nuchal ligament and C7–T1 spinous processes to the medial scapular border.",
        "The smaller rhomboid just above major. It is a kit leaf, not a stand-in for a missing neck muscle.",
    ),
    "teres-major": (
        "Adducts and internally rotates the humerus.",
        "Inferior angle of the scapula to the medial lip of the bicipital groove.",
        "A posterior axillary leaf beside the latissimus tendon. It is not part of the rotator cuff merge.",
    ),
    "quadratus-lumborum": (
        "Laterally flexes the lumbar spine and steadies rib 12.",
        "Iliac crest to the twelfth rib and lumbar transverse processes.",
        "A deep flank column beside the lumbar vertebrae, kept as its own Open3D leaf.",
    ),
    "multifidus": (
        "Stabilizes the vertebral column across lumbar, thoracic, and cervical spans.",
        "Sacrum, ilium, and transverse processes to spinous processes above.",
        "The deep multifidus slips from the kit, grouped as one back leaf and seated on the column.",
    ),
    "semispinalis": (
        "Extends the thoracic and cervical spine and rotates the head toward the opposite side.",
        "Transverse processes to spinous processes several levels above.",
        "Cervical and thoracic semispinalis from the kit. Capitis is not invented as a separate face muscle.",
    ),
    "splenius-capitis": (
        "Extends the head and rotates it toward the same side.",
        "Nuchal ligament and upper thoracic spines to the mastoid and occipital bone.",
        "The kit's splenius capitis on the nape. Sternocleidomastoid is not added beside it.",
    ),
    "splenius-cervicis": (
        "Extends and rotates the neck toward the same side.",
        "Upper thoracic spinous processes to the cervical transverse processes.",
        "The narrower splenius cervicis leaf under capitis. It ships with the Open3D back kit.",
    ),
    "serratus-posterior-superior": (
        "Elevates the upper ribs during a deep breath.",
        "Nuchal ligament and cervical spines to ribs 2–5.",
        "A thin sheet on the upper back from the Open3D kit, seated on the rib cage.",
    ),
    "serratus-posterior-inferior": (
        "Draws the lower ribs down and back.",
        "Thoracolumbar fascia and lumbar spines to ribs 9–12.",
        "The lower serratus posterior sheet. It is not a latissimus duplicate.",
    ),
    "external-oblique": (
        "Flexes and rotates the trunk and compresses the abdomen.",
        "Lower ribs to the iliac crest, linea alba, and inguinal ligament.",
        "The outer abdominal sheet, kept separate from rectus so the chest hug does not flatten the flank.",
    ),
    "internal-oblique": (
        "Flexes and rotates the trunk with the other flat abdominals.",
        "Iliac crest and inguinal ligament to the lower ribs and linea alba.",
        "The middle abdominal sheet from Open3D, mirrored to both sides.",
    ),
    "transversus-abdominis": (
        "Compresses the abdominal contents and tensions the linea alba.",
        "Thoracolumbar fascia, iliac crest, and lower ribs to the linea alba.",
        "The deepest flat abdominal leaf. It is not merged into the rectus hug.",
    ),
    "brachialis": (
        "Flexes the elbow under the biceps.",
        "Anterior humerus to the ulnar tuberosity.",
        "The deep elbow flexor from the Open3D arm, mirrored to both sides.",
    ),
    "coracobrachialis": (
        "Flexes and adducts the shoulder.",
        "Coracoid process to the medial humerus.",
        "A short anterior arm leaf beside the short head of biceps.",
    ),
    "anconeus": (
        "Assists triceps in extending the elbow.",
        "Lateral epicondyle of the humerus to the olecranon.",
        "A small posterior elbow leaf from the Open3D arm kit.",
    ),
    "brachioradialis": (
        "Flexes the elbow with the forearm in mid-pronation.",
        "Lateral supracondylar ridge to the distal radius.",
        "The radial forearm strap. It is not folded into the flexor mass.",
    ),
    "pronator-teres": (
        "Pronates the forearm and flexes the elbow.",
        "Medial epicondyle and coronoid process to the lateral radius.",
        "Both Open3D heads of pronator teres, mirrored.",
    ),
    "pronator-quadratus": (
        "Pronates the forearm at the distal radio-ulnar joint.",
        "Distal anterior ulna to the distal anterior radius.",
        "The deep square pronator at the wrist from the Open3D forearm.",
    ),
    "supinator": (
        "Supinates the forearm so the palm turns forward.",
        "Lateral epicondyle and ulna to the proximal radius.",
        "The deep posterior forearm leaf that turns the palm up.",
    ),
    "tibialis-posterior": (
        "Plantarflexes and inverts the foot.",
        "Posterior tibia and fibula to the navicular and midfoot.",
        "The deep posterior leg leaf under soleus, from the Open3D lower limb.",
    ),
    "fibularis-longus": (
        "Everts the foot and plantarflexes the ankle.",
        "Proximal fibula to the medial cuneiform and first metatarsal.",
        "The long fibular strap on the lateral leg.",
    ),
    "fibularis-brevis": (
        "Everts the foot and steadies the lateral arch.",
        "Distal fibula to the fifth metatarsal. Tertius is included on this leaf.",
        "Fibularis brevis plus the small tertius slip. They are not split into extra invented leaves.",
    ),
    "sartorius": (
        "Flexes, abducts, and externally rotates the hip, and flexes the knee.",
        "Anterior superior iliac spine to the medial proximal tibia.",
        "The long strap across the front of the thigh from the Open3D lower limb.",
    ),
    "tensor-fasciae-latae": (
        "Tenses the iliotibial tract and steadies the knee in stance.",
        "Iliac crest to the iliotibial tract.",
        "The small lateral hip muscle at the front of the iliac crest.",
    ),
    "piriformis": (
        "Externally rotates the extended hip and abducts the flexed hip.",
        "Anterior sacrum to the greater trochanter.",
        "The deep posterior hip leaf that exits the greater sciatic foramen.",
    ),
    "obturator-internus": (
        "Externally rotates the extended hip.",
        "Inner obturator membrane to the greater trochanter.",
        "The intrapelvic external rotator from the Open3D pelvis region.",
    ),
    "obturator-externus": (
        "Externally rotates the hip.",
        "Outer obturator membrane to the trochanteric fossa.",
        "The external obturator, kept as its own leaf beside the adductors.",
    ),
    "gemelli": (
        "Externally rotate the hip with obturator internus.",
        "Ischial spine and tuberosity to the greater trochanter.",
        "Superior and inferior gemellus share one leaf. They are kit muscles, not a gel stand-in.",
    ),
    "quadratus-femoris": (
        "Externally rotates the hip.",
        "Ischial tuberosity to the intertrochanteric crest.",
        "A short deep rotator under the gluteus, from the Open3D lower limb.",
    ),
    "popliteus": (
        "Unlocks the knee by rotating the tibia medially.",
        "Lateral femoral condyle to the posterior proximal tibia.",
        "The small muscle on the back of the knee. It is not part of gastrocnemius.",
    ),
    "plantaris": (
        "Weakly plantarflexes the ankle and flexes the knee.",
        "Lateral supracondylar ridge to the calcaneus via a long tendon.",
        "The slim plantaris belly from Open3D, separate from gastrocnemius and soleus.",
    ),
}


def load_scene(path: Path) -> trimesh.Scene:
    return trimesh.load(path, force="scene")


def index_meshes(scene: trimesh.Scene) -> dict[str, trimesh.Trimesh]:
    found: dict[str, list[trimesh.Trimesh]] = {}
    for node in scene.graph.nodes_geometry:
        transform, geom_name = scene.graph[node]
        geom = scene.geometry[geom_name]
        if geom.vertices is None or len(geom.vertices) == 0:
            continue
        mesh = geom.copy()
        mesh.apply_transform(transform)
        found.setdefault(str(node), []).append(mesh)
    out = {}
    for name, parts in found.items():
        out[name] = parts[0] if len(parts) == 1 else trimesh.util.concatenate(parts)
    return out


def catalog_positions(path: Path) -> dict[str, np.ndarray]:
    text = path.read_text()
    out = {}
    for block in text.split("\n  {"):
        mid = re.search(r"id: '([^']+)'", block)
        pos = re.search(r"position: \[([^\]]+)\]", block)
        if not mid or not pos:
            continue
        out[mid.group(1)] = np.array([float(x) for x in pos.group(1).split(",")], dtype=float)
    return out


def bone_boxes(skel: trimesh.Scene, positions: dict[str, np.ndarray]) -> list[dict]:
    boxes = []
    for node in skel.graph.nodes_geometry:
        name = str(node)
        if name not in positions:
            continue
        transform, geom_name = skel.graph[node]
        geom = skel.geometry[geom_name]
        pts = trimesh.transform_points(np.asarray(geom.vertices), transform)
        local_min, local_max = pts.min(0), pts.max(0)
        origin = positions[name]
        boxes.append(
            {
                "id": name,
                "min": origin + local_min,
                "max": origin + local_max,
                "center": origin + (local_min + local_max) / 2,
            }
        )
    return boxes


def bone_mesh(skel: trimesh.Scene, positions: dict[str, np.ndarray], bone_id: str) -> trimesh.Trimesh:
    origin = positions[bone_id]
    for node in skel.graph.nodes_geometry:
        if str(node) != bone_id:
            continue
        transform, geom_name = skel.graph[node]
        geom = skel.geometry[geom_name]
        pts = trimesh.transform_points(np.asarray(geom.vertices), transform)
        return trimesh.Trimesh(vertices=pts + origin, faces=np.asarray(geom.faces), process=False)
    raise SystemExit(f"missing bone {bone_id}")


def bounds_center(mesh: trimesh.Trimesh) -> np.ndarray:
    lo, hi = mesh.bounds
    return (lo + hi) / 2


def rigid_delta(open_meshes: dict[str, trimesh.Trimesh], positions: dict[str, np.ndarray]) -> np.ndarray:
    pairs = [
        ("Body of sternum", "body-of-sternum"),
        ("Manubrium of sternum", "manubrium"),
        ("Xiphoid process", "xiphoid-process"),
        ("Thoracic vertebrae (T7)", "seventh-thoracic-vertebra"),
        ("Lumbar vertebrae (L5)", "fifth-lumbar-vertebra"),
        ("Sacrum", "sacrum"),
        ("Atlas (C1)", "atlas"),
    ]
    deltas = []
    for src, dst in pairs:
        mesh = open_meshes[src]
        delta = positions[dst] - bounds_center(mesh)
        deltas.append(delta)
        print(f"  landmark {src:28} d={np.round(delta, 4)}")
    return np.mean(deltas, axis=0)


def mirror_x(mesh: trimesh.Trimesh) -> trimesh.Trimesh:
    mirrored = mesh.copy()
    mirrored.vertices = np.array(mirrored.vertices, copy=True)
    mirrored.vertices[:, 0] *= -1
    mirrored.faces = np.array(mirrored.faces[:, ::-1], copy=True)
    return mirrored


def compose(parts: list[trimesh.Trimesh], side: str) -> trimesh.Trimesh:
    chunks = []
    for part in parts:
        lo, hi = part.bounds
        bilateral = lo[0] < -0.02 and hi[0] > 0.02
        if side == "both" and not bilateral:
            chunks.extend([part, mirror_x(part)])
        elif side == "right" and not bilateral:
            chunks.append(mirror_x(part))
        else:
            chunks.append(part)
    mesh = chunks[0] if len(chunks) == 1 else trimesh.util.concatenate(chunks)
    mesh.merge_vertices()
    return mesh


def hug(mesh: trimesh.Trimesh, wall_z: float) -> float:
    z0, z1 = mesh.vertices[:, 2].min(), mesh.vertices[:, 2].max()
    half = (z1 - z0) / 2
    center = (z1 + z0) / 2
    target = wall_z + PLATE - half
    shift = target - center
    mesh.vertices[:, 2] += shift
    return float(shift)


def seat_rectus_face(mesh: trimesh.Trimesh, xiphoid_wall: float) -> float:
    """Put the anterior face on the xiphoid wall plus the 1cm plate.

    One Z shift keeps the sheet's own slope down to L5 height. Mixing the L5
    vertebral anterior into the wall sinks that face behind the obliques.
    """
    face = float(mesh.vertices[:, 2].max())
    shift = (xiphoid_wall + PLATE) - face
    mesh.vertices[:, 2] += shift
    return float(shift)


def cover_midline(mesh: trimesh.Trimesh, band: float = 0.02, overlap: float = 0.012) -> None:
    """Pull the medial edge across x=0 so a front midline ray does not fall through.

    The Open3D halves stop short of each other. That slit is how latissimus
    wins a belly click aimed at the linea alba.
    """
    x = np.array(mesh.vertices[:, 0], copy=True)
    medial = np.abs(x) < band
    if not np.any(medial):
        return
    sign = np.where(x >= 0.0, 1.0, -1.0)
    mesh.vertices[medial, 0] = x[medial] - sign[medial] * overlap


def keep_lateral(mesh: trimesh.Trimesh, medial_x: float) -> float:
    """Drop the midline aponeurosis so this leaf stays on the lateral abdomen."""
    centroids = mesh.triangles_center
    drop = np.abs(centroids[:, 0]) < medial_x
    if not np.any(drop):
        return 0.0
    mesh.update_faces(~drop)
    mesh.remove_unreferenced_vertices()
    return float(drop.mean())


def front_hit(mesh: trimesh.Trimesh, x: float, y: float) -> float | None:
    """Highest Z where a -Z ray through (x, y) meets this mesh."""
    tri = mesh.triangles
    lo = tri.min(axis=1)
    hi = tri.max(axis=1)
    sel = (lo[:, 0] <= x) & (hi[:, 0] >= x) & (lo[:, 1] <= y) & (hi[:, 1] >= y)
    if not np.any(sel):
        return None
    t = tri[sel]
    ax, ay = t[:, 0, 0], t[:, 0, 1]
    bx, by = t[:, 1, 0], t[:, 1, 1]
    cx, cy = t[:, 2, 0], t[:, 2, 1]
    den = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy)
    ok = np.abs(den) > 1e-12
    den = np.where(ok, den, 1.0)
    w0 = ((by - cy) * (x - cx) + (cx - bx) * (y - cy)) / den
    w1 = ((cy - ay) * (x - cx) + (ax - cx) * (y - cy)) / den
    w2 = 1.0 - w0 - w1
    inside = ok & (w0 >= -1e-4) & (w1 >= -1e-4) & (w2 >= -1e-4)
    if not np.any(inside):
        return None
    z = w0[inside] * t[inside, 0, 2] + w1[inside] * t[inside, 1, 2] + w2[inside] * t[inside, 2, 2]
    return float(z.max())


def posterior_hit(mesh: trimesh.Trimesh, x: float, y: float) -> float | None:
    """Lowest Z where a +Z ray through (x, y) meets this mesh."""
    tri = mesh.triangles
    lo = tri.min(axis=1)
    hi = tri.max(axis=1)
    sel = (lo[:, 0] <= x) & (hi[:, 0] >= x) & (lo[:, 1] <= y) & (hi[:, 1] >= y)
    if not np.any(sel):
        return None
    t = tri[sel]
    ax, ay = t[:, 0, 0], t[:, 0, 1]
    bx, by = t[:, 1, 0], t[:, 1, 1]
    cx, cy = t[:, 2, 0], t[:, 2, 1]
    den = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy)
    ok = np.abs(den) > 1e-12
    den = np.where(ok, den, 1.0)
    w0 = ((by - cy) * (x - cx) + (cx - bx) * (y - cy)) / den
    w1 = ((cy - ay) * (x - cx) + (ax - cx) * (y - cy)) / den
    w2 = 1.0 - w0 - w1
    inside = ok & (w0 >= -1e-4) & (w1 >= -1e-4) & (w2 >= -1e-4)
    if not np.any(inside):
        return None
    z = w0[inside] * t[inside, 0, 2] + w1[inside] * t[inside, 1, 2] + w2[inside] * t[inside, 2, 2]
    return float(z.min())


def posterior_shift(mesh: trimesh.Trimesh, boxes: list[dict]) -> float:
    """Move a back leaf forward when its sheet floats behind the nearest bone.

    A negative gap means the Open3D wrap already meets or enters that bone.
    Pulling those leaves backward floats them off the skeleton, so only a
    positive float is closed, down to the 1cm plate.
    """
    pts = mesh.vertices
    median_z = float(np.median(pts[:, 2]))
    sheet = pts[pts[:, 2] <= median_z]
    if len(sheet) < 8:
        return 0.0
    gaps = []
    for x, y, z in sheet:
        best = None
        best_d = 1e9
        for bone in boxes:
            d = (bone["center"][0] - x) ** 2 + (bone["center"][1] - y) ** 2
            if d < best_d:
                best_d = d
                best = bone
        if best is None or best_d > 0.12**2:
            continue
        gaps.append(float(best["min"][2] - z))
    if not gaps:
        return 0.0
    contact = float(np.percentile(gaps, 20))
    if contact <= PLATE:
        return 0.0
    shift = float(np.clip(contact - PLATE, 0.0, MAX_POSTERIOR_SHIFT))
    mesh.vertices[:, 2] += shift
    return shift


def nuchal_ridge(occ_vertices: np.ndarray) -> np.ndarray:
    """Posterior ridge of the occiput: the superior nuchal line on this skull."""
    ov = np.asarray(occ_vertices, dtype=float)
    ridge = []
    for x in np.linspace(-0.055, 0.055, 23):
        sel = ov[(np.abs(ov[:, 0] - x) < 0.006) & (ov[:, 1] > 1.59) & (ov[:, 1] < 1.65)]
        if len(sel) < 4:
            continue
        ridge.append(sel[np.argmin(sel[:, 2])])
    if len(ridge) < 8:
        raise SystemExit("occipital nuchal ridge is missing")
    return np.asarray(ridge, dtype=float)


def _ridge_yz(ridge: np.ndarray, x: float) -> tuple[float, float]:
    d = np.abs(ridge[:, 0] - x)
    order = np.argsort(d)[:3]
    w = 1.0 / (d[order] + 1e-4)
    w /= w.sum()
    return float(np.dot(w, ridge[order, 1])), float(np.dot(w, ridge[order, 2]))


def seat_nape(mesh: trimesh.Trimesh, occ_vertices: np.ndarray) -> int:
    """Pull the existing trapezius peak up and back onto the nuchal line.

    The Open3D leaf is a kite on the shoulders. Its medial apex stops in front
    of the neck, short of the superior nuchal line. Vertices already on that
    peak move onto the occipital ridge. The shoulder kite stays. This does not
    add a sternocleidomastoid leaf.
    """
    ridge = nuchal_ridge(occ_vertices)
    v = np.array(mesh.vertices, dtype=float)
    peak = (v[:, 1] > NAPE_HINGE_Y) & (np.abs(v[:, 0]) <= NAPE_X_MAX)
    if int(peak.sum()) < 32:
        raise SystemExit("trapezius has no medial peak to seat on the nape")
    edge_x = np.linspace(-NAPE_X_MAX, NAPE_X_MAX, 21)
    edge_y = np.full(len(edge_x), np.nan)
    for i, x in enumerate(edge_x):
        sel = peak & (np.abs(v[:, 0] - x) < 0.008)
        if np.any(sel):
            edge_y[i] = float(v[sel, 1].max())
    known = np.isfinite(edge_y)
    edge_y = np.interp(edge_x, edge_x[known], edge_y[known])

    def edge_at(x: float) -> float:
        d = np.abs(edge_x - x)
        order = np.argsort(d)[:2]
        w = 1.0 / (d[order] + 1e-4)
        w /= w.sum()
        return float(np.dot(w, edge_y[order]))

    moved = 0
    for i in np.flatnonzero(peak):
        span = max(edge_at(float(v[i, 0])) - NAPE_HINGE_Y, 1e-4)
        t = float(np.clip((v[i, 1] - NAPE_HINGE_Y) / span, 0.0, 1.0))
        wy = t * t * (3.0 - 2.0 * t)
        tz = float(np.clip(t / 0.55, 0.0, 1.0))
        wz = tz * tz * (3.0 - 2.0 * tz)
        ny, nz = _ridge_yz(ridge, float(v[i, 0]))
        v[i, 1] = (1.0 - wy) * v[i, 1] + wy * (ny + NAPE_LIFT)
        v[i, 2] = (1.0 - wz) * v[i, 2] + wz * (nz - NAPE_PLATE)
        moved += 1
    mesh.vertices = v
    return moved


def anterior_wall(boxes: list[dict], bone_id: str) -> float:
    bone = next(b for b in boxes if b["id"] == bone_id)
    return float(bone["max"][2])


def write_catalog(rows: list[dict]) -> None:
    lines = [
        "import type { Structure } from '../types'",
        "/** Open3Dmodel leaves in public/atlas/muscles.glb. Untextured. Latissimus is included. No SCM. */",
        "export const MUSCLE_MESH_PARTS: Structure[] = [",
    ]
    for row in rows:
        pos = ", ".join(f"{n:.5f}" for n in row["position"])
        lines.append("  {")
        lines.append(f"    id: '{row['id']}',")
        lines.append("    system: 'muscle',")
        lines.append(f"    name: '{row['name']}',")
        lines.append("    kind: 'Muscle · mesh',")
        lines.append(f"    region: '{row['region']}',")
        lines.append("    function: '',")
        lines.append("    relation: '',")
        lines.append("    blurb: '',")
        lines.append(f"    position: [{pos}],")
        lines.append(f"    focusDistance: {row['focus']:.2f},")
        lines.append("    source: 'open3d',")
        lines.append("  },")
    lines.append("]")
    lines.append("")
    OUT_CATALOG.write_text("\n".join(lines))


def write_ids(ids: list[str]) -> None:
    body = ",\n".join(f"  '{i}'" for i in ids)
    OUT_IDS.write_text(
        "/** Leaf ids baked into public/atlas/muscles.glb. */\n"
        f"export const OPEN3D_MUSCLE_IDS = [\n{body},\n] as const\n"
    )


def write_waves(extra_ids: list[str]) -> None:
    waves = []
    chunk: list[str] = []
    for leaf_id in extra_ids:
        chunk.append(leaf_id)
        if len(chunk) == 3:
            waves.append(chunk)
            chunk = []
    if chunk:
        waves.append(chunk)
    rendered = ",\n".join("  [" + ", ".join(f"'{i}'" for i in wave) + "]" for wave in waves)
    OUT_WAVES.write_text(
        "/** Open3D leaves beyond the original twenty. Mounted with the core kit, not behind M2. */\n"
        f"export const KIT_EXTRA_WAVES = [\n{rendered},\n] as const\n"
    )


def write_copy() -> None:
    lines = [
        "import type { MuscleCopy } from '../muscleCopy'",
        "",
        "/** Copy for Open3D leaves that were not in the BodyParts3D twenty. */",
        "export const OPEN3D_EXTRA_COPY: Record<string, MuscleCopy> = {",
    ]
    for leaf_id, (fn, rel, blurb) in EXTRA_COPY.items():
        lines.append(f"  '{leaf_id}': {{")
        lines.append(f"    function: {json.dumps(fn)},")
        lines.append(f"    relation: {json.dumps(rel)},")
        lines.append(f"    blurb: {json.dumps(blurb)},")
        lines.append("  },")
    lines.append("}")
    lines.append("")
    OUT_COPY.write_text("\n".join(lines))


def main() -> None:
    print("loading")
    thorax = index_meshes(load_scene(THORAX))
    upper = index_meshes(load_scene(UPPER))
    lower = index_meshes(load_scene(LOWER))
    pools = [thorax, upper, lower]
    positions = catalog_positions(SKEL_TS)
    skel = load_scene(SKEL_GLB)
    boxes = bone_boxes(skel, positions)
    occipital = bone_mesh(skel, positions, "occipital")
    delta = rigid_delta(thorax, positions)
    print("delta", np.round(delta, 4))

    pec_wall = anterior_wall(boxes, "body-of-sternum")
    xiphoid_wall = anterior_wall(boxes, "xiphoid-process")
    l5_wall = anterior_wall(boxes, "fifth-lumbar-vertebra")
    print(f"walls pec={pec_wall:.4f} xiphoid={xiphoid_wall:.4f} l5_vertebra={l5_wall:.4f}")

    scene = trimesh.Scene()
    rows = []
    manifest = []
    world_meshes: dict[str, trimesh.Trimesh] = {}
    for leaf_id, name, region, side, seat, sources in LEAVES:
        parts = []
        for src in sources:
            mesh = next((pool[src] for pool in pools if src in pool), None)
            if mesh is None:
                raise SystemExit(f"missing mesh {src} for {leaf_id}")
            placed = mesh.copy()
            placed.vertices = np.array(placed.vertices, dtype=float) + delta
            parts.append(placed)
        merged = compose(parts, side)
        if seat == "pec":
            shift = hug(merged, pec_wall)
            cover_midline(merged)
            print(f"  hug pec {leaf_id} {shift:+.4f}")
        elif seat == "abs":
            shift = seat_rectus_face(merged, xiphoid_wall)
            cover_midline(merged)
            print(f"  seat rectus {leaf_id} {shift:+.4f}")
        elif seat == "back":
            shift = posterior_shift(merged, boxes)
            print(f"  seat back {leaf_id} {shift:+.4f}")
        if leaf_id == "trapezius":
            moved = seat_nape(merged, occipital.vertices)
            print(f"  nape {leaf_id} moved={moved}")
        if leaf_id in LATERAL_ABDOMEN:
            dropped = keep_lateral(merged, OBLIQUE_MEDIAL_X)
            print(f"  lateral {leaf_id} drop={dropped:.1%}")
        if len(merged.faces) < 8:
            raise SystemExit(f"{leaf_id} lost its surface ({len(merged.faces)} faces)")
        world_meshes[leaf_id] = merged.copy()
        center = bounds_center(merged)
        merged.vertices = np.array(merged.vertices, dtype=float) - center
        extent = merged.extents
        focus = float(np.clip(0.75 + np.linalg.norm(extent) * 0.28, 0.9, 1.45))
        merged.visual = trimesh.visual.ColorVisuals(mesh=merged)
        scene.add_geometry(merged, geom_name=leaf_id, node_name=leaf_id)
        rows.append(
            {
                "id": leaf_id,
                "name": name,
                "region": region,
                "position": center.tolist(),
                "focus": focus,
            }
        )
        manifest.append(
            {
                "id": leaf_id,
                "name": name,
                "sources": sources,
                "vertexCount": int(len(merged.vertices)),
                "seat": seat,
            }
        )
        print(f"  {leaf_id:28} c={np.round(center, 3)} n={len(merged.vertices)}")

    def owner_at(x: float, y: float) -> tuple[str, float] | None:
        best = None
        for leaf_id, mesh in world_meshes.items():
            z = front_hit(mesh, x, y)
            if z is None:
                continue
            if best is None or z > best[1]:
                best = (leaf_id, z)
        return best

    for y in (0.96, 1.05, 1.14, 1.22):
        hit = owner_at(0.0, y)
        print(f"  front midline y={y:.2f} {hit}")
        if hit is None or hit[0] != "abdominal-wall":
            raise SystemExit(f"front midline y={y:.2f} is {hit}, want abdominal-wall")
        side = owner_at(0.11, y)
        print(f"  front lateral y={y:.2f} {side}")
        if side is None or side[0] == "abdominal-wall" or side[0] == "latissimus":
            raise SystemExit(f"front lateral y={y:.2f} is {side}, want an oblique")
    chest = owner_at(0.0, 1.34)
    print(f"  front sternum {chest}")
    if chest is None or chest[0] != "pectoralis":
        raise SystemExit(f"front sternum is {chest}, want pectoralis")
    for x in (0.0, 0.06, 0.11):
        for y in (1.00, 1.16, 1.30):
            hit = owner_at(x, y)
            if hit and hit[0] == "latissimus":
                raise SystemExit(f"front click x={x:.2f} y={y:.2f} hit latissimus")

    def back_owner(x: float, y: float) -> tuple[str, float] | None:
        best = None
        for leaf_id, mesh in world_meshes.items():
            z = posterior_hit(mesh, x, y)
            if z is None:
                continue
            if best is None or z < best[1]:
                best = (leaf_id, z)
        return best

    for x, y in (
        (0.10, 1.36),
        (-0.10, 1.36),
        (0.12, 1.40),
        (-0.12, 1.40),
        (0.08, 1.28),
        (-0.08, 1.28),
        (0.0, 1.36),
        (0.04, 1.32),
        (-0.04, 1.32),
        (0.0, 1.42),
    ):
        covered = back_owner(x, y)
        print(f"  upper back x={x:.2f} y={y:.2f} {covered}")
        if covered is None:
            raise SystemExit(f"upper back x={x:.2f} y={y:.2f} has no muscle")
    if any(row["id"] == "sternocleidomastoid" for row in rows):
        raise SystemExit("SCM was invented")

    def nape_ray(x: float, y: float) -> None:
        hit = back_owner(x, y)
        bone = posterior_hit(occipital, x, y)
        print(f"  nape x={x:.2f} y={y:.2f} {hit} bone={None if bone is None else round(bone, 4)}")
        if hit is None or hit[0] != "trapezius" or bone is None or not hit[1] < bone:
            raise SystemExit(f"nape x={x:.2f} y={y:.2f} is {hit}, bone={bone}, want trapezius behind the occiput")

    for x, y in ((0.0, 1.62), (0.0, 1.63), (0.02, 1.62), (-0.02, 1.62), (0.02, 1.63), (-0.02, 1.63)):
        nape_ray(x, y)
    for x, y in ((0.0, 1.65), (0.02, 1.65), (-0.02, 1.65)):
        hit = back_owner(x, y)
        bone = posterior_hit(occipital, x, y)
        print(f"  above nuchal x={x:.2f} y={y:.2f} {hit} bone={None if bone is None else round(bone, 4)}")
        if hit and hit[0] == "trapezius" and bone is not None and hit[1] < bone:
            raise SystemExit(f"trapezius covers the skull above the nuchal line at x={x:.2f} y={y:.2f}")

    scene.export(OUT_GLB)
    OUT_MANIFEST.write_text(json.dumps({"count": len(rows), "source": "open3dmodel", "groups": manifest}, indent=2) + "\n")
    write_catalog(rows)
    write_ids([row["id"] for row in rows])
    original = {
        "pectoralis",
        "biceps-left",
        "biceps-right",
        "triceps-left",
        "triceps-right",
        "deltoids",
        "abdominal-wall",
        "quadriceps",
        "trapezius",
        "gluteus",
        "gastrocnemius",
        "hamstrings",
        "soleus",
        "iliopsoas",
        "forearm-flexors",
        "rotator-cuff",
        "erector-spinae",
        "hip-adductors",
        "tibialis-anterior",
        "forearm-extensors",
    }
    extra = [row["id"] for row in rows if row["id"] not in original]
    missing_copy = [i for i in extra if i not in EXTRA_COPY]
    if missing_copy:
        raise SystemExit(f"missing copy {missing_copy}")
    write_waves(extra)
    write_copy()
    OUT_LIC.write_text(
        "Open3Dmodel muscle leaves in muscles.glb\n"
        "AnatomyTOOL / Open3D project, LUMC, MUMC+ and contributors.\n"
        "License: Creative Commons Attribution-ShareAlike 4.0 (CC BY-SA 4.0).\n"
        "https://anatomytool.org/open3dmodel\n"
        "Textures were omitted. Some Open3D texture maps are CC BY-NC-SA and are not shipped.\n"
        "The atlas applies its own untextured muscle material.\n"
    )
    print("leaves", len(rows), "bytes", OUT_GLB.stat().st_size)


if __name__ == "__main__":
    main()
