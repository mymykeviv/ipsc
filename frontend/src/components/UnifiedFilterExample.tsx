import React, { useState, useEffect } from 'react'
import { UnifiedFilterSystem } from './UnifiedFilterSystem'
import { getFilterConfig } from '../config/filterConfigs'

// Example implementation for Products page
export function ProductsPageWithUnifiedFilters() {
  const [filterValues, setFilterValues] = useState<Record<string, any>>({})
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Get the filter configuration for products page
  const filterConfig = getFilterConfig('products')

  // Handle filter changes
  const handleFilterChange = (filters: Record<string, any>) => {
    setFilterValues(filters)
    // Apply filters to your data here
    console.log('Filters changed:', filters)
  }

  // Handle clear all filters
  const handleClearAll = () => {
    setFilterValues({})
    // Reset your data here
    console.log('All filters cleared')
  }

  // Calculate active filters count
  const getActiveFiltersCount = () => {
    let count = 0
    Object.entries(filterValues).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== '') {
        if (typeof value === 'object' && value.startDate && value.endDate) {
          // Date range filter
          count++
        } else if (typeof value === 'string' && value.trim() !== '') {
          // Text or dropdown filter
          count++
        }
      }
    })
    return count
  }

  // Quick filter actions
  const quickFilterActions = {
    lowStock: () => {
      setFilterValues(prev => ({
        ...prev,
        stockLevel: 'low'
      }))
    },
    highValue: () => {
      setFilterValues(prev => ({
        ...prev,
        priceRange: '50000+'
      }))
    },
    recent: () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      const today = new Date().toISOString().slice(0, 10)
      setFilterValues(prev => ({
        ...prev,
        dateRange: {
          startDate: thirtyDaysAgo,
          endDate: today
        }
      }))
    }
  }

  // Update quick filters with actions
  const quickFilters = filterConfig.quickFilters.map(filter => ({
    ...filter,
    action: quickFilterActions[filter.id as keyof typeof quickFilterActions] || (() => {}),
    isActive: filterValues[filter.id] !== undefined && filterValues[filter.id] !== 'all'
  }))

  return (
    <div style={{ padding: '20px' }}>
      <h1>Products Management</h1>
      
      {/* Unified Filter System */}
      <UnifiedFilterSystem
        title="Product Filters"
        filters={filterConfig.filters}
        quickFilters={quickFilters}
        onFilterChange={handleFilterChange}
        onClearAll={handleClearAll}
        activeFiltersCount={getActiveFiltersCount()}
        showQuickActions={true}
      />

      {/* Your existing content */}
      <div style={{ marginTop: '20px' }}>
        <h2>Products List</h2>
        <p>Filter values: {JSON.stringify(filterValues, null, 2)}</p>
        {/* Your products table/list would go here */}
      </div>
    </div>
  )
}

// Example implementation for Invoices page
export function InvoicesPageWithUnifiedFilters() {
  const [filterValues, setFilterValues] = useState<Record<string, any>>({})
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Get the filter configuration for invoices page
  const filterConfig = getFilterConfig('invoices')

  // Handle filter changes
  const handleFilterChange = (filters: Record<string, any>) => {
    setFilterValues(filters)
    // Apply filters to your data here
    console.log('Invoice filters changed:', filters)
  }

  // Handle clear all filters
  const handleClearAll = () => {
    setFilterValues({})
    // Reset your data here
    console.log('All invoice filters cleared')
  }

  // Calculate active filters count
  const getActiveFiltersCount = () => {
    let count = 0
    Object.entries(filterValues).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== '') {
        if (typeof value === 'object' && value.startDate && value.endDate) {
          // Date range filter
          count++
        } else if (typeof value === 'string' && value.trim() !== '') {
          // Text or dropdown filter
          count++
        }
      }
    })
    return count
  }

  // Quick filter actions
  const quickFilterActions = {
    recent: () => {
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)
      const today = new Date().toISOString().slice(0, 10)
      setFilterValues(prev => ({
        ...prev,
        createdDateRange: {
          startDate: startOfMonth,
          endDate: today
        }
      }))
    },
    overdue: () => {
      setFilterValues(prev => ({
        ...prev,
        status: 'overdue'
      }))
    },
    unpaid: () => {
      setFilterValues(prev => ({
        ...prev,
        paymentStatus: 'unpaid'
      }))
    }
  }

  // Update quick filters with actions
  const quickFilters = filterConfig.quickFilters.map(filter => ({
    ...filter,
    action: quickFilterActions[filter.id as keyof typeof quickFilterActions] || (() => {}),
    isActive: filterValues[filter.id] !== undefined && filterValues[filter.id] !== 'all'
  }))

  return (
    <div style={{ padding: '20px' }}>
      <h1>Invoices Management</h1>
      
      {/* Unified Filter System */}
      <UnifiedFilterSystem
        title="Invoice Filters"
        filters={filterConfig.filters}
        quickFilters={quickFilters}
        onFilterChange={handleFilterChange}
        onClearAll={handleClearAll}
        activeFiltersCount={getActiveFiltersCount()}
        showQuickActions={true}
      />

      {/* Your existing content */}
      <div style={{ marginTop: '20px' }}>
        <h2>Invoices List</h2>
        <p>Filter values: {JSON.stringify(filterValues, null, 2)}</p>
        {/* Your invoices table/list would go here */}
      </div>
    </div>
  )
}

