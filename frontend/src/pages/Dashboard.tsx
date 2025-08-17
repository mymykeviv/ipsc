import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../modules/AuthContext'
import { apiGetCashflowSummary, CashflowSummary } from '../lib/api'
import { createApiErrorHandler } from '../lib/apiUtils'
import { Button } from '../components/Button'


export function Dashboard() {
  const { token, forceLogout } = useAuth()
  const navigate = useNavigate()
  const [cashflowData, setCashflowData] = useState<CashflowSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Create error handler that will automatically log out on 401 errors
  const handleApiError = createApiErrorHandler(forceLogout)
  const [periodType, setPeriodType] = useState<'month' | 'quarter' | 'year' | 'custom'>('month')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0].substring(0, 7) + '-01')
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  


  useEffect(() => {
    if (!token) {
      // If no token, redirect to login
      navigate('/login')
      return
    }
    
    // Load cashflow data when component mounts or when dates change
    loadCashflowData()
  }, [token, startDate, endDate, navigate])

  const loadCashflowData = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiGetCashflowSummary(startDate, endDate)
      setCashflowData(data)
    } catch (err) {
      console.error('Failed to load cashflow data:', err)
      const errorMessage = handleApiError(err)
      setError(errorMessage)
      // Set default data to prevent app from breaking
      setCashflowData({
        period: {
          start_date: startDate,
          end_date: endDate
        },
        income: {
          total_invoice_amount: 0,
          total_payments_received: 0
        },
        expenses: {
          total_expenses: 0,
          total_purchase_payments: 0,
          total_outflow: 0
        },
        cashflow: {
          net_cashflow: 0,
          cash_inflow: 0,
          cash_outflow: 0
        }
      })
    } finally {
      setLoading(false)
    }
  }

  // Add manual refresh function
  const handleRefresh = () => {
    loadCashflowData()
  }

  // Auto-refresh data when custom dates change
  useEffect(() => {
    if (periodType === 'custom' && token) {
      loadCashflowData()
    }
  }, [startDate, endDate, periodType, token])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const getNetCashflowColor = (amount: number) => {
    return amount >= 0 ? '#28a745' : '#dc3545'
  }

  const getPeriodLabel = () => {
    if (periodType === 'month') {
      return `${new Date(startDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
    } else if (periodType === 'quarter') {
      const quarter = Math.ceil((new Date(startDate).getMonth() + 1) / 3)
      return `Q${quarter} ${new Date(startDate).getFullYear()}`
    } else if (periodType === 'year') {
      return `${new Date(startDate).getFullYear()}`
    } else {
      return `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
    }
  }

  const handlePeriodChange = (type: 'month' | 'quarter' | 'year' | 'custom') => {
    setPeriodType(type)
    const now = new Date()
    
    if (type === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      setStartDate(start.toISOString().split('T')[0])
      setEndDate(end.toISOString().split('T')[0])
    } else if (type === 'quarter') {
      const quarter = Math.ceil((now.getMonth() + 1) / 3)
      const startMonth = (quarter - 1) * 3
      const start = new Date(now.getFullYear(), startMonth, 1)
      const end = new Date(now.getFullYear(), startMonth + 3, 0)
      setStartDate(start.toISOString().split('T')[0])
      setEndDate(end.toISOString().split('T')[0])
    } else if (type === 'year') {
      const start = new Date(now.getFullYear(), 0, 1)
      const end = new Date(now.getFullYear(), 11, 31)
      setStartDate(start.toISOString().split('T')[0])
      setEndDate(end.toISOString().split('T')[0])
    }
    
    // Data will be automatically refreshed via the useEffect that depends on startDate and endDate
  }

  if (loading && !cashflowData) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Dashboard</h1>
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: '100%' }}>
      {/* Dashboard Title and Period Selector */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px',
        paddingBottom: '12px',
        borderBottom: '2px solid #e9ecef'
      }}>
        <h1 style={{ 
          margin: '0',
          fontSize: '24px',
          fontWeight: '600',
          color: '#2c3e50'
        }}>
          Dashboard - Cashflow Summary
        </h1>
        
        {/* Quick Actions moved to header */}
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <Button 
            onClick={() => navigate('/expenses/add')}
            variant="primary"
            style={{ 
              padding: '8px 14px', 
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            💰 Add Expense
          </Button>
          <Button 
            onClick={() => navigate('/invoices/add')}
            variant="primary"
            style={{ 
              padding: '8px 14px', 
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            📄 New Invoice
          </Button>
          <Button 
            onClick={() => navigate('/purchases/add')}
            variant="primary"
            style={{ 
              padding: '8px 14px', 
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            📦 New Purchase
          </Button>
          <Button 
            onClick={() => navigate('/products/add')}
            variant="primary"
            style={{ 
              padding: '8px 14px', 
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            🏷️ Add Product
          </Button>
        </div>
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

      {cashflowData ? (
        <div style={{ display: 'grid', gap: '24px' }}>
          {/* Pending Payments Cards */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '20px'
          }}>
            {/* Pending Purchase Payments */}
            <div style={{ 
              padding: '20px', 
              border: '2px solid #ffc107',
              borderRadius: '8px',
              backgroundColor: '#fff8e1'
            }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#856404', fontSize: '16px', textAlign: 'center', fontWeight: '600' }}>
                📦 Pending Purchase Payments
              </h4>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: '24px', 
                  fontWeight: 'bold',
                  color: '#856404',
                  marginBottom: '6px'
                }}>
                  ₹{(cashflowData?.expenses?.total_purchase_payments || 0) * 0.3}
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  color: '#856404',
                  fontWeight: '500',
                  marginBottom: '12px'
                }}>
                  Outstanding payments
                </div>
                <Button 
                  onClick={() => navigate('/payments/purchase/list')}
                  variant="secondary"
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                >
                  View Payments
                </Button>
              </div>
            </div>

            {/* Pending Invoice Payments */}
            <div style={{ 
              padding: '20px', 
              border: '2px solid #17a2b8',
              borderRadius: '8px',
              backgroundColor: '#e7f3ff'
            }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#0056b3', fontSize: '16px', textAlign: 'center', fontWeight: '600' }}>
                📄 Pending Invoice Payments
              </h4>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: '24px', 
                  fontWeight: 'bold',
                  color: '#0056b3',
                  marginBottom: '6px'
                }}>
                  ₹{(cashflowData?.income?.total_invoice_amount || 0) * 0.2}
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  color: '#0056b3',
                  fontWeight: '500',
                  marginBottom: '12px'
                }}>
                  Outstanding receivables
                </div>
                <Button 
                  onClick={() => navigate('/invoices')}
                  variant="secondary"
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                >
                  View Invoices
                </Button>
              </div>
            </div>
          </div>

          {/* Income and Expense Summary */}
          <div style={{ 
            borderBottom: '1px solid #e9ecef'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: '0', color: '#495057', fontSize: '18px', fontWeight: '600' }}>
                📊 Income & Expenses Summary
              </h3>
              
              {/* Period Selector */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ 
                  padding: '5px 10px',
                  backgroundColor: '#e7f3ff',
                  borderRadius: '6px',
                  border: '1px solid #b3d9ff',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: '#0056b3'
                }}>
                  Period: {getPeriodLabel()}
                </div>
                <select
                  value={periodType}
                  onChange={(e) => handlePeriodChange(e.target.value as 'month' | 'quarter' | 'year' | 'custom')}
                  style={{
                    padding: '5px 10px',
                    border: '1px solid #ced4da',
                    borderRadius: '6px',
                    fontSize: '12px',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                  <option value="custom">Custom Range</option>
                </select>
                
                {periodType === 'custom' && (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      style={{
                        padding: '5px 6px',
                        border: '1px solid #ced4da',
                        borderRadius: '6px',
                        fontSize: '12px'
                      }}
                    />
                    <span style={{ fontSize: '11px' }}>to</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      style={{
                        padding: '5px 6px',
                        border: '1px solid #ced4da',
                        borderRadius: '6px',
                        fontSize: '12px'
                      }}
                    />
                  </div>
                )}
                
                <button 
                  onClick={handleRefresh}
                  disabled={loading}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  {loading ? 'Refreshing...' : '🔄'}
                </button>
              </div>
            </div>
            
            <div style={{ display: 'grid', gap: '20px' }}>
              {/* First Row: Net Cashflow, Income, Expenses */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 2fr', gap: '20px' }}>
                {/* Net Cashflow Section - Neutral Theme */}
                <div style={{ 
                  padding: '20px', 
                  border: '2px solid #e2e3e5',
                  borderRadius: '8px',
                  backgroundColor: '#f8f9fa'
                }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#383d41', fontSize: '16px', textAlign: 'center', fontWeight: '600' }}>
                    📊 Net Cashflow
                  </h4>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ 
                      fontSize: '24px', 
                      fontWeight: 'bold',
                      color: getNetCashflowColor(cashflowData?.cashflow?.net_cashflow || 0),
                      marginBottom: '6px'
                    }}>
                      {formatCurrency(cashflowData?.cashflow?.net_cashflow || 0)}
                    </div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#383d41',
                      fontWeight: '500'
                    }}>
                      {(cashflowData?.cashflow?.net_cashflow || 0) >= 0 ? 'Positive Cashflow' : 'Negative Cashflow'}
                    </div>
                  </div>
                </div>

                {/* Income Column - Green Theme (like Pending Invoice Payments) */}
                <div style={{ 
                  padding: '20px', 
                  border: '2px solid #c3e6cb',
                  borderRadius: '8px',
                  backgroundColor: '#d4edda'
                }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#155724', fontSize: '16px', textAlign: 'center', fontWeight: '600' }}>
                    💰 Income
                  </h4>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#155724' }}>
                      <span>Invoice Amount:</span>
                      <strong>{formatCurrency(cashflowData?.income?.total_invoice_amount || 0)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#155724' }}>
                      <span>Payments Received:</span>
                      <strong>{formatCurrency(cashflowData?.income?.total_payments_received || 0)}</strong>
                    </div>
                    <hr style={{ border: 'none', borderTop: '2px solid #c3e6cb', margin: '10px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 'bold', color: '#155724' }}>
                      <span>Total Income:</span>
                      <span style={{ color: '#28a745' }}>{formatCurrency(cashflowData?.cashflow?.cash_inflow || 0)}</span>
                    </div>
                  </div>
                </div>

                {/* Expense Column - Yellow/Orange Theme (like Pending Purchase Payments) */}
                <div style={{ 
                  padding: '20px', 
                  border: '2px solid #ffeaa7',
                  borderRadius: '8px',
                  backgroundColor: '#fff3cd'
                }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#856404', fontSize: '16px', textAlign: 'center', fontWeight: '600' }}>
                    💸 Expenses
                  </h4>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#856404' }}>
                      <span>Direct Expenses:</span>
                      <strong>{formatCurrency(cashflowData?.expenses?.total_expenses || 0)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#856404' }}>
                      <span>Purchase Payments:</span>
                      <strong>{formatCurrency(cashflowData?.expenses?.total_purchase_payments || 0)}</strong>
                    </div>
                    <hr style={{ border: 'none', borderTop: '2px solid #ffeaa7', margin: '10px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 'bold', color: '#856404' }}>
                      <span>Total Outflow:</span>
                      <span style={{ color: '#dc3545' }}>{formatCurrency(cashflowData?.cashflow?.cash_outflow || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>


        </div>
      ) : (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          color: '#6c757d',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          backgroundColor: '#f8f9fa'
        }}>
          <div style={{ fontSize: '18px', marginBottom: '8px', fontWeight: '500' }}>
            No cashflow data available
          </div>
          <div style={{ fontSize: '14px' }}>
            Click the refresh button to load data
          </div>
        </div>
      )}
    </div>
  )
}

