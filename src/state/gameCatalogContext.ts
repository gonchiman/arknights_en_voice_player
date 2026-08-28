import { createContext, useContext } from 'react'
import type { GameCatalog } from '../types/app'

export const GameCatalogContext = createContext<GameCatalog | null>(null)

export function useGameCatalog() {
  const catalog = useContext(GameCatalogContext)
  if (!catalog) throw new Error('useGameCatalog must be used within GameCatalogContext')
  return catalog
}
