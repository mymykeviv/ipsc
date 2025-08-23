import React, { useState, useEffect } from 'react'
import { apiGetInventoryValuation, InventoryValuationReport } from '../lib/api'
import { Button } from './Button'
import { LoadingSpinner } from './LoadingSpinner'
import { ErrorMessage } from './ErrorMessage'
import { useAuth } from '../modules/AuthContext'
import { createApiErrorHandler } from '../lib/apiUtils'

interface InventoryValuationReportProps {
  onClose?: () => void
}

export function InventoryValuationReportComponent({ onClose }: InventoryValuationReportProps) {
  const [report, setReport] = useState<InventoryValuationReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Filter states
  const [category, setCategory] = useState<string>('all')
  const [includeZeroStock, setIncludeZeroStock] = useState(true)
  
  const { forceLogout } = useAuth()
  const handleApiError = createApiErrorHandler({ onUnauthorized: forceLogout })

  const loadReport = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await apiGetInventoryValuation(
        category === 'all' ? undefined : category,
        includeZeroStock
      )
      setReport(data)
    } catch (err) {
      console.error('Failed to load inventory valuation report:', err)
      const errorMessage = handleApiError(err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReport()
  }, [category, includeZeroStock])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN')
  }

  const getValuationDifferenceColor = (difference: number) => {
    if (difference > 0) return '#10b981'
    if (difference < 0) return '#ef4444'
    return '#6b7280'
  }

  const clearFilters = () => {
    setCategory('all')
    setIncludeZeroStock(true)
  }

  return (
    <div style={{ padding: '20px', maxWidth: '100%' }}>
      <div style={{ 
        marginBottom: '24px',
        paddingBottom: '12px',
        borderBottom: '2px solid #e9ecef'
      }}>
        <h1 style={{ margin: '0', fontSize: '28px', fontWeight: '600', color: '#2c3e50' }}>Inventory Valuation Report</h1>
        <p style={{ color: '#6c757d', marginTop: '8px', fontSize: '16px' }}>
          Financial valuation of inventory assets with cost and market value analysis
        </p>
      </div>

      {error && (
        <div style={{ 
          padding: '12px 16px', 
          marginBottom: '20px', 
          backgroundColor: '#fee', 
          border: '1px solid #fcc', 
          borderRadius: '6px', 
          color: '#c33',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}

      {/* Filters Section */}
      <div style={{ 
        padding: '20px', 
        border: '1px solid #e9ecef',
        borderRadius: '8px',
        backgroundColor: 'white',
        marginBottom: '24px'
      }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600', color: '#495057' }}>Filters</h2>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px',
          marginBottom: '20px'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>Category:</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: 'white'
              }}
            >
              <option value="all">All Categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Clothing">Clothing</option>
              <option value="Books">Books</option>
              <option value="Home & Garden">Home & Garden</option>
              <option value="Sports">Sports</option>
              <option value="Automotive">Automotive</option>
              <option value="Health & Beauty">Health & Beauty</option>
              <option value="Toys">Toys</option>
              <option value="Food & Beverages">Food & Beverages</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>Include Zero Stock:</label>
            <select
              value={includeZeroStock.toString()}
              onChange={(e) => setIncludeZeroStock(e.target.value === 'true')}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: 'white'
              }}
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button variant="secondary" onClick={clearFilters}>
            Clear Filters
          </Button>
          <Button variant="primary" onClick={loadReport} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh Report'}
          </Button>
        </div>
      </div>

      {/* Report Content */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <LoadingSpinner />
          <p style={{ marginTop: '16px', color: '#6c757d' }}>Loading inventory valuation report...</p>
        </div>
      )}

      {report && !loading && (
        <div>
          {/* Summary Cards */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div style={{ 
              padding: '20px', 
              backgroundColor: '#e3f2fd', 
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2' }}>
                {formatNumber(report.total_products)}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>Total Products</div>
            </div>
            
            <div style={{ 
              padding: '20px', 
              backgroundColor: '#e8f5e8', 
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2e7d32' }}>
                {formatCurrency(report.total_cost_value)}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>Total Cost Value</div>
            </div>
            
            <div style={{ 
              padding: '20px', 
              backgroundColor: '#fff3e0', 
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f57c00' }}>
                {formatCurrency(report.total_market_value)}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>Total Market Value</div>
            </div>
            
            <div style={{ 
              padding: '20px', 
              backgroundColor: '#fce4ec', 
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                color: getValuationDifferenceColor(report.total_valuation_difference)
              }}>
                {formatCurrency(report.total_valuation_difference)}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>Total Difference</div>
            </div>
          </div>

          {/* Valuation Table */}
          <div style={{ 
            border: '1px solid #e9ecef', 
            borderRadius: '8px', 
            overflow: 'hidden',
            backgroundColor: 'white'
          }}>
            <h3 style={{ 
              margin: '0', 
              padding: '16px', 
              backgroundColor: '#f8f9fa', 
              borderBottom: '1px solid #e9ecef',
              fontSize: '18px',
              fontWeight: '600',
              color: '#495057'
            }}>
              Product Valuations
            </h3>
            
            {report.items.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>
                No products found for the selected criteria
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse',
                  fontSize: '14px'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef', fontWeight: '600' }}>Product</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef', fontWeight: '600' }}>Category</th>
                      <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e9ecef', fontWeight: '600' }}>Current Stock</th>
                      <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e9ecef', fontWeight: '600' }}>Unit Cost</th>
                      <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e9ecef', fontWeight: '600' }}>Cost Value</th>
                      <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e9ecef', fontWeight: '600' }}>Market Price</th>
                      <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e9ecef', fontWeight: '600' }}>Market Value</th>
                      <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e9ecef', fontWeight: '600' }}>Difference</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef', fontWeight: '600' }}>Last Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.items.map((item) => (
                      <tr key={item.product_id} style={{ borderBottom: '1px solid #f1f3f4' }}>
                        <td style={{ padding: '12px', borderBottom: '1px solid #f1f3f4' }}>
                          <div>
                            <div style={{ fontWeight: '500' }}>{item.product_name}</div>
                            {item.sku && (
                              <div style={{ fontSize: '12px', color: '#6c757d' }}>SKU: {item.sku}</div>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '12px', borderBottom: '1px solid #f1f3f4' }}>
                          {item.category || '-'}
                        </td>
                        <td style={{ padding: '12px', borderBottom: '1px solid #f1f3f4', textAlign: 'right' }}>
                          {formatNumber(item.current_stock)}
                        </td>
                        <td style={{ padding: '12px', borderBottom: '1px solid #f1f3f4', textAlign: 'right' }}>
                          {item.unit_cost ? formatCurrency(item.unit_cost) : '-'}
                        </td>
                        <td style={{ padding: '12px', borderBottom: '1px solid #f1f3f4', textAlign: 'right' }}>
                          {formatCurrency(item.total_cost_value)}
                        </td>
                        <td style={{ padding: '12px', borderBottom: '1px solid #f1f3f4', textAlign: 'right' }}>
                          {item.unit_market_price ? formatCurrency(item.unit_market_price) : '-'}
                        </td>
                        <td style={{ padding: '12px', borderBottom: '1px solid #f1f3f4', textAlign: 'right' }}>
                          {formatCurrency(item.total_market_value)}
                        </td>
                        <td style={{ 
                          padding: '12px', 
                          borderBottom: '1px solid #f1f3f4', 
                          textAlign: 'right',
                          color: getValuationDifferenceColor(item.valuation_difference),
                          fontWeight: '500'
                        }}>
                          {formatCurrency(item.valuation_difference)}
                        </td>
                        <td style={{ padding: '12px', borderBottom: '1px solid #f1f3f4' }}>
                          {item.last_updated ? formatDate(item.last_updated) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Valuation Summary */}
          <div style={{ 
            marginTop: '24px',
            padding: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e9ecef'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#495057' }}>
              Valuation Summary
            </h3>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '16px'
            }}>
              <div>
                <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '4px' }}>Average Cost Value per Product</div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#495057' }}>
                  {formatCurrency(report.total_cost_value / report.total_products)}
                </div>
              </div>
              
              <div>
                <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '4px' }}>Average Market Value per Product</div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#495057' }}>
                  {formatCurrency(report.total_market_value / report.total_products)}
                </div>
              </div>
              
              <div>
                <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '4px' }}>Average Valuation Difference</div>
                <div style={{ 
                  fontSize: '18px', 
                  fontWeight: '600',
                  color: getValuationDifferenceColor(report.total_valuation_difference / report.total_products)
                }}>
                  {formatCurrency(report.total_valuation_difference / report.total_products)}
                </div>
              </div>
              
              <div>
                <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '4px' }}>Valuation Ratio (Market/Cost)</div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#495057' }}>
                  {(report.total_market_value / report.total_cost_value).toFixed(2)}x
                </div>
              </div>
            </div>
          </div>

          {/* Report Footer */}
          <div style={{ 
            marginTop: '20px', 
            padding: '16px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '6px',
            fontSize: '14px',
            color: '#6c757d'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                Report generated on: {formatDate(report.generated_at)}
              </div>
              <div>
                {report.filters_applied && (
                  <span>Filters applied: {Object.keys(report.filters_applied).length}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
