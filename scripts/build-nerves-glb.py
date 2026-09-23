#!/usr/bin/env python3
"""Bake the nerve meshes BodyParts3D 4.0 actually ships.

Source: BodyParts3D (DBCLS) release 4.0, IS-A tree, polygon reduction 99%,
untextured OBJ. License CC BY-SA 2.1 Japan. The zip has no texture maps.

The published 4.0 nerve set is the named cranial-nerve meshes in the IS-A
tree (optic, trochlear, ophthalmic and its branches, ciliary ganglion, and
the leftover nerve-trunk files) plus the spinal cord from the PART-OF tree.
IS-A labels that same FJ1737 file as the central canal, which is not a nerve
leaf. Sciatic, median, femoral, and brachial plexus are not in this release,
so they are not invented. Each polygon file is assigned to the most specific
nerve name that lists it. Parent labels such as "nerve" and "cranial nerve"
do not become extra leaves. The spinal cord mesh this release ships is a
short craniovertebral segment, not a full-length cord.

Seating uses the same bp3d_to_atlas transform as the skeleton and vessels.
The muscle and vessel GLBs are not touched.
"""

from __future__ import annotations

import re
import zipfile
from collections import defaultdict
from pathlib import Path

import numpy as np
import trimesh

ROOT = Path(__file__).resolve().parents[1]
ISA_PARTS = Path("/tmp/isa_parts_list_e.txt")
ISA_ELEMS = Path("/tmp/isa_element_parts.txt")
ISA_ZIP = Path("/tmp/bp3d/isa_BP3D_4.0_obj_99.zip")
PARTOF_ELEMS = Path("/home/ubuntu/.cursor/projects/workspace/agent-tools/6d17c02b-8f0d-440e-98f8-a570bbe72edf.txt")
OBJ_DIR = Path("/tmp/bp3d/isa-obj")
OUT_GLB = ROOT / "public/atlas/nerves.glb"
OUT_TS = ROOT / "src/atlas/generated/nerveCatalog.ts"
OUT_LIC = ROOT / "public/atlas/LICENSE-BodyParts3D-nerves.txt"


def wanted(name: str) -> bool:
    n = name.lower()
    if any(k in n for k in ("artery", "vein", "ligament", "nucleus", "choroid", "canal", "muscle", "bone", "basal ganglion")):
        return False
    return "nerve" in n or ("ganglion" in n and "basal" not in n) or n == "spinal cord"


