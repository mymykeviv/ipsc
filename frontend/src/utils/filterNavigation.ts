import { useSearchParams } from 'react-router-dom'

export interface FilterNavigationParams {
  [key: string]: string | string[]
}

export interface FilterNavigationConfig {
  preserveFilterState: boolean
  clearURLParams: boolean
  defaultState: Record<string, any>
}

/**
 * Service for handling filter navigation and URL parameters
 * Supports cross-page navigation with filter state preservation
 */
export class FilterNavigationService {
  /**
   * Parse URL parameters and convert to filter state
   * @param searchParams - URL search parameters
   * @param filterMapping - Mapping of URL params to filter keys
   * @returns Filter state object
   */
  static parseURLParams(
    searchParams: URLSearchParams,
    filterMapping: Record<string, string> = {}
  ): Record<string, any> {
    const filters: Record<string, any> = {}
    
    for (const [key, value] of searchParams.entries()) {
      const filterKey = filterMapping[key] || key
      
      // Handle array parameters (e.g., multiple selections)
      if (filters[filterKey]) {
        if (Array.isArray(filters[filterKey])) {
          filters[filterKey].push(value)
        } else {
          filters[filterKey] = [filters[filterKey], value]
        }
      } else {
        filters[filterKey] = value
      }
    }
    
    return filters
  }

  /**
   * Convert filter state to URL parameters
   * @param filters - Current filter state
   * @param filterMapping - Mapping of filter keys to URL params
   * @returns URLSearchParams object
   */
  static toURLParams(
    filters: Record<string, any>,
    filterMapping: Record<string, string> = {}
  ): URLSearchParams {
    const params = new URLSearchParams()
    
    for (const [key, value] of Object.entries(filters)) {
      if (value && value !== 'all' && value !== '') {
        const urlKey = filterMapping[key] || key
        
        if (Array.isArray(value)) {
          value.forEach(v => params.append(urlKey, v))
        } else {
          params.set(urlKey, String(value))
        }
      }
    }
    
    return params
  }

  /**
   * Clear all filter parameters from URL
   * @param searchParams - Current search params
   * @param filterKeys - Keys to clear (if empty, clears all)
   * @returns New URLSearchParams without filter params
   */
  static clearURLParams(
    searchParams: URLSearchParams,
    filterKeys: string[] = []
  ): URLSearchParams {
    const newParams = new URLSearchParams(searchParams)
    
    if (filterKeys.length === 0) {
      // Clear all filter-related parameters
      const filterParamKeys = [
        'search', 'status', 'category', 'type', 'gstRate', 'stockLevel',
        'supplier', 'priceRange', 'dateFrom', 'dateTo', 'amountRange',
        'paymentStatus', 'paymentMethod', 'vendor', 'customer', 'product',
        'searchTerm', 'statusFilter', 'categoryFilter', 'itemTypeFilter', 'gstRateFilter',
        'stockLevelFilter', 'supplierFilter', 'priceRangeFilter', 'amountRangeFilter',
        'paymentStatusFilter', 'paymentMethodFilter', 'vendorFilter', 'customerFilter',
        'gstTypeFilter', 'transactionTypeFilter', 'accountHeadFilter', 'typeFilter',
        'invoiceNumberFilter', 'paymentAmountFilter', 'financialYearFilter',
        'expenseTypeFilter', 'contactPerson', 'email', 'phone', 'city', 'state',
        'country', 'gstStatus', 'gstRegistration', 'gstStateCode', 'partyType',
        'hasNotes', 'dateFilter', 'dateRange'
      ]
      
      filterParamKeys.forEach(key => {
        newParams.delete(key)
      })
    } else {
      filterKeys.forEach(key => {
        newParams.delete(key)
      })
    }
    
    return newParams
  }

  /**
   * Validate filter parameters
   * @param filters - Filter state to validate
   * @param validationRules - Validation rules for each filter
   * @returns Validation result with errors
   */
  static validateFilters(
    filters: Record<string, any>,
    validationRules: Record<string, (value: any) => boolean> = {}
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    
    for (const [key, value] of Object.entries(filters)) {
      if (validationRules[key]) {
        if (!validationRules[key](value)) {
          errors.push(`Invalid value for ${key}: ${value}`)
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

/**
 * Hook for managing filter navigation state
 * @param defaultState - Default filter state for the page
 * @param filterMapping - Mapping between URL params and filter keys
 * @returns Filter navigation utilities
 */
export function useFilterNavigation(
  defaultState: Record<string, any>,
  filterMapping: Record<string, string> = {}
) {
  const [searchParams, setSearchParams] = useSearchParams()

  /**
   * Apply filters from URL parameters
   * @returns Filter state from URL
   */
  const getFiltersFromURL = (): Record<string, any> => {
    return FilterNavigationService.parseURLParams(searchParams, filterMapping)
  }

  /**
   * Update URL with current filter state
   * @param filters - Current filter state
   */
  const updateURLWithFilters = (filters: Record<string, any>) => {
    const params = FilterNavigationService.toURLParams(filters, filterMapping)
    setSearchParams(params, { replace: true })
  }

  /**
   * Clear all filter parameters from URL
   */
  const clearURLFilters = () => {
    const newParams = FilterNavigationService.clearURLParams(searchParams)
    setSearchParams(newParams, { replace: true })
  }

  /**
   * Reset filters to default state and clear URL
   */
  const resetToDefault = () => {
    clearURLFilters()
    return defaultState
  }

  return {
    getFiltersFromURL,
    updateURLWithFilters,
    clearURLFilters,
    resetToDefault,
    searchParams
  }
}
