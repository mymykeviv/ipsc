import React, { useState, useEffect } from 'react'
import { apiGetStockMovementHistory, StockMovement, StockTransaction, apiGetProducts, Product, apiDownloadStockMovementHistoryPDF } from '../lib/api'
import { Button } from './Button'
import { ErrorMessage } from './ErrorMessage'
import { useAuth } from '../modules/AuthContext'
import { createApiErrorHandler } from '../lib/apiUtils'
import { EnhancedFilterBar } from './EnhancedFilterBar'
import { FilterDropdown } from './FilterDropdown'
import { DateFilter } from './DateFilter'
import { useSearchParams } from 'react-router-dom'

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
  const [entryTypeFilter, setEntryTypeFilter] = useState('all')
  const [dateRangeFilter, setDateRangeFilter] = useState('all')
  const [referenceTypeFilter, setReferenceTypeFilter] = useState('all')
  const [referenceSearch, setReferenceSearch] = useState('')
  const [amountRangeFilter, setAmountRangeFilter] = useState('all')
  const [stockLevelFilter, setStockLevelFilter] = useState('all')
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5) // Show 5 products per page
  
  // Force reload state
  const [forceReload, setForceReload] = useState(0)
  
  // PDF download state
  const [downloadingPDF, setDownloadingPDF] = useState(false)
  
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

  const loadStockHistory = async () => {
    try {
      setHistoryLoading(true)
      setError(null)
      
      // Use current FY as default, or selected FY
      const fy = financialYearFilter === 'all' ? getCurrentFinancialYear() : financialYearFilter
      
      // If forceReload is triggered, don't use productId from URL
      const productIdNum = (productId && forceReload === 0) ? parseInt(productId) : undefined
      
      const history = await apiGetStockMovementHistory(fy, productIdNum)
      setStockHistory(history)
    } catch (err) {
      console.error('Failed to load stock history:', err)
      const errorMessage = handleApiError(err)
      setError(errorMessage)
    } finally {
      setHistoryLoading(false)
    }
  }

  // Set product filter when productId is present in URL
  useEffect(() => {
    if (productId && products.length > 0) {
      const selectedProduct = products.find(p => p.id === parseInt(productId))
      if (selectedProduct) {
        setProductFilter(selectedProduct.name)
      }
    } else if (!productId) {
      // If no productId in URL, reset product filter to 'all'
      setProductFilter('all')
    }
  }, [productId, products])

  useEffect(() => {
    loadProducts()
    loadStockHistory()
  }, [financialYearFilter, productId, forceReload])

  // Filter stock history based on all filters
  const filteredStockHistory = stockHistory.filter(movement => {
    // Product filter - if productId is present, always include that product
    const matchesProduct = (productId && movement.product_id === parseInt(productId)) ||
                          productFilter === 'all' || 
                          movement.product_name === productFilter
    
    // Entry type filter (based on transaction types)
    const hasIncoming = movement.total_incoming > 0
    const hasOutgoing = movement.total_outgoing > 0
    const hasEntryAdjustments = movement.transactions.some(t => t.entry_type === 'adjust')
    
    const matchesEntryType = entryTypeFilter === 'all' ||
                            (entryTypeFilter === 'incoming' && hasIncoming) ||
                            (entryTypeFilter === 'outgoing' && hasOutgoing) ||
                            (entryTypeFilter === 'adjustment' && hasEntryAdjustments)
    
    // Reference type filter
    const hasInvoices = movement.transactions.some(t => t.ref_type === 'invoice')
    const hasPurchases = movement.transactions.some(t => t.ref_type === 'purchase')
    const hasRefAdjustments = movement.transactions.some(t => t.ref_type === 'adjustment')
    
    const matchesReferenceType = referenceTypeFilter === 'all' ||
                                (referenceTypeFilter === 'invoice' && hasInvoices) ||
                                (referenceTypeFilter === 'purchase' && hasPurchases) ||
                                (referenceTypeFilter === 'adjustment' && hasRefAdjustments)
    
    // Reference search
    const matchesReferenceSearch = !referenceSearch || 
                                  movement.transactions.some(t => 
                                    t.reference_number?.toLowerCase().includes(referenceSearch.toLowerCase())
                                  )
    
    // Stock level filter
    const matchesStockLevel = stockLevelFilter === 'all' ||
                             (stockLevelFilter === 'in_stock' && movement.closing_stock > 0) ||
                             (stockLevelFilter === 'out_of_stock' && movement.closing_stock === 0) ||
                             (stockLevelFilter === 'low_stock' && movement.closing_stock > 0 && movement.closing_stock < 10) // Assuming 10 is low stock threshold
    
    return matchesProduct && matchesEntryType && matchesReferenceType && 
           matchesReferenceSearch && matchesStockLevel
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
  }, [productFilter, entryTypeFilter, dateRangeFilter, referenceTypeFilter, referenceSearch, amountRangeFilter, stockLevelFilter])

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
    // Debug: Log the filtered data to understand what's happening
    console.log('Filtered Stock History:', filteredStockHistory)
    console.log('Stock History:', stockHistory)
    
    // If we have a specific product selected, show only that product's data
    if (productId || productFilter !== 'all') {
      const targetProduct = stockHistory.find(movement => 
        (productId && movement.product_id === parseInt(productId)) ||
        (productFilter !== 'all' && movement.product_name === productFilter)
      )
      
      if (targetProduct) {
        console.log('Target Product:', targetProduct)
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
      
      await apiDownloadStockMovementHistoryPDF(fy, productIdNum)
    } catch (err) {
      console.error('Failed to download PDF:', err)
      const errorMessage = handleApiError(err)
      setError(errorMessage)
    } finally {
      setDownloadingPDF(false)
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
            onClick={handleDownloadPDF} 
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
                Download PDF
              </>
            )}
          </Button>
          <Button onClick={onCancel} variant="secondary">
            ← Back to Products
          </Button>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Enhanced Filter Options */}
      <EnhancedFilterBar 
        title="Stock Movement Filters"
        activeFiltersCount={
          (financialYearFilter !== 'all' ? 1 : 0) +
          (productFilter !== 'all' ? 1 : 0) +
          (entryTypeFilter !== 'all' ? 1 : 0) +
          (dateRangeFilter !== 'all' ? 1 : 0) +
          (referenceTypeFilter !== 'all' ? 1 : 0) +
          (referenceSearch ? 1 : 0) +
          (amountRangeFilter !== 'all' ? 1 : 0) +
          (stockLevelFilter !== 'all' ? 1 : 0) +
          (productId ? 1 : 0) // Count productId from URL as an active filter
        }
        onClearAll={() => {
          setFinancialYearFilter('all')
          setProductFilter('all')
          setEntryTypeFilter('all')
          setDateRangeFilter('all')
          setReferenceTypeFilter('all')
          setReferenceSearch('')
          setAmountRangeFilter('all')
          setStockLevelFilter('all')
          setCurrentPage(1) // Reset pagination
          
          // If we have a productId from URL, remove it and reload
          if (productId) {
            const newSearchParams = new URLSearchParams(searchParams)
            newSearchParams.delete('product')
            // Use setSearchParams to properly update the URL and trigger re-render
            setSearchParams(newSearchParams)
            // Force reload to show all products
            setForceReload(prev => prev + 1)
          } else {
            // Just reload the current data
            loadStockHistory()
          }
        }}
        showQuickActions={true}
        quickActions={[
          {
            label: 'Current FY',
            action: () => setFinancialYearFilter(getCurrentFinancialYear()),
            icon: '📅'
          },
          {
            label: 'Last FY',
            action: () => {
              const currentYear = new Date().getFullYear()
              setFinancialYearFilter(`${currentYear - 1}-${currentYear}`)
            },
            icon: '📊'
          },
          {
            label: 'Incoming Only',
            action: () => setEntryTypeFilter('incoming'),
            icon: '📥'
          },
          {
            label: 'Outgoing Only',
            action: () => setEntryTypeFilter('outgoing'),
            icon: '📤'
          },
          {
            label: 'Low Stock',
            action: () => setStockLevelFilter('low_stock'),
            icon: '⚠️'
          }
        ]}
      >
        {/* Row 1: Financial Year and Product */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: '500', color: '#495057' }}>Financial Year</span>
            <FilterDropdown
              value={financialYearFilter}
              onChange={(value) => setFinancialYearFilter(Array.isArray(value) ? value[0] || 'all' : value)}
              options={[
                { value: 'all', label: 'All Years' },
                ...getAvailableFinancialYears().map(year => ({ value: year, label: year }))
              ]}
              placeholder="Select financial year"
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: '500', color: '#495057' }}>Product</span>
            <FilterDropdown
              value={productFilter}
              onChange={(value) => setProductFilter(Array.isArray(value) ? value[0] || 'all' : value)}
              options={[
                { value: 'all', label: 'All Products' },
                ...products.map(product => ({ value: product.name, label: product.name }))
              ]}
              placeholder="Select product"
            />
          </div>
        </div>

        {/* Row 2: Entry Type and Reference Type */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: '500', color: '#495057' }}>Entry Type</span>
            <FilterDropdown
              value={entryTypeFilter}
              onChange={(value) => setEntryTypeFilter(Array.isArray(value) ? value[0] || 'all' : value)}
              options={[
                { value: 'all', label: 'All Entries' },
                { value: 'incoming', label: 'Incoming' },
                { value: 'outgoing', label: 'Outgoing' },
                { value: 'adjustment', label: 'Adjustment' }
              ]}
              placeholder="Select entry type"
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: '500', color: '#495057' }}>Reference Type</span>
            <FilterDropdown
              value={referenceTypeFilter}
              onChange={(value) => setReferenceTypeFilter(Array.isArray(value) ? value[0] || 'all' : value)}
              options={[
                { value: 'all', label: 'All References' },
                { value: 'invoice', label: 'Invoice' },
                { value: 'purchase', label: 'Purchase' },
                { value: 'adjustment', label: 'Adjustment' }
              ]}
              placeholder="Select reference type"
            />
          </div>
        </div>

        {/* Row 3: Date Range and Stock Level */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: '500', color: '#495057' }}>Date Range</span>
            <DateFilter
              value={dateRangeFilter}
              onChange={setDateRangeFilter}
              placeholder="Select date range"
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: '500', color: '#495057' }}>Stock Level</span>
            <FilterDropdown
              value={stockLevelFilter}
              onChange={(value) => setStockLevelFilter(Array.isArray(value) ? value[0] || 'all' : value)}
              options={[
                { value: 'all', label: 'All Stock Levels' },
                { value: 'in_stock', label: 'In Stock' },
                { value: 'out_of_stock', label: 'Out of Stock' },
                { value: 'low_stock', label: 'Low Stock' }
              ]}
              placeholder="Select stock level"
            />
          </div>
        </div>

        {/* Row 4: Reference Search */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '12px', fontWeight: '500', color: '#495057' }}>Reference Search</span>
          <input
            type="text"
            value={referenceSearch}
            onChange={(e) => setReferenceSearch(e.target.value)}
            placeholder="Search by reference number..."
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '14px',
              outline: 'none'
            }}
          />
        </div>
      </EnhancedFilterBar>

      {/* Summary Section - computed from filtered dataset (not paginated) */}
      {filteredStockHistory.length > 0 && (
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          border: '1px solid #e9ecef', 
          borderRadius: '8px', 
          padding: '20px',
          marginBottom: '24px'
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
    </div>
  )
}
