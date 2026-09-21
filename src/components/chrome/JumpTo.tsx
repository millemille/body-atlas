import { ChevronDown } from 'lucide-react'
import { JUMP_REGIONS, type JumpRegionId } from '@/atlas/jumpTo'
import { cn } from '@/lib/utils'

export function JumpToToggle({
  open,
  onToggle,
}: {
  open: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      data-atlas-jump="toggle"
      aria-expanded={open}
      aria-controls="atlas-jump-list"
      aria-haspopup="listbox"
      onClick={onToggle}
      title="Jump the camera to a body region"
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-[13px] tracking-wide transition-all duration-200',
        open
          ? 'border border-[#3AD1C7] bg-[#3AD1C7]/10 text-ink shadow-[0_0_18px_rgb(58_209_199_/_0.18)]'
          : 'border border-transparent text-muted-ink hover:text-ink',
      )}
    >
      Jump to
      <ChevronDown className={cn('size-3.5 opacity-70 transition-transform', open && 'rotate-180')} />
    </button>
  )
}

/** In-flow list so the header grows and the Focus card is never covered. Not a dock control. */
export function JumpToList({
  activeId,
  onPick,
}: {
  activeId: JumpRegionId | null
  onPick: (id: JumpRegionId) => void
}) {
  return (
    <ul
      id="atlas-jump-list"
      data-atlas-jump-list
      role="listbox"
      className="glass-panel pointer-events-auto relative flex flex-col gap-0.5 rounded-2xl px-1.5 py-1.5"
    >
      {JUMP_REGIONS.map((region) => {
        const active = region.id === activeId
        return (
          <li key={region.id} role="none">
            <button
              type="button"
              role="option"
              aria-selected={active}
              data-atlas-jump-region={region.id}
              onClick={() => onPick(region.id)}
              className={cn(
                'w-full rounded-xl px-3.5 py-1.5 text-left text-[13px] tracking-wide transition-colors',
                active
                  ? 'bg-[#3AD1C7]/12 text-ink'
                  : 'text-muted-ink hover:bg-white/5 hover:text-ink',
              )}
            >
              {region.label}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
