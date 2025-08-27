import React, { useState, useEffect } from 'react'
import { SummaryCardGrid, type SummaryCardItem } from '../../components/common/SummaryCardGrid'
import { useAuth } from '../../modules/AuthContext'
import { Button } from '../../components/Button'
import { DownloadButtons } from '../../components/DownloadButtons'

interface CashflowReportItem {
  transaction_id: number
  transaction_type: string
  transaction_date: string
  amount: number
  description: string
  category: string | null
  payment_method: string | null
  reference_type: string | null
  reference_id: number | null
  reference_number: string | null
  party_name: string | null
}

interface CashflowReport {
  period: {
    start_date: string
    end_date: string
  }
  summary: {
    total_income: number
    total_outflow: number
    net_cashflow: number
    total_income_count: number
    total_outflow_count: number
  }
  transactions: CashflowReportItem[]
  trends: {
    monthly_breakdown: Array<{
      month: string
      income: number
      expenses: number
      net_cashflow: number
    }>
    cashflow_trend: string
  }
  generated_at: string
  filters_applied: any
}

export function CashflowReports() {
  const { token } = useAuth()
  const [report, setReport] = useState<CashflowReport | null>(null)
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
  const [transactionType, setTransactionType] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<string>('')
  const [category, setCategory] = useState<string>('')

  const loadReport = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate
      })
      
      if (transactionType) params.append('transaction_type', transactionType)
      if (paymentMethod) params.append('payment_method', paymentMethod)
      if (category) params.append('category', category)
      
      const response = await fetch(`/api/reports/cashflow?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (!response.ok) {
        throw new Error('Failed to load cashflow report')
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
  }, [token, startDate, endDate, transactionType, paymentMethod, category])

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

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'income': return '#28a745'
      case 'expense': return '#dc3545'
      case 'purchase_payment': return '#fd7e14'
      default: return '#6c757d'
    }
  }

  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case 'income': return '💰'
      case 'expense': return '💸'
      case 'purchase_payment': return '📦'
      default: return '📊'
    }
  }

  const clearFilters = () => {
    setTransactionType('')
    setPaymentMethod('')
    setCategory('')
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
      
      if (transactionType) params.append('transaction_type', transactionType)
      if (paymentMethod) params.append('payment_method', paymentMethod)
      if (category) params.append('category', category)
      
      const response = await fetch(`/api/reports/cashflow/download?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (!response.ok) {
        throw new Error('Failed to download PDF')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cashflow-analytics-${startDate}-to-${endDate}.pdf`
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
      
      if (transactionType) params.append('transaction_type', transactionType)
      if (paymentMethod) params.append('payment_method', paymentMethod)
      if (category) params.append('category', category)
      
      const response = await fetch(`/api/reports/cashflow/download?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (!response.ok) {
        throw new Error('Failed to download CSV')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cashflow-analytics-${startDate}-to-${endDate}.csv`
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
          <h1 style={{ margin: '0', fontSize: '28px', fontWeight: '600', color: '#2c3e50' }}>Cashflow Reports</h1>
          <p style={{ color: '#6c757d', marginTop: '8px', fontSize: '16px' }}>
            Cash flow analysis and financial performance reports
          </p>
        </div>
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          backgroundColor: 'white',
          border: '1px solid #e9ecef',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '18px', color: '#6c757d' }}>Loading cashflow report...</div>
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
          <h1 style={{ margin: '0', fontSize: '28px', fontWeight: '600', color: '#2c3e50' }}>Cashflow Analytics</h1>
          <p style={{ color: '#6c757d', marginTop: '8px', fontSize: '16px' }}>
            Cash flow analysis and financial performance analytics
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
        <h1 style={{ margin: '0', fontSize: '28px', fontWeight: '600', color: '#2c3e50' }}>Cashflow Analytics</h1>
        <p style={{ color: '#6c757d', marginTop: '8px', fontSize: '16px' }}>
          Cash flow analysis and financial performance analytics
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
              Transaction Type
            </label>
            <select
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value="">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
              <option value="purchase_payment">Purchase Payment</option>
            </select>
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
              <option value="Sales">Sales</option>
              <option value="Purchases">Purchases</option>
              <option value="Office">Office</option>
              <option value="Travel">Travel</option>
              <option value="Marketing">Marketing</option>
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
          {/* Summary Cards via SummaryCardGrid */}
          <div style={{ marginBottom: '24px' }}>
            {(() => {
              const items: SummaryCardItem[] = [
                {
                  label: 'Total Income',
                  primary: formatCurrency(report.summary.total_income),
                  secondary: `${report.summary.total_income_count} transactions`,
                },
                {
                  label: 'Total Outflow',
                  primary: formatCurrency(report.summary.total_outflow),
                  secondary: `${report.summary.total_outflow_count} transactions`,
                },
                {
                  label: 'Net Cashflow',
                  primary: formatCurrency(report.summary.net_cashflow),
                  secondary: report.trends.cashflow_trend === 'positive' ? 'Positive trend' : 'Negative trend',
                },
              ]
              return <SummaryCardGrid items={items} columnsMin={250} gapPx={16} />
            })()}
          </div>

          {/* Monthly Trend Chart */}
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            border: '1px solid #e9ecef',
            marginBottom: '24px'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#495057' }}>
              Monthly Cashflow Trend
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '16px'
            }}>
              {report.trends.monthly_breakdown.map((month: CashflowReport['trends']['monthly_breakdown'][number], index: number) => (
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
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#28a745', marginBottom: '4px' }}>
                    +{formatCurrency(month.income)}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#dc3545', marginBottom: '4px' }}>
                    -{formatCurrency(month.expenses)}
                  </div>
                  <div style={{ 
                    fontSize: '16px', 
                    fontWeight: '700', 
                    color: month.net_cashflow >= 0 ? '#28a745' : '#dc3545' 
                  }}>
                    {formatCurrency(month.net_cashflow)}
                  </div>
                </div>
              ))}
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
              Recent Transactions
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
                      Type
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>
                      Description
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>
                      Category
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>
                      Party
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>
                      Method
                    </th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {report.transactions.slice(0, 20).map((transaction: CashflowReportItem) => (
                    <tr key={transaction.transaction_id} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '12px', color: '#495057' }}>
                        {formatDate(transaction.transaction_date)}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: getTransactionTypeColor(transaction.transaction_type) + '20',
                          color: getTransactionTypeColor(transaction.transaction_type),
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {getTransactionTypeIcon(transaction.transaction_type)}
                          {transaction.transaction_type.replace('_', ' ').toUpperCase()}
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
                        {transaction.category || '-'}
                      </td>
                      <td style={{ padding: '12px', color: '#495057' }}>
                        {transaction.party_name || '-'}
                      </td>
                      <td style={{ padding: '12px', color: '#495057' }}>
                        {transaction.payment_method || '-'}
                      </td>
                      <td style={{ 
                        padding: '12px', 
                        textAlign: 'right',
                        fontWeight: '600',
                        color: transaction.transaction_type === 'income' ? '#28a745' : '#dc3545'
                      }}>
                        {transaction.transaction_type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
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
                No transactions found for the selected period and filters.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