def slug(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def region_for(name: str) -> str:
    if name.lower() == "spinal cord":
        return "Head and neck"
    return "Head"


def bp3d_to_atlas(points: np.ndarray) -> np.ndarray:
    """mm, Z-up, +X left → meters, Y-up, +X right, +Z anterior."""
    out = np.empty_like(points, dtype=np.float64)
    out[:, 0] = -points[:, 0] / 1000.0
    out[:, 1] = points[:, 2] / 1000.0 + 0.08
    out[:, 2] = -points[:, 1] / 1000.0
    return out


def load_tables() -> tuple[dict[str, str], dict[str, list[str]]]:
    names: dict[str, str] = {}
    for line in ISA_PARTS.read_text().splitlines()[1:]:
        cols = line.split("\t")
        if len(cols) >= 3:
            names[cols[0]] = cols[2]
    elem: dict[str, list[str]] = defaultdict(list)
    for line in ISA_ELEMS.read_text().splitlines()[1:]:
        cols = line.split("\t")
        if len(cols) >= 3:
            elem[cols[0]].append(cols[2])
            names.setdefault(cols[0], cols[1])
    return names, elem


def spinal_cord_files() -> list[str]:
    """PART-OF names FJ1737 spinal cord. IS-A only calls that file a canal."""
    files: list[str] = []
    for line in PARTOF_ELEMS.read_text().splitlines():
        cols = line.split()
        if len(cols) >= 3 and cols[0] == "FMA7647" and cols[-1].startswith("FJ"):
            files.append(cols[-1])
    if files != ["FJ1737"]:
        raise SystemExit(f"unexpected spinal cord files: {files}")
    return files


def assign_leaves(names: dict[str, str], elem: dict[str, list[str]]) -> dict[str, list[str]]:
    file_sets = {fma: set(files) for fma, files in elem.items() if wanted(names.get(fma, "")) and files}
    seen: set[str] = set()
    for files in file_sets.values():
        seen.update(files)
    owners: dict[str, list[str]] = defaultdict(list)
    for fj in sorted(seen):
        cands = [fma for fma, files in file_sets.items() if fj in files]
        best = min(cands, key=lambda fma: (len(file_sets[fma]), -len(names[fma]), fma))
        owners[best].append(fj)
    return {fma: files for fma, files in owners.items() if files}


def ensure_objs(files: set[str]) -> None:
    OBJ_DIR.mkdir(parents=True, exist_ok=True)
    missing = [fj for fj in files if not (OBJ_DIR / f"{fj}.obj").exists()]
    if not missing:
        return
    wanted = {f"isa_BP3D_4.0_obj_99/{fj}.obj": fj for fj in missing}
    with zipfile.ZipFile(ISA_ZIP) as zf:
        have = set(zf.namelist())
        for name, fj in wanted.items():
            if name not in have:
                raise SystemExit(f"{fj} is not in the BodyParts3D IS-A zip")
            (OBJ_DIR / f"{fj}.obj").write_bytes(zf.read(name))
    print("extracted", len(missing))


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
    names, elem = load_tables()
    owned = assign_leaves(names, elem)
    names["FMA7647"] = "spinal cord"
    owned["FMA7647"] = spinal_cord_files()
    files = {fj for group in owned.values() for fj in group}
    print("leaves", len(owned), "files", len(files))
    ensure_objs(files)

    scene = trimesh.Scene()
    rows = []
    used: set[str] = set()
    banned = {"sciatic-nerves", "median-nerves", "femoral-nerves", "brachial-plexus", "sternocleidomastoid"}
    for fma in sorted(owned, key=lambda item: names[item].lower()):
        name = names[fma]
        meshes = [load_file(fj) for fj in owned[fma]]
        merged = meshes[0] if len(meshes) == 1 else trimesh.util.concatenate(meshes)
        merged.remove_unreferenced_vertices()
        if len(merged.faces) < 4:
            raise SystemExit(f"{name} has no surface")
        world = merged.copy()
        centroid = np.asarray(merged.centroid, dtype=np.float64).copy()
        merged.vertices = np.asarray(merged.vertices, dtype=np.float64) - centroid
        extent = np.asarray(merged.extents, dtype=np.float64)
        focus = float(np.clip(0.7 + np.linalg.norm(extent) * 0.55, 0.85, 1.45))
        merged.visual = trimesh.visual.ColorVisuals(mesh=merged)
        pid = slug(name)
        if pid in used:
            pid = f"{pid}-{fma.lower()}"
        if pid in banned:
            raise SystemExit(f"refusing invented id {pid}")
        used.add(pid)
        scene.add_geometry(merged, geom_name=pid, node_name=pid)
        label = display_name(name)
        rows.append(
            {
                "id": pid,
                "name": label,
                "kind": "Nerve · mesh",
                "region": region_for(name),
                "function": f"Named {name} mesh in the BodyParts3D kit.",
                "relation": "Seated on this skeleton with the same transform as the bone meshes.",
                "blurb": (
                    f"{label} from BodyParts3D. Untextured mesh, seated on this skeleton. "
                    "Nerves are atlas yellow."
                ),
                "position": centroid,
                "focus": focus,
                "fma": fma,
                "bounds": world.bounds,
            }
        )
        print(f"  {pid:52} c={np.round(centroid, 3)} n={len(merged.vertices)}")

    by_id = {row["id"]: row for row in rows}
    for required in ("spinal-cord", "right-optic-nerve", "left-optic-nerve", "right-trochlear-nerve"):
        if required not in by_id:
            raise SystemExit(f"missing {required}")
    cord = by_id["spinal-cord"]
    cx, cy, cz = cord["position"]
    span = float(cord["bounds"][1, 1] - cord["bounds"][0, 1])
    # Release 4.0 ships a short craniovertebral segment, not a full-length cord.
    if abs(cx) > 0.02 or not (1.45 <= cy <= 1.70) or span < 0.01 or cz > 0.12:
        raise SystemExit(f"spinal cord is not at the craniovertebral junction: {cord['position']} span {span}")
    optic = by_id["right-optic-nerve"]
    if optic["position"][1] < 1.45:
        raise SystemExit(f"optic nerve is not in the head: {optic['position']}")
    if len(rows) < 20:
        raise SystemExit(f"only {len(rows)} nerve leaves")

    OUT_GLB.parent.mkdir(parents=True, exist_ok=True)
    scene.export(OUT_GLB)
    raw = OUT_GLB.read_bytes()
    if raw[:4] != b"glTF":
        raise SystemExit("export is not a GLB")
    length = int.from_bytes(raw[12:16], "little")
    js = raw[20 : 20 + length]
    if b'"images"' in js or b"image/" in js:
        raise SystemExit("nerves.glb contains an image map")
    print("wrote", OUT_GLB, "bytes", OUT_GLB.stat().st_size, "leaves", len(rows))

    lines = []
    for row in rows:
        x, y, z = row["position"]
        lines.append(
            "  {\n"
            f"    id: '{row['id']}',\n"
            "    system: 'nerve',\n"
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
    OUT_TS.parent.mkdir(parents=True, exist_ok=True)
    OUT_TS.write_text(
        "import type { Structure } from '../types'\n\n"
        "/** BodyParts3D 4.0 nerves in public/atlas/nerves.glb. Untextured. Do not edit by hand. */\n"
        "export const NERVE_MESH_PARTS = [\n"
        + ",\n".join(lines)
        + "\n] as const satisfies readonly Structure[]\n\n"
        f"export const NERVE_MESH_COUNT = {len(rows)}\n"
    )
    print("wrote", OUT_TS)

    OUT_LIC.write_text(
        "BodyParts3D nerve meshes (spinal cord and the cranial nerves this release ships)\n"
        "\n"
        "Source models: BodyParts3D — The Database Center for Life Science (DBCLS)\n"
        "Release: 4.0, polygon reduction 99%, untextured OBJ\n"
        "Cranial nerves from the IS-A tree; spinal cord from the PART-OF tree (FJ1737).\n"
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
        "No texture maps are included. Sciatic, median, femoral, and brachial plexus\n"
        "meshes are not in this release and are not invented here.\n"
        "Share-alike: this derived GLB stays CC BY-SA.\n"
    )


if __name__ == "__main__":
    main()
