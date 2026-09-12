import { useAtlas } from '@/atlas/AtlasProvider'
import { activateFocus } from '@/atlas/chromeActions'
import { SYSTEMS } from '@/atlas/systems'
import { cn } from '@/lib/utils'
import type { Structure } from '@/atlas/types'

function cardFocus() {
  activateFocus('card')
}

const FOOTNOTE =
  'Illustrative mockup only — not a scan, not a clinical map. Skeleton and muscle meshes: BodyParts3D (DBCLS) / Z-Anatomy, CC BY-SA (attribute + share-alike). Nerve / vessel / other stay glyphs.'

function fieldRows(part: Structure): { label: string; value: string }[] {
  const system = SYSTEMS.find((s) => s.id === part.system)?.label ?? part.system
  const relateLabel =
    part.system === 'skeleton' || part.system === 'muscle' ? 'Articulates' : 'Relations'
  const relate = [
    part.relation,
    part.origin ? `Origin ${part.origin}` : null,
    part.insertion ? `Insertion ${part.insertion}` : null,
    part.innervation ? `Innervation ${part.innervation}` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return [
    { label: 'System', value: system },
    { label: 'Region', value: part.region },
    { label: 'Function', value: part.function },
    { label: relateLabel, value: relate },
  ]
}

export function SelectionCard({
  className,
  mobile = false,
}: {
  className?: string
  mobile?: boolean
}) {
  const { selected, viewMode, select } = useAtlas()
  if (!selected) return null

  return (
    <article
      data-atlas-chrome
      data-atlas-selection-card
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
      className={cn(
        'glass-card relative z-20 w-[296px] max-w-[320px] origin-top-left select-none rounded-xl px-5 py-4 [&_*]:select-none',
        'transition-[opacity,transform] duration-200 ease-out scale-100 opacity-100',
        mobile && 'mx-4 mb-1 w-auto max-w-lg origin-bottom',
        className,
      )}
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        pointerEvents: 'auto',
      }}
    >
      <div
        className={cn(
          mobile ? 'max-h-[42vh] overflow-y-auto pr-1' : 'max-h-[min(56vh,26rem)] overflow-y-auto pr-1',
        )}
      >
        <h2 className="font-display text-[1.55rem] leading-none tracking-tight text-ink">
          {selected.name}
        </h2>
        <p className="mt-1.5 text-[11px] tracking-[0.08em] text-muted-ink uppercase">
          {selected.kind} · {selected.region}
        </p>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[12px] leading-snug">
          {fieldRows(selected).map((row) => (
            <div key={row.label} className="contents">
              <dt className="pt-px text-[10px] tracking-[0.12em] text-muted-ink uppercase">
                {row.label}
              </dt>
              <dd className="text-ink/85">{row.value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-[13px] leading-relaxed text-ink/80">{selected.blurb}</p>
        <p className="mt-3 text-[10px] leading-relaxed text-muted-ink/75">{FOOTNOTE}</p>
      </div>
      <footer className="relative z-30 mt-3 flex flex-wrap items-center gap-2" style={{ pointerEvents: 'auto' }}>
        <button
          type="button"
          data-atlas-focus="card"
          aria-pressed={viewMode === 'focus'}
          tabIndex={0}
          onClick={cardFocus}
          onPointerUp={(e) => {
            if (e.button !== 0) return
            cardFocus()
          }}
          onKeyDown={(e) => {
            if (e.key !== 'Enter' && e.key !== ' ') return
            e.preventDefault()
            cardFocus()
          }}
          className={cn(
            'rounded-lg px-4 py-2 text-[13px] tracking-wide',
            viewMode === 'focus'
              ? 'bg-[#3AD1C7] text-[#0B0D10]'
              : 'border border-ink/30 text-ink hover:bg-white/5',
          )}
          style={{ pointerEvents: 'auto', minWidth: 96, minHeight: 40 }}
        >
          Focus
        </button>
        <button
          type="button"
          data-atlas-close="card"
          tabIndex={0}
          onClick={() => select(null)}
          className="rounded-lg border border-[#3AD1C7]/50 px-4 py-2 text-[13px] tracking-wide text-[#3AD1C7] hover:bg-[#3AD1C7]/10"
          style={{ pointerEvents: 'auto', minWidth: 96, minHeight: 40 }}
        >
          Close
        </button>
      </footer>
    </article>
  )
}
