# Body Atlas

Illustrative 3D tissue explorer mockup. Not scan data, not clinical.

Jessica v0.1 chrome. Sabrina materials. Max **two** hot systems; non-hot layers are hard-off. Opens on **Skeleton** so the BodyParts3D mesh kit is the first silhouette.

**Skeleton** is a segmented BodyParts3D mesh kit (197 named bones — vertebrae, ribs, carpals, phalanges, and the rest). Warm porcelain (`#D4C8B0`) under a cool key and opposite ivory rim.  
**Muscle** is procedural densify: sixteen Iron-stable rose `MeshStandard` volumes on Muscle ON (pecs first, then the rest of the M1 kit). Opacity 0.5 satin gel so volumes read at home while ivory still shows through. Muscle ON waits for the skeleton GLB to be ready, then waits **800 ms** and mounts **only M1**, one wave every 12 frames. **More coverage (M2)** (cuff, erectors, adductors, tibialis, forearm extensors) is a chrome toggle, default **off**, and also auto-enables only after M1 has painted + a long settle (~4 s) so the first belly click is M1-only. When M2 loads, those five groups appear at the top of the Structures muscle list and open cards on first click. From a back view, scapula / deep-back hits win over pectoralis. Densify refine v2 sits volumes on BodyParts3D centroids (flexors to carpals, TA to medial midfoot, adductors to mid-femur, erectors along the column). Cuff and adductor bellies are sized to occupy those compartments. A canvas click in the **lateral** cuff region names Rotator cuff over deltoid / biceps on front/side views; sternum / front chest stays Pectoralis. A full-back scapula-area click names Scapula over T-spine, lats, and nearby ribs; side / wrap lateral-shoulder clicks stay Rotator cuff and must not flip to Deltoids, Scapula, T5, or proximal humerus. Adductors keep the medial-thigh named hit over quads / hams. Canvas DPR is locked at **1** (no 1.5→1 realloc on Muscle ON). No MSAA. `powerPreference` is default, not high-performance. Gels unmount when Muscle turns off. One FrontSide program, cloned per group — no DoubleSide / roughnessMap. Not segmented BodyParts3D.  
**Nerve / vessel / other** stay interim glyphs (teal filaments, glass vessels, organ masses).

Attribution: BodyParts3D (DBCLS) via Z-Anatomy, **CC BY-SA** (attribute + share-alike) — not CC0. See `public/atlas/LICENSE-BodyParts3D.txt`. The dock footer repeats this credit.

## Run

```bash
npm install
npm run dev
```

Dev server: `http://127.0.0.1:47321`.

```bash
npm run build
npm run preview
```

No backend or secrets.

## Use

- **Pills** — Skeleton / Muscle / Nerve / Vessel / Other. Max 2 hot. Turning Skeleton off then on remounts the bone meshes from a cached GLB (materials snap back to visible + pickable — the canvas must not stay a blank void). After Muscle is hot, **More coverage (M2)** appears under the pills (default off) and also turns on after M1 gels settle (not in the same ON tick). Turning Muscle off unmounts gels and resets M2 coverage.
- **Canvas** — drag to orbit, right-drag to pan, scroll to zoom. The look-at point can travel to the feet, hands, and skull — it does not snap back to the chest. Click a part to select (drag does not pick). With skeleton and muscle both on, a click through thin rose gel onto bone selects the bone; a click on a muscle bulge selects the muscle. From a back view, pectoralis / cuff / deltoid / abdominal gel does not raycast, so a scapula or deep-back click is not stolen to the chest or shoulder.
- **Structures** — collapsed by default; search + list of hot systems, grouped by region for the bone kit.
- **Hover** — half the teal select treatment on the leaf mesh only. No card, no scale.
- **Select** — click (not drag) a part. Bones scale ≤1.08, tint **teal `#3AD1C7`**, and get a soft additive halo. Muscle select is an albedo teal mix only (no emissive, no additive BackSide rim). The camera eases a short lean-in (not Focus). Back-of-body picks (scapula, traps, lats) from a front camera yaw toward the posterior hemisphere so the lean approaches the back, not the sternum; front picks still dolly in from the front; limbs do not flip. Muscle lean waits a few frames so first belly pick is paint + card. Bone select still rest-dims the rest of the kit (−40% opacity, mild desat, still writes depth). Muscle select does **not** rest-dim 197 bones — that transparent flip on top of gel overdraw died the tab on mauve. Card opens on first click.
- **Card** — opens on the first select click (no deferred fade). Pinned in the left chrome (not hover). Stays up through Focus and Esc-from-Focus. Title, CLASS · REGION, then System / Region / Function / Articulates (or Relations). Skeleton copy comes from `src/atlas/boneCopy.ts`. Muscle copy comes from `src/atlas/muscleCopy.ts`. Nerve / vessel / other stay glyph placeholders. Disclaimer is a footnote. **Focus** only on the card. Isolate is toolbar-only. Muscle Focus uses a 0.72 m catalog dolly (gentler than the 0.18 m heel fill). Canvas `onPointerMissed` does not clear a pick from the same gesture.
- **Reset · Focus · Isolate** — Reset homes orbit (position, target, distance), clears the selection, and exits Focus/Isolate. Isolate hides every non-selected mesh. Esc exits Focus and keeps the selection; Esc again clears it. Toolbar Focus and card Focus use the same activation path (click or Tab+Enter).
- **QA** — card Focus uses the same `onClick` path as dock Focus. A window capture listener also fires the card button by hit-test so a canvas pointer-capture cannot swallow the OS click. Add `?debug=1` (or run `npm run dev`) for the pointer HUD, red dock outline, and optional FIRED toasts. Production UI has no Focus debug banner.
- **Load** — a percent bar tracks the skeleton GLB; it never covers the canvas.

Void is `#0B0D10`. Skeleton and muscle card copy is brief atlas text, not a diagnosis. Nerve / vessel / other copy is still placeholder.

## Stack

Vite · TypeScript · React · React Three Fiber · Three.js · Tailwind · shadcn/ui
