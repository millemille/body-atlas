#!/usr/bin/env python3
"""Bake every artery and vein mesh BodyParts3D 4.0 actually ships.

Source: BodyParts3D (DBCLS) release 4.0, PART-OF tree, polygon reduction 99%,
untextured OBJ. License CC BY-SA 2.1 Japan. The zip has no texture maps.

Each polygon file is assigned to the most specific named artery, vein, vena,
aorta, pulmonary trunk, coronary sinus, or cerebral arterial circle that
lists it. Parent trees (systemic arterial tree, and so on) do not become
leaves, and a file is not copied into its ancestors. Nerves are not imported.
The muscle GLB is not touched.

Seating uses the same bp3d_to_atlas transform as scripts/build-skeleton-glb.py.
"""

from __future__ import annotations

import re
import zipfile
from collections import defaultdict
from pathlib import Path

import numpy as np
import trimesh

ROOT = Path(__file__).resolve().parents[1]
PARTS = Path("/tmp/partof_parts_list_e.txt")
ELEMS = Path("/home/ubuntu/.cursor/projects/workspace/agent-tools/6d17c02b-8f0d-440e-98f8-a570bbe72edf.txt")
ZIP = Path("/tmp/bp3d/partof_BP3D_4.0_obj_99.zip")
OBJ_DIR = Path("/tmp/bp3d/obj")
OUT_GLB = ROOT / "public/atlas/vessels.glb"
OUT_TS = ROOT / "src/atlas/generated/vesselCatalog.ts"
OUT_LIC = ROOT / "public/atlas/LICENSE-BodyParts3D-vessels.txt"

INCLUDE = re.compile(
    r"\b(artery|arteries|vein|veins|vena|venae|aorta)\b"
    r"|pulmonary trunk|coronary sinus|cerebral arterial circle",
    re.I,
)
EXCLUDE = re.compile(r"\b(system|tree|valve|nerve|lymph|bronchopulmonary)\b", re.I)


def wanted(name: str) -> bool:
    if EXCLUDE.search(name):
        return False
    return bool(INCLUDE.search(name))


def is_vein(name: str) -> bool:
    n = name.lower()
    if "artery" in n or "arterial" in n or "aorta" in n or n == "pulmonary trunk":
        return False
    return "vein" in n or "vena" in n or "sinus" in n


