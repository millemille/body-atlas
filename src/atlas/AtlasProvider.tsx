import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { toggleHotSystems } from './hotSystems'
import { JUMP_BY_ID, type JumpRegionId } from './jumpTo'
import { filterStructuresForM2Coverage } from './muscleReveal'
import { dropSelectionIfCold, dropSelectionIfCoverageOff } from './pickable'
import { noteAtlasPick, restoreStagePicks } from './pointerSession'
import {
  INITIAL_SKELETON_LOAD,
  type SkeletonLoadState,
} from './skeletonLoad'
import { getStructure, structuresForSystems } from './structures'
import type { Structure, SystemId, ViewMode } from './types'

type AtlasContextValue = {
  hotSystems: SystemId[]
  m2Coverage: boolean
  selectedId: string | null
  query: string
  viewMode: ViewMode
  isolated: boolean
  railOpen: boolean
  viewEpoch: number
  focusNonce: number
  jumpRegionId: JumpRegionId | null
  selected: Structure | null
  visibleStructures: Structure[]
  toggleSystem: (id: SystemId) => void
  toggleM2Coverage: () => void
  enableM2Coverage: () => void
  select: (id: string | null) => void
  jumpTo: (id: JumpRegionId) => void
  setQuery: (q: string) => void
  enterFocus: () => void
  exitFocus: () => void
  toggleFocus: () => void
  requestFocus: () => void
  toggleIsolate: () => void
  resetView: () => void
  setRailOpen: (open: boolean) => void
  sceneReady: boolean
  markSceneReady: () => void
  skeletonLoad: SkeletonLoadState
  reportSkeletonLoad: (next: SkeletonLoadState) => void
}

const AtlasContext = createContext<AtlasContextValue | null>(null)

