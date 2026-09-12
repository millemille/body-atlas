import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { markCaptureMounted } from './atlas/atlasDebug'
import { runTool } from './atlas/chromeActions'
import { syncAtlasDebugFlag } from './atlas/debugMode'
import { installPointerGuards } from './atlas/pointerSession'
import './index.css'
import App from './App.tsx'

const w = window as Window & {
  __atlasRunTool?: (name: string) => void
  __atlasToolQueue?: string[]
  __atlasCaptureMounted?: boolean
  __atlasPaintHud?: () => void
}

syncAtlasDebugFlag()
w.__atlasCaptureMounted = true
w.__atlasRunTool = runTool
markCaptureMounted()
installPointerGuards()
w.__atlasPaintHud?.()
w.__atlasToolQueue?.splice(0).forEach((name) => runTool(name))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
