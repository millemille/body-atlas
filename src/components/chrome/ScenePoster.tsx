import { useAtlas } from '@/atlas/AtlasProvider'

/** Honest load status. Never covers the canvas. Never a stick-figure stand-in. */
export function ScenePoster() {
  const { skeletonLoad } = useAtlas()
  const { phase, loaded, total, error } = skeletonLoad

  if (phase === 'ready') return null

  const pct = total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 0
  const label =
    phase === 'error'
      ? error ?? 'Skeleton failed to load'
      : phase === 'parse'
        ? 'Preparing 197 bone meshes'
        : `Loading BodyParts3D skeleton ${pct}%`

  return (
    <div
      data-atlas-skeleton={phase}
      className="pointer-events-none absolute inset-x-0 bottom-6 z-[5] flex flex-col items-center gap-1"
      role="status"
    >
      <p className="text-[11px] tracking-[0.16em] text-muted-ink uppercase">{label}</p>
      {phase === 'error' ? (
        <p className="text-[11px] text-muted-ink">Refresh to retry · file is /atlas/skeleton.glb</p>
      ) : (
        <div className="h-px w-40 overflow-hidden bg-white/10">
          <div className="h-full bg-[#3AD1C7]" style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  )
}