export function AtlasProvider({ children }: { children: ReactNode }) {
  const [hotSystems, setHotSystems] = useState<SystemId[]>(['skeleton'])
  const [m2Coverage, setM2Coverage] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('default')
  const [isolated, setIsolated] = useState(false)
  const [railOpen, setRailOpen] = useState(false)
  const [viewEpoch, setViewEpoch] = useState(0)
  const [focusNonce, setFocusNonce] = useState(0)
  const [jumpRegionId, setJumpRegionId] = useState<JumpRegionId | null>(null)
  const [sceneReady, setSceneReady] = useState(false)
  const [skeletonLoad, setSkeletonLoad] = useState<SkeletonLoadState>(INITIAL_SKELETON_LOAD)

  const selected = getStructure(selectedId)

  const visibleStructures = useMemo(() => {
    const list = filterStructuresForM2Coverage(structuresForSystems(hotSystems), m2Coverage)
    const q = query.trim().toLowerCase()
    if (!q) return list
    return list.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.kind.toLowerCase().includes(q) ||
        s.region.toLowerCase().includes(q) ||
        s.function.toLowerCase().includes(q) ||
        s.id.includes(q),
    )
  }, [hotSystems, m2Coverage, query])

  const toggleSystem = useCallback((id: SystemId) => {
    setHotSystems((cur) => {
      const next = toggleHotSystems(cur, id)
      if (id === 'muscle' && !next.includes('muscle')) {
        setM2Coverage(false)
      }
      setSelectedId((sel) => {
        const kept = dropSelectionIfCoverageOff(
          next.includes('muscle') && m2Coverage,
          dropSelectionIfCold(next, sel),
        )
        if (sel && !kept) {
          // Orphan Isolate / leftover Focus: selection died with the system.
          // Do not bump viewEpoch — that snaps the camera home and used to
          // look like a remount. Bones stay mounted; visibility snaps back.
          setIsolated(false)
          setViewMode('default')
          setJumpRegionId(null)
        }
        return kept
      })
      return next
    })
    restoreStagePicks()
  }, [m2Coverage])

  const toggleM2Coverage = useCallback(() => {
    setM2Coverage((cur) => {
      const next = !cur
      if (!next) {
        setSelectedId((sel) => {
          const kept = dropSelectionIfCoverageOff(false, sel)
          if (sel && !kept) {
            setIsolated(false)
            setViewMode('default')
            setJumpRegionId(null)
          }
          return kept
        })
      }
      return next
    })
    restoreStagePicks()
  }, [])

  const enableM2Coverage = useCallback(() => {
    setM2Coverage(true)
  }, [])

  const select = useCallback((id: string | null) => {
    if (id) noteAtlasPick()
    setJumpRegionId(null)
    setSelectedId(id)
    if (!id) {
      setViewMode('default')
      setIsolated(false)
    }
  }, [])

  const jumpTo = useCallback((id: JumpRegionId) => {
    const region = JUMP_BY_ID[id]
    if (!region) return
    noteAtlasPick()
    setHotSystems((cur) => {
      if (cur.includes('skeleton')) return cur
      if (cur.length < 2) return [...cur, 'skeleton']
      return ['skeleton', cur[cur.length - 1]]
    })
    setJumpRegionId(id)
    setSelectedId(region.leafId)
    setIsolated(false)
    setViewMode('focus')
    setRailOpen(false)
    setFocusNonce((n) => n + 1)
  }, [])

  const enterFocus = useCallback(() => {
    setJumpRegionId(null)
    setViewMode('focus')
    setRailOpen(false)
    setFocusNonce((n) => n + 1)
  }, [])

  const requestFocus = enterFocus

  const exitFocus = useCallback(() => {
    // Leave the camera where Focus put it. viewEpoch is the home snap (reset).
    setJumpRegionId(null)
    setViewMode('default')
  }, [])

  const toggleFocus = useCallback(() => {
    setViewMode((m) => {
      if (m === 'focus') {
        setJumpRegionId(null)
        return 'default'
      }
      setJumpRegionId(null)
      setRailOpen(false)
      return 'focus'
    })
  }, [])

  const toggleIsolate = useCallback(() => {
    if (!selectedId) {
      setIsolated(false)
      return
    }
    setIsolated((v) => !v)
  }, [selectedId])

  const resetView = useCallback(() => {
    setSelectedId(null)
    setJumpRegionId(null)
    setViewMode('default')
    setIsolated(false)
    setViewEpoch((n) => n + 1)
  }, [])

  const markSceneReady = useCallback(() => {
    setSceneReady(true)
  }, [])

  const reportSkeletonLoad = useCallback((next: SkeletonLoadState) => {
    setSkeletonLoad(next)
  }, [])

  useEffect(() => {
    if (!selectedId && isolated) setIsolated(false)
  }, [selectedId, isolated])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      if (!new URLSearchParams(window.location.search).has('qa')) return
    } catch {
      return
    }
    const w = window as Window & { __atlasSelect?: (id: string | null) => void }
    w.__atlasSelect = select
    return () => {
      delete w.__atlasSelect
    }
  }, [select])

  const value = useMemo<AtlasContextValue>(
    () => ({
      hotSystems,
      m2Coverage,
      selectedId,
      query,
      viewMode,
      isolated,
      railOpen,
      viewEpoch,
      focusNonce,
      jumpRegionId,
      selected,
      visibleStructures,
      toggleSystem,
      toggleM2Coverage,
      enableM2Coverage,
      select,
      jumpTo,
      setQuery,
      enterFocus,
      exitFocus,
      toggleFocus,
      requestFocus,
      toggleIsolate,
      resetView,
      setRailOpen,
      sceneReady,
      markSceneReady,
      skeletonLoad,
      reportSkeletonLoad,
    }),
    [
      hotSystems,
      m2Coverage,
      selectedId,
      query,
      viewMode,
      isolated,
      railOpen,
      viewEpoch,
      focusNonce,
      jumpRegionId,
      selected,
      visibleStructures,
      toggleSystem,
      toggleM2Coverage,
      enableM2Coverage,
      select,
      jumpTo,
      enterFocus,
      exitFocus,
      toggleFocus,
      requestFocus,
      toggleIsolate,
      resetView,
      sceneReady,
      markSceneReady,
      skeletonLoad,
      reportSkeletonLoad,
    ],
  )

  return <AtlasContext.Provider value={value}>{children}</AtlasContext.Provider>
}

export function useAtlas() {
  const ctx = useContext(AtlasContext)
  if (!ctx) throw new Error('useAtlas must be used within AtlasProvider')
  return ctx
}
