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
      className="glass-panel flex w-full max-w-md items-stretch gap-0 rounded-full p-1 md:w-auto md:max-w-none"
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
      style={{ pointerEvents: 'auto' }}
      onClick={onActivate}
      onKeyDown={(e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return
        e.preventDefault()
        onActivate()
      }}
      className={cn(
        'min-h-12 min-w-0 flex-1 rounded-full px-3 text-[14px] tracking-wide outline-none md:min-w-[108px] md:flex-none md:px-5',
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
