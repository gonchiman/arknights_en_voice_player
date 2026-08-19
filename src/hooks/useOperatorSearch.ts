import { useMemo, useState } from 'react'
import { classLabels } from '../data/operators'
import type { Operator } from '../types/app'

export type OperatorSearchController = {
  query: string
  setQuery: (value: string) => void
  rarity: string
  setRarity: (value: string) => void
  operatorClass: string
  setOperatorClass: (value: string) => void
  subclass: string
  setSubclass: (value: string) => void
  initial: string
  setInitial: (value: string) => void
  initialOptions: string[]
  subclassOptions: string[]
  filteredOperators: Operator[]
  resetFilters: () => void
}

export function useOperatorSearch(sourceOperators: Operator[]): OperatorSearchController {
  const [query, setQuery] = useState('')
  const [rarity, setRarity] = useState('all')
  const [operatorClass, setOperatorClass] = useState('all')
  const [subclass, setSubclass] = useState('all')
  const [initial, setInitial] = useState('all')

  const initialOptions = useMemo(
    () =>
      Array.from(
        new Set(
          sourceOperators.map(
            (operator) => operator.name.at(0)?.toUpperCase() ?? '',
          ),
        ),
      ).sort(),
    [sourceOperators],
  )
  const subclassOptions = useMemo(
    () => Array.from(new Set(sourceOperators.map((operator) => operator.subclass))).sort(),
    [sourceOperators],
  )

  const filteredOperators = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()
    return sourceOperators.filter((operator) => {
      const searchable = [
        operator.name,
        operator.japaneseName,
        operator.operatorClass,
        classLabels[operator.operatorClass],
        operator.subclass,
        operator.faction,
      ]
        .join(' ')
        .toLocaleLowerCase()

      return (
        (!normalizedQuery || searchable.includes(normalizedQuery)) &&
        (rarity === 'all' || operator.rarity === Number(rarity)) &&
        (operatorClass === 'all' || operator.operatorClass === operatorClass) &&
        (subclass === 'all' || operator.subclass === subclass) &&
        (initial === 'all' || operator.name.toUpperCase().startsWith(initial))
      )
    })
  }, [initial, operatorClass, query, rarity, sourceOperators, subclass])

  const resetFilters = () => {
    setQuery('')
    setRarity('all')
    setOperatorClass('all')
    setSubclass('all')
    setInitial('all')
  }

  return {
    query,
    setQuery,
    rarity,
    setRarity,
    operatorClass,
    setOperatorClass,
    subclass,
    setSubclass,
    initial,
    setInitial,
    initialOptions,
    subclassOptions,
    filteredOperators,
    resetFilters,
  }
}
