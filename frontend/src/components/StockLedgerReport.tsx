import React, { useState, useEffect } from 'react'
import { apiGetStockLedger, StockLedgerReport } from '../lib/api'
import { Button } from './Button'
import { LoadingSpinner } from './LoadingSpinner'
import { ErrorMessage } from './ErrorMessage'
import { useAuth } from '../modules/AuthContext'
import { createApiErrorHandler } from '../lib/apiUtils'

interface StockLedgerReportProps {
  onClose?: () => void
}

export function StockLedgerReportComponent({ onClose }: StockLedgerReportProps) {
  const [report, setReport] = useState<StockLedgerReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Filter states
  const [productId, setProductId] = useState<string>('')
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')
  const [entryType, setEntryType] = useState<string>('all')
  
  const { forceLogout } = useAuth()
  const handleApiError = createApiErrorHandler({ onUnauthorized: forceLogout })

  const loadReport = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await apiGetStockLedger(
        productId ? parseInt(productId) : undefined,
        fromDate || undefined,
        toDate || undefined,
        entryType !== 'all' ? entryType : undefined
      )
      setReport(data)
    } catch (err) {
      console.error('Failed to load stock ledger report:', err)
      const errorMessage = handleApiError(err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReport()
  }, [productId, fromDate, toDate, entryType])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN')
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num)
  }

  const getEntryTypeColor = (type: string) => {
    switch (type) {
      case 'in': return '#10b981'
      case 'out': return '#ef4444'
      case 'adjust': return '#f59e0b'
      default: return '#6b7280'
    }
  }

  const getEntryTypeText = (type: string) => {
    switch (type) {
      case 'in': return 'Incoming'
      case 'out': return 'Outgoing'
      case 'adjust': return 'Adjustment'
      default: return type
    }
  }

  const clearFilters = () => {
    setProductId('')
    setFromDate('')
    setToDate('')
    setEntryType('all')
  }

  return (
    <div style={{ padding: '20px', maxWidth: '100%' }}>
      <div style={{ 
        marginBottom: '24px',
        paddingBottom: '12px',
        borderBottom: '2px solid #e9ecef'
      }}>
        <h1 style={{ margin: '0', fontSize: '28px', fontWeight: '600', color: '#2c3e50' }}>Stock Ledger Report</h1>
        <p style={{ color: '#6c757d', marginTop: '8px', fontSize: '16px' }}>
          Detailed transaction history with running balances for audit and reconciliation
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
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>Product ID:</label>
            <input
              type="number"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              placeholder="Enter product ID"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>From Date:</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>To Date:</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>Entry Type:</label>
            <select
              value={entryType}
              onChange={(e) => setEntryType(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: 'white'
              }}
            >
              <option value="all">All Types</option>
              <option value="in">Incoming</option>
              <option value="out">Outgoing</option>
              <option value="adjust">Adjustment</option>
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
          <p style={{ marginTop: '16px', color: '#6c757d' }}>Loading stock ledger report...</p>
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
                {formatNumber(report.total_transactions)}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>Total Transactions</div>
            </div>
            
            <div style={{ 
              padding: '20px', 
              backgroundColor: '#e8f5e8', 
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2e7d32' }}>
                {formatNumber(report.total_incoming)}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>Total Incoming</div>
            </div>
            
            <div style={{ 
              padding: '20px', 
              backgroundColor: '#fff3e0', 
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f57c00' }}>
                {formatNumber(report.total_outgoing)}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>Total Outgoing</div>
            </div>
            
            <div style={{ 
              padding: '20px', 
              backgroundColor: '#fce4ec', 
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#c2185b' }}>
                {formatNumber(report.total_adjustments)}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>Total Adjustments</div>
            </div>
            
            <div style={{ 
              padding: '20px', 
              backgroundColor: '#f3e5f5', 
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#7b1fa2' }}>
                {formatNumber(report.closing_balance)}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>Closing Balance</div>
            </div>
          </div>

          {/* Transactions Table */}
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
              Transaction Details
            </h3>
            
            {report.transactions.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>
                No transactions found for the selected criteria
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
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef', fontWeight: '600' }}>Date</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef', fontWeight: '600' }}>Product</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef', fontWeight: '600' }}>Type</th>
                      <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e9ecef', fontWeight: '600' }}>Quantity</th>
                      <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e9ecef', fontWeight: '600' }}>Unit Price</th>
                      <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e9ecef', fontWeight: '600' }}>Total Value</th>
                      <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e9ecef', fontWeight: '600' }}>Running Balance</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef', fontWeight: '600' }}>Reference</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef', fontWeight: '600' }}>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.transactions.map((transaction) => (
                      <tr key={transaction.transaction_id} style={{ borderBottom: '1px solid #f1f3f4' }}>
                        <td style={{ padding: '12px', borderBottom: '1px solid #f1f3f4' }}>
                          {formatDate(transaction.transaction_date)}
                        </td>
                        <td style={{ padding: '12px', borderBottom: '1px solid #f1f3f4' }}>
                          <div>
                            <div style={{ fontWeight: '500' }}>{transaction.product_name}</div>
                            {transaction.sku && (
                              <div style={{ fontSize: '12px', color: '#6c757d' }}>SKU: {transaction.sku}</div>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '12px', borderBottom: '1px solid #f1f3f4' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500',
                            backgroundColor: getEntryTypeColor(transaction.entry_type) + '20',
                            color: getEntryTypeColor(transaction.entry_type)
                          }}>
                            {getEntryTypeText(transaction.entry_type)}
                          </span>
                        </td>
                        <td style={{ padding: '12px', borderBottom: '1px solid #f1f3f4', textAlign: 'right' }}>
                          {formatNumber(transaction.quantity)}
                        </td>
                        <td style={{ padding: '12px', borderBottom: '1px solid #f1f3f4', textAlign: 'right' }}>
                          {transaction.unit_price ? formatCurrency(transaction.unit_price) : '-'}
                        </td>
                        <td style={{ padding: '12px', borderBottom: '1px solid #f1f3f4', textAlign: 'right' }}>
                          {transaction.total_value ? formatCurrency(transaction.total_value) : '-'}
                        </td>
                        <td style={{ padding: '12px', borderBottom: '1px solid #f1f3f4', textAlign: 'right', fontWeight: '500' }}>
                          {formatNumber(transaction.running_balance)}
                        </td>
                        <td style={{ padding: '12px', borderBottom: '1px solid #f1f3f4' }}>
                          {transaction.reference_number && (
                            <div>
                              <div style={{ fontSize: '12px', color: '#6c757d' }}>
                                {transaction.reference_type?.toUpperCase()}
                              </div>
                              <div>{transaction.reference_number}</div>
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px', borderBottom: '1px solid #f1f3f4' }}>
                          {transaction.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
