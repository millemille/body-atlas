import { useEffect } from 'react'
import { AtlasProvider, useAtlas } from '@/atlas/AtlasProvider'
import { bindChromeActions } from '@/atlas/chromeActions'
import { noteChromeInteract } from '@/atlas/pointerSession'
import { BodyScene } from '@/components/canvas/BodyScene'
import { isAtlasDebug } from '@/atlas/debugMode'
import { AtlasHud } from '@/components/chrome/AtlasHud'
import { FocusFiredBanner } from '@/components/chrome/AtlasToast'
import { BottomToolbar } from '@/components/chrome/BottomToolbar'
import { GestureHint } from '@/components/chrome/GestureHint'
import { MeshCredit } from '@/components/chrome/MeshCredit'
import { ScenePoster } from '@/components/chrome/ScenePoster'
import { KeyboardShortcuts } from '@/components/chrome/KeyboardShortcuts'
import { SelectionCard } from '@/components/chrome/SelectionCard'
import { MobileStructures, StructuresRail } from '@/components/chrome/StructuresRail'
import { SystemsBar } from '@/components/chrome/SystemsBar'
import { TooltipProvider } from '@/components/ui/tooltip'

function ChromeActionBinder() {
  const { requestFocus, resetView, toggleIsolate } = useAtlas()
  useEffect(
    () => bindChromeActions({ focus: requestFocus, reset: resetView, isolate: toggleIsolate }),
    [requestFocus, resetView, toggleIsolate],
  )
  return null
}

function Shell() {
  return (
    <div className="flex h-svh w-full flex-col overflow-hidden bg-void text-ink select-none">
      <ChromeActionBinder />
      {isAtlasDebug() ? <AtlasHud /> : null}
      <KeyboardShortcuts />

      <div className="relative min-h-0 flex-1">
        <div data-atlas-canvas-host className="absolute inset-0 z-0 overflow-hidden bg-void">
          <BodyScene />
        </div>
        <ScenePoster />

        <div
          data-atlas-chrome
          onPointerDownCapture={noteChromeInteract}
          className="pointer-events-none absolute inset-0 z-10 flex flex-col"
        >
          {isAtlasDebug() ? <FocusFiredBanner /> : null}
          <header className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 p-4 max-md:pt-[max(1rem,env(safe-area-inset-top))] md:flex md:flex-col md:items-start md:gap-3 md:p-5">
            <div className="pointer-events-none min-w-0 px-1">
              <p className="font-display text-[1.35rem] leading-none tracking-tight text-ink md:text-[1.6rem]">
                Body Atlas
              </p>
              <p className="mt-1 text-[10px] tracking-[0.18em] text-muted-ink uppercase">
                Illustrative mockup
              </p>
            </div>
            <MobileStructures />
            <div className="col-span-2 min-w-0 md:w-fit">
              <SystemsBar />
            </div>
          </header>

          <div className="flex min-h-0 flex-1 items-start justify-between gap-3 px-4 pb-2 md:px-5">
            <div className="pointer-events-auto relative z-30 hidden h-full min-h-0 flex-col md:flex">
              <SelectionCard />
            </div>
            <StructuresRail />
          </div>
          <div className="pointer-events-auto relative z-30 mt-auto max-h-[34%] min-h-0 overflow-hidden md:hidden">
            <SelectionCard mobile />
          </div>
        </div>
      </div>

      <div
        data-atlas-dock
        className="relative z-50 flex w-full shrink-0 flex-col items-center justify-center gap-2 px-4 py-5 pb-7 min-h-[120px] max-md:min-h-0 max-md:gap-1 max-md:px-3 max-md:py-2 max-md:pb-[max(0.75rem,env(safe-area-inset-bottom))] max-md:landscape:min-h-[72px] max-md:landscape:gap-1 max-md:landscape:py-2 max-md:landscape:pb-3"
        style={{ pointerEvents: 'auto' }}
      >
        <BottomToolbar />
        <GestureHint />
        <MeshCredit />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <TooltipProvider>
      <AtlasProvider>
        <Shell />
      </AtlasProvider>
    </TooltipProvider>
  )
}
