import { useCallback } from 'react'
import { useFilterNavigation } from '../utils/filterNavigation'
import { getDefaultFilterState } from '../config/defaultFilterStates'

export interface UseFilterResetOptions {
  pageName: keyof typeof import('../config/defaultFilterStates').defaultFilterStates
  onReset?: (defaultState: Record<string, any>) => void
  showConfirmation?: boolean
  preserveQuickFilters?: boolean
}

/**
 * Hook for managing filter reset functionality
 * Handles resetting filters to default state and clearing URL parameters
 */
export function useFilterReset({
  pageName,
  onReset,
  showConfirmation = false,
  preserveQuickFilters = false
}: UseFilterResetOptions) {
  const defaultState = getDefaultFilterState(pageName)
  const { clearURLFilters } = useFilterNavigation(defaultState)

  /**
   * Reset all filters to default state
   * @param currentState - Current filter state
   * @returns Default filter state
   */
  const resetAllFilters = useCallback((
    currentState: Record<string, any>
  ): Record<string, any> => {
    if (showConfirmation) {
      const confirmed = window.confirm(
        'Are you sure you want to clear all filters? This action cannot be undone.'
      )
      if (!confirmed) {
        return currentState
      }
    }

    // Clear URL parameters first
    clearURLFilters()

    // Get default state
    const newState = { ...defaultState }

    // Preserve quick filters if requested
    if (preserveQuickFilters) {
      // Keep quick filter related state
      const quickFilterKeys = ['quickFilterActive', 'quickFilterType']
      quickFilterKeys.forEach(key => {
        if (currentState[key] !== undefined) {
          (newState as Record<string, any>)[key] = currentState[key]
        }
      })
    }

    // Call onReset callback with the new state
    if (onReset) {
      onReset(newState)
    }

    return newState
  }, [defaultState, clearURLFilters, showConfirmation, preserveQuickFilters, onReset])

  /**
   * Reset specific filters to default
   * @param currentState - Current filter state
   * @param filterKeys - Keys of filters to reset
   * @returns Updated filter state
   */
  const resetSpecificFilters = useCallback((
    currentState: Record<string, any>,
    filterKeys: string[]
  ): Record<string, any> => {
    const newState = { ...currentState }

    filterKeys.forEach(key => {
      if ((defaultState as Record<string, any>)[key] !== undefined) {
        newState[key] = (defaultState as Record<string, any>)[key]
      }
    })

    return newState
  }, [defaultState])

  /**
   * Check if current state is at default
   * @param currentState - Current filter state
   * @returns True if current state matches default
   */
  const isAtDefaultState = useCallback((
    currentState: Record<string, any>
  ): boolean => {
    for (const [key, value] of Object.entries(defaultState)) {
      if (currentState[key] !== value) {
        return false
      }
    }
    return true
  }, [defaultState])

  /**
   * Get count of active (non-default) filters
   * @param currentState - Current filter state
   * @returns Number of active filters
   */
  const getActiveFilterCount = useCallback((
    currentState: Record<string, any>
  ): number => {
    let count = 0

    for (const [key, value] of Object.entries(currentState)) {
      if ((defaultState as Record<string, any>)[key] !== undefined && value !== (defaultState as Record<string, any>)[key]) {
        count++
      }
    }

    return count
  }, [defaultState])

  return {
    resetAllFilters,
    resetSpecificFilters,
    isAtDefaultState,
    getActiveFilterCount,
    defaultState
  }
}
