import { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Mesh, PlaneGeometry, Scene } from 'three'
import { useAtlas } from '@/atlas/AtlasProvider'
import { getMuscleMaterialTemplate } from '@/atlas/muscleMaterial'
import { m1Placement } from '@/atlas/musclePlacement'
import {
  M1_HOLD_FRAMES,
  M1_WAVES,
  M2_HOLD_FRAMES,
  M2_SETTLE_FRAMES,
  WAVE_IDLE_FRAMES,
} from '@/atlas/muscleReveal'
import { useRevealWaves } from './useRevealWaves'
import { MuscleFan, MuscleFusiform, MusclePart, MuscleSlab } from '../MuscleVolume'

const M2MuscleLayer = lazy(() =>
  import('./M2MuscleLayer').then((m) => ({ default: m.M2MuscleLayer })),
)

function Revealed({
  id,
  shown,
  children,
}: {
  id: string
  shown: Set<string>
  children: ReactNode
}) {
  if (!shown.has(id)) return null
  return <MusclePart id={id}>{children}</MusclePart>
}

function WarmMuscleProgram() {
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera)
  useLayoutEffect(() => {
    const geo = new PlaneGeometry(0.01, 0.01)
    const mesh = new Mesh(geo, getMuscleMaterialTemplate())
    const scene = new Scene()
    scene.add(mesh)
    try {
      gl.compile(scene, camera)
    } catch {
      /* compile is best-effort before the first wave */
    }
    geo.dispose()
    scene.clear()
  }, [camera, gl])
  return null
}

/**
 * M1 densify only on Muscle ON. M2 mounts after M1 has painted + settled
 * (auto) or after More coverage is toggled — never in the same ON tick.
 */
