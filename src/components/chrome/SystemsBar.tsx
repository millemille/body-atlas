import { useState } from 'react'
import { useAtlas } from '@/atlas/AtlasProvider'
import { SYSTEMS } from '@/atlas/systems'
import { JumpToList, JumpToToggle } from '@/components/chrome/JumpTo'
import { cn } from '@/lib/utils'

export function SystemsBar() {
  const { hotSystems, jumpRegionId, jumpTo, toggleSystem } = useAtlas()
  const [jumpOpen, setJumpOpen] = useState(false)

  return (
    <section className="pointer-events-auto flex w-full min-w-0 flex-col gap-2 md:w-fit">
      <div className="atlas-pill-row glass-panel flex flex-nowrap items-center gap-1.5 overflow-x-auto overscroll-x-contain rounded-full px-2 py-1.5 max-md:gap-1 max-md:px-1.5 md:flex-wrap md:overflow-visible">
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
                'shrink-0 rounded-full px-3.5 py-1.5 text-[13px] tracking-wide transition-all duration-200 max-md:min-h-11 max-md:px-2 max-md:text-[12px] max-md:tracking-normal',
                hot
                  ? 'border border-[#3AD1C7] bg-[#3AD1C7]/10 text-ink shadow-[0_0_18px_rgb(58_209_199_/_0.18)]'
                  : 'border border-transparent text-muted-ink hover:text-ink',
              )}
            >
              {sys.label}
            </button>
          )
        })}
        <JumpToToggle open={jumpOpen} onToggle={() => setJumpOpen((v) => !v)} />
      </div>
      {jumpOpen ? (
        <JumpToList
          activeId={jumpRegionId}
          onPick={(id) => {
            jumpTo(id)
            setJumpOpen(false)
          }}
        />
      ) : null}
    </section>
  )
}
