import React, { useReducer, useEffect, useMemo, useState } from 'react'
import { SummaryCardGrid, type SummaryCardItem } from './common/SummaryCardGrid'
import { useSearchParams } from 'react-router-dom'
import { apiGetStockMovementHistory, apiDownloadStockMovementHistoryPDF, apiGetProducts, Product } from '../lib/api'
import { Button } from './Button'
import { ErrorMessage } from './ErrorMessage'
import { UnifiedFilterSystem } from './UnifiedFilterSystem'
import { createApiErrorHandler } from '../lib/apiUtils'
import { StockMovementHistoryTable } from './StockMovementHistoryTable'

// Proper TypeScript interfaces following quality rules - matching backend types
interface StockMovement {
  product_id: number
  product_name: string
  financial_year: string
  opening_stock: number
  opening_value: number
  total_incoming: number
  total_incoming_value: number
  total_outgoing: number
  total_outgoing_value: number
  closing_stock: number
  closing_value: number
  transactions: StockTransaction[]
}

// Normalize backend timestamps that may include microseconds (6 digits) to milliseconds (3 digits)
// Example: 2025-08-25T08:33:19.980740 -> 2025-08-25T08:33:19.980
const normalizeToMs = (s: string): string => s.replace(/\.(\d{3})\d+$/, '.$1')

interface StockTransaction {
  id: number
  product_id: number
  product_name: string
  transaction_date: string
  entry_type: string // 'in', 'out', 'adjust'
  quantity: number
  unit_price: number | null
  total_value: number | null
  ref_type: string | null
  ref_id: number | null
  reference_number: string | null
  notes: string | null
  financial_year: string
  running_balance: number
}

interface DateRange {
  startDate: string
  endDate: string
}

// Define the state interface for useReducer with proper types
interface StockHistoryState {
  stockHistory: StockMovement[]
  products: Product[]
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
    dateRangeFilter: DateRange
  }
  forceReload: number
  debounceTimer: ReturnType<typeof setTimeout> | null
}

