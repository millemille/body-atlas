import { createContext, useContext } from 'react'

export type StructureRenderState = {
  id: string
  selected: boolean
  hovered: boolean
  pickable: boolean
}

const StructureRenderContext = createContext<StructureRenderState | null>(null)

export const StructureRenderProvider = StructureRenderContext.Provider

export function useStructureRender() {
  return useContext(StructureRenderContext)
}
