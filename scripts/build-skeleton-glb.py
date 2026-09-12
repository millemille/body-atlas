#!/usr/bin/env python3
"""Build public/atlas/skeleton.glb from BodyParts3D PART-OF bone OBJs.

License: BodyParts3D (DBCLS) / Z-Anatomy — CC BY-SA
(attribute + share-alike). Not CC0.
"""

from __future__ import annotations

import json
import re
from collections import defaultdict
from pathlib import Path

import numpy as np
import trimesh

ROOT = Path(__file__).resolve().parents[1]
SRC_LIST = Path("/tmp/bp3d/partof_parts_list_e.txt")
SRC_ELEM = Path("/tmp/bp3d/partof_element_parts.txt")
OBJ_DIR = Path("/tmp/bp3d/obj")
OUT_GLB = ROOT / "public/atlas/skeleton.glb"
OUT_TS = ROOT / "src/atlas/generated/skeletonCatalog.ts"
OUT_LIC = ROOT / "public/atlas/LICENSE-BodyParts3D.txt"

EXCLUDE = re.compile(
    r"\b(artery|vein|nerve|muscle|ligament|disk|disc|cartilage|joint|cavity|"
    r"fascia|bursa|sheath|canal|foramen|sinus|gland|duct|membrane|plexus|"
    r"apparatus|lake|sac|canaliculus|lobe|gyrus|lobule|mons pubis|"
    r"part of head|symphysis)\b",
    re.I,
)
COMPOUND = re.compile(
    r"^(skull|sternum|rib cage|vertebral column|thoracic vertebral column|"
    r"lumbar vertebral column|cervical vertebral column|"
    r"left side of rib cage|right side of rib cage)$",
    re.I,
)
BONE_KW = re.compile(
    r"\b(vertebra|atlas|axis|rib|sternum|xiphoid|manubrium|clavicle|scapula|"
    r"humerus|radius|ulna|femur|tibia|fibula|patella|hip bone|ilium|ischium|"
    r"pubis|sacrum|coccyx|mandible|maxilla|hyoid|zygomatic|nasal bone|"
    r"lacrimal bone|palatine|vomer|ethmoid|sphenoid|occipital bone|"
    r"parietal bone|temporal bone|frontal bone|metacarpal|metatarsal|phalanx|"
    r"scaphoid|lunate|triquetrum|pisiform|trapezium|trapezoid|capitate|hamate|"
    r"talus|calcaneus|navicular|cuboid|cuneiform)\b",
    re.I,
)


def part_id(name: str) -> str:
    n = name.lower()
    side = None
    if re.search(r"\bleft\b", n):
        side = "left"
        n = re.sub(r"\bleft\b", " ", n)
    elif re.search(r"\bright\b", n):
        side = "right"
        n = re.sub(r"\bright\b", " ", n)
    n = re.sub(r"\bbone\b", " ", n)
    slug = re.sub(r"[^a-z0-9]+", "-", n).strip("-")
    return f"{slug}-{side}" if side else slug


def display_name(name: str) -> str:
    n = name.strip()
    n = re.sub(r"^left ", "", n, flags=re.I)
    n = re.sub(r"^right ", "", n, flags=re.I)
    n = n[0].upper() + n[1:] if n else n
    if re.search(r"\bleft\b", name, re.I):
        return f"{n} · left"
    if re.search(r"\bright\b", name, re.I):
        return f"{n} · right"
    return n