// Define action types for useReducer with proper payload types
type StockHistoryAction =
  | { type: 'SET_STOCK_HISTORY'; payload: StockMovement[] }
  | { type: 'SET_PRODUCTS'; payload: Product[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_DOWNLOADING_PDF'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SHOW_PDF_PREVIEW'; payload: boolean }
  | { type: 'SET_CURRENT_PAGE'; payload: number }
  | { type: 'SET_ITEMS_PER_PAGE'; payload: number }
  | { type: 'SET_FILTER'; payload: { key: keyof StockHistoryState['filters']; value: string | DateRange } }
  | { type: 'SET_FORCE_RELOAD'; payload: number }
  | { type: 'SET_DEBOUNCE_TIMER'; payload: ReturnType<typeof setTimeout> | null }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET_FILTERS' }

// Initial state with proper types
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

// Reducer function with proper type safety
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
    case 'SET_ITEMS_PER_PAGE':
      return { ...state, itemsPerPage: action.payload }
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

// Main component with proper TypeScript types
export const StockHistoryForm: React.FC<{ onSuccess?: () => void; onCancel: () => void }> = ({ onSuccess, onCancel }) => {
  const [state, dispatch] = useReducer(stockHistoryReducer, initialState)
  const [searchParams, setSearchParams] = useSearchParams()
  const [showDetails, setShowDetails] = useState(false)
  const [selectedMovement, setSelectedMovement] = useState<StockMovement | null>(null)
  
  // Create API error handler (memoized)
  const handleApiError = useMemo(() => createApiErrorHandler(() => {}), [])
  
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
  
  // Memoized product name with proper types
  const productName = useMemo((): string | null => {
    if (productId && products.length > 0) {
      const product = products.find(p => p.id === parseInt(productId))
      return product ? product.name : null
    }
    return null
  }, [productId, products])

  // Memoized loadProducts function following quality rules
  const loadProducts = useCallback(async (): Promise<void> => {
    try {
      const productsData = await apiGetProducts()
      dispatch({ type: 'SET_PRODUCTS', payload: productsData })
    } catch (err) {
      console.error('Failed to load products:', err)
      const errorMessage = handleApiError(err)
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
    }
  }, [handleApiError])

  // Memoized loadStockHistory function with proper error handling
  const loadStockHistory = useCallback(async (): Promise<void> => {
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
  }, [financialYearFilter, productId, forceReload, handleApiError])

  // Memoized filtered stock history with proper types
  const filteredStockHistory = useMemo((): StockMovement[] => {
    return stockHistory.filter((movement: StockMovement) => {
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
      const hasEntryAdjustments = movement.transactions.some((t: StockTransaction) => t.entry_type === 'adjust')
      
      const matchesEntryType = entryTypeFilter === 'all' ||
                              (entryTypeFilter === 'incoming' && hasIncoming) ||
                              (entryTypeFilter === 'outgoing' && hasOutgoing) ||
                              (entryTypeFilter === 'adjustment' && hasEntryAdjustments)
      
      // Date range filter - include the ENTIRE end day to avoid excluding same-day transactions
      const matchesDateRange = movement.transactions.some((transaction: StockTransaction) => {
        const transactionDate = new Date(normalizeToMs(transaction.transaction_date))
        const startDate = new Date(dateRangeFilter.startDate)
        const endDate = new Date(dateRangeFilter.endDate)
        // Normalize end date to end-of-day 23:59:59.999
        endDate.setHours(23, 59, 59, 999)
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
  const paginatedStockHistory = useMemo((): StockMovement[] => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredStockHistory.slice(startIndex, endIndex)
  }, [filteredStockHistory, currentPage, itemsPerPage])

  // Memoized total pages
  const totalPages = useMemo((): number => {
    return Math.ceil(filteredStockHistory.length / itemsPerPage)
  }, [filteredStockHistory.length, itemsPerPage])

  // Memoized filter options
  const filterOptions = useMemo(() => {
    const categories = [...new Set(products.map(p => p.category).filter(Boolean))]
    const suppliers = [...new Set(products.map(p => p.supplier).filter(Boolean))]
    
    return {
      products: products.map(p => ({ value: p.name || '', label: p.name || '' })),
      categories: categories.map(c => ({ value: c || '', label: c || '' })),
      suppliers: suppliers.map(s => ({ value: s || '', label: s || '' })),
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

  // Memoize filters config to avoid re-creating array every render
  const unifiedFilters = useMemo(() => ([
    {
      id: 'financialYear',
      type: 'dropdown' as const,
      label: 'Financial Year',
      options: filterOptions.financialYears,
      defaultValue: financialYearFilter
    },
    {
      id: 'product',
      type: 'dropdown' as const,
      label: 'Product',
      options: filterOptions.products,
      defaultValue: productFilter
    },
    {
      id: 'category',
      type: 'dropdown' as const,
      label: 'Category',
      options: filterOptions.categories,
      defaultValue: categoryFilter
    },
    {
      id: 'supplier',
      type: 'dropdown' as const,
      label: 'Supplier',
      options: filterOptions.suppliers,
      defaultValue: supplierFilter
    },
    {
      id: 'stockLevel',
      type: 'stock-level' as const,
      label: 'Stock Level',
      options: filterOptions.stockLevels,
      defaultValue: stockLevelFilter
    },
    {
      id: 'entryType',
      type: 'dropdown' as const,
      label: 'Entry Type',
      options: filterOptions.entryTypes,
      defaultValue: entryTypeFilter
    },
    {
      id: 'dateRange',
      type: 'date-range' as const,
      label: 'Date Range',
      defaultValue: dateRangeFilter
    }
  ]), [filterOptions, financialYearFilter, productFilter, categoryFilter, supplierFilter, stockLevelFilter, entryTypeFilter, dateRangeFilter])

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
  }, [loadProducts])

  useEffect(() => {
    loadStockHistory()
  }, [loadStockHistory])

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
        dispatch({ type: 'SET_FORCE_RELOAD', payload: forceReload + 1 })
      }, 500) // 500ms delay
      
      dispatch({ type: 'SET_DEBOUNCE_TIMER', payload: timer })
    }
  }, [debounceTimer, forceReload])

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
    dispatch({ type: 'SET_ITEMS_PER_PAGE', payload: newItemsPerPage })
    dispatch({ type: 'SET_CURRENT_PAGE', payload: 1 }) // Reset to first page
  }

  // Validate and recalculate running balance if needed
  const validateRunningBalance = (movement: StockMovement) => {
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

  // Calculate grand totals across current filtered dataset (independent of pagination)
  const grandTotals = useMemo(() => {
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
  }, [productId, productFilter, stockHistory, filteredStockHistory])

  // Get available financial years from data
  const availableFinancialYears = useMemo(() => {
    const years = new Set<string>()
    stockHistory.forEach(movement => {
      years.add(movement.financial_year)
    })
    return Array.from(years).sort().reverse()
  }, [stockHistory])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(normalizeToMs(dateString)).toLocaleDateString('en-IN', {
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
    dispatch({ type: 'SET_FORCE_RELOAD', payload: forceReload + 1 })
    
    // If we have a productId from URL, remove it and reload
    if (productId) {
      const newSearchParams = new URLSearchParams(searchParams)
      newSearchParams.delete('product')
      setSearchParams(newSearchParams)
    }
  }

  // Quick filter actions
  const quickFilterActions = [
    {
      id: 'current-fy',
      label: 'Current FY',
      icon: '📅',
      action: () => dispatch({ type: 'SET_FILTER', payload: { key: 'financialYearFilter', value: getCurrentFinancialYear() } }),
      isActive: financialYearFilter === getCurrentFinancialYear()
    },
    {
      id: 'previous-fy',
      label: 'Previous FY',
      icon: '📅',
      action: () => {
        const currentYear = new Date().getFullYear()
        dispatch({ type: 'SET_FILTER', payload: { key: 'financialYearFilter', value: `${currentYear - 1}-${currentYear}` } })
      },
      isActive: financialYearFilter === `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
    },
    {
      id: 'incoming-only',
      label: 'Incoming Only',
      icon: '📥',
      action: () => dispatch({ type: 'SET_FILTER', payload: { key: 'entryTypeFilter', value: 'incoming' } }),
      isActive: entryTypeFilter === 'incoming'
    },
    {
      id: 'outgoing-only',
      label: 'Outgoing Only',
      icon: '📤',
      action: () => dispatch({ type: 'SET_FILTER', payload: { key: 'entryTypeFilter', value: 'outgoing' } }),
      isActive: entryTypeFilter === 'outgoing'
    },
    {
      id: 'low-stock',
      label: 'Low Stock',
      icon: '⚠️',
      action: () => dispatch({ type: 'SET_FILTER', payload: { key: 'stockLevelFilter', value: 'low_stock' } }),
      isActive: stockLevelFilter === 'low_stock'
    }
  ]

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
        filters={unifiedFilters}
        quickFilters={quickFilterActions}
        onFilterChange={handleFilterChange}
        onClearAll={handleClearAll}
      />

      {/* Loading State */}
      {historyLoading && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          padding: '40px',
          fontSize: '16px',
          color: '#6c757d'
        }}>
          <span style={{ marginRight: '8px' }}>⏳</span>
          Loading stock movement history...
        </div>
      )}

      {/* Error State */}
      {error && !historyLoading && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          padding: '40px',
          fontSize: '16px',
          color: '#dc3545'
        }}>
          <span style={{ marginRight: '8px' }}>❌</span>
          {error}
        </div>
      )}

      {/* Empty State */}
      {!historyLoading && !error && paginatedStockHistory.length === 0 && (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          padding: '40px',
          fontSize: '16px',
          color: '#6c757d',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '48px', marginBottom: '16px' }}>📊</span>
          <h3 style={{ margin: '0 0 8px 0', color: '#495057' }}>No Stock Movement Data Found</h3>
          <p style={{ margin: '0 0 16px 0', maxWidth: '400px' }}>
            No stock movement history matches your current filters. Try adjusting your search criteria or check if there's data for the selected time period.
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button 
              variant="primary" 
              onClick={() => {
                dispatch({ type: 'SET_FORCE_RELOAD', payload: forceReload + 1 })
                loadStockHistory()
              }}
            >
              🔄 Refresh Data
            </Button>
            <Button variant="secondary" onClick={handleClearAll}>
              🗑️ Clear Filters
            </Button>
          </div>
        </div>
      )}

      {/* Data Display */}
      {!historyLoading && !error && paginatedStockHistory.length > 0 && (
        <>
          {/* Grand Totals Summary - using shared SummaryCardGrid */}
          <SummaryCardGrid
            items={([
              { label: 'Opening Stock', primary: `${grandTotals.opening_stock.toFixed(2)} units`, secondary: `Value: ${formatCurrency(grandTotals.opening_value)}` },
              { label: 'Total Incoming', primary: `${grandTotals.total_incoming.toFixed(2)} units`, secondary: `Value: ${formatCurrency(grandTotals.total_incoming_value)}` },
              { label: 'Total Outgoing', primary: `${grandTotals.total_outgoing.toFixed(2)} units`, secondary: `Value: ${formatCurrency(grandTotals.total_outgoing_value)}` },
              { label: 'Closing Stock', primary: `${grandTotals.closing_stock.toFixed(2)} units`, secondary: `Value: ${formatCurrency(grandTotals.closing_value)}` },
            ] as SummaryCardItem[])}
          />

          {/* Stock Movement Table */}
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '8px', 
            overflow: 'hidden',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginBottom: '20px'
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                fontSize: '14px'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Product</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>Opening Stock</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>Incoming</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>Outgoing</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>Closing Stock</th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedStockHistory.map((movement, index) => (
                    <tr key={`${movement.product_id}-${movement.financial_year}`} style={{ 
                      borderBottom: '1px solid #f1f3f4',
                      backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa'
                    }}>
                      <td style={{ padding: '12px', borderBottom: '1px solid #f1f3f4' }}>
                        <div>
                          <strong>{movement.product_name}</strong>
                          <br />
                          <small style={{ color: '#6c757d' }}>FY: {movement.financial_year}</small>
                        </div>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #f1f3f4' }}>
                        <div>{movement.opening_stock.toFixed(2)}</div>
                        <small style={{ color: '#6c757d' }}>{formatCurrency(movement.opening_value)}</small>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #f1f3f4' }}>
                        <div style={{ color: '#28a745' }}>+{movement.total_incoming.toFixed(2)}</div>
                        <small style={{ color: '#6c757d' }}>{formatCurrency(movement.total_incoming_value)}</small>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #f1f3f4' }}>
                        <div style={{ color: '#dc3545' }}>-{movement.total_outgoing.toFixed(2)}</div>
                        <small style={{ color: '#6c757d' }}>{formatCurrency(movement.total_outgoing_value)}</small>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #f1f3f4' }}>
                        <div style={{ 
                          fontWeight: 'bold',
                          color: movement.closing_stock > 0 ? '#28a745' : '#dc3545'
                        }}>
                          {movement.closing_stock.toFixed(2)}
                        </div>
                        <small style={{ color: '#6c757d' }}>{formatCurrency(movement.closing_value)}</small>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #f1f3f4' }}>
                        <Button 
                          variant="primary" 
                          onClick={() => {
                            setSelectedMovement(movement)
                            setShowDetails(true)
                          }}
                        >
                          📊 View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: '8px',
              marginTop: '20px'
            }}>
              <Button 
                variant="secondary" 
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                ← Previous
              </Button>
              
              <span style={{ fontSize: '14px', color: '#6c757d' }}>
                Page {currentPage} of {totalPages}
              </span>
              
              <Button 
                variant="secondary" 
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                Next →
              </Button>
            </div>
          )}
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
        productId={productId ? parseInt(productId) : undefined}
        filters={{
          product: productFilter,
          category: categoryFilter,
          supplier: supplierFilter,
          stockLevel: stockLevelFilter,
          entryType: entryTypeFilter,
          dateRange: dateRangeFilter
        }}
      />
      */}

      {/* Details Modal with drilldown table */}
      {showDetails && selectedMovement && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ width: '90%', maxWidth: '1400px', maxHeight: '85vh', overflow: 'hidden', backgroundColor: 'white', borderRadius: '8px', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ margin: 0 }}>
                Stock Movements • {selectedMovement.product_name} • FY {selectedMovement.financial_year}
              </h2>
              <Button variant="secondary" onClick={() => setShowDetails(false)}>Close</Button>
            </div>

            <StockMovementHistoryTable
              rows={selectedMovement.transactions.map(t => ({
                id: t.id,
                timestamp: t.transaction_date,
                type: t.entry_type,
                quantity_change: t.entry_type === 'out' ? -Math.abs(t.quantity) : Math.abs(t.quantity),
                sku: (t as any).sku,
                category: (t as any).category,
                source: null,
                destination: null,
                reference: t.reference_number,
                user: null,
                unit_price: t.unit_price,
                value: t.total_value,
                supplier: (t as any).supplier_name,
                balance: t.running_balance,
                remarks: t.notes
              }))}
            />
          </div>
        </div>
      )}
    </div>
  )
}
