import { useEffect, useState } from 'react'
import { useAuth } from '../modules/AuthContext'
import { apiGetCashflowSummary, CashflowSummary } from '../lib/api'
import { Card } from '../components/Card'

export function Dashboard() {
  const { token } = useAuth()
  const [cashflowData, setCashflowData] = useState<CashflowSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0].substring(0, 7) + '-01')
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    if (!token) return
    loadCashflowData()
  }, [token, startDate, endDate])

  const loadCashflowData = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiGetCashflowSummary(startDate, endDate)
      setCashflowData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cashflow data')
    } finally {
      setLoading(false)
    }
  }

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

  if (loading && !cashflowData) {
    return (
      <Card>
        <h1>Dashboard</h1>
        <div>Loading...</div>
      </Card>
    )
  }

  return (
    <Card>
      {/* Quick Actions Section */}
      <div style={{ 
        marginBottom: '24px',
        padding: '16px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #e9ecef'
      }}>
        <h3 style={{ 
          margin: '0 0 16px 0', 
          fontSize: '18px',
          color: '#495057',
          fontWeight: '600'
        }}>
          🚀 Quick Actions
        </h3>
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <button 
            onClick={() => window.location.href = '/expenses'}
            className="btn btn-primary"
            style={{ 
              padding: '10px 16px', 
              fontSize: '14px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#007bff',
              color: 'white',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#0056b3'
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#007bff'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            💰 Add Expense
          </button>
          <button 
            onClick={() => window.location.href = '/invoices'}
            className="btn btn-secondary"
            style={{ 
              padding: '10px 16px', 
              fontSize: '14px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#6c757d',
              color: 'white',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#545b62'
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#6c757d'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            📄 New Invoice
          </button>
          <button 
            onClick={() => window.location.href = '/purchases'}
            className="btn btn-secondary"
            style={{ 
              padding: '10px 16px', 
              fontSize: '14px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#6c757d',
              color: 'white',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#545b62'
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#6c757d'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            📦 New Purchase
          </button>
          <button 
            onClick={() => window.location.href = '/products'}
            className="btn btn-secondary"
            style={{ 
              padding: '10px 16px', 
              fontSize: '14px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#6c757d',
              color: 'white',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#545b62'
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#6c757d'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            🏷️ Manage Products
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Dashboard - Cashflow Summary</h1>
        <button 
          onClick={loadCashflowData}
          className="btn btn-primary"
          style={{ padding: '10px 20px' }}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div style={{ 
          padding: '12px', 
          marginBottom: '16px', 
          backgroundColor: '#fee', 
          border: '1px solid #fcc', 
          borderRadius: '4px', 
          color: '#c33' 
        }}>
          {error}
        </div>
      )}

      {/* Date Range Selector */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <label>
          <div>Start Date</div>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              fontSize: '14px'
            }}
          />
        </label>
        <label>
          <div>End Date</div>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              fontSize: '14px'
            }}
          />
        </label>
      </div>

      {cashflowData && (
        <div style={{ display: 'grid', gap: '20px' }}>
          {/* Period Information */}
          <div style={{ 
            padding: '16px', 
            backgroundColor: 'var(--background-secondary)', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-secondary)' }}>
              Cashflow Period
            </h3>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
              {new Date(cashflowData.period.start_date).toLocaleDateString()} - {new Date(cashflowData.period.end_date).toLocaleDateString()}
            </div>
          </div>

          {/* Net Cashflow Summary */}
          <div style={{ 
            padding: '24px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '8px',
            border: '2px solid var(--border)',
            textAlign: 'center'
          }}>
            <h2 style={{ margin: '0 0 16px 0', color: 'var(--text-secondary)' }}>
              Net Cashflow
            </h2>
            <div style={{ 
              fontSize: '32px', 
              fontWeight: 'bold',
              color: getNetCashflowColor(cashflowData.cashflow.net_cashflow)
            }}>
              {formatCurrency(cashflowData.cashflow.net_cashflow)}
            </div>
            <div style={{ 
              marginTop: '8px', 
              fontSize: '14px', 
              color: 'var(--text-secondary)' 
            }}>
              {cashflowData.cashflow.net_cashflow >= 0 ? 'Positive Cashflow' : 'Negative Cashflow'}
            </div>
          </div>

          {/* Income and Expense Breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Income Section */}
            <div style={{ 
              padding: '20px', 
              backgroundColor: '#d4edda', 
              borderRadius: '8px',
              border: '1px solid #c3e6cb'
            }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#155724' }}>
                💰 Income
              </h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Invoice Amount:</span>
                  <strong>{formatCurrency(cashflowData.income.total_invoice_amount)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Payments Received:</span>
                  <strong>{formatCurrency(cashflowData.income.total_payments_received)}</strong>
                </div>
                <hr style={{ border: 'none', borderTop: '1px solid #c3e6cb', margin: '12px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold' }}>
                  <span>Total Income:</span>
                  <span>{formatCurrency(cashflowData.cashflow.cash_inflow)}</span>
                </div>
              </div>
            </div>

            {/* Expense Section */}
            <div style={{ 
              padding: '20px', 
              backgroundColor: '#f8d7da', 
              borderRadius: '8px',
              border: '1px solid #f5c6cb'
            }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#721c24' }}>
                💸 Expenses
              </h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Direct Expenses:</span>
                  <strong>{formatCurrency(cashflowData.expenses.total_expenses)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Purchase Payments:</span>
                  <strong>{formatCurrency(cashflowData.expenses.total_purchase_payments)}</strong>
                </div>
                <hr style={{ border: 'none', borderTop: '1px solid #f5c6cb', margin: '12px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold' }}>
                  <span>Total Outflow:</span>
                  <span>{formatCurrency(cashflowData.cashflow.cash_outflow)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div style={{ 
            padding: '20px', 
            backgroundColor: 'var(--background-secondary)', 
            borderRadius: '8px'
          }}>
            <h3 style={{ margin: '0 0 16px 0' }}>Detailed Breakdown</h3>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div style={{ 
                  padding: '12px', 
                  backgroundColor: 'white', 
                  borderRadius: '4px',
                  border: '1px solid var(--border)'
                }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Invoice Amount
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                    {formatCurrency(cashflowData.income.total_invoice_amount)}
                  </div>
                </div>

                <div style={{ 
                  padding: '12px', 
                  backgroundColor: 'white', 
                  borderRadius: '4px',
                  border: '1px solid var(--border)'
                }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Payments Received
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#28a745' }}>
                    {formatCurrency(cashflowData.income.total_payments_received)}
                  </div>
                </div>

                <div style={{ 
                  padding: '12px', 
                  backgroundColor: 'white', 
                  borderRadius: '4px',
                  border: '1px solid var(--border)'
                }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Direct Expenses
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#dc3545' }}>
                    {formatCurrency(cashflowData.expenses.total_expenses)}
                  </div>
                </div>

                <div style={{ 
                  padding: '12px', 
                  backgroundColor: 'white', 
                  borderRadius: '4px',
                  border: '1px solid var(--border)'
                }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Purchase Payments
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#dc3545' }}>
                    {formatCurrency(cashflowData.expenses.total_purchase_payments)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cashflow Analysis */}
          <div style={{ 
            padding: '20px', 
            backgroundColor: '#e2e3e5', 
            borderRadius: '8px',
            border: '1px solid #d6d8db'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#383d41' }}>
              📊 Cashflow Analysis
            </h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Cash Inflow:</span>
                <span style={{ fontWeight: 'bold', color: '#28a745' }}>
                  {formatCurrency(cashflowData.cashflow.cash_inflow)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Cash Outflow:</span>
                <span style={{ fontWeight: 'bold', color: '#dc3545' }}>
                  {formatCurrency(cashflowData.cashflow.cash_outflow)}
                </span>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid #d6d8db', margin: '12px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '18px', fontWeight: 'bold' }}>
                <span>Net Cashflow:</span>
                <span style={{ color: getNetCashflowColor(cashflowData.cashflow.net_cashflow) }}>
                  {formatCurrency(cashflowData.cashflow.net_cashflow)}
                </span>
              </div>
              
              {/* Cashflow Ratio */}
              {cashflowData.cashflow.cash_outflow > 0 && (
                <div style={{ marginTop: '16px', padding: '12px', backgroundColor: 'white', borderRadius: '4px' }}>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Cashflow Ratio (Inflow/Outflow)
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                    {(cashflowData.cashflow.cash_inflow / cashflowData.cashflow.cash_outflow).toFixed(2)}x
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {cashflowData.cashflow.cash_inflow / cashflowData.cashflow.cash_outflow >= 1 
                      ? 'Healthy cashflow - Income exceeds expenses' 
                      : 'Attention needed - Expenses exceed income'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!cashflowData && !loading && (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          color: 'var(--text-secondary)' 
        }}>
          <div style={{ fontSize: '18px', marginBottom: '8px' }}>
            No cashflow data available for the selected period
          </div>
          <div style={{ fontSize: '14px' }}>
            Try adjusting the date range or create some transactions
          </div>
        </div>
      )}
    </Card>
  )
}