export function MuscleLayer() {
  const { hotSystems, m2Coverage, enableM2Coverage } = useAtlas()
  const muscleHot = hotSystems.includes('muscle')
  const { shown, complete: m1Done } = useRevealWaves(
    muscleHot,
    M1_WAVES,
    WAVE_IDLE_FRAMES,
    M1_HOLD_FRAMES,
  )
  const [m2Mount, setM2Mount] = useState(false)
  const settle = useRef(0)
  const mountHold = useRef(0)
  useEffect(() => {
    if (!m2Coverage) {
      setM2Mount(false)
      mountHold.current = 0
    }
  }, [m2Coverage])
  useFrame(() => {
    if (!muscleHot || !m1Done) return
    if (!m2Coverage) {
      settle.current += 1
      if (settle.current >= M2_SETTLE_FRAMES) enableM2Coverage()
      return
    }
    if (m2Mount) return
    mountHold.current += 1
    if (mountHold.current >= M2_HOLD_FRAMES) setM2Mount(true)
  })
  const p = useMemo(() => m1Placement(), [])

  return (
    <group>
      <WarmMuscleProgram />
      <Revealed shown={shown} id="pectoralis">
        <MuscleFan
          from={p.pecOriginUpperL}
          to={p.grooveL}
          originWidth={0.068}
          insertWidth={0.026}
          originThick={0.022}
          insertThick={0.014}
          bulge={0.016}
        />
        <MuscleFan
          from={p.pecOriginLowerL}
          to={p.grooveL}
          originWidth={0.086}
          insertWidth={0.028}
          originThick={0.02}
          insertThick={0.013}
          bulge={0.014}
        />
        <MuscleFan
          from={p.pecOriginUpperR}
          to={p.grooveR}
          originWidth={0.068}
          insertWidth={0.026}
          originThick={0.022}
          insertThick={0.014}
          bulge={0.016}
        />
        <MuscleFan
          from={p.pecOriginLowerR}
          to={p.grooveR}
          originWidth={0.086}
          insertWidth={0.028}
          originThick={0.02}
          insertThick={0.013}
          bulge={0.014}
        />
      </Revealed>

      <Revealed shown={shown} id="biceps-left">
        <MuscleFusiform from={p.coracoidL} to={p.radTubL} midRadius={0.026} endRadius={0.007} flatten={[0.88, 0.74]} />
      </Revealed>
      <Revealed shown={shown} id="biceps-right">
        <MuscleFusiform from={p.coracoidR} to={p.radTubR} midRadius={0.026} endRadius={0.007} flatten={[0.88, 0.74]} />
      </Revealed>

      <Revealed shown={shown} id="triceps-left">
        <MuscleFusiform from={p.infraglenoidL} to={p.olecL} midRadius={0.03} endRadius={0.009} flatten={[0.88, 0.82]} />
      </Revealed>
      <Revealed shown={shown} id="triceps-right">
        <MuscleFusiform from={p.infraglenoidR} to={p.olecR} midRadius={0.03} endRadius={0.009} flatten={[0.88, 0.82]} />
      </Revealed>

      <Revealed shown={shown} id="deltoids">
        <MuscleFusiform from={p.acromionL} to={p.deltoidTubL} midRadius={0.038} endRadius={0.012} flatten={[1.15, 0.95]} />
        <MuscleFusiform from={p.acromionR} to={p.deltoidTubR} midRadius={0.038} endRadius={0.012} flatten={[1.15, 0.95]} />
      </Revealed>

      <Revealed shown={shown} id="abdominal-wall">
        <MuscleSlab from={p.xiphoid} to={p.pubis} width={0.15} thick={0.028} />
      </Revealed>

      <Revealed shown={shown} id="quadriceps">
        <MuscleFusiform from={p.aiisL} to={p.patL} midRadius={0.036} endRadius={0.01} flatten={[1.05, 0.72]} />
        <MuscleFusiform from={p.vastusL} to={p.patL} midRadius={0.032} endRadius={0.01} flatten={[1.2, 0.7]} />
        <MuscleFusiform from={p.aiisR} to={p.patR} midRadius={0.036} endRadius={0.01} flatten={[1.05, 0.72]} />
        <MuscleFusiform from={p.vastusR} to={p.patR} midRadius={0.032} endRadius={0.01} flatten={[1.2, 0.7]} />
      </Revealed>

      <Revealed shown={shown} id="hamstrings">
        <MuscleFusiform from={p.ischiumL} to={p.tibPostL} midRadius={0.03} endRadius={0.009} flatten={[0.95, 0.75]} />
        <MuscleFusiform from={p.ischiumR} to={p.tibPostR} midRadius={0.03} endRadius={0.009} flatten={[0.95, 0.75]} />
      </Revealed>

      <Revealed shown={shown} id="trapezius">
        <MuscleFan
          from={p.occ}
          to={p.clavL}
          originWidth={0.05}
          insertWidth={0.04}
          originThick={0.018}
          insertThick={0.014}
          bulge={0.008}
        />
        <MuscleFan
          from={p.occ}
          to={p.clavR}
          originWidth={0.05}
          insertWidth={0.04}
          originThick={0.018}
          insertThick={0.014}
          bulge={0.008}
        />
        <MuscleFan
          from={p.c7}
          to={p.scapL}
          originWidth={0.08}
          insertWidth={0.045}
          originThick={0.02}
          insertThick={0.014}
          bulge={-0.01}
        />
        <MuscleFan
          from={p.c7}
          to={p.scapR}
          originWidth={0.08}
          insertWidth={0.045}
          originThick={0.02}
          insertThick={0.014}
          bulge={-0.01}
        />
      </Revealed>

      <Revealed shown={shown} id="latissimus">
        <MuscleFan
          from={p.latOriginL}
          to={p.grooveL}
          originWidth={0.16}
          insertWidth={0.028}
          originThick={0.022}
          insertThick={0.014}
          bulge={-0.018}
        />
        <MuscleFan
          from={p.latOriginR}
          to={p.grooveR}
          originWidth={0.16}
          insertWidth={0.028}
          originThick={0.022}
          insertThick={0.014}
          bulge={-0.018}
        />
      </Revealed>

      <Revealed shown={shown} id="gluteus">
        <MuscleFan
          from={p.iliumPostL}
          to={p.gluteTubL}
          originWidth={0.1}
          insertWidth={0.04}
          originThick={0.05}
          insertThick={0.028}
          bulge={-0.02}
        />
        <MuscleFan
          from={p.iliumPostR}
          to={p.gluteTubR}
          originWidth={0.1}
          insertWidth={0.04}
          originThick={0.05}
          insertThick={0.028}
          bulge={-0.02}
        />
      </Revealed>

      <Revealed shown={shown} id="gastrocnemius">
        <MuscleFusiform from={p.condyleMedL} to={p.achillesL} midRadius={0.024} endRadius={0.007} flatten={[0.95, 0.8]} />
        <MuscleFusiform from={p.condyleLatL} to={p.achillesL} midRadius={0.022} endRadius={0.007} flatten={[0.9, 0.78]} />
        <MuscleFusiform from={p.condyleMedR} to={p.achillesR} midRadius={0.024} endRadius={0.007} flatten={[0.95, 0.8]} />
        <MuscleFusiform from={p.condyleLatR} to={p.achillesR} midRadius={0.022} endRadius={0.007} flatten={[0.9, 0.78]} />
      </Revealed>

      <Revealed shown={shown} id="soleus">
        <MuscleFusiform from={p.soleusFromL} to={p.achillesL} midRadius={0.028} endRadius={0.008} flatten={[1.15, 0.7]} />
        <MuscleFusiform from={p.soleusFromR} to={p.achillesR} midRadius={0.028} endRadius={0.008} flatten={[1.15, 0.7]} />
      </Revealed>

      <Revealed shown={shown} id="iliopsoas">
        <MuscleFusiform from={p.psoasFromL} to={p.lesserTrL} midRadius={0.02} endRadius={0.007} flatten={[0.85, 0.75]} />
        <MuscleFusiform from={p.psoasFromR} to={p.lesserTrR} midRadius={0.02} endRadius={0.007} flatten={[0.85, 0.75]} />
      </Revealed>

      <Revealed shown={shown} id="forearm-flexors">
        <MuscleFusiform from={p.medialEpiL} to={p.flexorScaphL} midRadius={0.012} endRadius={0.004} flatten={[0.82, 0.58]} />
        <MuscleFusiform from={p.medialEpiL} to={p.flexorPisL} midRadius={0.011} endRadius={0.0038} flatten={[0.78, 0.56]} />
        <MuscleFusiform from={p.medialEpiR} to={p.flexorScaphR} midRadius={0.012} endRadius={0.004} flatten={[0.82, 0.58]} />
        <MuscleFusiform from={p.medialEpiR} to={p.flexorPisR} midRadius={0.011} endRadius={0.0038} flatten={[0.78, 0.56]} />
      </Revealed>
      {m2Mount ? (
        <Suspense fallback={null}>
          <M2MuscleLayer active={muscleHot && m2Coverage} />
        </Suspense>
      ) : null}
    </group>
  )
}
