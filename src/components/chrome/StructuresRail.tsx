import { ChevronRight, Search } from 'lucide-react'
import { useState } from 'react'
import { useAtlas } from '@/atlas/AtlasProvider'
import { isM2MuscleId } from '@/atlas/muscleReveal'
import { SYSTEMS } from '@/atlas/systems'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import type { Structure } from '@/atlas/types'

export function StructuresRail() {
  const { railOpen, setRailOpen } = useAtlas()

  return (
    <aside
      className={cn(
        'glass-panel pointer-events-auto hidden h-full flex-col overflow-hidden rounded-2xl transition-[width] duration-200 md:flex',
        railOpen ? 'w-[240px]' : 'w-11',
      )}
    >
      {railOpen ? (
        <RailBody onCollapse={() => setRailOpen(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setRailOpen(true)}
          className="flex h-full flex-col items-center gap-3 px-2 py-4 text-muted-ink hover:text-ink"
          aria-label="Open structures rail"
        >
          <ChevronRight className="size-4 rotate-180" />
          <span
            className="text-[10px] tracking-[0.22em] text-[#3AD1C7]/80 uppercase"
            style={{ writingMode: 'vertical-rl' }}
          >
            Structures
          </span>
        </button>
      )}
    </aside>
  )
}

export function MobileStructures() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="glass-panel pointer-events-auto rounded-full px-3 py-1.5 text-[11px] tracking-[0.16em] text-[#3AD1C7] uppercase md:hidden"
      >
        Structures
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="border-l border-[#3AD1C7]/25 bg-[#0B0D10]/90 text-ink backdrop-blur-xl md:hidden"
        >
          <SheetHeader>
            <SheetTitle className="font-display text-ink">Structures</SheetTitle>
          </SheetHeader>
          <div className="min-h-0 flex-1 px-2 pb-4">
            <RailBody />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

function groupByRegion(items: Structure[]): [string, Structure[]][] {
  const order: string[] = []
  const map = new Map<string, Structure[]>()
  for (const item of items) {
    const key = item.region
    if (!map.has(key)) {
      map.set(key, [])
      order.push(key)
    }
    map.get(key)!.push(item)
  }
  return order.map((key) => [key, map.get(key)!])
}

function RailBody({ onCollapse }: { onCollapse?: () => void }) {
  const { query, setQuery, visibleStructures, selectedId, select, hotSystems } =
    useAtlas()

  const grouped = SYSTEMS.filter((s) => hotSystems.includes(s.id)).map((sys) => ({
    sys,
    items: visibleStructures.filter((p) => p.system === sys.id),
  }))

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center justify-between px-4 pt-4 pb-2">
        <p className="text-[10px] tracking-[0.22em] text-[#3AD1C7]/80 uppercase">
          Structures
        </p>
        {onCollapse ? (
          <button
            type="button"
            onClick={onCollapse}
            className="text-muted-ink hover:text-ink"
            aria-label="Collapse structures rail"
          >
            <ChevronRight className="size-4" />
          </button>
        ) : null}
      </header>
      <div className="relative px-3 pb-3">
        <Search className="pointer-events-none absolute top-2.5 left-5 size-3.5 text-muted-ink" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search parts"
          className="h-8 border-white/10 bg-black/30 pl-8 text-[13px] text-ink placeholder:text-muted-ink"
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-3">
        {visibleStructures.length === 0 ? (
          <p className="px-3 py-8 text-center text-[13px] text-muted-ink">
            {query
              ? `No matches in the hot systems for “${query}”.`
              : 'Turn on a system to list parts.'}
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {grouped.map(({ sys, items }) =>
              items.length === 0 ? null : (
                <li key={sys.id}>
                  <p className="px-2 pb-1 text-[10px] tracking-[0.16em] text-muted-ink uppercase">
                    {sys.label}
                  </p>
                  <ul className="flex flex-col gap-0.5">
                    {sys.id === 'muscle' ? (
                      <MuscleRailItems
                        items={items}
                        query={query}
                        selectedId={selectedId}
                        onSelect={select}
                      />
                    ) : (
                      <RegionRows
                        items={items}
                        showRegions={sys.id === 'skeleton' && !query.trim()}
                        selectedId={selectedId}
                        onSelect={select}
                      />
                    )}
                  </ul>
                </li>
              ),
            )}
          </ul>
        )}
      </div>
    </div>
  )
}

function RegionRows({
  items,
  showRegions,
  selectedId,
  onSelect,
}: {
  items: Structure[]
  showRegions: boolean
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  return (
    <>
      {groupByRegion(items).map(([region, rows]) => (
        <li key={region}>
          {showRegions ? (
            <p className="px-2 pt-2 pb-0.5 text-[10px] tracking-[0.14em] text-muted-ink/80">
              {region}
            </p>
          ) : null}
          <ul className="flex flex-col gap-0.5">
            {rows.map((item) => (
              <StructureRow
                key={item.id}
                item={item}
                active={item.id === selectedId}
                onSelect={() => onSelect(item.id)}
              />
            ))}
          </ul>
        </li>
      ))}
    </>
  )
}

function MuscleRailItems({
  items,
  query,
  selectedId,
  onSelect,
}: {
  items: Structure[]
  query: string
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const extra = items.filter((p) => isM2MuscleId(p.id))
  const core = items.filter((p) => !isM2MuscleId(p.id))
  const showRegions = !query.trim()
  return (
    <>
      {extra.length > 0 ? (
        <li>
          <p className="px-2 pt-2 pb-0.5 text-[10px] tracking-[0.14em] text-[#3AD1C7]/80">
            More coverage
          </p>
          <ul className="flex flex-col gap-0.5">
            <RegionRows
              items={extra}
              showRegions={showRegions}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          </ul>
        </li>
      ) : null}
      <RegionRows
        items={core}
        showRegions={showRegions}
        selectedId={selectedId}
        onSelect={onSelect}
      />
    </>
  )
}

function StructureRow({
  item,
  active,
  onSelect,
}: {
  item: Structure
  active: boolean
  onSelect: () => void
}) {
  return (
    <li>
      <button
        type="button"
        data-atlas-structure={item.id}
        onClick={onSelect}
        className={cn(
          'w-full rounded-lg px-2.5 py-2 text-left transition-colors duration-200',
          active
            ? 'bg-[#3AD1C7]/12 text-ink shadow-[inset_0_0_0_1px_rgb(58_209_199_/_0.5)]'
            : 'text-ink/85 hover:bg-white/5',
        )}
      >
        <span className="block text-[13px]">{item.name}</span>
        <span className="block text-[11px] text-muted-ink">{item.kind}</span>
      </button>
    </li>
  )
}