def classify(name: str) -> tuple[str, str, str]:
    n = name.lower()
    # Toe / tarsal tokens must win. Generic "phalanx" used to dump every toe into Hand.
    if any(
        w in n
        for w in (
            "toe",
            "metatarsal",
            "talus",
            "calcaneus",
            "cuboid",
            "cuneiform",
            "tarsal",
            "hallux",
        )
    ) or "navicular of foot" in n or "navicular bone of foot" in n:
        return "Foot bone · mesh", "Foot", "0.85"
    if "phalanx" in n or "metacarpal" in n or any(
        w in n
        for w in (
            "finger",
            "thumb",
            "scaphoid",
            "lunate",
            "triquetrum",
            "pisiform",
            "trapezium",
            "trapezoid",
            "capitate",
            "hamate",
        )
    ) or "navicular of hand" in n:
        return "Hand bone · mesh", "Hand", "0.85"
    if "metatarsal" in n or any(
        w in n for w in ("talus", "calcaneus", "navicular", "cuboid", "cuneiform")
    ):
        return "Foot bone · mesh", "Foot", "0.85"
    if "rib" in n or "sternum" in n or "xiphoid" in n or "manubrium" in n:
        return "Thoracic bone · mesh", "Thorax", "1.05"
    if "vertebra" in n or n in {"atlas", "axis"} or "sacrum" in n or "coccyx" in n:
        region = "Cervical spine" if any(w in n for w in ("cervical", "atlas", "axis")) else (
            "Thoracic spine" if "thoracic" in n else ("Lumbar spine" if "lumbar" in n else "Axial spine")
        )
        return "Vertebra · mesh", region, "0.95"
    if any(w in n for w in ("femur", "tibia", "fibula", "patella")):
        return "Long bone · lower limb", "Lower limb", "1.1"
    if any(w in n for w in ("humerus", "radius", "ulna")):
        return "Long bone · upper limb", "Upper limb", "1.0"
    if any(w in n for w in ("clavicle", "scapula", "hip")):
        return "Girdle bone · mesh", "Girdle", "1.05"
    if any(
        w in n
        for w in (
            "mandible",
            "maxilla",
            "frontal",
            "parietal",
            "temporal",
            "occipital",
            "sphenoid",
            "ethmoid",
            "zygomatic",
            "nasal",
            "lacrimal",
            "palatine",
            "vomer",
            "hyoid",
        )
    ):
        return "Cranial bone · mesh", "Head", "0.95"
    return "Bone · mesh", "Axial", "1.0"


def load_parts() -> list[tuple[str, str, str]]:
    rows = []
    for line in SRC_LIST.read_text().splitlines()[1:]:
        cols = line.split("\t")
        if len(cols) < 3:
            continue
        fma, bp, name = cols[0], cols[1], cols[2]
        if BONE_KW.search(name) and not EXCLUDE.search(name) and not COMPOUND.search(name):
            rows.append((fma, bp, name))
    return rows


def load_elements() -> dict[str, list[str]]:
    elem: dict[str, list[str]] = defaultdict(list)
    for line in SRC_ELEM.read_text().splitlines()[1:]:
        cols = line.split("\t")
        if len(cols) < 3:
            continue
        elem[cols[0]].append(cols[2])
    return elem


def bp3d_to_atlas(points: np.ndarray) -> np.ndarray:
    """mm, Z-up, +X left → meters, Y-up, +X right, +Z anterior."""
    x, y, z = points[:, 0], points[:, 1], points[:, 2]
    out = np.empty_like(points)
    out[:, 0] = -x / 1000.0
    out[:, 1] = z / 1000.0 + 0.08
    out[:, 2] = -y / 1000.0
    return out


def load_bone_mesh(fjs: list[str]) -> trimesh.Trimesh:
    meshes = []
    for fj in fjs:
        path = OBJ_DIR / f"{fj}.obj"
        m = trimesh.load(path, force="mesh")
        if isinstance(m, trimesh.Trimesh):
            meshes.append(m)
    if len(meshes) == 1:
        mesh = meshes[0]
    else:
        mesh = trimesh.util.concatenate(meshes)
    mesh.vertices = bp3d_to_atlas(np.asarray(mesh.vertices, dtype=np.float64))
    mesh.remove_unreferenced_vertices()
    return mesh


def ts_escape(s: str) -> str:
    return s.replace("\\", "\\\\").replace("'", "\\'")


