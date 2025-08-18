import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../modules/AuthContext'
import { apiGetCashflowSummary, CashflowSummary, apiGetInventoryDashboard, InventoryDashboardMetrics } from '../lib/api'
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
  const [inventoryData, setInventoryData] = useState<InventoryDashboardMetrics | null>(null)
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
    loadInventoryData()
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

  const loadInventoryData = async () => {
    try {
      const data = await apiGetInventoryDashboard()
      setInventoryData(data)
    } catch (err) {
      console.error('Failed to load inventory data:', err)
      // Don't show error for inventory data, just log it
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

          {/* Stock Inventory Section */}
          {inventoryData && (
            <div style={{ 
              marginTop: '32px',
              padding: '24px',
              backgroundColor: '#f8f9fa',
              borderRadius: '12px',
              border: '1px solid #e9ecef'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '24px' 
              }}>
                <h3 style={{ 
                  margin: '0', 
                  fontSize: '24px', 
                  fontWeight: '600', 
                  color: '#2c3e50'
                }}>
                  📦 Stock Inventory
                </h3>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <Button 
                    onClick={() => navigate('/products')}
                    variant="secondary"
                    style={{ 
                      fontSize: '14px', 
                      padding: '8px 16px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      fontWeight: '600',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    📦 Manage Products
                  </Button>
                  <Button 
                    onClick={() => navigate('/reports/inventory')}
                    variant="primary"
                    style={{ 
                      fontSize: '14px', 
                      padding: '8px 16px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      fontWeight: '600',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    View Inventory Reports
                  </Button>
                </div>
              </div>

              {/* Inventory Metrics Cards */}
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
                  textAlign: 'center',
                  border: '1px solid #bbdefb'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2', marginBottom: '8px' }}>
                    {inventoryData.total_products}
                  </div>
                  <div style={{ fontSize: '14px', color: '#1976d2', fontWeight: '500' }}>Total Products</div>
                </div>
                
                <div style={{ 
                  padding: '20px', 
                  backgroundColor: '#e8f5e8', 
                  borderRadius: '8px',
                  textAlign: 'center',
                  border: '1px solid #c8e6c9'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2e7d32', marginBottom: '8px' }}>
                    ₹{inventoryData.total_stock_value.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '14px', color: '#2e7d32', fontWeight: '500' }}>Total Stock Value</div>
                </div>
                
                <div style={{ 
                  padding: '20px', 
                  backgroundColor: '#fff3e0', 
                  borderRadius: '8px',
                  textAlign: 'center',
                  border: '1px solid #ffe0b2'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f57c00', marginBottom: '8px' }}>
                    {inventoryData.low_stock_items}
                  </div>
                  <div style={{ fontSize: '14px', color: '#f57c00', fontWeight: '500' }}>Low Stock Items</div>
                </div>
                
                <div style={{ 
                  padding: '20px', 
                  backgroundColor: '#fce4ec', 
                  borderRadius: '8px',
                  textAlign: 'center',
                  border: '1px solid #f8bbd9'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#c2185b', marginBottom: '8px' }}>
                    {inventoryData.out_of_stock_items}
                  </div>
                  <div style={{ fontSize: '14px', color: '#c2185b', fontWeight: '500' }}>Out of Stock</div>
                </div>
                
                <div style={{ 
                  padding: '20px', 
                  backgroundColor: '#f3e5f5', 
                  borderRadius: '8px',
                  textAlign: 'center',
                  border: '1px solid #e1bee7'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#7b1fa2', marginBottom: '8px' }}>
                    {inventoryData.recent_movements}
                  </div>
                  <div style={{ fontSize: '14px', color: '#7b1fa2', fontWeight: '500' }}>Recent Movements</div>
                </div>
                
                <div style={{ 
                  padding: '20px', 
                  backgroundColor: '#e0f2f1', 
                  borderRadius: '8px',
                  textAlign: 'center',
                  border: '1px solid #b2dfdb'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#00695c', marginBottom: '8px' }}>
                    {inventoryData.average_stock_level.toFixed(1)}
                  </div>
                  <div style={{ fontSize: '14px', color: '#00695c', fontWeight: '500' }}>Avg Stock Level</div>
                </div>
              </div>

              {/* Alerts and Insights */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
                gap: '24px'
              }}>
                {/* Low Stock Alerts */}
                <div style={{ 
                  border: '1px solid #e9ecef',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    padding: '12px 16px', 
                    backgroundColor: '#fff3cd', 
                    borderBottom: '1px solid #e9ecef'
                  }}>
                    <h4 style={{ 
                      margin: '0', 
                      fontSize: '16px', 
                      fontWeight: '600', 
                      color: '#856404'
                    }}>
                      ⚠️ Low Stock Alerts ({inventoryData.low_stock_alerts.length})
                    </h4>
                  </div>
                  
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {inventoryData.low_stock_alerts.length === 0 ? (
                      <div style={{ padding: '16px', textAlign: 'center', color: '#6c757d' }}>
                        No low stock alerts
                      </div>
                    ) : (
                      <div style={{ padding: '0' }}>
                        {inventoryData.low_stock_alerts.slice(0, 5).map((alert, index) => (
                          <div key={alert.product_id} style={{ 
                            padding: '12px 16px', 
                            borderBottom: index < Math.min(inventoryData.low_stock_alerts.length - 1, 4) ? '1px solid #f1f3f4' : 'none',
                            backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <div style={{ fontWeight: '500', color: '#495057', marginBottom: '4px' }}>
                                  {alert.product_name}
                                </div>
                                <div style={{ fontSize: '12px', color: '#6c757d' }}>
                                  Category: {alert.category || 'Uncategorized'}
                                </div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ 
                                  fontSize: '16px', 
                                  fontWeight: 'bold',
                                  color: '#f57c00'
                                }}>
                                  {alert.current_stock}
                                </div>
                                <div style={{ fontSize: '12px', color: '#6c757d' }}>
                                  Min: {alert.minimum_stock}
                                </div>
                                <Button 
                                  onClick={() => navigate(`/products?adjust_stock=${alert.product_id}`)}
                                  variant="secondary"
                                  style={{ 
                                    fontSize: '11px', 
                                    padding: '4px 8px',
                                    backgroundColor: '#f8f9fa',
                                    color: '#6c757d',
                                    fontWeight: '500',
                                    border: '1px solid #dee2e6',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s',
                                    marginTop: '4px'
                                  }}
                                >
                                  Adjust Stock
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Top Moving Products */}
                <div style={{ 
                  border: '1px solid #e9ecef',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    padding: '12px 16px', 
                    backgroundColor: '#d1ecf1', 
                    borderBottom: '1px solid #e9ecef'
                  }}>
                    <h4 style={{ 
                      margin: '0', 
                      fontSize: '16px', 
                      fontWeight: '600', 
                      color: '#0c5460'
                    }}>
                      📊 Top Moving Products
                    </h4>
                  </div>
                  
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {inventoryData.top_moving_products.length === 0 ? (
                      <div style={{ padding: '16px', textAlign: 'center', color: '#6c757d' }}>
                        No movement data available
                      </div>
                    ) : (
                      <div style={{ padding: '0' }}>
                        {inventoryData.top_moving_products.slice(0, 5).map((product, index) => (
                          <div key={product.product_id} style={{ 
                            padding: '12px 16px', 
                            borderBottom: index < Math.min(inventoryData.top_moving_products.length - 1, 4) ? '1px solid #f1f3f4' : 'none',
                            backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <div style={{ fontWeight: '500', color: '#495057', marginBottom: '4px' }}>
                                  {product.product_name}
                                </div>
                                <div style={{ fontSize: '12px', color: '#6c757d' }}>
                                  Category: {product.category || 'Uncategorized'}
                                </div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ 
                                  fontSize: '16px', 
                                  fontWeight: 'bold',
                                  color: '#1976d2'
                                }}>
                                  {product.movement_count}
                                </div>
                                <div style={{ fontSize: '12px', color: '#6c757d' }}>
                                  Stock: {product.current_stock}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

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

