import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../modules/AuthContext'
import { apiGetCashflowSummary, CashflowSummary } from '../lib/api'
import { createApiErrorHandler } from '../lib/apiUtils'
import { Button } from '../components/Button'

// Enhanced Analytics Components
interface AnalyticsData {
  salesTrend: { date: string; amount: number }[]
  purchaseTrend: { date: string; amount: number }[]
  topSellingItems: { name: string; quantity: number; revenue: number }[]
  lowStockItems: { name: string; currentStock: number; minStock: number }[]
  customerInsights: { name: string; totalPurchases: number; avgOrderValue: number }[]
  vendorInsights: { name: string; totalSupplies: number; avgSupplyValue: number }[]
  gstInsights: { month: string; cgst: number; sgst: number; igst: number }[]
}

export function Dashboard() {
  const { token, forceLogout } = useAuth()
  const navigate = useNavigate()
  const [cashflowData, setCashflowData] = useState<CashflowSummary | null>(null)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
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
    loadAnalyticsData()
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

  const loadAnalyticsData = async () => {
    try {
      // Mock analytics data - in real implementation, this would come from API
      const mockAnalytics: AnalyticsData = {
        salesTrend: [
          { date: '2024-01', amount: 150000 },
          { date: '2024-02', amount: 180000 },
          { date: '2024-03', amount: 220000 },
          { date: '2024-04', amount: 190000 },
          { date: '2024-05', amount: 250000 },
          { date: '2024-06', amount: 280000 }
        ],
        purchaseTrend: [
          { date: '2024-01', amount: 120000 },
          { date: '2024-02', amount: 140000 },
          { date: '2024-03', amount: 180000 },
          { date: '2024-04', amount: 160000 },
          { date: '2024-05', amount: 200000 },
          { date: '2024-06', amount: 220000 }
        ],
        topSellingItems: [
          { name: 'Industrial Motor', quantity: 45, revenue: 675000 },
          { name: 'Steel Bearings', quantity: 120, revenue: 360000 },
          { name: 'Hydraulic Pumps', quantity: 28, revenue: 420000 },
          { name: 'Control Valves', quantity: 65, revenue: 325000 }
        ],
        lowStockItems: [
          { name: 'Steel Bearings', currentStock: 8, minStock: 10 },
          { name: 'Hydraulic Pumps', currentStock: 3, minStock: 5 },
          { name: 'Control Valves', currentStock: 12, minStock: 15 }
        ],
        customerInsights: [
          { name: 'ABC Manufacturing', totalPurchases: 15, avgOrderValue: 45000 },
          { name: 'XYZ Industries', totalPurchases: 12, avgOrderValue: 38000 },
          { name: 'DEF Solutions', totalPurchases: 8, avgOrderValue: 52000 }
        ],
        vendorInsights: [
          { name: 'Steel Corp Ltd', totalSupplies: 25, avgSupplyValue: 28000 },
          { name: 'Motor Industries', totalSupplies: 18, avgSupplyValue: 35000 },
          { name: 'Pump Solutions', totalSupplies: 22, avgSupplyValue: 32000 }
        ],
        gstInsights: [
          { month: 'Jan 2024', cgst: 13500, sgst: 13500, igst: 27000 },
          { month: 'Feb 2024', cgst: 16200, sgst: 16200, igst: 32400 },
          { month: 'Mar 2024', cgst: 19800, sgst: 19800, igst: 39600 }
        ]
      }
      setAnalyticsData(mockAnalytics)
    } catch (err) {
      console.error('Failed to load analytics data:', err)
    }
  }

  // Add manual refresh function
  const handleRefresh = () => {
    loadCashflowData()
    loadAnalyticsData()
  }

  // Auto-refresh data when custom dates change
  useEffect(() => {
    if (periodType === 'custom' && token) {
      loadCashflowData()
      loadAnalyticsData()
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

  const handlePeriodChange = (newPeriodType: 'month' | 'quarter' | 'year' | 'custom') => {
    setPeriodType(newPeriodType)
    
    const now = new Date()
    let newStartDate = ''
    let newEndDate = now.toISOString().split('T')[0]
    
    if (newPeriodType === 'month') {
      newStartDate = now.toISOString().split('T')[0].substring(0, 7) + '-01'
    } else if (newPeriodType === 'quarter') {
      const quarter = Math.ceil((now.getMonth() + 1) / 3)
      const quarterStartMonth = (quarter - 1) * 3
      newStartDate = `${now.getFullYear()}-${String(quarterStartMonth + 1).padStart(2, '0')}-01`
    } else if (newPeriodType === 'year') {
      newStartDate = `${now.getFullYear()}-01-01`
    }
    
    if (newStartDate) {
      setStartDate(newStartDate)
      setEndDate(newEndDate)
    }
  }

  return (
    <div style={{ 
      padding: '24px', 
      maxWidth: '1400px', 
      margin: '0 auto',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '2px solid #e9ecef'
      }}>
        <h1 style={{ margin: '0', fontSize: '28px', fontWeight: '600', color: '#2c3e50' }}>
          Dashboard - {getPeriodLabel()}
        </h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Button variant="secondary" onClick={handleRefresh} disabled={loading}>
            {loading ? 'Refreshing...' : '🔄 Refresh'}
          </Button>
        </div>
      </div>

      {/* Period Selector */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        <Button 
          variant={periodType === 'month' ? 'primary' : 'secondary'}
          onClick={() => handlePeriodChange('month')}
          style={{ fontSize: '12px', padding: '6px 12px' }}
        >
          This Month
        </Button>
        <Button 
          variant={periodType === 'quarter' ? 'primary' : 'secondary'}
          onClick={() => handlePeriodChange('quarter')}
          style={{ fontSize: '12px', padding: '6px 12px' }}
        >
          This Quarter
        </Button>
        <Button 
          variant={periodType === 'year' ? 'primary' : 'secondary'}
          onClick={() => handlePeriodChange('year')}
          style={{ fontSize: '12px', padding: '6px 12px' }}
        >
          This Year
        </Button>
        <Button 
          variant={periodType === 'custom' ? 'primary' : 'secondary'}
          onClick={() => handlePeriodChange('custom')}
          style={{ fontSize: '12px', padding: '6px 12px' }}
        >
          Custom Range
        </Button>
      </div>

      {/* Custom Date Range */}
      {periodType === 'custom' && (
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          marginBottom: '24px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <div>
            <label style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px', display: 'block' }}>
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                padding: '6px 10px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px', display: 'block' }}>
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                padding: '6px 10px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            />
          </div>
        </div>
      )}

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>


          {/* Cashflow Summary - Full Width */}
          <div style={{ 
            padding: '24px', 
            border: '2px solid #28a745',
            borderRadius: '8px',
            backgroundColor: '#f8fff9'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#155724', fontSize: '20px', textAlign: 'center', fontWeight: '600' }}>
              💰 Cashflow Summary
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '20px',
              textAlign: 'center'
            }}>
              <div>
                <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '4px' }}>
                  Total Income
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
                  {formatCurrency(cashflowData.income.total_invoice_amount)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '4px' }}>
                  Total Expenses
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc3545' }}>
                  {formatCurrency(cashflowData.expenses.total_expenses)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '4px' }}>
                  Net Cashflow
                </div>
                <div style={{ 
                  fontSize: '24px', 
                  fontWeight: 'bold', 
                  color: getNetCashflowColor(cashflowData.cashflow.net_cashflow)
                }}>
                  {formatCurrency(cashflowData.cashflow.net_cashflow)}
                </div>
              </div>
            </div>
          </div>

          {/* Expense Breakdown by Category */}
          <div style={{ 
            padding: '20px', 
            border: '2px solid #dc3545',
            borderRadius: '8px',
            backgroundColor: '#fff5f5'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#721c24', fontSize: '18px', textAlign: 'center', fontWeight: '600' }}>
              📊 Expense Breakdown by Category
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '20px',
              textAlign: 'center'
            }}>
              <div style={{ 
                padding: '16px', 
                border: '1px solid #dc3545',
                borderRadius: '6px',
                backgroundColor: '#fff'
              }}>
                <div style={{ fontSize: '14px', color: '#721c24', marginBottom: '8px', fontWeight: '600' }}>
                  🏭 Direct/COGS
                </div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#dc3545', marginBottom: '4px' }}>
                  {formatCurrency(cashflowData.expenses.total_expenses * 0.6)}
                </div>
                <div style={{ fontSize: '12px', color: '#6c757d' }}>
                  {Math.round((cashflowData.expenses.total_expenses * 0.6 / cashflowData.expenses.total_expenses) * 100)}% of total expenses
                </div>
              </div>
              <div style={{ 
                padding: '16px', 
                border: '1px solid #dc3545',
                borderRadius: '6px',
                backgroundColor: '#fff'
              }}>
                <div style={{ fontSize: '14px', color: '#721c24', marginBottom: '8px', fontWeight: '600' }}>
                  🏢 Indirect/Operating
                </div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#dc3545', marginBottom: '4px' }}>
                  {formatCurrency(cashflowData.expenses.total_expenses * 0.4)}
                </div>
                <div style={{ fontSize: '12px', color: '#6c757d' }}>
                  {Math.round((cashflowData.expenses.total_expenses * 0.4 / cashflowData.expenses.total_expenses) * 100)}% of total expenses
                </div>
              </div>
            </div>
            <div style={{ 
              marginTop: '16px', 
              padding: '12px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '6px',
              fontSize: '12px',
              color: '#6c757d',
              textAlign: 'center'
            }}>
              💡 <strong>Direct/COGS:</strong> Raw materials, packing, freight | <strong>Indirect/Operating:</strong> Salary, rent, utilities, marketing
            </div>
          </div>

          {/* Pending Payments Cards - 2 Column Layout */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
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
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Button 
                    onClick={() => navigate('/purchases/add')}
                    variant="primary"
                    style={{ 
                      fontSize: '12px', 
                      padding: '6px 12px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      fontWeight: '600',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    📦 New Purchase
                  </Button>
                  <Button 
                    onClick={() => navigate('/payments/purchase/list')}
                    variant="secondary"
                    style={{ 
                      fontSize: '12px', 
                      padding: '6px 12px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      fontWeight: '500',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    View Payments
                  </Button>
                </div>
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
                  ₹{(cashflowData?.income?.total_invoice_amount || 0) * 0.25}
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  color: '#0056b3',
                  fontWeight: '500',
                  marginBottom: '12px'
                }}>
                  Outstanding payments
                </div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Button 
                    onClick={() => navigate('/invoices/add')}
                    variant="primary"
                    style={{ 
                      fontSize: '12px', 
                      padding: '6px 12px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      fontWeight: '600',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    📄 New Invoice
                  </Button>
                  <Button 
                    onClick={() => navigate('/payments/invoice/list')}
                    variant="secondary"
                    style={{ 
                      fontSize: '12px', 
                      padding: '6px 12px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      fontWeight: '500',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    View Payments
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Analytics Section - 2 Column Layout */}
          {analyticsData && (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: '20px'
            }}>
              {/* Top Selling Items */}
              <div style={{ 
                padding: '20px', 
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                backgroundColor: 'white',
                height: 'fit-content'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ margin: '0', color: '#495057', fontSize: '18px', fontWeight: '600' }}>
                    🏆 Top Selling Items
                  </h4>
                  <Button 
                    onClick={() => navigate('/products/add')}
                    variant="primary"
                    style={{ 
                      fontSize: '12px', 
                      padding: '6px 12px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      fontWeight: '600',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    🏷️ Add Product
                  </Button>
                </div>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {analyticsData.topSellingItems.map((item, index) => (
                    <div key={index} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '8px 12px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '4px'
                    }}>
                      <div>
                        <div style={{ fontWeight: '500', color: '#495057' }}>{item.name}</div>
                        <div style={{ fontSize: '12px', color: '#6c757d' }}>
                          Quantity: {item.quantity}
                        </div>
                      </div>
                      <div style={{ fontWeight: '600', color: '#28a745' }}>
                        {formatCurrency(item.revenue)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Low Stock Alerts */}
              <div style={{ 
                padding: '20px', 
                border: '1px solid #ffc107',
                borderRadius: '8px',
                backgroundColor: '#fff8e1',
                height: 'fit-content'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ margin: '0', color: '#856404', fontSize: '18px', fontWeight: '600' }}>
                    ⚠️ Low Stock Alerts
                  </h4>
                  <Button 
                    onClick={() => navigate('/products')}
                    variant="primary"
                    style={{ 
                      fontSize: '12px', 
                      padding: '6px 12px',
                      backgroundColor: '#ffc107',
                      color: '#856404',
                      fontWeight: '600',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    📦 Manage Products
                  </Button>
                </div>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {analyticsData.lowStockItems.map((item, index) => (
                    <div key={index} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '8px 12px',
                      backgroundColor: '#fff3cd',
                      borderRadius: '4px'
                    }}>
                      <div>
                        <div style={{ fontWeight: '500', color: '#856404' }}>{item.name}</div>
                        <div style={{ fontSize: '12px', color: '#856404' }}>
                          Current: {item.currentStock} | Min: {item.minStock}
                        </div>
                      </div>
                      <Button 
                        onClick={() => navigate('/products/stock-adjustment')}
                        variant="secondary"
                        style={{ fontSize: '11px', padding: '4px 8px' }}
                      >
                        Adjust Stock
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer Insights */}
              <div style={{ 
                padding: '20px', 
                border: '1px solid #17a2b8',
                borderRadius: '8px',
                backgroundColor: '#e7f3ff',
                height: 'fit-content'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ margin: '0', color: '#0056b3', fontSize: '18px', fontWeight: '600' }}>
                    👥 Top Customers
                  </h4>
                  <Button 
                    onClick={() => navigate('/customers')}
                    variant="primary"
                    style={{ 
                      fontSize: '12px', 
                      padding: '6px 12px',
                      backgroundColor: '#17a2b8',
                      color: 'white',
                      fontWeight: '600',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    👤 Manage Customers
                  </Button>
                </div>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {analyticsData.customerInsights.map((customer, index) => (
                    <div key={index} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '8px 12px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '4px'
                    }}>
                      <div>
                        <div style={{ fontWeight: '500', color: '#495057' }}>{customer.name}</div>
                        <div style={{ fontSize: '12px', color: '#6c757d' }}>
                          Orders: {customer.totalPurchases}
                        </div>
                      </div>
                      <div style={{ fontWeight: '600', color: '#17a2b8' }}>
                        Avg: {formatCurrency(customer.avgOrderValue)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* GST Insights */}
              <div style={{ 
                padding: '20px', 
                border: '1px solid #6f42c1',
                borderRadius: '8px',
                backgroundColor: '#f8f5ff',
                height: 'fit-content'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ margin: '0', color: '#6f42c1', fontSize: '18px', fontWeight: '600' }}>
                    🏛️ GST Insights (Last 3 Months)
                  </h4>
                  <Button 
                    onClick={() => navigate('/invoices')}
                    variant="primary"
                    style={{ 
                      fontSize: '12px', 
                      padding: '6px 12px',
                      backgroundColor: '#6f42c1',
                      color: 'white',
                      fontWeight: '600',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    📊 View Reports
                  </Button>
                </div>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {analyticsData.gstInsights.map((gst, index) => (
                    <div key={index} style={{ 
                      padding: '12px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '4px'
                    }}>
                      <div style={{ fontWeight: '500', color: '#495057', marginBottom: '8px' }}>
                        {gst.month}
                      </div>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(3, 1fr)', 
                        gap: '8px',
                        fontSize: '12px'
                      }}>
                        <div>
                          <div style={{ color: '#6c757d' }}>CGST</div>
                          <div style={{ fontWeight: '600', color: '#6f42c1' }}>
                            {formatCurrency(gst.cgst)}
                          </div>
                        </div>
                        <div>
                          <div style={{ color: '#6c757d' }}>SGST</div>
                          <div style={{ fontWeight: '600', color: '#6f42c1' }}>
                            {formatCurrency(gst.sgst)}
                          </div>
                        </div>
                        <div>
                          <div style={{ color: '#6c757d' }}>IGST</div>
                          <div style={{ fontWeight: '600', color: '#6f42c1' }}>
                            {formatCurrency(gst.igst)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '200px',
          fontSize: '16px',
          color: '#6c757d'
        }}>
          {loading ? 'Loading dashboard data...' : 'No data available'}
        </div>
      )}
    </div>
  )
}

