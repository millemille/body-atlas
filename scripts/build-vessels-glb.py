#!/usr/bin/env python3
"""Bake the five vessel trunks that BodyParts3D actually ships.

Source: BodyParts3D (DBCLS) release 4.0, PART-OF tree, polygon reduction 99%,
untextured OBJ. License CC BY-SA 2.1 Japan (same kit as the skeleton).
No texture maps are in this zip, so nothing non-commercial is packed.

Only element files whose specific names are the named trunk (plus the parent
trunk the source already tags on that file) are included:

  aorta                 FJ1931 FJ1932 FJ3411 FJ3413 FJ3427
  carotid-arteries      FJ3564 FJ3483
  vena-cava             FJ3645 FJ3441 FJ3659
  femoral-arteries      FJ2143 FJ2074
  subclavian-arteries   FJ3579 FJ3479

Downstream trees (internal carotid, vertebral, arm, deep femoral, genicular)
are separate element files and are not imported. Nerves are not imported.
The muscle GLB is not touched.

Seating uses the same bp3d_to_atlas transform as scripts/build-skeleton-glb.py.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
import trimesh

ROOT = Path(__file__).resolve().parents[1]
OBJ_DIR = Path("/tmp/bp3d/obj")
OUT_GLB = ROOT / "public/atlas/vessels.glb"
OUT_TS = ROOT / "src/atlas/generated/vesselCatalog.ts"
OUT_LIC = ROOT / "public/atlas/LICENSE-BodyParts3D-vessels.txt"

GROUPS = [
    {
        "id": "aorta",
        "name": "Aorta",
        "kind": "Great vessel · mesh",
        "region": "Thoracic / upper abdominal axis",
        "function": "Primary arterial trunk through the chest and upper abdomen in this figure.",
        "relation": "Ascending aorta, arch, and descending run sit behind the sternum, left of the vena cava.",
        "blurb": (
            "Ascending aorta, arch, descending thoracic aorta, abdominal aorta, and the descending aorta element from BodyParts3D. "
            "Intercostal and iliac branches are not in this leaf. Ruby shading is atlas styling, not a source color map."
        ),
        "fma": "FMA3734",
        "slate": False,
        "files": ["FJ1931", "FJ1932", "FJ3411", "FJ3413", "FJ3427"],
    },
    {
        "id": "carotid-arteries",
        "name": "Carotid arteries",
        "kind": "Arterial · mesh",
        "region": "Neck",
        "function": "Left and right common carotid trunks beside the cervical column.",
        "relation": "Rise from the arch and the brachiocephalic parent toward the skull base.",
        "blurb": (
            "Left and right common carotid trunks from BodyParts3D. The right file is also tagged brachiocephalic. "
            "Internal carotids are not in this leaf. Left and right share one structure."
        ),
        "fma": "FMA3941",
        "slate": False,
        "files": ["FJ3564", "FJ3483"],
    },
    {
        "id": "vena-cava",
        "name": "Vena cava",
        "kind": "Great vessel · mesh",
        "region": "Right trunk",
        "function": "Superior and inferior vena cava trunks on the right of the aorta.",
        "relation": "The two caval trunks sit to the right of the aortic run. They are one card.",
        "blurb": (
            "Superior vena cava and inferior vena cava from BodyParts3D, one card. "
            "These files do not include a joining cardiac segment or hepatic and renal inflows. "
            "Slate shading is atlas styling, not a source color map."
        ),
        "fma": "FMA4720",
        "slate": True,
        "files": ["FJ3645", "FJ3441", "FJ3659"],
    },
    {
        "id": "femoral-arteries",
        "name": "Femoral arteries",
        "kind": "Arterial · mesh",
        "region": "Pelvis into the thighs",
        "function": "Left and right femoral artery meshes, including the iliac parent tagged on each file.",
        "relation": "Run medial to each femur, from the iliac parent the source tags on the file down the thigh.",
        "blurb": (
            "Left and right femoral artery meshes from BodyParts3D. Each file is also tagged as the common and external iliac parent, so that parent trunk is in the mesh. "
            "Deep femoral, circumflex, and genicular arteries are not separate leaves here."
        ),
        "fma": "FMA70249",
        "slate": False,
        "files": ["FJ2143", "FJ2074"],
    },
    {
        "id": "subclavian-arteries",
        "name": "Subclavian arteries",
        "kind": "Arterial · mesh",
        "region": "Shoulder girdle",
        "function": "Left and right subclavian trunks under the clavicles.",
        "relation": "Short trunks from the arch and the brachiocephalic parent toward each clavicle.",
        "blurb": (
            "Left and right subclavian trunks from BodyParts3D. The right file is also tagged brachiocephalic. "
            "Vertebral, internal thoracic, and arm arteries are not in this leaf."
        ),
        "fma": "FMA3953",
        "slate": False,
        "files": ["FJ3579", "FJ3479"],
    },
]


def bp3d_to_atlas(points: np.ndarray) -> np.ndarray:
    """mm, Z-up, +X left → meters, Y-up, +X right, +Z anterior."""
    x, y, z = points[:, 0], points[:, 1], points[:, 2]
    out = np.empty_like(points, dtype=np.float64)
    out[:, 0] = -x / 1000.0
    out[:, 1] = z / 1000.0 + 0.08
    out[:, 2] = -y / 1000.0
    return out


def load_group(files: list[str]) -> trimesh.Trimesh:
    meshes = []
    for fj in files:
        path = OBJ_DIR / f"{fj}.obj"
        if not path.exists():
            raise SystemExit(f"missing {path}")
        text = path.read_text(errors="replace")
        if "map_" in text or ".png" in text or ".jpg" in text:
            raise SystemExit(f"{fj} references a texture map")
        mesh = trimesh.load(path, force="mesh", process=False)
        if not isinstance(mesh, trimesh.Trimesh):
            raise SystemExit(f"{fj} did not load as a mesh")
        mesh.vertices = bp3d_to_atlas(np.asarray(mesh.vertices, dtype=np.float64))
        meshes.append(mesh)
    merged = meshes[0] if len(meshes) == 1 else trimesh.util.concatenate(meshes)
    merged.remove_unreferenced_vertices()
    return merged


def ts_escape(s: str) -> str:
    return s.replace("\\", "\\\\").replace("'", "\\'")


def main() -> None:
    scene = trimesh.Scene()
    rows = []
    world = {}
    for group in GROUPS:
        mesh = load_group(group["files"])
        if len(mesh.faces) < 8:
            raise SystemExit(f"{group['id']} has no surface")
        world[group["id"]] = mesh.copy()
        centroid = np.asarray(mesh.centroid, dtype=np.float64).copy()
        mesh.vertices = np.asarray(mesh.vertices, dtype=np.float64) - centroid
        extent = mesh.extents
        focus = float(np.clip(0.75 + np.linalg.norm(extent) * 0.55, 0.9, 1.4))
        # Untextured. ColorVisuals carries no image map.
        mesh.visual = trimesh.visual.ColorVisuals(mesh=mesh)
        scene.add_geometry(mesh, geom_name=group["id"], node_name=group["id"])
        rows.append({**group, "position": centroid, "focus": focus, "verts": int(len(mesh.vertices))})
        print(
            f"  {group['id']:22} c={np.round(centroid, 3)} "
            f"span={np.round(extent, 3)} n={len(mesh.vertices)} focus={focus:.2f}"
        )

    aorta = world["aorta"]
    cava = world["vena-cava"]
    carotids = world["carotid-arteries"]
    femorals = world["femoral-arteries"]
    subclavians = world["subclavian-arteries"]
    if not (1.15 < aorta.centroid[1] < 1.35 and 0.05 < aorta.centroid[2] < 0.16):
        raise SystemExit(f"aorta is not seated in the chest: {aorta.centroid}")
    if not (cava.centroid[0] > aorta.centroid[0]):
        raise SystemExit("vena cava should sit to the anatomical right of the aorta")
    if not (1.38 < carotids.centroid[1] < 1.50):
        raise SystemExit(f"carotids are not in the neck: {carotids.centroid}")
    if carotids.bounds[1, 1] > 1.52:
        raise SystemExit("carotid files reach the skull; that would be an internal carotid we did not mean to take")
    if not (0.55 < femorals.bounds[0, 1] < 0.7 and femorals.bounds[1, 1] > 0.85):
        raise SystemExit(f"femoral span is unexpected: {femorals.bounds}")
    if not (subclavians.bounds[1, 0] - subclavians.bounds[0, 0] > 0.12 and 1.35 < subclavians.centroid[1] < 1.48):
        raise SystemExit(f"subclavians are not under the clavicles: {subclavians.bounds}")

    OUT_GLB.parent.mkdir(parents=True, exist_ok=True)
    scene.export(OUT_GLB)
    raw = OUT_GLB.read_bytes()
    if raw[:4] != b"glTF":
        raise SystemExit("export is not a GLB")
    # JSON chunk must not reference images.
    length = int.from_bytes(raw[12:16], "little")
    js = raw[20 : 20 + length]
    if b'"images"' in js or b"image/" in js:
        raise SystemExit("vessels.glb contains an image map")
    print("wrote", OUT_GLB, "bytes", OUT_GLB.stat().st_size)

    lines = []
    for row in rows:
        x, y, z = row["position"]
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
    OUT_TS.parent.mkdir(parents=True, exist_ok=True)
    OUT_TS.write_text(
        "import type { Structure } from '../types'\n\n"
        "/** BodyParts3D 4.0 PART-OF trunks in public/atlas/vessels.glb. Untextured. Do not edit by hand. */\n"
        "export const VESSEL_MESH_PARTS = [\n"
        + ",\n".join(lines)
        + "\n] as const satisfies readonly Structure[]\n\n"
        "export const VESSEL_SLATE_IDS = ['vena-cava'] as const\n"
    )
    print("wrote", OUT_TS)

    OUT_LIC.write_text(
        "BodyParts3D vessel trunks (aorta, common carotids, venae cavae, femorals, subclavians)\n"
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
        "Only the five trunk groups listed in scripts/build-vessels-glb.py are included.\n"
        "Share-alike: this derived GLB must stay under a compatible CC BY-SA license.\n"
    )
    print("wrote", OUT_LIC)


if __name__ == "__main__":
    main()