def slug(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def region_for(name: str) -> str:
    n = name.lower()
    if any(k in n for k in ("carotid", "vertebral", "cerebral", "facial", "lingual", "ophthalm", "maxillary", "temporal", "occipital", "meningeal", "jugular", "thyroid", "cervical")):
        return "Head and neck"
    if any(k in n for k in ("femoral", "iliac", "tibial", "popliteal", "fibular", "peroneal", "plantar", "dorsal pedis", "genicular", "saphenous")):
        return "Lower limb"
    if any(k in n for k in ("subclavian", "axillary", "brachial", "radial", "ulnar", "humeral", "scapular", "thoracoacromial")):
        return "Upper limb"
    if any(k in n for k in ("hepatic", "portal", "renal", "mesenteric", "splenic", "gastric", "abdominal", "celiac", "colic", "jejunal", "ileal", "lumbar", "ovarian", "testicular", "suprarenal")):
        return "Abdomen"
    if any(k in n for k in ("coronary", "pulmonary", "aorta", "intercostal", "thoracic", "pericardi", "bronchial", "phrenic")):
        return "Thorax"
    return "Body"


def bp3d_to_atlas(points: np.ndarray) -> np.ndarray:
    """mm, Z-up, +X left → meters, Y-up, +X right, +Z anterior."""
    out = np.empty_like(points, dtype=np.float64)
    out[:, 0] = -points[:, 0] / 1000.0
    out[:, 1] = points[:, 2] / 1000.0 + 0.08
    out[:, 2] = -points[:, 1] / 1000.0
    return out


def load_parts() -> dict[str, str]:
    names = {}
    for line in PARTS.read_text().splitlines()[1:]:
        cols = line.split("\t")
        if len(cols) < 3:
            continue
        names[cols[0]] = cols[2]
    return names


def load_elements() -> dict[str, list[str]]:
    elem: dict[str, list[str]] = defaultdict(list)
    for line in ELEMS.read_text().splitlines()[1:]:
        bits = line.split()
        if len(bits) < 3:
            continue
        elem[bits[0]].append(bits[-1])
    return elem


def assign_leaves(parts: dict[str, str], elem: dict[str, list[str]]) -> dict[str, list[str]]:
    candidates = {fma: name for fma, name in parts.items() if wanted(name) and elem.get(fma)}
    file_sets = {fma: set(elem[fma]) for fma in candidates}
    owners: dict[str, list[str]] = defaultdict(list)
    seen: set[str] = set()
    for fma, files in file_sets.items():
        seen.update(files)
    for fj in sorted(seen):
        owners_for = [fma for fma, files in file_sets.items() if fj in files]
        if not owners_for:
            continue
        best = min(owners_for, key=lambda fma: (len(file_sets[fma]), -len(candidates[fma]), fma))
        owners[best].append(fj)
    return {fma: files for fma, files in owners.items() if files}


def ensure_objs(files: set[str]) -> None:
    OBJ_DIR.mkdir(parents=True, exist_ok=True)
    missing = [fj for fj in files if not (OBJ_DIR / f"{fj}.obj").exists()]
    if not missing:
        return
    if not ZIP.exists():
        raise SystemExit(f"missing {ZIP}")
    wanted_names = {f"partof_BP3D_4.0_obj_99/{fj}.obj": fj for fj in missing}
    with zipfile.ZipFile(ZIP) as zf:
        have = set(zf.namelist())
        for name, fj in wanted_names.items():
            if name not in have:
                raise SystemExit(f"{fj} is not in the BodyParts3D zip")
            (OBJ_DIR / f"{fj}.obj").write_bytes(zf.read(name))
    print("extracted", len(missing), "obj files")


def load_file(fj: str) -> trimesh.Trimesh:
    path = OBJ_DIR / f"{fj}.obj"
    text = path.read_text(errors="replace")
    if "map_" in text or ".png" in text.lower() or ".jpg" in text.lower():
        raise SystemExit(f"{fj} references a texture map")
    mesh = trimesh.load(path, force="mesh", process=False)
    if not isinstance(mesh, trimesh.Trimesh) or len(mesh.faces) < 1:
        raise SystemExit(f"{fj} did not load as a mesh")
    mesh.vertices = bp3d_to_atlas(np.asarray(mesh.vertices, dtype=np.float64))
    return mesh


def ts_escape(s: str) -> str:
    return s.replace("\\", "\\\\").replace("'", "\\'")


def display_name(name: str) -> str:
    return name[:1].upper() + name[1:]


def main() -> None:
    parts = load_parts()
    elem = load_elements()
    owned = assign_leaves(parts, elem)
    files = {fj for group in owned.values() for fj in group}
    print("leaves", len(owned), "files", len(files))
    ensure_objs(files)

    scene = trimesh.Scene()
    rows = []
    used_ids: set[str] = set()
    for fma in sorted(owned, key=lambda item: parts[item].lower()):
        name = parts[fma]
        meshes = [load_file(fj) for fj in owned[fma]]
        merged = meshes[0] if len(meshes) == 1 else trimesh.util.concatenate(meshes)
        merged.remove_unreferenced_vertices()
        if len(merged.faces) < 4:
            raise SystemExit(f"{name} has no surface")
        centroid = np.asarray(merged.centroid, dtype=np.float64).copy()
        merged.vertices = np.asarray(merged.vertices, dtype=np.float64) - centroid
        extent = np.asarray(merged.extents, dtype=np.float64)
        focus = float(np.clip(0.72 + np.linalg.norm(extent) * 0.55, 0.85, 1.4))
        merged.visual = trimesh.visual.ColorVisuals(mesh=merged)
        pid = slug(name)
        if pid in used_ids:
            pid = f"{pid}-{fma.lower()}"
        used_ids.add(pid)
        scene.add_geometry(merged, geom_name=pid, node_name=pid)
        vein = is_vein(name)
        label = display_name(name)
        kind = "Venous · mesh" if vein else "Arterial · mesh"
        tone = "blue" if vein else "red"
        rows.append(
            {
                "id": pid,
                "name": label,
                "kind": kind,
                "region": region_for(name),
                "function": f"Named {name} mesh in the BodyParts3D kit.",
                "relation": "Seated on this skeleton with the same transform as the bone meshes.",
                "blurb": (
                    f"{label} from BodyParts3D. Untextured mesh, seated on this skeleton. "
                    f"Arteries are atlas red and veins are atlas blue."
                ),
                "position": centroid,
                "focus": focus,
                "fma": fma,
                "vein": vein,
                "tone": tone,
            }
        )

    if len(rows) < 40:
        raise SystemExit(f"only {len(rows)} vessel leaves; the source has more")
    if not any(row["id"] == "arch-of-aorta" for row in rows):
        raise SystemExit("arch of aorta was not a leaf")
    if not any(row["id"] == "superior-vena-cava" for row in rows):
        raise SystemExit("superior vena cava was not a leaf")
    if not any(row["vein"] for row in rows) or not any(not row["vein"] for row in rows):
        raise SystemExit("need both arteries and veins")
    arch = next(row for row in rows if row["id"] == "arch-of-aorta")
    svc = next(row for row in rows if row["id"] == "superior-vena-cava")
    if not (1.30 < arch["position"][1] < 1.45 and arch["position"][2] > 0.04):
        raise SystemExit(f"arch is not in the chest: {arch['position']}")
    if not (svc["position"][0] > arch["position"][0]):
        raise SystemExit("superior vena cava should sit to the anatomical right of the arch")

    OUT_GLB.parent.mkdir(parents=True, exist_ok=True)
    scene.export(OUT_GLB)
    raw = OUT_GLB.read_bytes()
    if raw[:4] != b"glTF":
        raise SystemExit("export is not a GLB")
    length = int.from_bytes(raw[12:16], "little")
    js = raw[20 : 20 + length]
    if b'"images"' in js or b"image/" in js:
        raise SystemExit("vessels.glb contains an image map")
    print("wrote", OUT_GLB, "bytes", OUT_GLB.stat().st_size, "leaves", len(rows))

    lines = []
    vein_ids = []
    for row in rows:
        x, y, z = row["position"]
        if row["vein"]:
            vein_ids.append(row["id"])
        lines.append(
            "  {\n"
            f"    id: '{row['id']}',\n"
            "    system: 'vessel',\n"
            f"    name: '{ts_escape(row['name'])}',\n"
            f"    kind: '{ts_escape(row['kind'])}',\n"
            f"    region: '{ts_escape(row['region'])}',\n"
            f"    function: '{ts_escape(row['function'])}',\n"
            f"    relation: '{ts_escape(row['relation'])}',\n"
            f"    blurb: '{ts_escape(row['blurb'])}',\n"
            f"    position: [{x:.5f}, {y:.5f}, {z:.5f}],\n"
            f"    focusDistance: {row['focus']:.2f},\n"
            "    source: 'bodyparts3d',\n"
            f"    fma: '{row['fma']}',\n"
            "  }"
        )
    vein_body = ",\n".join(f"  '{vid}'" for vid in vein_ids)
    OUT_TS.write_text(
        "import type { Structure } from '../types'\n\n"
        "/** BodyParts3D 4.0 PART-OF arteries and veins in public/atlas/vessels.glb. Untextured. Do not edit by hand. */\n"
        "export const VESSEL_MESH_PARTS = [\n"
        + ",\n".join(lines)
        + "\n] as const satisfies readonly Structure[]\n\n"
        f"export const VESSEL_MESH_COUNT = {len(rows)}\n\n"
        "export const VESSEL_VEIN_IDS = [\n"
        + vein_body
        + "\n] as const\n"
    )
    print("wrote", OUT_TS, "veins", len(vein_ids), "arteries", len(rows) - len(vein_ids))

    OUT_LIC.write_text(
        "BodyParts3D artery and vein meshes\n"
        "\n"
        "Source models: BodyParts3D — The Database Center for Life Science (DBCLS)\n"
        "Release: 4.0 PART-OF tree, polygon reduction 99%, untextured OBJ\n"
        "https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html\n"
        "\n"
        "License: Creative Commons Attribution-ShareAlike 2.1 Japan (CC BY-SA 2.1 JP)\n"
        "https://creativecommons.org/licenses/by-sa/2.1/jp/\n"
        "https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html\n"
        "\n"
        "Required attribution:\n"
        "\"BodyParts3D — The Database Center for Life Science — CC BY-SA\"\n"
        "\n"
        "This GLB uses the same meter, Y-up, +X anatomical-right seating as skeleton.glb.\n"
        "No texture maps are included. Non-commercial color maps from other kits are not packed.\n"
        "Each polygon file is one leaf: the most specific artery or vein name the source gives it.\n"
        "Nerves are not included. Share-alike: this derived GLB stays CC BY-SA.\n"
    )


if __name__ == "__main__":
    main()