def main() -> None:
    parts = load_parts()
    elem = load_elements()
    scene = trimesh.Scene()
    catalog = []
    used_ids: set[str] = set()

    for fma, bp, name in parts:
        fjs = elem[fma]
        mesh = load_bone_mesh(fjs)
        pid = part_id(name)
        if pid in used_ids:
            pid = f"{pid}-{fma.lower()}"
        used_ids.add(pid)
        centroid = mesh.centroid.copy()
        mesh.vertices = mesh.vertices - centroid
        mesh.visual.vertex_colors = np.tile(
            np.array([230, 220, 200, 255], dtype=np.uint8),
            (len(mesh.vertices), 1),
        )
        scene.add_geometry(mesh, geom_name=pid, node_name=pid)
        kind, region, focus = classify(name)
        side = "left" if re.search(r"\bleft\b", name, re.I) else (
            "right" if re.search(r"\bright\b", name, re.I) else "midline"
        )
        catalog.append(
            {
                "id": pid,
                "fma": fma,
                "bp": bp,
                "sourceName": name,
                "name": display_name(name),
                "kind": kind,
                "region": region,
                "side": side,
                "position": [float(centroid[0]), float(centroid[1]), float(centroid[2])],
                "focusDistance": float(focus),
                "vertexCount": int(len(mesh.vertices)),
            }
        )

    OUT_GLB.parent.mkdir(parents=True, exist_ok=True)
    scene.export(OUT_GLB)
    print("wrote", OUT_GLB, "bytes", OUT_GLB.stat().st_size, "parts", len(catalog))

    rows = []
    for p in catalog:
        x, y, z = p["position"]
        # Real Function / Articulates / blurb live in src/atlas/boneCopy.ts
        # and are applied when STRUCTURES is built, so a GLB rebuild cannot
        # wipe clinical copy back to kit boilerplate.
        blurb = (
            f"{p['name']} — segmented BodyParts3D mesh. "
            "Card copy is applied from boneCopy.ts at runtime."
        )
        relate = "See boneCopy.ts (applied at runtime)."
        rows.append(
            "  {\n"
            f"    id: '{p['id']}',\n"
            "    system: 'skeleton',\n"
            f"    name: '{ts_escape(p['name'])}',\n"
            f"    kind: '{ts_escape(p['kind'])}',\n"
            f"    region: '{ts_escape(p['region'])}',\n"
            "    function: 'See boneCopy.ts (applied at runtime).',\n"
            f"    relation: '{relate}',\n"
            f"    blurb: '{ts_escape(blurb)}',\n"
            f"    position: [{x:.5f}, {y:.5f}, {z:.5f}],\n"
            f"    focusDistance: {p['focusDistance']},\n"
            f"    source: 'bodyparts3d',\n"
            f"    fma: '{p['fma']}',\n"
            "  }"
        )

    OUT_TS.parent.mkdir(parents=True, exist_ok=True)
    OUT_TS.write_text(
        "import type { Structure } from '../types'\n\n"
        "/** Auto-generated from BodyParts3D PART-OF bones. Do not edit by hand. */\n"
        "export const SKELETON_MESH_PARTS = [\n"
        + ",\n".join(rows)
        + "\n] as const satisfies readonly Structure[]\n\n"
        f"export const SKELETON_MESH_COUNT = {len(catalog)}\n"
    )
    print("wrote", OUT_TS)

    OUT_LIC.write_text(
        "BodyParts3D / Z-Anatomy segmented bone meshes\n"
        "Source models: BodyParts3D — The Database Center for Life Science (DBCLS)\n"
        "License: Creative Commons Attribution-ShareAlike (CC BY-SA)\n"
        "https://creativecommons.org/licenses/by-sa/4.0/\n"
        "https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html\n"
        "https://github.com/Z-Anatomy/Models-of-human-anatomy\n"
        "\n"
        'Required attribution: "BodyParts3D — DBCLS — CC BY-SA" and '
        '"Z-Anatomy — CC BY-SA 4.0"\n'
        "Share-alike applies to this derived per-bone GLB.\n"
        "Not CC0. No fused scans. No Zygote.\n"
    )
    (ROOT / "public/atlas/skeleton-manifest.json").write_text(
        json.dumps({"count": len(catalog), "ids": [p["id"] for p in catalog]}, indent=2)
    )


if __name__ == "__main__":
    main()
