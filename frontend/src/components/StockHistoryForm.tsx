import React, { useState, useEffect } from 'react'
import { apiGetStockMovementHistory, StockMovement } from '../lib/api'
import { Button } from './Button'
import { ErrorMessage } from './ErrorMessage'
import { useAuth } from '../modules/AuthContext'
import { createApiErrorHandler } from '../lib/apiUtils'
import { EnhancedFilterBar } from './EnhancedFilterBar'
import { FilterDropdown } from './FilterDropdown'

interface StockHistoryFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export function StockHistoryForm({ onSuccess, onCancel }: StockHistoryFormProps) {
  const [stockHistory, setStockHistory] = useState<StockMovement[]>([])
  const [filteredStockHistory, setFilteredStockHistory] = useState<StockMovement[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [productFilter, setProductFilter] = useState('all')
  const [financialYearFilter, setFinancialYearFilter] = useState('all')
  const { forceLogout } = useAuth()
  const handleApiError = createApiErrorHandler(forceLogout)

  const loadStockHistory = async () => {
    try {
      setHistoryLoading(true)
      setError(null)
      const history = await apiGetStockMovementHistory()
      setStockHistory(history)
      setFilteredStockHistory(history)
    } catch (err) {
      console.error('Failed to load stock history:', err)
      const errorMessage = handleApiError(err)
      setError(errorMessage)
    } finally {
      setHistoryLoading(false)
    }
  }

  // Filter stock history based on selected filters
  useEffect(() => {
    let filtered = stockHistory

    if (productFilter !== 'all') {
      filtered = filtered.filter(movement => 
        movement.product_name.toLowerCase().includes(productFilter.toLowerCase())
      )
    }

    if (financialYearFilter !== 'all') {
      filtered = filtered.filter(movement => 
        movement.financial_year === financialYearFilter
      )
    }

    setFilteredStockHistory(filtered)
  }, [stockHistory, productFilter, financialYearFilter])

  useEffect(() => {
    loadStockHistory()
  }, [])

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
          Stock Movement History
        </h1>
        <Button onClick={onCancel} variant="secondary">
          ← Back to Products
        </Button>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Enhanced Filter Options */}
      <EnhancedFilterBar 
        title="Stock History Filters"
        activeFiltersCount={
          (productFilter !== 'all' ? 1 : 0) +
          (financialYearFilter !== 'all' ? 1 : 0)
        }
        onClearAll={() => {
          setProductFilter('all')
          setFinancialYearFilter('all')
        }}
        showQuickActions={true}
        quickActions={[
          {
            label: 'Current FY',
            action: () => {
              const currentYear = new Date().getFullYear()
              setFinancialYearFilter(`${currentYear}-${currentYear + 1}`)
            },
            icon: '📅'
          },
          {
            label: 'Last FY',
            action: () => {
              const currentYear = new Date().getFullYear()
              setFinancialYearFilter(`${currentYear - 1}-${currentYear}`)
            },
            icon: '📊'
          }
        ]}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '12px', fontWeight: '500', color: '#495057' }}>Product</span>
          <FilterDropdown
            value={productFilter}
            onChange={(value) => setProductFilter(Array.isArray(value) ? value[0] || 'all' : value)}
            options={[
              { value: 'all', label: 'All Products' },
              ...stockHistory
                .map(movement => ({ value: movement.product_name, label: movement.product_name }))
                .filter((item, index, self) => self.findIndex(t => t.value === item.value) === index)
            ]}
            placeholder="Select product"
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '12px', fontWeight: '500', color: '#495057' }}>Financial Year</span>
          <FilterDropdown
            value={financialYearFilter}
            onChange={(value) => setFinancialYearFilter(Array.isArray(value) ? value[0] || 'all' : value)}
            options={[
              { value: 'all', label: 'All Years' },
              ...stockHistory
                .map(movement => ({ value: movement.financial_year, label: movement.financial_year }))
                .filter((item, index, self) => self.findIndex(t => t.value === item.value) === index)
            ]}
            placeholder="Select financial year"
          />
        </div>
      </EnhancedFilterBar>

      {/* Stock Movement Table */}
      <div style={{ 
        border: '1px solid #e9ecef', 
        borderRadius: '8px', 
        overflow: 'hidden',
        backgroundColor: 'white'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #e9ecef' }}>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Product</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Financial Year</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Opening Stock</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Incoming</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Outgoing</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Closing Stock</th>
            </tr>
          </thead>
          <tbody>
            {historyLoading ? (
              <tr>
                <td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>
                  Loading stock movement history...
                </td>
              </tr>
            ) : filteredStockHistory.length > 0 ? (
              filteredStockHistory.map((movement, index) => (
                <tr key={index} style={{ 
                  borderBottom: '1px solid #e9ecef',
                  backgroundColor: 'white'
                }}>
                  <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>
                    {movement.product_name}
                  </td>
                  <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>
                    {movement.financial_year}
                  </td>
                  <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>
                    {movement.opening_stock.toFixed(2)}
                  </td>
                  <td style={{ padding: '12px', borderRight: '1px solid #e9ecef', color: '#28a745' }}>
                    {movement.incoming_stock.toFixed(2)}
                  </td>
                  <td style={{ padding: '12px', borderRight: '1px solid #e9ecef', color: '#dc3545' }}>
                    {movement.outgoing_stock.toFixed(2)}
                  </td>
                  <td style={{ padding: '12px', borderRight: '1px solid #e9ecef', fontWeight: '600' }}>
                    {movement.closing_stock.toFixed(2)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>
                  {stockHistory.length === 0 ? 'No stock movement data available' : 'No data matches the selected filters'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ 
        marginTop: '20px', 
        padding: '16px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '8px',
        border: '1px solid #e9ecef'
      }}>
        <p style={{ color: '#6c757d', fontSize: '14px', margin: '0', textAlign: 'center' }}>
          <strong>Note:</strong> Stock movement history shows the movement of stock for each financial year (April 1st to March 31st).
          Opening stock, incoming, and outgoing calculations are based on stock adjustment records.
        </p>
      </div>
    </div>
  )
}
