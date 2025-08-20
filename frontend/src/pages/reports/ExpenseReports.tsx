import React, { useState, useEffect } from 'react'
import { useAuth } from '../../modules/AuthContext'
import { Button } from '../../components/Button'
import { DownloadButtons } from '../../components/DownloadButtons'

interface ExpenseReportItem {
  expense_id: number
  expense_date: string
  category: string
  description: string
  amount: number
  vendor_name: string | null
  payment_method: string | null
  reference_number: string | null
}

interface ExpenseReport {
  period: {
    start_date: string
    end_date: string
  }
  summary: {
    total_expenses: number
    expense_count: number
    average_expense: number
  }
  transactions: ExpenseReportItem[]
  category_breakdown: Array<{
    category: string
    total_amount: number
    expense_count: number
    percentage: number
  }>
  vendor_breakdown: Array<{
    vendor_name: string
    total_amount: number
    expense_count: number
    percentage: number
  }>
  trends: {
    monthly_expenses: Array<{
      month: string
      expenses: number
    }>
    expense_trend: string
  }
  generated_at: string
  filters_applied: any
}

export function ExpenseReports() {
  const { token } = useAuth()
  const [report, setReport] = useState<ExpenseReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Filter states
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date()
    date.setDate(date.getDate() - 30)
    return date.toISOString().slice(0, 10)
  })
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10)
  })
  const [category, setCategory] = useState<string>('')
  const [vendorName, setVendorName] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<string>('')

  const loadReport = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate
      })
      
      if (category) params.append('category', category)
      if (vendorName) params.append('vendor_name', vendorName)
      if (paymentMethod) params.append('payment_method', paymentMethod)
      
      const response = await fetch(`/api/reports/expenses?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (!response.ok) {
        throw new Error('Failed to load expense report')
      }
      
      const data = await response.json()
      setReport(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      loadReport()
    }
  }, [token, startDate, endDate, category, vendorName, paymentMethod])

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

  const getCategoryColor = (category: string) => {
    const colors = {
      'Office': '#007bff',
      'Travel': '#28a745',
      'Marketing': '#ffc107',
      'Utilities': '#17a2b8',
      'Rent': '#6f42c1',
      'Insurance': '#fd7e14',
      'Maintenance': '#e83e8c',
      'Other': '#6c757d'
    }
    return colors[category as keyof typeof colors] || '#6c757d'
  }

  const getCategoryIcon = (category: string) => {
    const icons = {
      'Office': '🏢',
      'Travel': '✈️',
      'Marketing': '📢',
      'Utilities': '⚡',
      'Rent': '🏠',
      'Insurance': '🛡️',
      'Maintenance': '🔧',
      'Other': '📋'
    }
    return icons[category as keyof typeof icons] || '📋'
  }

  const clearFilters = () => {
    setCategory('')
    setVendorName('')
    setPaymentMethod('')
  }

  // Download states
  const [pdfLoading, setPdfLoading] = useState(false)
  const [csvLoading, setCsvLoading] = useState(false)

  const handleDownloadPDF = async () => {
    try {
      setPdfLoading(true)
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
        format: 'pdf'
      })
      
      if (category) params.append('category', category)
      if (vendorName) params.append('vendor_name', vendorName)
      if (paymentMethod) params.append('payment_method', paymentMethod)
      
      const response = await fetch(`/api/reports/expenses/download?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (!response.ok) {
        throw new Error('Failed to download PDF')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `expense-analytics-${startDate}-to-${endDate}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('PDF download failed:', err)
      alert('Failed to download PDF. Please try again.')
    } finally {
      setPdfLoading(false)
    }
  }

  const handleDownloadCSV = async () => {
    try {
      setCsvLoading(true)
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
        format: 'csv'
      })
      
      if (category) params.append('category', category)
      if (vendorName) params.append('vendor_name', vendorName)
      if (paymentMethod) params.append('payment_method', paymentMethod)
      
      const response = await fetch(`/api/reports/expenses/download?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (!response.ok) {
        throw new Error('Failed to download CSV')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `expense-analytics-${startDate}-to-${endDate}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('CSV download failed:', err)
      alert('Failed to download CSV. Please try again.')
    } finally {
      setCsvLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '20px', maxWidth: '100%' }}>
        <div style={{ 
          marginBottom: '24px',
          paddingBottom: '12px',
          borderBottom: '2px solid #e9ecef'
        }}>
          <h1 style={{ margin: '0', fontSize: '28px', fontWeight: '600', color: '#2c3e50' }}>Expense Reports</h1>
          <p style={{ color: '#6c757d', marginTop: '8px', fontSize: '16px' }}>
            Expense analysis and cost tracking reports
          </p>
        </div>
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          backgroundColor: 'white',
          border: '1px solid #e9ecef',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '18px', color: '#6c757d' }}>Loading expense report...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '20px', maxWidth: '100%' }}>
        <div style={{ 
          marginBottom: '24px',
          paddingBottom: '12px',
          borderBottom: '2px solid #e9ecef'
        }}>
          <h1 style={{ margin: '0', fontSize: '28px', fontWeight: '600', color: '#2c3e50' }}>Expense Analytics</h1>
          <p style={{ color: '#6c757d', marginTop: '8px', fontSize: '16px' }}>
            Expense analysis and cost tracking analytics
          </p>
        </div>
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          backgroundColor: 'white',
          border: '1px solid #e9ecef',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '18px', color: '#dc3545', marginBottom: '16px' }}>Error: {error}</div>
          <Button onClick={loadReport} variant="primary">Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: '100%' }}>
      <div style={{ 
        marginBottom: '24px',
        paddingBottom: '12px',
        borderBottom: '2px solid #e9ecef'
      }}>
        <h1 style={{ margin: '0', fontSize: '28px', fontWeight: '600', color: '#2c3e50' }}>Expense Analytics</h1>
        <p style={{ color: '#6c757d', marginTop: '8px', fontSize: '16px' }}>
          Expense analysis and cost tracking analytics
        </p>
      </div>

      {/* Filters */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #e9ecef',
        marginBottom: '24px'
      }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#495057' }}>Filters</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          alignItems: 'end'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#495057' }}>
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#495057' }}>
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#495057' }}>
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value="">All Categories</option>
              <option value="Office">Office</option>
              <option value="Travel">Travel</option>
              <option value="Marketing">Marketing</option>
              <option value="Utilities">Utilities</option>
              <option value="Rent">Rent</option>
              <option value="Insurance">Insurance</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#495057' }}>
              Vendor Name
            </label>
            <input
              type="text"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              placeholder="Search vendor..."
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#495057' }}>
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value="">All Methods</option>
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cheque">Cheque</option>
              <option value="upi">UPI</option>
            </select>
          </div>
          
          <div>
            <Button onClick={clearFilters} variant="secondary" style={{ width: '100%' }}>
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Download Section */}
      {report && (
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #e9ecef',
          marginBottom: '24px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h3 style={{ margin: '0', fontSize: '18px', fontWeight: '600', color: '#495057' }}>
              Export Data
            </h3>
            <div style={{ fontSize: '14px', color: '#6c757d' }}>
              Generated: {formatDate(report.generated_at)}
            </div>
          </div>
          <DownloadButtons
            onDownloadPDF={handleDownloadPDF}
            onDownloadCSV={handleDownloadCSV}
            pdfLoading={pdfLoading}
            csvLoading={csvLoading}
            disabled={loading}
          />
        </div>
      )}

      {report && (
        <>
          {/* Summary Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '24px'
          }}>
            <div style={{
              padding: '24px',
              backgroundColor: '#ffebee',
              borderRadius: '8px',
              border: '1px solid #ffcdd2'
            }}>
              <div style={{ fontSize: '14px', color: '#c62828', fontWeight: '500', marginBottom: '8px' }}>
                💸 Total Expenses
              </div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#c62828' }}>
                {formatCurrency(report.summary.total_expenses)}
              </div>
              <div style={{ fontSize: '12px', color: '#c62828', marginTop: '4px' }}>
                {report.summary.expense_count} transactions
              </div>
            </div>

            <div style={{
              padding: '24px',
              backgroundColor: '#fff3e0',
              borderRadius: '8px',
              border: '1px solid #ffe0b2'
            }}>
              <div style={{ fontSize: '14px', color: '#f57c00', fontWeight: '500', marginBottom: '8px' }}>
                📊 Average Expense
              </div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#f57c00' }}>
                {formatCurrency(report.summary.average_expense)}
              </div>
              <div style={{ fontSize: '12px', color: '#f57c00', marginTop: '4px' }}>
                per transaction
              </div>
            </div>

            <div style={{
              padding: '24px',
              backgroundColor: '#e8f5e8',
              borderRadius: '8px',
              border: '1px solid #c8e6c9'
            }}>
              <div style={{ fontSize: '14px', color: '#2e7d32', fontWeight: '500', marginBottom: '8px' }}>
                📈 Expense Trend
              </div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#2e7d32' }}>
                {report.trends.expense_trend === 'increasing' ? '↗️' : '→'}
              </div>
              <div style={{ fontSize: '12px', color: '#2e7d32', marginTop: '4px' }}>
                {report.trends.expense_trend === 'increasing' ? 'Increasing' : 'Stable'}
              </div>
            </div>
          </div>

          {/* Monthly Expense Trend */}
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            border: '1px solid #e9ecef',
            marginBottom: '24px'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#495057' }}>
              Monthly Expense Trend
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '16px'
            }}>
              {report.trends.monthly_expenses.map((month, index) => (
                <div key={index} style={{
                  padding: '16px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  border: '1px solid #dee2e6',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '8px' }}>
                    {month.month}
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#dc3545' }}>
                    {formatCurrency(month.expenses)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Breakdown */}
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            border: '1px solid #e9ecef',
            marginBottom: '24px'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#495057' }}>
              Expenses by Category
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '14px'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>
                      Category
                    </th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>
                      Total Amount
                    </th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>
                      Count
                    </th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>
                      % of Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {report.category_breakdown.map((cat, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '12px', color: '#495057' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <span style={{ fontSize: '16px' }}>{getCategoryIcon(cat.category)}</span>
                          <span style={{ fontWeight: '500' }}>{cat.category}</span>
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#dc3545', fontWeight: '600' }}>
                        {formatCurrency(cat.total_amount)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#495057' }}>
                        {cat.expense_count}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#6c757d' }}>
                        {cat.percentage.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Vendor Breakdown */}
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            border: '1px solid #e9ecef',
            marginBottom: '24px'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#495057' }}>
              Top Vendors by Expense
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '14px'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>
                      Vendor
                    </th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>
                      Total Amount
                    </th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>
                      Count
                    </th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>
                      % of Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {report.vendor_breakdown.slice(0, 10).map((vendor, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '12px', color: '#495057', fontWeight: '500' }}>
                        {vendor.vendor_name}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#dc3545', fontWeight: '600' }}>
                        {formatCurrency(vendor.total_amount)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#495057' }}>
                        {vendor.expense_count}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#6c757d' }}>
                        {vendor.percentage.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Transactions Table */}
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            border: '1px solid #e9ecef'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#495057' }}>
              Recent Expenses
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '14px'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>
                      Date
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>
                      Category
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>
                      Description
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>
                      Vendor
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>
                      Payment Method
                    </th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {report.transactions.slice(0, 20).map((transaction) => (
                    <tr key={transaction.expense_id} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '12px', color: '#495057' }}>
                        {formatDate(transaction.expense_date)}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: getCategoryColor(transaction.category) + '20',
                          color: getCategoryColor(transaction.category),
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {getCategoryIcon(transaction.category)}
                          {transaction.category}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: '#495057', maxWidth: '200px' }}>
                        <div style={{ fontWeight: '500' }}>{transaction.description}</div>
                        {transaction.reference_number && (
                          <div style={{ fontSize: '12px', color: '#6c757d' }}>
                            Ref: {transaction.reference_number}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px', color: '#495057' }}>
                        {transaction.vendor_name || '-'}
                      </td>
                      <td style={{ padding: '12px', color: '#495057' }}>
                        {transaction.payment_method || '-'}
                      </td>
                      <td style={{ 
                        padding: '12px', 
                        textAlign: 'right',
                        fontWeight: '600',
                        color: '#dc3545'
                      }}>
                        {formatCurrency(transaction.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {report.transactions.length === 0 && (
              <div style={{
                padding: '40px',
                textAlign: 'center',
                color: '#6c757d'
              }}>
                No expenses found for the selected period and filters.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