// Example implementation for Stock History page
export function StockHistoryPageWithUnifiedFilters() {
  const [filterValues, setFilterValues] = useState<Record<string, any>>({})
  const [stockHistory, setStockHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Get the filter configuration for stock history page
  const filterConfig = getFilterConfig('stockHistory')

  // Handle filter changes
  const handleFilterChange = (filters: Record<string, any>) => {
    setFilterValues(filters)
    // Apply filters to your data here
    console.log('Stock history filters changed:', filters)
  }

  // Handle clear all filters
  const handleClearAll = () => {
    setFilterValues({})
    // Reset your data here
    console.log('All stock history filters cleared')
  }

  // Calculate active filters count
  const getActiveFiltersCount = () => {
    let count = 0
    Object.entries(filterValues).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== '') {
        if (typeof value === 'object' && value.startDate && value.endDate) {
          // Date range filter
          count++
        } else if (typeof value === 'string' && value.trim() !== '') {
          // Text or dropdown filter
          count++
        }
      }
    })
    return count
  }

  // Quick filter actions
  const quickFilterActions = {
    currentFY: () => {
      const currentYear = new Date().getFullYear()
      const fyStart = `${currentYear}-04-01`
      const fyEnd = `${currentYear + 1}-03-31`
      setFilterValues(prev => ({
        ...prev,
        dateRange: {
          startDate: fyStart,
          endDate: fyEnd
        }
      }))
    },
    lastFY: () => {
      const currentYear = new Date().getFullYear()
      const fyStart = `${currentYear - 1}-04-01`
      const fyEnd = `${currentYear}-03-31`
      setFilterValues(prev => ({
        ...prev,
        dateRange: {
          startDate: fyStart,
          endDate: fyEnd
        }
      }))
    },
    incoming: () => {
      setFilterValues(prev => ({
        ...prev,
        entryType: 'incoming'
      }))
    },
    outgoing: () => {
      setFilterValues(prev => ({
        ...prev,
        entryType: 'outgoing'
      }))
    },
    lowStock: () => {
      setFilterValues(prev => ({
        ...prev,
        stockLevel: 'low'
      }))
    }
  }

  // Update quick filters with actions
  const quickFilters = filterConfig.quickFilters.map(filter => ({
    ...filter,
    action: quickFilterActions[filter.id as keyof typeof quickFilterActions] || (() => {}),
    isActive: filterValues[filter.id] !== undefined && filterValues[filter.id] !== 'all'
  }))

  return (
    <div style={{ padding: '20px' }}>
      <h1>Stock Movement History</h1>
      
      {/* Unified Filter System */}
      <UnifiedFilterSystem
        title="Stock Movement Filters"
        filters={filterConfig.filters}
        quickFilters={quickFilters}
        onFilterChange={handleFilterChange}
        onClearAll={handleClearAll}
        activeFiltersCount={getActiveFiltersCount()}
        showQuickActions={true}
      />

      {/* Your existing content */}
      <div style={{ marginTop: '20px' }}>
        <h2>Stock History List</h2>
        <p>Filter values: {JSON.stringify(filterValues, null, 2)}</p>
        {/* Your stock history table/list would go here */}
      </div>
    </div>
  )
}


