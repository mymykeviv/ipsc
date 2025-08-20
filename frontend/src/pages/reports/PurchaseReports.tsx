import React, { useState, useEffect } from 'react'
import { useAuth } from '../../modules/AuthContext'
import { Button } from '../../components/Button'
import { DownloadButtons } from '../../components/DownloadButtons'

interface PurchaseReportItem {
  purchase_id: number
  purchase_no: string
  purchase_date: string
  vendor_name: string
  taxable_value: number
  total_tax: number
  grand_total: number
  payment_status: string
  payment_amount: number
  outstanding_amount: number
}

interface PurchaseReport {
  period: {
    start_date: string
    end_date: string
  }
  summary: {
    total_purchases: number
    total_tax: number
    total_taxable_value: number
    paid_amount: number
    outstanding_amount: number
    purchase_count: number
    payment_status_breakdown: {
      paid: number
      outstanding: number
    }
  }
  transactions: PurchaseReportItem[]
  vendor_breakdown: Array<{
    vendor_name: string
    total_purchases: number
    purchase_count: number
  }>
  product_breakdown: Array<{
    product_name: string
    total_purchases: number
    quantity_purchased: number
  }>
  trends: {
    monthly_purchases: Array<{
      month: string
      purchases: number
    }>
    purchase_trend: string
  }
  generated_at: string
  filters_applied: any
}

