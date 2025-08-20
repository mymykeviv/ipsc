import React, { useState, useEffect, useCallback } from 'react'
import { apiGetStockMovementHistory, StockMovement, StockTransaction, apiGetProducts, Product, apiDownloadStockMovementHistoryPDF } from '../lib/api'
import { Button } from './Button'
import { ErrorMessage } from './ErrorMessage'
import { useAuth } from '../modules/AuthContext'
import { createApiErrorHandler } from '../lib/apiUtils'
import { UnifiedFilterSystem, DateRange } from './UnifiedFilterSystem'
import { useSearchParams } from 'react-router-dom'
import { PDFViewer } from './PDFViewer'

interface StockHistoryFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export function StockHistoryForm({ onSuccess, onCancel }: StockHistoryFormProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const productId = searchParams.get('product')
  
  const [stockHistory, setStockHistory] = useState<StockMovement[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [financialYearFilter, setFinancialYearFilter] = useState('all')
  
  // New filter states
  const [productFilter, setProductFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [supplierFilter, setSupplierFilter] = useState('all')
  const [stockLevelFilter, setStockLevelFilter] = useState('all')
  const [entryTypeFilter, setEntryTypeFilter] = useState('all')
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRange>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10)
  })
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5) // Show 5 products per page
  
  // Force reload state
  const [forceReload, setForceReload] = useState(0)
  
  // Debounce state for real-time updates
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)
  
  // PDF download state
  const [downloadingPDF, setDownloadingPDF] = useState(false)
  const [showPDFPreview, setShowPDFPreview] = useState(false)
  
  const { forceLogout } = useAuth()
  const handleApiError = createApiErrorHandler(forceLogout)

  // Get current financial year
  const getCurrentFinancialYear = () => {
    const now = new Date()
    const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
    return `${year}-${year + 1}`
  }

  const loadProducts = async () => {
    try {
      const productsData = await apiGetProducts()
      setProducts(productsData)
    } catch (err) {
      console.error('Failed to load products:', err)
      const errorMessage = handleApiError(err)
      setError(errorMessage)
    }
  }

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
      
      setHistoryLoading(true)
      setError(null)
      
      // Use current FY as default, or selected FY
      const fy = financialYearFilter === 'all' ? getCurrentFinancialYear() : financialYearFilter
      
      // If forceReload is triggered, don't use productId from URL
      const productIdNum = (productId && forceReload === 0) ? parseInt(productId) : undefined
      
      const history = await apiGetStockMovementHistory(fy, productIdNum)
      console.log('Stock history loaded:', history)
      setStockHistory(history)
    } catch (err) {
      console.error('Failed to load stock history:', err)
      const errorMessage = handleApiError(err)
      setError(errorMessage)
    } finally {
      setHistoryLoading(false)
    }
  }, [financialYearFilter, productId, forceReload, productFilter, categoryFilter, supplierFilter, stockLevelFilter, entryTypeFilter, dateRangeFilter])

  // Set product filter when productId is present in URL
  useEffect(() => {
    if (productId && products.length > 0) {
      const selectedProduct = products.find(p => p.id === parseInt(productId))
      if (selectedProduct) {
        setProductFilter(selectedProduct.name)
      } else {
        // Product not found - show error and reset filter
        setError(`Product with ID ${productId} not found`)
        setProductFilter('all')
        // Remove invalid product ID from URL
        const newSearchParams = new URLSearchParams(searchParams)
        newSearchParams.delete('product')
        setSearchParams(newSearchParams)
      }
    } else if (!productId) {
      // If no productId in URL, reset product filter to 'all'
      setProductFilter('all')
    }
  }, [productId, products, searchParams, setSearchParams])

  useEffect(() => {
    loadProducts()
  }, []) // Only load products once on mount

  useEffect(() => {
    loadStockHistory()
  }, [financialYearFilter, productId, forceReload, loadStockHistory]) // Only reload when these specific values change

  // Additional effect to handle filter changes that require data reload
  useEffect(() => {
    // When any filter changes, we need to reload the data
    // This ensures the API gets the latest filter state
    if (forceReload > 0) {
      loadStockHistory()
    }
  }, [forceReload, loadStockHistory])

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
    }
  }, [debounceTimer])

  // Real-time filter update handler with debouncing
  const handleFilterChange = useCallback((filters: Record<string, any>) => {
    console.log('Filter change detected:', filters)
    
    // Clear existing debounce timer
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    
    // Update individual filter states based on unified filter values
    let hasChanges = false
    
    if (filters.financialYear !== undefined && filters.financialYear !== financialYearFilter) {
      setFinancialYearFilter(filters.financialYear)
      hasChanges = true
    }
    if (filters.product !== undefined && filters.product !== productFilter) {
      setProductFilter(filters.product)
      hasChanges = true
    }
    if (filters.category !== undefined && filters.category !== categoryFilter) {
      setCategoryFilter(filters.category)
      hasChanges = true
    }
    if (filters.supplier !== undefined && filters.supplier !== supplierFilter) {
      setSupplierFilter(filters.supplier)
      hasChanges = true
    }
    if (filters.stockLevel !== undefined && filters.stockLevel !== stockLevelFilter) {
      setStockLevelFilter(filters.stockLevel)
      hasChanges = true
    }
    if (filters.entryType !== undefined && filters.entryType !== entryTypeFilter) {
      setEntryTypeFilter(filters.entryType)
      hasChanges = true
    }
    if (filters.dateRange !== undefined && 
        (filters.dateRange.startDate !== dateRangeFilter.startDate || 
         filters.dateRange.endDate !== dateRangeFilter.endDate)) {
      setDateRangeFilter(filters.dateRange)
      hasChanges = true
    }
    
    // Only trigger reload if there are actual changes
    if (hasChanges) {
      // Debounce the reload to prevent rapid API calls
      const timer = setTimeout(() => {
        console.log('Triggering data reload due to filter changes:', filters)
        setForceReload(prev => prev + 1)
      }, 500) // 500ms delay
      
      setDebounceTimer(timer)
    }
  }, [debounceTimer, financialYearFilter, productFilter, categoryFilter, supplierFilter, stockLevelFilter, entryTypeFilter, dateRangeFilter])

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
    setCurrentPage(1)
  }, [productFilter, categoryFilter, supplierFilter, stockLevelFilter, entryTypeFilter, dateRangeFilter])

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Scroll to top of content
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset to first page
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
      setDownloadingPDF(true)
      setError(null)
      
      // Get current financial year
      const fy = financialYearFilter === 'all' ? getCurrentFinancialYear() : financialYearFilter
      
      // Get product ID if filtering by specific product
      const productIdNum = (productId && forceReload === 0) ? parseInt(productId) : undefined
      
      await apiDownloadStockMovementHistoryPDF(fy, productIdNum, {
        productFilter: productFilter !== 'all' ? productFilter : undefined,
        categoryFilter: categoryFilter !== 'all' ? categoryFilter : undefined,
        supplierFilter: supplierFilter !== 'all' ? supplierFilter : undefined,
        stockLevelFilter: stockLevelFilter !== 'all' ? stockLevelFilter : undefined,
        entryTypeFilter: entryTypeFilter !== 'all' ? entryTypeFilter : undefined
      })
    } catch (err) {
      console.error('Failed to download PDF:', err)
      const errorMessage = handleApiError(err)
      setError(errorMessage)
    } finally {
      setDownloadingPDF(false)
    }
  }

  const handlePreviewPDF = () => {
    setShowPDFPreview(true)
  }

  // Enhanced Clear All functionality
  const handleClearAll = () => {
    setFinancialYearFilter('all')
    setProductFilter('all')
    setCategoryFilter('all')
    setSupplierFilter('all')
    setStockLevelFilter('all')
    setEntryTypeFilter('all')
    setDateRangeFilter({
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      endDate: new Date().toISOString().slice(0, 10)
    })
    setCurrentPage(1) // Reset pagination
    
    // If we have a productId from URL, remove it and reload
    if (productId) {
      const newSearchParams = new URLSearchParams(searchParams)
      newSearchParams.delete('product')
      setSearchParams(newSearchParams)
      // Force reload to show all products
      setForceReload(prev => prev + 1)
    } else {
      // Just reload the current data
      loadStockHistory()
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
            action: () => setFinancialYearFilter(getCurrentFinancialYear()),
            isActive: financialYearFilter === getCurrentFinancialYear()
          },
          {
            id: 'lastFY',
            label: 'Last FY',
            icon: '📊',
            action: () => {
              const currentYear = new Date().getFullYear()
              setFinancialYearFilter(`${currentYear - 1}-${currentYear}`)
            },
            isActive: financialYearFilter === `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
          },
          {
            id: 'incoming',
            label: 'Incoming Only',
            icon: '📥',
            action: () => setEntryTypeFilter('incoming'),
            isActive: entryTypeFilter === 'incoming'
          },
          {
            id: 'outgoing',
            label: 'Outgoing Only',
            icon: '📤',
            action: () => setEntryTypeFilter('outgoing'),
            isActive: entryTypeFilter === 'outgoing'
          },
          {
            id: 'lowStock',
            label: 'Low Stock',
            icon: '⚠️',
            action: () => setStockLevelFilter('low_stock'),
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
          <div style={{ fontSize: '18px', marginBottom: '8px', fontWeight: '500' }}>
            No stock movements found
          </div>
          <div style={{ fontSize: '14px' }}>
            {productName ? `No stock movements for ${productName} in the selected period` : 'No stock movements in the selected period'}
          </div>
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
      <PDFViewer
        isOpen={showPDFPreview}
        onClose={() => setShowPDFPreview(false)}
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
    </div>
  )
}
