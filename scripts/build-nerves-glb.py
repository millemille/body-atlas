#!/usr/bin/env python3
"""Bake nerve meshes the licensed sources actually ship.

Cranial nerves and the short spinal cord: BodyParts3D 4.0, untextured OBJ,
CC BY-SA 2.1 Japan. Sciatic, median, femoral, and brachial plexus are not in
that release.

Peripheral nerves: AnatomyTOOL Open3Dmodel upper-limb and lower-limb GLBs
(CC BY-SA 4.0), the kit this atlas already uses for muscle. Those limb nerves
were newly modelled; Z-Anatomy had turned the older paths into curves. Open3D
ships one side (".r", which lands on atlas left). The other side is the same
mesh mirrored, the same way the muscle bake mirrors unilateral leaves.
Texture maps are stripped. Some Open3D maps are CC BY-NC-SA and must not ship.

Seating uses bp3d_to_atlas for the cranial set and the muscle rigid delta for
the limb set. The muscle and vessel GLBs are not touched.
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
OUT_LIC_OPEN3D = ROOT / "public/atlas/LICENSE-Open3D-nerves.txt"
UPPER = Path("/tmp/open3d/upper.glb")
LOWER = Path("/tmp/open3d/lower.glb")
THORAX = Path("/tmp/open3d/thorax.glb")
SKEL_TS = ROOT / "src/atlas/generated/skeletonCatalog.ts"
NERVE_NAME = re.compile(r"nerve|plexus", re.I)
SKIP_NAME = re.compile(r"bursa|tendon|ligament|artery|vein|muscle|sheath", re.I)


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


def index_meshes(scene: trimesh.Scene) -> dict[str, trimesh.Trimesh]:
    found: dict[str, list[trimesh.Trimesh]] = {}
    for node in scene.graph.nodes_geometry:
        transform, geom_name = scene.graph[node]
        geom = scene.geometry[geom_name]
        if geom.vertices is None or len(geom.vertices) == 0:
            continue
        mesh = trimesh.Trimesh(
            vertices=np.asarray(geom.vertices, dtype=np.float64),
            faces=np.asarray(geom.faces),
            process=False,
        )
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


def bounds_center(mesh: trimesh.Trimesh) -> np.ndarray:
    lo, hi = mesh.bounds
    return (lo + hi) / 2


def rigid_delta(thorax: dict[str, trimesh.Trimesh], positions: dict[str, np.ndarray]) -> np.ndarray:
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
        delta = positions[dst] - bounds_center(thorax[src])
        deltas.append(delta)
    mean = np.mean(deltas, axis=0)
    if np.linalg.norm(mean - np.array([0.0003, 0.0173, 0.0939])) > 0.01:
        raise SystemExit(f"Open3D seating delta drifted: {mean}")
    return mean


def mirror_x(mesh: trimesh.Trimesh) -> trimesh.Trimesh:
    mirrored = mesh.copy()
    mirrored.vertices = np.array(mirrored.vertices, copy=True)
    mirrored.vertices[:, 0] *= -1
    mirrored.faces = np.array(mirrored.faces[:, ::-1], copy=True)
    return mirrored


def peripheral_region(name: str) -> str:
    n = name.lower()
    if any(k in n for k in ("plexus", "pudendal", "iliohypogastric", "ilioinguinal", "genitofemoral", "coccygeal", "clunial")):
        if any(k in n for k in ("brachial", "subclavian", "pectoral", "scapular", "thoracic nerve")):
            return "Upper limb"
        return "Pelvis"
    if any(
        k in n
        for k in (
            "sciatic", "femoral", "tibial", "fibular", "sural", "plantar", "obturator",
            "saphenous", "gluteal", "calcaneal", "psoas", "quadratus femoris", "levator ani",
        )
    ):
        return "Lower limb"
    return "Upper limb"


def clean_open3d_name(node: str) -> str:
    name = re.sub(r"\.r$", "", node.strip())
    return re.sub(r"\s+", " ", name).strip(" -")


def add_open3d_nerves(scene: trimesh.Scene, rows: list[dict], used: set[str]) -> None:
    thorax = index_meshes(trimesh.load(THORAX, force="scene"))
    upper = index_meshes(trimesh.load(UPPER, force="scene"))
    lower = index_meshes(trimesh.load(LOWER, force="scene"))
    delta = rigid_delta(thorax, catalog_positions(SKEL_TS))
    print("open3d delta", np.round(delta, 4))
    sources = {**upper, **lower}
    picked = [name for name in sources if NERVE_NAME.search(name) and not SKIP_NAME.search(name)]
    if len(picked) < 40:
        raise SystemExit(f"only {len(picked)} Open3D nerve meshes")
    for node in sorted(picked, key=str.lower):
        placed = sources[node].copy()
        placed.vertices = np.asarray(placed.vertices, dtype=np.float64) + delta
        lo, hi = placed.bounds
        crosses = lo[0] < -0.02 and hi[0] > 0.02
        label = clean_open3d_name(node)
        if crosses:
            sides = [(placed, "")]
        else:
            left = placed if bounds_center(placed)[0] <= 0 else mirror_x(placed)
            sides = [(left, "left"), (mirror_x(left), "right")]
        for mesh, side in sides:
            mesh.remove_unreferenced_vertices()
            if len(mesh.faces) < 4:
                raise SystemExit(f"{node} has no surface")
            world = mesh.copy()
            centroid = np.asarray(bounds_center(mesh), dtype=np.float64)
            mesh.vertices = np.asarray(mesh.vertices, dtype=np.float64) - centroid
            extent = np.asarray(mesh.extents, dtype=np.float64)
            focus = float(np.clip(0.75 + np.linalg.norm(extent) * 0.28, 0.9, 1.45))
            mesh.visual = trimesh.visual.ColorVisuals(mesh=mesh)
            pretty = display_name(label)
            if side:
                pretty = f"{pretty} · {side}"
            pid = slug(pretty)
            if pid in used:
                pid = f"{pid}-open3d"
            if pid in used:
                raise SystemExit(f"duplicate nerve id {pid}")
            used.add(pid)
            scene.add_geometry(mesh, geom_name=pid, node_name=pid)
            rows.append(
                {
                    "id": pid,
                    "name": pretty,
                    "kind": "Nerve · mesh",
                    "region": peripheral_region(label),
                    "function": f"Named {label} mesh in the Open3Dmodel kit.",
                    "relation": "Seated on this skeleton with the same shift as the Open3D muscles.",
                    "blurb": (
                        f"{pretty} from Open3Dmodel. Untextured mesh, seated on this skeleton. "
                        "Nerves are atlas yellow."
                    ),
                    "position": centroid,
                    "focus": focus,
                    "fma": "",
                    "source": "open3d",
                    "bounds": world.bounds,
                }
            )
            print(f"  {pid:52} c={np.round(centroid, 3)} n={len(mesh.vertices)}")


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
                "source": "bodyparts3d",
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
    cranial = len(rows)
    add_open3d_nerves(scene, rows, used)
    by_id = {row["id"]: row for row in rows}
    for required in ("sciatic-nerve-left", "sciatic-nerve-right", "femoral-nerve-left", "median-nerve-left"):
        if required not in by_id or by_id[required]["source"] != "open3d":
            raise SystemExit(f"missing peripheral {required}")
    sciatic = by_id["sciatic-nerve-left"]
    median = by_id["median-nerve-left"]
    if sciatic["position"][0] > -0.04 or not (0.45 <= sciatic["position"][1] <= 1.05):
        raise SystemExit(f"sciatic is not in the thigh: {sciatic['position']}")
    if median["position"][0] > -0.1 or median["position"][1] < 0.8 or median["position"][1] > 1.45:
        raise SystemExit(f"median is not in the arm: {median['position']}")
    if not any("brachial-plexus" in row["id"] for row in rows):
        raise SystemExit("brachial plexus parts are missing")
    if any("bursa" in row["id"] for row in rows):
        raise SystemExit("a bursa was imported as a nerve")
    print("cranial", cranial, "peripheral", len(rows) - cranial)

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
            f"    source: '{row['source']}',\n"
            + (f"    fma: '{row['fma']}',\n" if row.get("fma") else "")
            + "  }"
        )
    OUT_TS.parent.mkdir(parents=True, exist_ok=True)
    OUT_TS.write_text(
        "import type { Structure } from '../types'\n\n"
        "/** BodyParts3D cranial nerves plus Open3D limb nerves in public/atlas/nerves.glb. Untextured. Do not edit by hand. */\n"
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
        "No texture maps are included. Limb nerves in the same file are Open3Dmodel,\n"
        "CC BY-SA 4.0, also untextured. See LICENSE-Open3D-nerves.txt.\n"
        "Share-alike: this derived GLB stays CC BY-SA.\n"
    )
    OUT_LIC_OPEN3D.write_text(
        "Open3Dmodel peripheral nerve meshes in public/atlas/nerves.glb\n"
        "\n"
        "Source: AnatomyTOOL Open3D project, upper limb and lower limb, July 2025.\n"
        "https://anatomytool.org/open3dmodel\n"
        "The limb nerves were newly modelled for Open3Dmodel (CC BY-SA 4.0).\n"
        "Z-Anatomy (CC BY-SA 4.0) is the predecessor; it stored many of these paths\n"
        "as curves rather than the meshes this atlas needs.\n"
        "\n"
        "License: Creative Commons Attribution-ShareAlike 4.0 (CC BY-SA 4.0).\n"
        "https://creativecommons.org/licenses/by-sa/4.0/\n"
        "\n"
        "Required attribution:\n"
        "\"Open3DModel\" by the Open3D project, license CC BY-SA\n"
        "\n"
        "Texture maps were omitted. Some Open3D maps are CC BY-NC-SA and are not shipped.\n"
        "The atlas shades these meshes yellow. The \".r\" side is mirrored so both limbs\n"
        "carry the same named nerve. Cranial nerves in this GLB stay BodyParts3D.\n"
        "Share-alike: this derived GLB stays CC BY-SA.\n"
    )


if __name__ == "__main__":
    main()
