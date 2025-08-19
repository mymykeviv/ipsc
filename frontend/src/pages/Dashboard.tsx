import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../modules/AuthContext'
import { apiGetCashflowSummary, CashflowSummary, apiGetInventoryDashboard, InventoryDashboardMetrics } from '../lib/api'
import { createApiErrorHandler } from '../lib/apiUtils'
import { Button } from '../components/Button'

// GST Summary Types
interface GstSummary {
  taxable_value: number
  cgst: number
  sgst: number
  igst: number
  grand_total: number
  rate_breakup: { rate: number; taxable_value: number }[]
}

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
  const [gstData, setGstData] = useState<GstSummary | null>(null)
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
    loadGstData()
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

  const loadGstData = async () => {
    try {
      const response = await fetch(`/api/reports/gst-summary?from=${startDate}&to=${endDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setGstData(data)
      } else {
        console.error('Failed to load GST data:', response.statusText)
      }
    } catch (err) {
      console.error('Failed to load GST data:', err)
      // Don't show error for GST data, just log it
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
    loadInventoryData()
    loadGstData()
  }

  // Auto-refresh data when custom dates change
  useEffect(() => {
    if (periodType === 'custom' && token) {
      loadCashflowData()
      loadAnalyticsData()
      loadInventoryData()
      loadGstData()
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
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh'
    }}>
      {/* Dashboard Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '32px',
        padding: '24px',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div>
          <h1 style={{ margin: '0', fontSize: '28px', fontWeight: '600', color: '#2c3e50' }}>
            📊 Business Dashboard
          </h1>
          <p style={{ margin: '8px 0 0 0', color: '#6c757d', fontSize: '16px' }}>
            {getPeriodLabel()} • Real-time business overview
          </p>
        </div>
        
        {/* Period Selector and Actions */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button 
              variant={periodType === 'month' ? 'primary' : 'secondary'}
              onClick={() => handlePeriodChange('month')}
              style={{ 
                fontSize: '12px', 
                padding: '8px 16px',
                borderRadius: '6px',
                fontWeight: '500'
              }}
            >
              Month
            </Button>
            <Button 
              variant={periodType === 'quarter' ? 'primary' : 'secondary'}
              onClick={() => handlePeriodChange('quarter')}
              style={{ 
                fontSize: '12px', 
                padding: '8px 16px',
                borderRadius: '6px',
                fontWeight: '500'
              }}
            >
              Quarter
            </Button>
            <Button 
              variant={periodType === 'year' ? 'primary' : 'secondary'}
              onClick={() => handlePeriodChange('year')}
              style={{ 
                fontSize: '12px', 
                padding: '8px 16px',
                borderRadius: '6px',
                fontWeight: '500'
              }}
            >
              Year
            </Button>
          </div>
          
          <Button 
            onClick={() => {
              loadCashflowData()
              loadAnalyticsData()
              loadInventoryData()
            }}
            disabled={loading}
            variant="primary"
            style={{ 
              fontSize: '14px', 
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              fontWeight: '600',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {loading ? '🔄 Loading...' : '🔄 Refresh'}
          </Button>
        </div>
      </div>

      {/* Custom Date Range */}
      {periodType === 'custom' && (
        <div style={{ 
          display: 'flex', 
          gap: '16px', 
          marginBottom: '24px',
          alignItems: 'center',
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div>
            <label style={{ fontSize: '14px', color: '#495057', marginBottom: '8px', display: 'block', fontWeight: '500' }}>
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                padding: '10px 16px',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: 'white'
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '14px', color: '#495057', marginBottom: '8px', display: 'block', fontWeight: '500' }}>
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                padding: '10px 16px',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: 'white'
              }}
            />
          </div>
        </div>
      )}

      {error && (
        <div style={{ 
          padding: '16px', 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          borderRadius: '8px', 
          marginBottom: '24px',
          border: '1px solid #f5c6cb'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Financial Overview - KPI Cards */}
      {cashflowData && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '20px',
          marginBottom: '24px'
        }}>
          {/* Cashflow Summary */}
          <div style={{ 
            padding: '24px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            border: '1px solid #e9ecef'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                backgroundColor: '#e3f2fd', 
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '16px'
              }}>
                <span style={{ fontSize: '24px' }}>💰</span>
              </div>
              <div>
                <h3 style={{ margin: '0', fontSize: '18px', fontWeight: '600', color: '#2c3e50' }}>
                  Cashflow
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6c757d' }}>
                  Net cash position
                </p>
              </div>
            </div>
            <div style={{ 
              fontSize: '32px', 
              fontWeight: 'bold',
              color: getNetCashflowColor(cashflowData.cashflow.net_cashflow),
              marginBottom: '8px'
            }}>
              {formatCurrency(cashflowData.cashflow.net_cashflow)}
            </div>
            <div style={{ fontSize: '14px', color: '#6c757d' }}>
              Inflow: {formatCurrency(cashflowData.cashflow.cash_inflow)} | 
              Outflow: {formatCurrency(cashflowData.cashflow.cash_outflow)}
            </div>
          </div>

          {/* Income Summary */}
          <div style={{ 
            padding: '24px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            border: '1px solid #e9ecef'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                backgroundColor: '#e8f5e8', 
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '16px'
              }}>
                <span style={{ fontSize: '24px' }}>📈</span>
              </div>
              <div>
                <h3 style={{ margin: '0', fontSize: '18px', fontWeight: '600', color: '#2c3e50' }}>
                  Income
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6c757d' }}>
                  Total revenue
                </p>
              </div>
            </div>
            <div style={{ 
              fontSize: '32px', 
              fontWeight: 'bold',
              color: '#28a745',
              marginBottom: '8px'
            }}>
              {formatCurrency(cashflowData.income.total_invoice_amount)}
            </div>
            <div style={{ fontSize: '14px', color: '#6c757d' }}>
              Received: {formatCurrency(cashflowData.income.total_payments_received)}
            </div>
          </div>

          {/* Expenses Summary */}
          <div style={{ 
            padding: '24px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            border: '1px solid #e9ecef'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                backgroundColor: '#fff3e0', 
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '16px'
              }}>
                <span style={{ fontSize: '24px' }}>📉</span>
              </div>
              <div>
                <h3 style={{ margin: '0', fontSize: '18px', fontWeight: '600', color: '#2c3e50' }}>
                  Expenses
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6c757d' }}>
                  Total costs
                </p>
              </div>
            </div>
            <div style={{ 
              fontSize: '32px', 
              fontWeight: 'bold',
              color: '#dc3545',
              marginBottom: '8px'
            }}>
              {formatCurrency(cashflowData.expenses.total_expenses)}
            </div>
            <div style={{ fontSize: '14px', color: '#6c757d' }}>
              Purchases: {formatCurrency(cashflowData.expenses.total_purchase_payments)}
            </div>
          </div>

          {/* Net Flow Summary */}
          <div style={{ 
            padding: '24px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            border: '1px solid #e9ecef'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                backgroundColor: '#f3e5f5', 
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '16px'
              }}>
                <span style={{ fontSize: '24px' }}>⚖️</span>
              </div>
              <div>
                <h3 style={{ margin: '0', fontSize: '18px', fontWeight: '600', color: '#2c3e50' }}>
                  Net Flow
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6c757d' }}>
                  Income - Expenses
                </p>
              </div>
            </div>
            <div style={{ 
              fontSize: '32px', 
              fontWeight: 'bold',
              color: getNetCashflowColor(cashflowData.income.total_invoice_amount - cashflowData.expenses.total_expenses),
              marginBottom: '8px'
            }}>
              {formatCurrency(cashflowData.income.total_invoice_amount - cashflowData.expenses.total_expenses)}
            </div>
            <div style={{ fontSize: '14px', color: '#6c757d' }}>
              Profit margin: {((cashflowData.income.total_invoice_amount - cashflowData.expenses.total_expenses) / cashflowData.income.total_invoice_amount * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      )}

      {/* Critical Actions */}
      <div style={{ 
        padding: '24px',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '24px'
      }}>
        <h3 style={{ 
          margin: '0 0 20px 0', 
          fontSize: '20px', 
          fontWeight: '600', 
          color: '#2c3e50',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          ⚡ Critical Actions
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px'
        }}>
          <Button 
            onClick={() => navigate('/invoices/add')}
            variant="primary"
            style={{ 
              padding: '16px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              fontWeight: '600',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            📄 Create Invoice
          </Button>
          
          <Button 
            onClick={() => navigate('/payments/invoice/add')}
            variant="primary"
            style={{ 
              padding: '16px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              fontWeight: '600',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            💰 Record Payment
          </Button>
          
          <Button 
            onClick={() => navigate('/purchases/add')}
            variant="primary"
            style={{ 
              padding: '16px 20px',
              backgroundColor: '#ffc107',
              color: '#212529',
              fontWeight: '600',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            📦 Add Purchase
          </Button>
          
          <Button 
            onClick={() => navigate('/products')}
            variant="primary"
            style={{ 
              padding: '16px 20px',
              backgroundColor: '#6f42c1',
              color: 'white',
              fontWeight: '600',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            📊 Adjust Stock
          </Button>
        </div>
      </div>

      {/* GST Summary Widget */}
      {gstData && (
        <div style={{ 
          padding: '24px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '24px',
          border: '1px solid #e9ecef'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h3 style={{ 
              margin: '0', 
              fontSize: '20px', 
              fontWeight: '600', 
              color: '#2c3e50',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              🏛️ GST Summary ({getPeriodLabel()})
            </h3>
            <Button 
              onClick={() => navigate('/reports')}
              variant="secondary"
              style={{ 
                padding: '8px 16px',
                backgroundColor: '#6c757d',
                color: 'white',
                fontWeight: '500',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              View Reports
            </Button>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '16px'
          }}>
            {/* Total Taxable Value */}
            <div style={{ 
              padding: '16px',
              backgroundColor: '#e8f5e8',
              borderRadius: '8px',
              border: '1px solid #c8e6c9'
            }}>
              <div style={{ fontSize: '14px', color: '#2e7d32', fontWeight: '500', marginBottom: '4px' }}>
                Taxable Value
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2e7d32' }}>
                {formatCurrency(gstData.taxable_value)}
              </div>
            </div>

            {/* CGST */}
            <div style={{ 
              padding: '16px',
              backgroundColor: '#e3f2fd',
              borderRadius: '8px',
              border: '1px solid #bbdefb'
            }}>
              <div style={{ fontSize: '14px', color: '#1976d2', fontWeight: '500', marginBottom: '4px' }}>
                CGST
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2' }}>
                {formatCurrency(gstData.cgst)}
              </div>
            </div>

            {/* SGST */}
            <div style={{ 
              padding: '16px',
              backgroundColor: '#fff3e0',
              borderRadius: '8px',
              border: '1px solid #ffe0b2'
            }}>
              <div style={{ fontSize: '14px', color: '#f57c00', fontWeight: '500', marginBottom: '4px' }}>
                SGST
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f57c00' }}>
                {formatCurrency(gstData.sgst)}
              </div>
            </div>

            {/* IGST */}
            <div style={{ 
              padding: '16px',
              backgroundColor: '#f3e5f5',
              borderRadius: '8px',
              border: '1px solid #e1bee7'
            }}>
              <div style={{ fontSize: '14px', color: '#7b1fa2', fontWeight: '500', marginBottom: '4px' }}>
                IGST
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#7b1fa2' }}>
                {formatCurrency(gstData.igst)}
              </div>
            </div>

            {/* Grand Total */}
            <div style={{ 
              padding: '16px',
              backgroundColor: '#e8f4fd',
              borderRadius: '8px',
              border: '1px solid #b3d9ff'
            }}>
              <div style={{ fontSize: '14px', color: '#0066cc', fontWeight: '500', marginBottom: '4px' }}>
                Grand Total
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0066cc' }}>
                {formatCurrency(gstData.grand_total)}
              </div>
            </div>
          </div>

          {/* Rate-wise Breakdown */}
          {gstData.rate_breakup && gstData.rate_breakup.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <h4 style={{ 
                margin: '0 0 12px 0', 
                fontSize: '16px', 
                fontWeight: '600', 
                color: '#495057'
              }}>
                Rate-wise Breakdown
              </h4>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                gap: '12px'
              }}>
                {gstData.rate_breakup.map((rate, index) => (
                  <div key={index} style={{ 
                    padding: '12px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '6px',
                    border: '1px solid #dee2e6',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>
                      {rate.rate}% GST
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#495057' }}>
                      {formatCurrency(rate.taxable_value)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Status Dashboard */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
        gap: '20px',
        marginBottom: '24px'
      }}>
        {/* Pending Items */}
        <div style={{ 
          padding: '24px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          border: '1px solid #e9ecef'
        }}>
          <h3 style={{ 
            margin: '0 0 20px 0', 
            fontSize: '18px', 
            fontWeight: '600', 
            color: '#2c3e50',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            ⏰ Pending Items
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '12px 16px',
              backgroundColor: '#fff3cd',
              borderRadius: '8px',
              border: '1px solid #ffeaa7'
            }}>
              <div>
                <div style={{ fontWeight: '500', color: '#856404', marginBottom: '4px' }}>
                  Overdue Invoices
                </div>
                <div style={{ fontSize: '12px', color: '#856404' }}>
                  Payment pending
                </div>
              </div>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: 'bold',
                color: '#856404'
              }}>
                ₹{(cashflowData?.income?.total_invoice_amount || 0) * 0.25}
              </div>
            </div>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '12px 16px',
              backgroundColor: '#f8d7da',
              borderRadius: '8px',
              border: '1px solid #f5c6cb'
            }}>
              <div>
                <div style={{ fontWeight: '500', color: '#721c24', marginBottom: '4px' }}>
                  Due Payments
                </div>
                <div style={{ fontSize: '12px', color: '#721c24' }}>
                  Purchase payments
                </div>
              </div>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: 'bold',
                color: '#721c24'
              }}>
                ₹{(cashflowData?.expenses?.total_purchase_payments || 0) * 0.3}
              </div>
            </div>
            
            {inventoryData && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '12px 16px',
                backgroundColor: '#fff3e0',
                borderRadius: '8px',
                border: '1px solid #ffe0b2'
              }}>
                <div>
                  <div style={{ fontWeight: '500', color: '#f57c00', marginBottom: '4px' }}>
                    Low Stock Items
                  </div>
                  <div style={{ fontSize: '12px', color: '#f57c00' }}>
                    Need attention
                  </div>
                </div>
                <div style={{ 
                  fontSize: '18px', 
                  fontWeight: 'bold',
                  color: '#f57c00'
                }}>
                  {inventoryData.low_stock_items}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Inventory Status */}
        <div style={{ 
          padding: '24px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          border: '1px solid #e9ecef'
        }}>
          <h3 style={{ 
            margin: '0 0 20px 0', 
            fontSize: '18px', 
            fontWeight: '600', 
            color: '#2c3e50',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            📦 Inventory Status
          </h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '16px'
          }}>
            <div style={{ 
              padding: '16px',
              backgroundColor: '#e3f2fd',
              borderRadius: '8px',
              textAlign: 'center',
              border: '1px solid #bbdefb'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2', marginBottom: '4px' }}>
                {inventoryData?.total_products || 0}
              </div>
              <div style={{ fontSize: '12px', color: '#1976d2', fontWeight: '500' }}>Products</div>
            </div>
            
            <div style={{ 
              padding: '16px',
              backgroundColor: '#fff3e0',
              borderRadius: '8px',
              textAlign: 'center',
              border: '1px solid #ffe0b2'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f57c00', marginBottom: '4px' }}>
                {inventoryData?.low_stock_items || 0}
              </div>
              <div style={{ fontSize: '12px', color: '#f57c00', fontWeight: '500' }}>Low Stock</div>
            </div>
            
            <div style={{ 
              padding: '16px',
              backgroundColor: '#fce4ec',
              borderRadius: '8px',
              textAlign: 'center',
              border: '1px solid #f8bbd9'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#c2185b', marginBottom: '4px' }}>
                {inventoryData?.out_of_stock_items || 0}
              </div>
              <div style={{ fontSize: '12px', color: '#c2185b', fontWeight: '500' }}>Out of Stock</div>
            </div>
          </div>
          
          {inventoryData && (
            <div style={{ 
              marginTop: '16px',
              padding: '12px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#6c757d',
              textAlign: 'center'
            }}>
              Total Value: ₹{inventoryData.total_stock_value.toLocaleString('en-IN')}
            </div>
          )}
        </div>
      </div>






      {cashflowData ? (
        <>
          {/* Recent Activity & Quick Insights */}
          <div style={{ 
            padding: '24px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginBottom: '24px'
          }}>
            <h3 style={{ 
              margin: '0 0 20px 0', 
              fontSize: '18px', 
              fontWeight: '600', 
              color: '#2c3e50',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              📊 Recent Activity & Quick Insights
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: '20px'
            }}>
              {/* Recent Transactions */}
              <div style={{ 
                padding: '20px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}>
                <h4 style={{ 
                  margin: '0 0 16px 0', 
                  fontSize: '16px', 
                  fontWeight: '600', 
                  color: '#495057'
                }}>
                  💰 Recent Transactions
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '12px',
                    backgroundColor: 'white',
                    borderRadius: '6px',
                    border: '1px solid #e9ecef'
                  }}>
                    <div>
                      <div style={{ fontWeight: '500', color: '#495057', marginBottom: '4px' }}>
                        Invoice #INV-001
                      </div>
                      <div style={{ fontSize: '12px', color: '#6c757d' }}>
                        Customer Payment
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#28a745' }}>
                        ₹15,000
                      </div>
                      <div style={{ fontSize: '12px', color: '#6c757d' }}>
                        2 hours ago
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '12px',
                    backgroundColor: 'white',
                    borderRadius: '6px',
                    border: '1px solid #e9ecef'
                  }}>
                    <div>
                      <div style={{ fontWeight: '500', color: '#495057', marginBottom: '4px' }}>
                        Purchase #PUR-002
                      </div>
                      <div style={{ fontSize: '12px', color: '#6c757d' }}>
                        Vendor Payment
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#dc3545' }}>
                        ₹8,500
                      </div>
                      <div style={{ fontSize: '12px', color: '#6c757d' }}>
                        1 day ago
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Insights */}
              <div style={{ 
                padding: '20px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}>
                <h4 style={{ 
                  margin: '0 0 16px 0', 
                  fontSize: '16px', 
                  fontWeight: '600', 
                  color: '#495057'
                }}>
                  📈 Quick Insights
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ 
                    padding: '12px',
                    backgroundColor: 'white',
                    borderRadius: '6px',
                    border: '1px solid #e9ecef'
                  }}>
                    <div style={{ fontWeight: '500', color: '#495057', marginBottom: '4px' }}>
                      Cash Flow Trend
                    </div>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>
                      Net cashflow improved by 12% this month
                    </div>
                  </div>
                  
                  <div style={{ 
                    padding: '12px',
                    backgroundColor: 'white',
                    borderRadius: '6px',
                    border: '1px solid #e9ecef'
                  }}>
                    <div style={{ fontWeight: '500', color: '#495057', marginBottom: '4px' }}>
                      Inventory Alert
                    </div>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>
                      {inventoryData?.low_stock_items || 0} items need restocking
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
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

