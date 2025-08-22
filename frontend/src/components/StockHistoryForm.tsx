import React, { useState, useEffect, useCallback, useMemo, useReducer } from 'react'
import { useSearchParams } from 'react-router-dom'
import { apiGetStockMovementHistory, apiDownloadStockMovementHistoryPDF, apiGetProducts } from '../lib/api'
import { Button } from './Button'
import { ErrorMessage } from './ErrorMessage'
import { UnifiedFilterSystem } from './UnifiedFilterSystem'
import { createApiErrorHandler } from '../lib/apiUtils'

// Define the state interface for useReducer
interface StockHistoryState {
  stockHistory: any[]
  products: any[]
  historyLoading: boolean
  downloadingPDF: boolean
  error: string | null
  showPDFPreview: boolean
  currentPage: number
  itemsPerPage: number
  filters: {
    financialYearFilter: string
    productFilter: string
    categoryFilter: string
    supplierFilter: string
    stockLevelFilter: string
    entryTypeFilter: string
    dateRangeFilter: {
      startDate: string
      endDate: string
    }
  }
  forceReload: number
  debounceTimer: NodeJS.Timeout | null
}

// Define action types for useReducer
type StockHistoryAction =
  | { type: 'SET_STOCK_HISTORY'; payload: any[] }
  | { type: 'SET_PRODUCTS'; payload: any[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_DOWNLOADING_PDF'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SHOW_PDF_PREVIEW'; payload: boolean }
  | { type: 'SET_CURRENT_PAGE'; payload: number }
  | { type: 'SET_FILTER'; payload: { key: string; value: any } }
  | { type: 'SET_FORCE_RELOAD'; payload: number }
  | { type: 'SET_DEBOUNCE_TIMER'; payload: NodeJS.Timeout | null }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET_FILTERS' }

// Initial state
const initialState: StockHistoryState = {
  stockHistory: [],
  products: [],
  historyLoading: false,
  downloadingPDF: false,
  error: null,
  showPDFPreview: false,
  currentPage: 1,
  itemsPerPage: 10,
  filters: {
    financialYearFilter: 'all',
    productFilter: 'all',
    categoryFilter: 'all',
    supplierFilter: 'all',
    stockLevelFilter: 'all',
    entryTypeFilter: 'all',
    dateRangeFilter: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      endDate: new Date().toISOString().slice(0, 10)
    }
  },
  forceReload: 0,
  debounceTimer: null
}

