import { useMemo, useState } from 'react'
import { classLabels } from '../data/operators'
import {
  getOperatorInitialGroup,
  type OperatorInitialGroup,
} from '../lib/operatorInitials'
import type { Operator } from '../types/app'

export type OperatorInitialFilter = 'all' | OperatorInitialGroup

export type OperatorSearchController = {
  query: string
  setQuery: (value: string) => void
  rarity: string
  setRarity: (value: string) => void
  operatorClass: string
  setOperatorClass: (value: string) => void
  initial: OperatorInitialFilter
  setInitial: (value: OperatorInitialFilter) => void
  filteredOperators: Operator[]
  hasActiveFilters: boolean
  resetFilters: () => void
}

export function useOperatorSearch(sourceOperators: Operator[]): OperatorSearchController {
  const [query, setQuery] = useState('')
  const [rarity, setRarity] = useState('all')
  const [operatorClass, setOperatorClass] = useState('all')
  const [initial, setInitial] = useState<OperatorInitialFilter>('all')

  const hasActiveFilters =
    query.length > 0 ||
    rarity !== 'all' ||
    operatorClass !== 'all' ||
    initial !== 'all'

  const filteredOperators = useMemo(() => {
    const normalizedQuery = query.trim().normalize('NFKC').toLocaleLowerCase()
    return sourceOperators.filter((operator) => {
      const searchable = [
        operator.name,
        operator.japaneseName,
        operator.operatorClass,
        classLabels[operator.operatorClass],
        operator.subclass,
        operator.faction,
        operator.voiceActor,
        operator.description,
      ]
        .join(' ')
        .normalize('NFKC')
        .toLocaleLowerCase()

      return (
        (!normalizedQuery || searchable.includes(normalizedQuery)) &&
        (rarity === 'all' || operator.rarity === Number(rarity)) &&
        (operatorClass === 'all' || operator.operatorClass === operatorClass) &&
        (initial === 'all' ||
          getOperatorInitialGroup(operator.japaneseName) === initial)
      )
    })
  }, [initial, operatorClass, query, rarity, sourceOperators])

  const resetFilters = () => {
    setQuery('')
    setRarity('all')
    setOperatorClass('all')
    setInitial('all')
  }

  return {
    query,
    setQuery,
    rarity,
    setRarity,
    operatorClass,
    setOperatorClass,
    initial,
    setInitial,
    filteredOperators,
    hasActiveFilters,
    resetFilters,
  }
}
