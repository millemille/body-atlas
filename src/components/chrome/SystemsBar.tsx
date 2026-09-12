import { useAtlas } from '@/atlas/AtlasProvider'
import { SYSTEMS } from '@/atlas/systems'
import { cn } from '@/lib/utils'

export function SystemsBar() {
  const { hotSystems, m2Coverage, toggleSystem, toggleM2Coverage } = useAtlas()
  const muscleHot = hotSystems.includes('muscle')

  return (
    <section className="pointer-events-auto flex flex-col gap-2">
      <div className="glass-panel flex flex-wrap items-center gap-1.5 rounded-full px-2 py-1.5">
        {SYSTEMS.map((sys) => {
          const hot = hotSystems.includes(sys.id)
          return (
            <button
              key={sys.id}
              type="button"
              data-atlas-system={sys.id}
              onClick={() => toggleSystem(sys.id)}
              aria-pressed={hot}
              title={sys.hint}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-[13px] tracking-wide transition-all duration-200',
                hot
                  ? 'border border-[#3AD1C7] bg-[#3AD1C7]/10 text-ink shadow-[0_0_18px_rgb(58_209_199_/_0.18)]'
                  : 'border border-transparent text-muted-ink hover:text-ink',
              )}
            >
              {sys.label}
            </button>
          )
        })}
      </div>
      {muscleHot ? (
        <div className="glass-panel flex flex-wrap items-center gap-1.5 rounded-full px-2 py-1.5">
          <button
            type="button"
            data-atlas-m2
            onClick={() => toggleM2Coverage()}
            aria-pressed={m2Coverage}
            title="Mount cuff, erectors, adductors, tibialis, and forearm extensors. Also turns on by itself after Muscle gels settle."
            className={cn(
              'rounded-full px-3.5 py-1.5 text-[13px] tracking-wide transition-all duration-200',
              m2Coverage
                ? 'border border-[#3AD1C7] bg-[#3AD1C7]/10 text-ink shadow-[0_0_18px_rgb(58_209_199_/_0.18)]'
                : 'border border-transparent text-muted-ink hover:text-ink',
            )}
          >
            More coverage (M2)
          </button>
        </div>
      ) : null}
    </section>
  )
}
