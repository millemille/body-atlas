import { activateFocus, runIsolate, runReset } from '@/atlas/chromeActions'
import { noteChromeInteract } from '@/atlas/pointerSession'
import { useAtlas } from '@/atlas/AtlasProvider'
import { cn } from '@/lib/utils'

function toolbarFocus() {
  activateFocus('toolbar')
}

function toolbarReset() {
  noteChromeInteract()
  runReset()
}

function toolbarIsolate() {
  noteChromeInteract()
  runIsolate()
}

export function BottomToolbar() {
  const { viewMode, isolated } = useAtlas()

  return (
    <div
      data-atlas-toolbar
      className="glass-panel flex items-stretch gap-0 rounded-full p-1"
      style={{ pointerEvents: 'auto', position: 'relative', zIndex: 50 }}
    >
      <ToolButton name="reset" active={false} onActivate={toolbarReset}>
        Reset
      </ToolButton>
      <ToolButton name="focus" active={viewMode === 'focus'} onActivate={toolbarFocus}>
        Focus
      </ToolButton>
      <ToolButton name="isolate" active={isolated} onActivate={toolbarIsolate}>
        Isolate
      </ToolButton>
    </div>
  )
}

function ToolButton({
  name,
  children,
  onActivate,
  active,
}: {
  name: 'reset' | 'focus' | 'isolate'
  children: string
  onActivate: () => void
  active?: boolean
}) {
  return (
    <button
      type="button"
      data-atlas-tool={name}
      aria-pressed={active}
      tabIndex={0}
      style={{ pointerEvents: 'auto', minWidth: 108, minHeight: 48 }}
      onClick={onActivate}
      onKeyDown={(e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return
        e.preventDefault()
        onActivate()
      }}
      className={cn(
        'rounded-full px-5 text-[14px] tracking-wide outline-none',
        'focus-visible:ring-2 focus-visible:ring-[#3AD1C7]',
        active
          ? 'bg-[#3AD1C7]/18 text-[#3AD1C7] shadow-[inset_0_0_0_1px_#3AD1C7]'
          : 'text-ink/90',
      )}
    >
      {children}
    </button>
  )
}