export function PurchaseReports() {
  const { token } = useAuth()
  const [report, setReport] = useState<PurchaseReport | null>(null)
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
  const [vendorId, setVendorId] = useState<string>('')
  const [paymentStatus, setPaymentStatus] = useState<string>('')
  
  // Download states
  const [pdfLoading, setPdfLoading] = useState(false)
  const [csvLoading, setCsvLoading] = useState(false)

  const loadReport = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate
      })
      
      if (vendorId) params.append('vendor_id', vendorId)
      if (paymentStatus) params.append('payment_status', paymentStatus)
      
      const response = await fetch(`/api/reports/purchases?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (!response.ok) {
        throw new Error('Failed to load purchase report')
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
  }, [token, startDate, endDate, vendorId, paymentStatus])

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

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#28a745'
      case 'partial': return '#ffc107'
      case 'pending': return '#dc3545'
      default: return '#6c757d'
    }
  }

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return '✅'
      case 'partial': return '⚠️'
      case 'pending': return '⏳'
      default: return '❓'
    }
  }

  const clearFilters = () => {
    setVendorId('')
    setPaymentStatus('')
  }

  const handleDownloadPDF = async () => {
    try {
      setPdfLoading(true)
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
        format: 'pdf'
      })
      
      if (vendorId) params.append('vendor_id', vendorId)
      if (paymentStatus) params.append('payment_status', paymentStatus)
      
      const response = await fetch(`/api/reports/purchases/download?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (!response.ok) {
        throw new Error('Failed to download PDF')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `purchase-analytics-${startDate}-to-${endDate}.pdf`
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
      
      if (vendorId) params.append('vendor_id', vendorId)
      if (paymentStatus) params.append('payment_status', paymentStatus)
      
      const response = await fetch(`/api/reports/purchases/download?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (!response.ok) {
        throw new Error('Failed to download CSV')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `purchase-analytics-${startDate}-to-${endDate}.csv`
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
          <h1 style={{ margin: '0', fontSize: '28px', fontWeight: '600', color: '#2c3e50' }}>Purchase Analytics</h1>
          <p style={{ color: '#6c757d', marginTop: '8px', fontSize: '16px' }}>
            Purchase analysis and vendor tracking reports
          </p>
        </div>
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          backgroundColor: 'white',
          border: '1px solid #e9ecef',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '18px', color: '#6c757d' }}>Loading purchase report...</div>
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
          <h1 style={{ margin: '0', fontSize: '28px', fontWeight: '600', color: '#2c3e50' }}>Purchase Analytics</h1>
          <p style={{ color: '#6c757d', marginTop: '8px', fontSize: '16px' }}>
            Purchase analysis and vendor tracking reports
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
        <h1 style={{ margin: '0', fontSize: '28px', fontWeight: '600', color: '#2c3e50' }}>Purchase Analytics</h1>
        <p style={{ color: '#6c757d', marginTop: '8px', fontSize: '16px' }}>
          Purchase analysis and vendor tracking reports
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
              Payment Status
            </label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value="">All Status</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="pending">Pending</option>
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
              backgroundColor: '#e3f2fd',
              borderRadius: '8px',
              border: '1px solid #bbdefb'
            }}>
              <div style={{ fontSize: '14px', color: '#1976d2', fontWeight: '500', marginBottom: '8px' }}>
                📦 Total Purchases
              </div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#1976d2' }}>
                {formatCurrency(report.summary.total_purchases)}
              </div>
              <div style={{ fontSize: '12px', color: '#1976d2', marginTop: '4px' }}>
                {report.summary.purchase_count} purchases
              </div>
            </div>

            <div style={{
              padding: '24px',
              backgroundColor: '#e8f5e8',
              borderRadius: '8px',
              border: '1px solid #c8e6c9'
            }}>
              <div style={{ fontSize: '14px', color: '#2e7d32', fontWeight: '500', marginBottom: '8px' }}>
                💳 Paid Amount
              </div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#2e7d32' }}>
                {formatCurrency(report.summary.paid_amount)}
              </div>
              <div style={{ fontSize: '12px', color: '#2e7d32', marginTop: '4px' }}>
                {((report.summary.paid_amount / report.summary.total_purchases) * 100).toFixed(1)}% of total
              </div>
            </div>

            <div style={{
              padding: '24px',
              backgroundColor: '#fff3e0',
              borderRadius: '8px',
              border: '1px solid #ffe0b2'
            }}>
              <div style={{ fontSize: '14px', color: '#f57c00', fontWeight: '500', marginBottom: '8px' }}>
                ⏳ Outstanding
              </div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#f57c00' }}>
                {formatCurrency(report.summary.outstanding_amount)}
              </div>
              <div style={{ fontSize: '12px', color: '#f57c00', marginTop: '4px' }}>
                {((report.summary.outstanding_amount / report.summary.total_purchases) * 100).toFixed(1)}% of total
              </div>
            </div>

            <div style={{
              padding: '24px',
              backgroundColor: '#f3e5f5',
              borderRadius: '8px',
              border: '1px solid #e1bee7'
            }}>
              <div style={{ fontSize: '14px', color: '#7b1fa2', fontWeight: '500', marginBottom: '8px' }}>
                📈 Purchase Trend
              </div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#7b1fa2' }}>
                {report.trends.purchase_trend === 'increasing' ? '↗️' : '→'}
              </div>
              <div style={{ fontSize: '12px', color: '#7b1fa2', marginTop: '4px' }}>
                {report.trends.purchase_trend === 'increasing' ? 'Increasing' : 'Stable'}
              </div>
            </div>
          </div>

          {/* Monthly Purchase Trend */}
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            border: '1px solid #e9ecef',
            marginBottom: '24px'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#495057' }}>
              Monthly Purchase Trend
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '16px'
            }}>
              {report.trends.monthly_purchases.map((month, index) => (
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
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#1976d2' }}>
                    {formatCurrency(month.purchases)}
                  </div>
                </div>
              ))}
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
              Top Vendors by Purchase Value
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
                      Total Purchases
                    </th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>
                      Purchase Count
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
                      <td style={{ padding: '12px', textAlign: 'right', color: '#1976d2', fontWeight: '600' }}>
                        {formatCurrency(vendor.total_purchases)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#495057' }}>
                        {vendor.purchase_count}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#6c757d' }}>
                        {((vendor.total_purchases / report.summary.total_purchases) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Product Breakdown */}
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            border: '1px solid #e9ecef',
            marginBottom: '24px'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#495057' }}>
              Top Products by Purchase Value
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
                      Product
                    </th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>
                      Total Purchases
                    </th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>
                      Quantity Purchased
                    </th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>
                      % of Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {report.product_breakdown.slice(0, 10).map((product, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '12px', color: '#495057', fontWeight: '500' }}>
                        {product.product_name}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#1976d2', fontWeight: '600' }}>
                        {formatCurrency(product.total_purchases)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#495057' }}>
                        {product.quantity_purchased}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#6c757d' }}>
                        {((product.total_purchases / report.summary.total_purchases) * 100).toFixed(1)}%
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
              Recent Purchases
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
                      Purchase
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>
                      Date
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>
                      Vendor
                    </th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>
                      Taxable Value
                    </th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>
                      Tax
                    </th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>
                      Total
                    </th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>
                      Status
                    </th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>
                      Outstanding
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {report.transactions.slice(0, 20).map((transaction) => (
                    <tr key={transaction.purchase_id} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '12px', color: '#495057', fontWeight: '500' }}>
                        {transaction.purchase_no}
                      </td>
                      <td style={{ padding: '12px', color: '#495057' }}>
                        {formatDate(transaction.purchase_date)}
                      </td>
                      <td style={{ padding: '12px', color: '#495057' }}>
                        {transaction.vendor_name}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#495057' }}>
                        {formatCurrency(transaction.taxable_value)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#495057' }}>
                        {formatCurrency(transaction.total_tax)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#1976d2', fontWeight: '600' }}>
                        {formatCurrency(transaction.grand_total)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: getPaymentStatusColor(transaction.payment_status) + '20',
                          color: getPaymentStatusColor(transaction.payment_status),
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {getPaymentStatusIcon(transaction.payment_status)}
                          {transaction.payment_status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ 
                        padding: '12px', 
                        textAlign: 'right',
                        fontWeight: '600',
                        color: transaction.outstanding_amount > 0 ? '#dc3545' : '#28a745'
                      }}>
                        {formatCurrency(transaction.outstanding_amount)}
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
                No purchases found for the selected period and filters.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