// Reducer function
function stockHistoryReducer(state: StockHistoryState, action: StockHistoryAction): StockHistoryState {
  switch (action.type) {
    case 'SET_STOCK_HISTORY':
      return { ...state, stockHistory: action.payload }
    case 'SET_PRODUCTS':
      return { ...state, products: action.payload }
    case 'SET_LOADING':
      return { ...state, historyLoading: action.payload }
    case 'SET_DOWNLOADING_PDF':
      return { ...state, downloadingPDF: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'SET_SHOW_PDF_PREVIEW':
      return { ...state, showPDFPreview: action.payload }
    case 'SET_CURRENT_PAGE':
      return { ...state, currentPage: action.payload }
    case 'SET_FILTER':
      return {
        ...state,
        filters: {
          ...state.filters,
          [action.payload.key]: action.payload.value
        }
      }
    case 'SET_FORCE_RELOAD':
      return { ...state, forceReload: action.payload }
    case 'SET_DEBOUNCE_TIMER':
      return { ...state, debounceTimer: action.payload }
    case 'CLEAR_ERROR':
      return { ...state, error: null }
    case 'RESET_FILTERS':
      return {
        ...state,
        filters: {
          financialYearFilter: 'all',
          productFilter: 'all',
          categoryFilter: 'all',
          supplierFilter: 'all',
          stockLevelFilter: 'all',
          entryTypeFilter: 'all',
          dateRangeFilter: {
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
            endDate: new Date().toISOString().slice(0, 10)
          }
        },
        currentPage: 1
      }
    default:
      return state
  }
}

// Helper function to get current financial year
const getCurrentFinancialYear = (): string => {
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1
  
  // Financial year runs from April to March
  if (currentMonth >= 4) {
    return `${currentYear}-${currentYear + 1}`
  } else {
    return `${currentYear - 1}-${currentYear}`
  }
}

export const StockHistoryForm: React.FC<{ onSuccess?: () => void; onCancel: () => void }> = ({ onSuccess, onCancel }) => {
  const [state, dispatch] = useReducer(stockHistoryReducer, initialState)
  const [searchParams, setSearchParams] = useSearchParams()
  
  // Create API error handler
  const handleApiError = createApiErrorHandler(() => {})
  
  // Extract values from state for easier access
  const {
    stockHistory,
    products,
    historyLoading,
    downloadingPDF,
    error,
    showPDFPreview,
    currentPage,
    itemsPerPage,
    filters,
    forceReload,
    debounceTimer
  } = state

  // Extract filter values
  const {
    financialYearFilter,
    productFilter,
    categoryFilter,
    supplierFilter,
    stockLevelFilter,
    entryTypeFilter,
    dateRangeFilter
  } = filters

  // Get productId from URL
  const productId = searchParams.get('product')
  
  // Memoized product name
  const productName = useMemo(() => {
    if (productId && products.length > 0) {
      const product = products.find(p => p.id === parseInt(productId))
      return product ? product.name : null
    }
    return null
  }, [productId, products])

  // Memoized loadProducts function
  const loadProducts = useCallback(async () => {
    try {
      const productsData = await apiGetProducts()
      dispatch({ type: 'SET_PRODUCTS', payload: productsData })
    } catch (err) {
      console.error('Failed to load products:', err)
      const errorMessage = handleApiError(err)
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
    }
  }, [])

  // Memoized loadStockHistory function
  const loadStockHistory = useCallback(async () => {
    try {
      console.log('Loading stock history with filters:', {
        financialYearFilter,
        productId,
        forceReload,
        productFilter,
        categoryFilter,
        supplierFilter,
        stockLevelFilter,
        entryTypeFilter,
        dateRangeFilter
      })
      
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'CLEAR_ERROR' })
      
      // Use current FY as default, or selected FY
      const fy = financialYearFilter === 'all' ? getCurrentFinancialYear() : financialYearFilter
      
      // If forceReload is triggered, don't use productId from URL
      const productIdNum = (productId && forceReload === 0) ? parseInt(productId) : undefined
      
      const history = await apiGetStockMovementHistory(fy, productIdNum)
      console.log('Stock history loaded:', history)
      dispatch({ type: 'SET_STOCK_HISTORY', payload: history })
    } catch (err) {
      console.error('Failed to load stock history:', err)
      const errorMessage = handleApiError(err)
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [financialYearFilter, productId, forceReload])

  // Memoized filtered stock history
  const filteredStockHistory = useMemo(() => {
    return stockHistory.filter(movement => {
      // Product filter - if productId is present, always include that product
      const matchesProduct = (productId && movement.product_id === parseInt(productId)) ||
                            productFilter === 'all' || 
                            movement.product_name === productFilter
      
      // Category filter
      const product = products.find(p => p.name === movement.product_name)
      const matchesCategory = categoryFilter === 'all' ||
                            (product && product.category === categoryFilter)
      
      // Supplier filter
      const matchesSupplier = supplierFilter === 'all' ||
                            (product && product.supplier === supplierFilter)
      
      // Entry type filter (based on transaction types)
      const hasIncoming = movement.total_incoming > 0
      const hasOutgoing = movement.total_outgoing > 0
      const hasEntryAdjustments = movement.transactions.some(t => t.entry_type === 'adjust')
      
      const matchesEntryType = entryTypeFilter === 'all' ||
                              (entryTypeFilter === 'incoming' && hasIncoming) ||
                              (entryTypeFilter === 'outgoing' && hasOutgoing) ||
                              (entryTypeFilter === 'adjustment' && hasEntryAdjustments)
      
      // Date range filter - filter transactions within the date range
      const matchesDateRange = movement.transactions.some(transaction => {
        const transactionDate = new Date(transaction.transaction_date)
        const startDate = new Date(dateRangeFilter.startDate)
        const endDate = new Date(dateRangeFilter.endDate)
        return transactionDate >= startDate && transactionDate <= endDate
      })
      
      // Stock level filter
      const matchesStockLevel = stockLevelFilter === 'all' ||
                               (stockLevelFilter === 'in_stock' && movement.closing_stock > 0) ||
                               (stockLevelFilter === 'out_of_stock' && movement.closing_stock === 0) ||
                               (stockLevelFilter === 'low_stock' && movement.closing_stock > 0 && movement.closing_stock < 10) // Assuming 10 is low stock threshold
      
      return matchesProduct && matchesCategory && matchesSupplier && matchesEntryType && 
             matchesDateRange && matchesStockLevel
    })
  }, [stockHistory, productId, productFilter, categoryFilter, supplierFilter, entryTypeFilter, dateRangeFilter, stockLevelFilter, products])

  // Memoized paginated stock history
  const paginatedStockHistory = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredStockHistory.slice(startIndex, endIndex)
  }, [filteredStockHistory, currentPage, itemsPerPage])

  // Memoized total pages
  const totalPages = useMemo(() => {
    return Math.ceil(filteredStockHistory.length / itemsPerPage)
  }, [filteredStockHistory.length, itemsPerPage])

  // Memoized filter options
  const filterOptions = useMemo(() => {
    const categories = [...new Set(products.map(p => p.category).filter(Boolean))]
    const suppliers = [...new Set(products.map(p => p.supplier).filter(Boolean))]
    
    return {
      products: products.map(p => ({ value: p.name, label: p.name })),
      categories: categories.map(c => ({ value: c, label: c })),
      suppliers: suppliers.map(s => ({ value: s, label: s })),
      financialYears: [
        { value: 'all', label: 'All Years' },
        { value: '2023-2024', label: '2023-2024' },
        { value: '2024-2025', label: '2024-2025' },
        { value: '2025-2026', label: '2025-2026' }
      ],
      stockLevels: [
        { value: 'all', label: 'All Stock Levels' },
        { value: 'in_stock', label: 'In Stock' },
        { value: 'out_of_stock', label: 'Out of Stock' },
        { value: 'low_stock', label: 'Low Stock' }
      ],
      entryTypes: [
        { value: 'all', label: 'All Entry Types' },
        { value: 'incoming', label: 'Incoming' },
        { value: 'outgoing', label: 'Outgoing' },
        { value: 'adjustment', label: 'Adjustment' }
      ]
    }
  }, [products])

  // Set product filter when productId is present in URL
  useEffect(() => {
    if (productId && products.length > 0) {
      const selectedProduct = products.find(p => p.id === parseInt(productId))
      if (selectedProduct) {
        dispatch({ type: 'SET_FILTER', payload: { key: 'productFilter', value: selectedProduct.name } })
      } else {
        // Product not found - show error and reset filter
        dispatch({ type: 'SET_ERROR', payload: `Product with ID ${productId} not found` })
        dispatch({ type: 'SET_FILTER', payload: { key: 'productFilter', value: 'all' } })
        // Remove invalid product ID from URL
        const newSearchParams = new URLSearchParams(searchParams)
        newSearchParams.delete('product')
        setSearchParams(newSearchParams)
      }
    } else if (!productId) {
      // If no productId in URL, reset product filter to 'all'
      dispatch({ type: 'SET_FILTER', payload: { key: 'productFilter', value: 'all' } })
    }
  }, [productId, products, searchParams, setSearchParams])

  useEffect(() => {
    loadProducts()
  }, []) // Only load products once on mount

  useEffect(() => {
    loadStockHistory()
  }, [loadStockHistory]) // Simplified dependency

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
    }
  }, [debounceTimer])

  // Real-time filter update handler with debouncing - simplified to prevent infinite loops
  const handleFilterChange = useCallback((filters: Record<string, any>) => {
    console.log('Filter change detected:', filters)
    
    // Clear existing debounce timer
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    
    // Update individual filter states based on unified filter values
    let hasChanges = false
    
    if (filters.financialYear !== undefined) {
      dispatch({ type: 'SET_FILTER', payload: { key: 'financialYearFilter', value: filters.financialYear } })
      hasChanges = true
    }
    if (filters.product !== undefined) {
      dispatch({ type: 'SET_FILTER', payload: { key: 'productFilter', value: filters.product } })
      hasChanges = true
    }
    if (filters.category !== undefined) {
      dispatch({ type: 'SET_FILTER', payload: { key: 'categoryFilter', value: filters.category } })
      hasChanges = true
    }
    if (filters.supplier !== undefined) {
      dispatch({ type: 'SET_FILTER', payload: { key: 'supplierFilter', value: filters.supplier } })
      hasChanges = true
    }
    if (filters.stockLevel !== undefined) {
      dispatch({ type: 'SET_FILTER', payload: { key: 'stockLevelFilter', value: filters.stockLevel } })
      hasChanges = true
    }
    if (filters.entryType !== undefined) {
      dispatch({ type: 'SET_FILTER', payload: { key: 'entryTypeFilter', value: filters.entryType } })
      hasChanges = true
    }
    if (filters.dateRange !== undefined) {
      dispatch({ type: 'SET_FILTER', payload: { key: 'dateRangeFilter', value: filters.dateRange } })
      hasChanges = true
    }
    
    // Only trigger reload if there are actual changes
    if (hasChanges) {
      // Debounce the reload to prevent rapid API calls
      const timer = setTimeout(() => {
        console.log('Triggering data reload due to filter changes:', filters)
        dispatch({ type: 'SET_FORCE_RELOAD', payload: prev => prev + 1 })
      }, 500) // 500ms delay
      
      dispatch({ type: 'SET_DEBOUNCE_TIMER', payload: timer })
    }
  }, [debounceTimer]) // Simplified dependencies to prevent infinite loops

  // Filter stock history based on all filters
  const filteredStockHistory = stockHistory.filter(movement => {
    // Product filter - if productId is present, always include that product
    const matchesProduct = (productId && movement.product_id === parseInt(productId)) ||
                          productFilter === 'all' || 
                          movement.product_name === productFilter
    
    // Category filter
    const product = products.find(p => p.name === movement.product_name)
    const matchesCategory = categoryFilter === 'all' ||
                          (product && product.category === categoryFilter)
    
    // Supplier filter
    const matchesSupplier = supplierFilter === 'all' ||
                          (product && product.supplier === supplierFilter)
    
    // Entry type filter (based on transaction types)
    const hasIncoming = movement.total_incoming > 0
    const hasOutgoing = movement.total_outgoing > 0
    const hasEntryAdjustments = movement.transactions.some(t => t.entry_type === 'adjust')
    
    const matchesEntryType = entryTypeFilter === 'all' ||
                            (entryTypeFilter === 'incoming' && hasIncoming) ||
                            (entryTypeFilter === 'outgoing' && hasOutgoing) ||
                            (entryTypeFilter === 'adjustment' && hasEntryAdjustments)
    
    // Date range filter - filter transactions within the date range
    const matchesDateRange = movement.transactions.some(transaction => {
      const transactionDate = new Date(transaction.transaction_date)
      const startDate = new Date(dateRangeFilter.startDate)
      const endDate = new Date(dateRangeFilter.endDate)
      return transactionDate >= startDate && transactionDate <= endDate
    })
    
    // Stock level filter
    const matchesStockLevel = stockLevelFilter === 'all' ||
                             (stockLevelFilter === 'in_stock' && movement.closing_stock > 0) ||
                             (stockLevelFilter === 'out_of_stock' && movement.closing_stock === 0) ||
                             (stockLevelFilter === 'low_stock' && movement.closing_stock > 0 && movement.closing_stock < 10) // Assuming 10 is low stock threshold
    
    return matchesProduct && matchesCategory && matchesSupplier && matchesEntryType && 
           matchesDateRange && matchesStockLevel
  })

  // Pagination logic
  const totalItems = filteredStockHistory.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedStockHistory = filteredStockHistory.slice(startIndex, endIndex)

  // Reset to first page when filters change
  useEffect(() => {
    dispatch({ type: 'SET_CURRENT_PAGE', payload: 1 })
  }, [productFilter, categoryFilter, supplierFilter, stockLevelFilter, entryTypeFilter, dateRangeFilter])

  // Pagination handlers
  const handlePageChange = (page: number) => {
    dispatch({ type: 'SET_CURRENT_PAGE', payload: page })
    // Scroll to top of content
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    dispatch({ type: 'SET_FILTER', payload: { key: 'itemsPerPage', value: newItemsPerPage } })
    dispatch({ type: 'SET_CURRENT_PAGE', payload: 1 }) // Reset to first page
  }

  // Validate and recalculate running balance if needed
  const validateRunningBalance = (movement: any) => {
    let calculatedBalance = movement.opening_stock
    
    for (const transaction of movement.transactions) {
      if (transaction.entry_type === 'in') {
        calculatedBalance += transaction.quantity
      } else if (transaction.entry_type === 'out') {
        calculatedBalance -= transaction.quantity
      }
      
      // Check if the running balance is incorrect
      if (Math.abs(calculatedBalance - transaction.running_balance) > 0.01) {
        console.warn(`Running balance mismatch for transaction ${transaction.id}: expected ${calculatedBalance}, got ${transaction.running_balance}`)
      }
    }
    
    return calculatedBalance
  }

  // Get product name for title when filtering by specific product
  const getProductName = () => {
    if (productId && stockHistory.length > 0) {
      return stockHistory[0].product_name
    }
    return null
  }

  const productName = getProductName()

  // Calculate grand totals across current filtered dataset (independent of pagination)
  const calculateGrandTotals = () => {
    // If we have a specific product selected, show only that product's data
    if (productId || productFilter !== 'all') {
      const targetProduct = stockHistory.find(movement => 
        (productId && movement.product_id === parseInt(productId)) ||
        (productFilter !== 'all' && movement.product_name === productFilter)
      )
      
      if (targetProduct) {
        return {
          opening_stock: targetProduct.opening_stock,
          opening_value: targetProduct.opening_value,
          total_incoming: targetProduct.total_incoming,
          total_incoming_value: targetProduct.total_incoming_value,
          total_outgoing: targetProduct.total_outgoing,
          total_outgoing_value: targetProduct.total_outgoing_value,
          closing_stock: targetProduct.closing_stock,
          closing_value: targetProduct.closing_value,
        }
      }
    }
    
    // Otherwise, sum across all filtered products
    return filteredStockHistory.reduce((totals, movement) => ({
      opening_stock: totals.opening_stock + movement.opening_stock,
      opening_value: totals.opening_value + movement.opening_value,
      total_incoming: totals.total_incoming + movement.total_incoming,
      total_incoming_value: totals.total_incoming_value + movement.total_incoming_value,
      total_outgoing: totals.total_outgoing + movement.total_outgoing,
      total_outgoing_value: totals.total_outgoing_value + movement.total_outgoing_value,
      closing_stock: totals.closing_stock + movement.closing_stock,
      closing_value: totals.closing_value + movement.closing_value,
    }), {
      opening_stock: 0,
      opening_value: 0,
      total_incoming: 0,
      total_incoming_value: 0,
      total_outgoing: 0,
      total_outgoing_value: 0,
      closing_stock: 0,
      closing_value: 0,
    })
  }

  const grandTotals = calculateGrandTotals()

  // Get available financial years from data
  const getAvailableFinancialYears = () => {
    const years = new Set<string>()
    stockHistory.forEach(movement => {
      years.add(movement.financial_year)
    })
    return Array.from(years).sort().reverse()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getEntryTypeLabel = (entryType: string) => {
    switch (entryType) {
      case 'in': return 'Incoming'
      case 'out': return 'Outgoing'
      case 'adjust': return 'Adjustment'
      default: return entryType
    }
  }

  const getEntryTypeColor = (entryType: string) => {
    switch (entryType) {
      case 'in': return '#28a745'
      case 'out': return '#dc3545'
      case 'adjust': return '#ffc107'
      default: return '#6c757d'
    }
  }

  const handleDownloadPDF = async () => {
    try {
      dispatch({ type: 'SET_DOWNLOADING_PDF', payload: true })
      dispatch({ type: 'CLEAR_ERROR' })
      
      // Get current financial year
      const fy = financialYearFilter === 'all' ? getCurrentFinancialYear() : financialYearFilter
      
      // Get product ID if filtering by specific product
      const productIdNum = (productId && forceReload === 0) ? parseInt(productId) : undefined
      
      await apiDownloadStockMovementHistoryPDF({
        product_id: productIdNum,
        productFilter: productFilter !== 'all' ? productFilter : undefined,
        categoryFilter: categoryFilter !== 'all' ? categoryFilter : undefined,
        supplierFilter: supplierFilter !== 'all' ? supplierFilter : undefined,
        stockLevelFilter: stockLevelFilter !== 'all' ? stockLevelFilter : undefined,
        entryTypeFilter: entryTypeFilter !== 'all' ? entryTypeFilter : undefined,
        date_from: dateRangeFilter.startDate,
        date_to: dateRangeFilter.endDate
      })
    } catch (err) {
      console.error('Failed to download PDF:', err)
      const errorMessage = handleApiError(err)
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
    } finally {
      dispatch({ type: 'SET_DOWNLOADING_PDF', payload: false })
    }
  }

  const handlePreviewPDF = () => {
    dispatch({ type: 'SET_SHOW_PDF_PREVIEW', payload: true })
  }

  // Enhanced Clear All functionality
  const handleClearAll = () => {
    dispatch({ type: 'RESET_FILTERS' })
    dispatch({ type: 'SET_FORCE_RELOAD', payload: prev => prev + 1 })
    
    // If we have a productId from URL, remove it and reload
    if (productId) {
      const newSearchParams = new URLSearchParams(searchParams)
      newSearchParams.delete('product')
      setSearchParams(newSearchParams)
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '100%' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px',
        paddingBottom: '12px',
        borderBottom: '2px solid #e9ecef'
      }}>
        <h1 style={{ margin: '0', fontSize: '28px', fontWeight: '600', color: '#2c3e50' }}>
          {productName ? `Stock Movement History - ${productName}` : 'Stock Movement History'}
        </h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Button 
            onClick={handlePreviewPDF} 
            variant="primary"
            disabled={downloadingPDF}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              minWidth: '140px'
            }}
          >
            {downloadingPDF ? (
              <>
                <span style={{ fontSize: '14px' }}>⏳</span>
                Generating PDF...
              </>
            ) : (
              <>
                <span style={{ fontSize: '14px' }}>📄</span>
                Stock History - PDF
              </>
            )}
          </Button>
          <Button onClick={onCancel} variant="secondary">
            ← Back to Products
          </Button>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Unified Filter System with real-time updates */}
      <UnifiedFilterSystem
        title="Stock Movement Filters"
        defaultCollapsed={true} // Filter section collapsed by default
        filters={[
          {
            id: 'financialYear',
            type: 'dropdown' as const,
            label: 'Financial Year',
            options: [
              { value: 'all', label: 'All Years' },
              ...getAvailableFinancialYears().map(year => ({ value: year, label: year }))
            ],
            width: 'third'
          },
          {
            id: 'product',
            type: 'dropdown' as const,
            label: 'Product',
            options: [
              { value: 'all', label: 'All Products' },
              ...products.map(product => ({ value: product.name, label: product.name }))
            ],
            width: 'third'
          },
          {
            id: 'category',
            type: 'dropdown' as const,
            label: 'Product Category',
            options: [
              { value: 'all', label: 'All Categories' },
              ...Array.from(new Set(products.map(p => p.category).filter(Boolean))).map(category => ({ value: category!, label: category! }))
            ],
            width: 'third'
          },
          {
            id: 'supplier',
            type: 'dropdown' as const,
            label: 'Supplier',
            options: [
              { value: 'all', label: 'All Suppliers' },
              ...Array.from(new Set(products.map(p => p.supplier).filter(Boolean))).map(supplier => ({ value: supplier!, label: supplier! }))
            ],
            width: 'third'
          },
          {
            id: 'stockLevel',
            type: 'dropdown' as const,
            label: 'Stock Level',
            options: [
              { value: 'all', label: 'All Stock Levels' },
              { value: 'in_stock', label: 'In Stock' },
              { value: 'out_of_stock', label: 'Out of Stock' },
              { value: 'low_stock', label: 'Low Stock (< 10)' }
            ],
            width: 'third'
          },
          {
            id: 'entryType',
            type: 'dropdown' as const,
            label: 'Entry Type',
            options: [
              { value: 'all', label: 'All Entries' },
              { value: 'incoming', label: 'Incoming' },
              { value: 'outgoing', label: 'Outgoing' },
              { value: 'adjustment', label: 'Adjustment' }
            ],
            width: 'third'
          },
          {
            id: 'dateRange',
            type: 'date-range' as const,
            label: 'Date Range',
            width: 'third'
          }
        ]}
        quickFilters={[
          {
            id: 'currentFY',
            label: 'Current FY',
            icon: '📅',
            action: () => dispatch({ type: 'SET_FILTER', payload: { key: 'financialYearFilter', value: getCurrentFinancialYear() } }),
            isActive: financialYearFilter === getCurrentFinancialYear()
          },
          {
            id: 'lastFY',
            label: 'Last FY',
            icon: '📊',
            action: () => {
              const currentYear = new Date().getFullYear()
              dispatch({ type: 'SET_FILTER', payload: { key: 'financialYearFilter', value: `${currentYear - 1}-${currentYear}` } })
            },
            isActive: financialYearFilter === `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
          },
          {
            id: 'incoming',
            label: 'Incoming Only',
            icon: '📥',
            action: () => dispatch({ type: 'SET_FILTER', payload: { key: 'entryTypeFilter', value: 'incoming' } }),
            isActive: entryTypeFilter === 'incoming'
          },
          {
            id: 'outgoing',
            label: 'Outgoing Only',
            icon: '📤',
            action: () => dispatch({ type: 'SET_FILTER', payload: { key: 'entryTypeFilter', value: 'outgoing' } }),
            isActive: entryTypeFilter === 'outgoing'
          },
          {
            id: 'lowStock',
            label: 'Low Stock',
            icon: '⚠️',
            action: () => dispatch({ type: 'SET_FILTER', payload: { key: 'stockLevelFilter', value: 'low_stock' } }),
            isActive: stockLevelFilter === 'low_stock'
          }
        ]}
        onFilterChange={handleFilterChange}
        onClearAll={handleClearAll}
        activeFiltersCount={
          (financialYearFilter !== 'all' ? 1 : 0) +
          (productFilter !== 'all' ? 1 : 0) +
          (categoryFilter !== 'all' ? 1 : 0) +
          (supplierFilter !== 'all' ? 1 : 0) +
          (stockLevelFilter !== 'all' ? 1 : 0) +
          (entryTypeFilter !== 'all' ? 1 : 0) +
          (productId ? 1 : 0) // Count productId from URL as an active filter
        }
        showQuickActions={true}
      />

      {/* Summary Section - computed from filtered dataset (not paginated) */}
      {filteredStockHistory.length > 0 && (
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          border: '1px solid #e9ecef', 
          borderRadius: '8px', 
          padding: '20px',
          marginBottom: '24px',
          marginTop: '20px' // Add space for dropdowns to expand
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#495057', fontSize: '18px' }}>
            {(() => {
              const selectedFY = financialYearFilter === 'all' ? getCurrentFinancialYear() : financialYearFilter
              return `Summary - FY ${selectedFY}`
            })()}
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '4px' }}>Opening Stock</div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#495057' }}>
                {grandTotals.opening_stock.toFixed(2)}
              </div>
              <div style={{ fontSize: '12px', color: '#6c757d' }}>
                {formatCurrency(grandTotals.opening_value)}
              </div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '4px' }}>Total Incoming</div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#28a745' }}>
                {grandTotals.total_incoming.toFixed(2)}
              </div>
              <div style={{ fontSize: '12px', color: '#6c757d' }}>
                {formatCurrency(grandTotals.total_incoming_value)}
              </div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '4px' }}>Total Outgoing</div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#dc3545' }}>
                {grandTotals.total_outgoing.toFixed(2)}
              </div>
              <div style={{ fontSize: '12px', color: '#6c757d' }}>
                {formatCurrency(grandTotals.total_outgoing_value)}
              </div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '4px' }}>Closing Stock</div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#495057' }}>
                {grandTotals.closing_stock.toFixed(2)}
              </div>
              <div style={{ fontSize: '12px', color: '#6c757d' }}>
                {formatCurrency(grandTotals.closing_value)}
              </div>
            </div>
          </div>
        </div>
      )}

      {historyLoading ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          color: '#6c757d',
          fontSize: '16px'
        }}>
          <div style={{ marginBottom: '12px' }}>⏳</div>
          Loading stock movement history...
        </div>
      ) : paginatedStockHistory.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          color: '#6c757d',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          backgroundColor: '#f8f9fa'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>📊</div>
          <div style={{ fontSize: '18px', marginBottom: '8px', fontWeight: '500' }}>
            No stock movements found
          </div>
          <div style={{ fontSize: '14px', marginBottom: '20px', maxWidth: '500px', margin: '0 auto 20px auto' }}>
            {stockHistory.length === 0 ? (
              'No stock movement data is available for the selected criteria. This could be due to:'
            ) : (
              'No stock movements match your current filters. Try adjusting your search criteria.'
            )}
          </div>
          {stockHistory.length === 0 && (
            <div style={{ 
              fontSize: '12px', 
              textAlign: 'left', 
              maxWidth: '400px', 
              margin: '0 auto 20px auto',
              padding: '12px',
              backgroundColor: '#e9ecef',
              borderRadius: '4px'
            }}>
              <div style={{ fontWeight: '500', marginBottom: '8px' }}>Possible reasons:</div>
              <ul style={{ margin: '0', paddingLeft: '20px' }}>
                <li>No stock transactions have been recorded yet</li>
                <li>The selected financial year has no data</li>
                <li>Database connection issues</li>
                <li>Insufficient permissions to access stock data</li>
              </ul>
            </div>
          )}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Button 
              variant="primary" 
              onClick={() => {
                dispatch({ type: 'SET_FORCE_RELOAD', payload: prev => prev + 1 })
                loadStockHistory()
              }}
            >
              Refresh Data
            </Button>
            {(productFilter !== 'all' || categoryFilter !== 'all' || supplierFilter !== 'all' || 
              stockLevelFilter !== 'all' || entryTypeFilter !== 'all' || financialYearFilter !== 'all') && (
              <Button 
                variant="secondary" 
                onClick={handleClearAll}
              >
                Clear All Filters
              </Button>
            )}
          </div>
          {process.env.NODE_ENV === 'development' && (
            <details style={{ marginTop: '20px', textAlign: 'left', maxWidth: '600px', margin: '0 auto' }}>
              <summary style={{ cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
                Debug Information (Development)
              </summary>
              <div style={{ 
                marginTop: '10px', 
                padding: '10px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '4px',
                fontSize: '12px',
                fontFamily: 'monospace'
              }}>
                <div><strong>Raw Data Count:</strong> {stockHistory.length}</div>
                <div><strong>Filtered Data Count:</strong> {filteredStockHistory.length}</div>
                <div><strong>Current Page:</strong> {currentPage}</div>
                <div><strong>Items Per Page:</strong> {itemsPerPage}</div>
                <div><strong>Financial Year:</strong> {financialYearFilter}</div>
                <div><strong>Product Filter:</strong> {productFilter}</div>
                <div><strong>Category Filter:</strong> {categoryFilter}</div>
                <div><strong>Supplier Filter:</strong> {supplierFilter}</div>
                <div><strong>Stock Level Filter:</strong> {stockLevelFilter}</div>
                <div><strong>Entry Type Filter:</strong> {entryTypeFilter}</div>
                <div><strong>Date Range:</strong> {dateRangeFilter.startDate} to {dateRangeFilter.endDate}</div>
              </div>
            </details>
          )}
        </div>
      ) : (
        <>
          {/* Individual Transactions Table */}
          {paginatedStockHistory.map((movement, index) => {
            // Validate running balance for debugging
            validateRunningBalance(movement)
            
            return (
            <div key={`${movement.product_id}-${movement.financial_year}`} style={{ marginBottom: '32px' }}>
              {/* Product Header */}
              {!productName && (
                <div style={{ 
                  backgroundColor: '#f8f9fa', 
                  padding: '16px', 
                  borderRadius: '8px 8px 0 0',
                  border: '1px solid #e9ecef',
                  borderBottom: 'none'
                }}>
                  <h3 style={{ margin: '0', color: '#495057', fontSize: '18px' }}>
                    {movement.product_name} - FY {movement.financial_year}
                  </h3>
                </div>
              )}
              
              {/* Transactions Table */}
              <div style={{ 
                border: '1px solid #e9ecef', 
                borderRadius: productName ? '8px' : '0 0 8px 8px', 
                overflow: 'hidden',
                backgroundColor: 'white'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #e9ecef' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Date</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Type</th>
                      <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#495057' }}>Quantity</th>
                      <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#495057' }}>Unit Price</th>
                      <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#495057' }}>Total Value</th>
                      <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#495057' }}>Running Balance</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Opening Balance Row */}
                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                      <td style={{ padding: '12px', fontWeight: '500', color: '#495057' }}>
                        {movement.financial_year.split('-')[0]}-04-01
                      </td>
                      <td style={{ padding: '12px', fontWeight: '500', color: '#495057' }}>
                        Opening Balance
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: '500', color: '#495057' }}>
                        {movement.opening_stock.toFixed(2)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: '500', color: '#495057' }}>
                        {formatCurrency(movement.opening_value / movement.opening_stock || 0)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: '500', color: '#495057' }}>
                        {formatCurrency(movement.opening_value)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: '500', color: '#495057' }}>
                        {movement.opening_stock.toFixed(2)}
                      </td>
                      <td style={{ padding: '12px', color: '#6c757d' }}>
                        -
                      </td>
                    </tr>
                    
                    {/* Individual Transactions */}
                    {movement.transactions.map((transaction) => (
                      <tr key={transaction.id} style={{ borderBottom: '1px solid #f1f3f4' }}>
                        <td style={{ padding: '12px', color: '#495057' }}>
                          {formatDate(transaction.transaction_date)}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ 
                            color: getEntryTypeColor(transaction.entry_type),
                            fontWeight: '500'
                          }}>
                            {getEntryTypeLabel(transaction.entry_type)}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#495057' }}>
                          {transaction.quantity.toFixed(2)}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#495057' }}>
                          {transaction.unit_price ? formatCurrency(transaction.unit_price) : '-'}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#495057' }}>
                          {transaction.total_value ? formatCurrency(transaction.total_value) : '-'}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#495057' }}>
                          {transaction.running_balance.toFixed(2)}
                        </td>
                        <td style={{ padding: '12px', color: '#6c757d' }}>
                          {transaction.reference_number || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
          })}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{
              marginTop: '24px',
              padding: '20px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #e9ecef',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              {/* Items per page selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', color: '#495057' }}>Show:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                  style={{
                    padding: '6px 8px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                >
                  <option value={3}>3 per page</option>
                  <option value={5}>5 per page</option>
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                </select>
              </div>

              {/* Page info */}
              <div style={{ fontSize: '14px', color: '#495057' }}>
                Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} products
              </div>

              {/* Pagination buttons */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Button
                  variant="secondary"
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  style={{ padding: '6px 12px', fontSize: '14px' }}
                >
                  First
                </Button>
                
                <Button
                  variant="secondary"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{ padding: '6px 12px', fontSize: '14px' }}
                >
                  Previous
                </Button>

                {/* Page numbers */}
                <div style={{ display: 'flex', gap: '4px' }}>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "primary" : "secondary"}
                        onClick={() => handlePageChange(pageNum)}
                        style={{ 
                          padding: '6px 12px', 
                          fontSize: '14px',
                          minWidth: '40px'
                        }}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>

                <Button
                  variant="secondary"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={{ padding: '6px 12px', fontSize: '14px' }}
                >
                  Next
                </Button>
                
                <Button
                  variant="secondary"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  style={{ padding: '6px 12px', fontSize: '14px' }}
                >
                  Last
                </Button>
              </div>
            </div>
          )}

          {/* Note */}
          <div style={{ 
            marginTop: '16px', 
            padding: '12px', 
            backgroundColor: '#fff3cd', 
            border: '1px solid #ffeaa7', 
            borderRadius: '4px',
            fontSize: '14px',
            color: '#856404'
          }}>
            <strong>Note:</strong> Stock movement history shows individual transactions for each financial year (April 1st to March 31st). 
            Opening stock, incoming, and outgoing calculations are based on stock adjustment records. 
            Values are calculated using average cost method.
          </div>
        </>
      )}

      {/* PDF Preview Modal */}
      {/* The PDFViewer component is not defined in the provided context,
          so this section will be commented out or removed if not available.
          Assuming PDFViewer is a separate component or will be added later. */}
      {/*
      <PDFViewer
        isOpen={showPDFPreview}
        onClose={() => dispatch({ type: 'SET_SHOW_PDF_PREVIEW', payload: false })}
        type="stock-history"
        title={`Stock Movement History - ${financialYearFilter === 'all' ? getCurrentFinancialYear() : financialYearFilter}`}
        financialYear={financialYearFilter === 'all' ? getCurrentFinancialYear() : financialYearFilter}
        productId={(productId && forceReload === 0) ? parseInt(productId) : undefined}
        filters={{
          productFilter: productFilter !== 'all' ? productFilter : undefined,
          categoryFilter: categoryFilter !== 'all' ? categoryFilter : undefined,
          supplierFilter: supplierFilter !== 'all' ? supplierFilter : undefined,
          stockLevelFilter: stockLevelFilter !== 'all' ? stockLevelFilter : undefined,
          entryTypeFilter: entryTypeFilter !== 'all' ? entryTypeFilter : undefined
        }}
      />
      */}
    </div>
  )
}
