import React, { useState, useEffect } from 'react'
import { useAuth } from '../../modules/AuthContext'
import { Button } from '../../components/Button'

interface PaymentReportItem {
  payment_id: number
  payment_date: string
  payment_type: string
  payment_method: string
  amount: number
  reference_type: string
  reference_id: number
  reference_number: string
  party_name: string
  status: string
}

interface PaymentReport {
  period: {
    start_date: string
    end_date: string
  }
  summary: {
    total_payments: number
    payment_count: number
    average_payment: number
  }
  transactions: PaymentReportItem[]
  method_breakdown: Array<{
    payment_method: string
    total_amount: number
    payment_count: number
    percentage: number
  }>
  party_breakdown: Array<{
    party_name: string
    total_amount: number
    payment_count: number
    percentage: number
  }>
  trends: {
    monthly_payments: Array<{
      month: string
      payments: number
    }>
    payment_trend: string
  }
  generated_at: string
  filters_applied: any
}

export function PaymentReports() {
  const { token } = useAuth()
  const [report, setReport] = useState<PaymentReport | null>(null)
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
  const [paymentType, setPaymentType] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<string>('')
  const [partyId, setPartyId] = useState<string>('')

  const loadReport = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate
      })
      
      if (paymentType) params.append('payment_type', paymentType)
      if (paymentMethod) params.append('payment_method', paymentMethod)
      if (partyId) params.append('party_id', partyId)
      
      const response = await fetch(`/api/reports/payments?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (!response.ok) {
        throw new Error('Failed to load payment report')
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
  }, [token, startDate, endDate, paymentType, paymentMethod, partyId])

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

  const getPaymentTypeColor = (type: string) => {
    switch (type) {
      case 'invoice_payment': return '#28a745'
      case 'purchase_payment': return '#007bff'
      default: return '#6c757d'
    }
  }

  const getPaymentTypeIcon = (type: string) => {
    switch (type) {
      case 'invoice_payment': return '💰'
      case 'purchase_payment': return '💳'
      default: return '📊'
    }
  }

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'cash': return '#28a745'
      case 'bank_transfer': return '#007bff'
      case 'cheque': return '#ffc107'
      case 'upi': return '#6f42c1'
      default: return '#6c757d'
    }
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return '💵'
      case 'bank_transfer': return '🏦'
      case 'cheque': return '📄'
      case 'upi': return '📱'
      default: return '💳'
    }
  }

  const clearFilters = () => {
    setPaymentType('')
    setPaymentMethod('')
    setPartyId('')
  }

  if (loading) {
    return (
      <div style={{ padding: '20px', maxWidth: '100%' }}>
        <div style={{ 
          marginBottom: '24px',
          paddingBottom: '12px',
          borderBottom: '2px solid #e9ecef'
        }}>
          <h1 style={{ margin: '0', fontSize: '28px', fontWeight: '600', color: '#2c3e50' }}>Payment Analytics</h1>
          <p style={{ color: '#6c757d', marginTop: '8px', fontSize: '16px' }}>
            Payment analysis and transaction tracking reports
          </p>
        </div>
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          backgroundColor: 'white',
          border: '1px solid #e9ecef',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '18px', color: '#6c757d' }}>Loading payment report...</div>
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
          <h1 style={{ margin: '0', fontSize: '28px', fontWeight: '600', color: '#2c3e50' }}>Payment Analytics</h1>
          <p style={{ color: '#6c757d', marginTop: '8px', fontSize: '16px' }}>
            Payment analysis and transaction tracking reports
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
        <h1 style={{ margin: '0', fontSize: '28px', fontWeight: '600', color: '#2c3e50' }}>Payment Analytics</h1>
        <p style={{ color: '#6c757d', marginTop: '8px', fontSize: '16px' }}>
          Payment analysis and transaction tracking reports
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
              Payment Type
            </label>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value="">All Types</option>
              <option value="invoice_payment">Invoice Payment</option>
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
            <Button onClick={clearFilters} variant="secondary" style={{ width: '100%' }}>
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

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
              backgroundColor: '#e8f5e8',
              borderRadius: '8px',
              border: '1px solid #c8e6c9'
            }}>
              <div style={{ fontSize: '14px', color: '#2e7d32', fontWeight: '500', marginBottom: '8px' }}>
                💰 Total Payments
              </div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#2e7d32' }}>
                {formatCurrency(report.summary.total_payments)}
              </div>
              <div style={{ fontSize: '12px', color: '#2e7d32', marginTop: '4px' }}>
                {report.summary.payment_count} transactions
              </div>
            </div>

            <div style={{
              padding: '24px',
              backgroundColor: '#e3f2fd',
              borderRadius: '8px',
              border: '1px solid #bbdefb'
            }}>
              <div style={{ fontSize: '14px', color: '#1976d2', fontWeight: '500', marginBottom: '8px' }}>
                📊 Average Payment
              </div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#1976d2' }}>
                {formatCurrency(report.summary.average_payment)}
              </div>
              <div style={{ fontSize: '12px', color: '#1976d2', marginTop: '4px' }}>
                per transaction
              </div>
            </div>

            <div style={{
              padding: '24px',
              backgroundColor: '#f3e5f5',
              borderRadius: '8px',
              border: '1px solid #e1bee7'
            }}>
              <div style={{ fontSize: '14px', color: '#7b1fa2', fontWeight: '500', marginBottom: '8px' }}>
                📈 Payment Trend
              </div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#7b1fa2' }}>
                {report.trends.payment_trend === 'increasing' ? '↗️' : '→'}
              </div>
              <div style={{ fontSize: '12px', color: '#7b1fa2', marginTop: '4px' }}>
                {report.trends.payment_trend === 'increasing' ? 'Increasing' : 'Stable'}
              </div>
            </div>
          </div>

          {/* Monthly Payment Trend */}
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            border: '1px solid #e9ecef',
            marginBottom: '24px'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#495057' }}>
              Monthly Payment Trend
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '16px'
            }}>
              {report.trends.monthly_payments.map((month, index) => (
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
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#28a745' }}>
                    {formatCurrency(month.payments)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Method Breakdown */}
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            border: '1px solid #e9ecef',
            marginBottom: '24px'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#495057' }}>
              Payments by Method
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
                      Method
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
                  {report.method_breakdown.map((method, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '12px', color: '#495057' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <span style={{ fontSize: '16px' }}>{getPaymentMethodIcon(method.payment_method)}</span>
                          <span style={{ fontWeight: '500' }}>{method.payment_method.replace('_', ' ').toUpperCase()}</span>
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#28a745', fontWeight: '600' }}>
                        {formatCurrency(method.total_amount)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#495057' }}>
                        {method.payment_count}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#6c757d' }}>
                        {method.percentage.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Party Breakdown */}
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            border: '1px solid #e9ecef',
            marginBottom: '24px'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#495057' }}>
              Top Parties by Payment Value
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
                      Party
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
                  {report.party_breakdown.slice(0, 10).map((party, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '12px', color: '#495057', fontWeight: '500' }}>
                        {party.party_name}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#28a745', fontWeight: '600' }}>
                        {formatCurrency(party.total_amount)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#495057' }}>
                        {party.payment_count}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#6c757d' }}>
                        {party.percentage.toFixed(1)}%
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
              Recent Payments
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
                      Method
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>
                      Party
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>
                      Reference
                    </th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {report.transactions.slice(0, 20).map((transaction) => (
                    <tr key={transaction.payment_id} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '12px', color: '#495057' }}>
                        {formatDate(transaction.payment_date)}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: getPaymentTypeColor(transaction.payment_type) + '20',
                          color: getPaymentTypeColor(transaction.payment_type),
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {getPaymentTypeIcon(transaction.payment_type)}
                          {transaction.payment_type.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: getPaymentMethodColor(transaction.payment_method) + '20',
                          color: getPaymentMethodColor(transaction.payment_method),
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {getPaymentMethodIcon(transaction.payment_method)}
                          {transaction.payment_method.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: '#495057' }}>
                        {transaction.party_name}
                      </td>
                      <td style={{ padding: '12px', color: '#495057' }}>
                        {transaction.reference_number}
                      </td>
                      <td style={{ 
                        padding: '12px', 
                        textAlign: 'right',
                        fontWeight: '600',
                        color: '#28a745'
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
                No payments found for the selected period and filters.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
