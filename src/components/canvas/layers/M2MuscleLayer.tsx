import { useMemo, type ReactNode } from 'react'
import { m2Placement } from '@/atlas/musclePlacement'
import { M2_HOLD_FRAMES, M2_IDLE_FRAMES, M2_WAVES } from '@/atlas/muscleReveal'
import { MuscleFan, MuscleFusiform, MusclePart } from '../MuscleVolume'
import { useRevealWaves } from './useRevealWaves'

function Revealed({
  id,
  shown,
  render,
}: {
  id: string
  shown: Set<string>
  render: () => ReactNode
}) {
  if (!shown.has(id)) return null
  return <MusclePart id={id}>{render()}</MusclePart>
}

/**
 * M2 majors. Must not mount until chrome “More coverage (M2)” is on and M1
 * has painted + settled. Muscle ON never imports this chunk.
 */
export function M2MuscleLayer({ active }: { active: boolean }) {
  const { shown } = useRevealWaves(active, M2_WAVES, M2_IDLE_FRAMES, M2_HOLD_FRAMES)
  const p = useMemo(() => m2Placement(), [])

  return (
    <group>
      <Revealed
        shown={shown}
        id="rotator-cuff"
        render={() => (
          <>
            <MuscleFusiform from={p.supraL} to={p.gtL} midRadius={0.016} endRadius={0.005} flatten={[1.4, 0.5]} radial={6} stacks={8} />
            <MuscleFan
              from={p.infraL}
              to={p.gtL}
              originWidth={0.064}
              insertWidth={0.018}
              originThick={0.018}
              insertThick={0.01}
              bulge={-0.008}
            />
            <MuscleFusiform from={p.teresL} to={p.gtL} midRadius={0.012} endRadius={0.0044} flatten={[1.22, 0.52]} radial={6} stacks={8} />
            <MuscleFusiform from={p.subscapL} to={p.ltL} midRadius={0.016} endRadius={0.005} flatten={[1.18, 0.54]} radial={6} stacks={8} />
            <MuscleFusiform from={p.supraR} to={p.gtR} midRadius={0.016} endRadius={0.005} flatten={[1.4, 0.5]} radial={6} stacks={8} />
            <MuscleFan
              from={p.infraR}
              to={p.gtR}
              originWidth={0.064}
              insertWidth={0.018}
              originThick={0.018}
              insertThick={0.01}
              bulge={-0.008}
            />
            <MuscleFusiform from={p.teresR} to={p.gtR} midRadius={0.012} endRadius={0.0044} flatten={[1.22, 0.52]} radial={6} stacks={8} />
            <MuscleFusiform from={p.subscapR} to={p.ltR} midRadius={0.016} endRadius={0.005} flatten={[1.18, 0.54]} radial={6} stacks={8} />
          </>
        )}
      />
      <Revealed
        shown={shown}
        id="erector-spinae"
        render={() => (
          <>
            <MuscleFusiform from={p.erectFromL} to={p.erectMidL} midRadius={0.009} endRadius={0.0036} flatten={[0.62, 0.92]} radial={6} stacks={8} />
            <MuscleFusiform from={p.erectMidL} to={p.erectToL} midRadius={0.008} endRadius={0.0034} flatten={[0.6, 0.9]} radial={6} stacks={8} />
            <MuscleFusiform from={p.erectFromR} to={p.erectMidR} midRadius={0.009} endRadius={0.0036} flatten={[0.62, 0.92]} radial={6} stacks={8} />
            <MuscleFusiform from={p.erectMidR} to={p.erectToR} midRadius={0.008} endRadius={0.0034} flatten={[0.6, 0.9]} radial={6} stacks={8} />
          </>
        )}
      />
      <Revealed
        shown={shown}
        id="hip-adductors"
        render={() => (
          <>
            <MuscleFusiform from={p.adductorFromL} to={p.adductorToL} midRadius={0.024} endRadius={0.007} flatten={[0.78, 0.72]} radial={6} stacks={8} />
            <MuscleFusiform from={p.adductorLongFromL} to={p.adductorLongToL} midRadius={0.02} endRadius={0.006} flatten={[0.72, 0.68]} radial={6} stacks={8} />
            <MuscleFusiform from={p.adductorMagFromL} to={p.adductorMagToL} midRadius={0.022} endRadius={0.0064} flatten={[0.74, 0.7]} radial={6} stacks={8} />
            <MuscleFusiform from={p.adductorFromR} to={p.adductorToR} midRadius={0.024} endRadius={0.007} flatten={[0.78, 0.72]} radial={6} stacks={8} />
            <MuscleFusiform from={p.adductorLongFromR} to={p.adductorLongToR} midRadius={0.02} endRadius={0.006} flatten={[0.72, 0.68]} radial={6} stacks={8} />
            <MuscleFusiform from={p.adductorMagFromR} to={p.adductorMagToR} midRadius={0.022} endRadius={0.0064} flatten={[0.74, 0.7]} radial={6} stacks={8} />
          </>
        )}
      />
      <Revealed
        shown={shown}
        id="tibialis-anterior"
        render={() => (
          <>
            <MuscleFusiform from={p.taFromL} to={p.taToL} midRadius={0.008} endRadius={0.0028} flatten={[0.76, 0.58]} radial={6} stacks={8} />
            <MuscleFusiform from={p.taFromR} to={p.taToR} midRadius={0.008} endRadius={0.0028} flatten={[0.76, 0.58]} radial={6} stacks={8} />
          </>
        )}
      />
      <Revealed
        shown={shown}
        id="forearm-extensors"
        render={() => (
          <>
            <MuscleFusiform from={p.latEpiL} to={p.dorsalWristL} midRadius={0.01} endRadius={0.0032} flatten={[0.78, 0.56]} radial={6} stacks={8} />
            <MuscleFusiform from={p.latEpiL} to={p.dorsalMcL} midRadius={0.008} endRadius={0.0028} flatten={[0.74, 0.54]} radial={6} stacks={8} />
            <MuscleFusiform from={p.latEpiR} to={p.dorsalWristR} midRadius={0.01} endRadius={0.0032} flatten={[0.78, 0.56]} radial={6} stacks={8} />
            <MuscleFusiform from={p.latEpiR} to={p.dorsalMcR} midRadius={0.008} endRadius={0.0028} flatten={[0.74, 0.54]} radial={6} stacks={8} />
          </>
        )}
      />
    </group>
  )
}
