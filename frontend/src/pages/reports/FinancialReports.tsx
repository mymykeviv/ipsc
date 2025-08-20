import React, { useState, useEffect } from 'react'
import { useAuth } from '../../modules/AuthContext'
import { Button } from '../../components/Button'

interface FinancialReport {
  report_type: string
  period: {
    start_date: string
    end_date: string
    as_of_date: string
  }
  data: any
  generated_at: string
  filters_applied: any
}

export function FinancialReports() {
  const { token } = useAuth()
  const [report, setReport] = useState<FinancialReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Filter states
  const [reportType, setReportType] = useState<string>('profit_loss')
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date()
    date.setDate(date.getDate() - 30)
    return date.toISOString().slice(0, 10)
  })
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10)
  })
  const [asOfDate, setAsOfDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10)
  })

  const loadReport = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        report_type: reportType
      })
      
      if (reportType === 'balance_sheet') {
        params.append('as_of_date', asOfDate)
      } else {
        params.append('start_date', startDate)
        params.append('end_date', endDate)
      }
      
      const response = await fetch(`/api/reports/financial?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (!response.ok) {
        throw new Error('Failed to load financial report')
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
  }, [token, reportType, startDate, endDate, asOfDate])

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

  const getReportTypeColor = (type: string) => {
    switch (type) {
      case 'profit_loss': return '#28a745'
      case 'balance_sheet': return '#007bff'
      case 'cash_flow': return '#ffc107'
      default: return '#6c757d'
    }
  }

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'profit_loss': return '📊'
      case 'balance_sheet': return '⚖️'
      case 'cash_flow': return '💰'
      default: return '📋'
    }
  }

  const renderProfitLossReport = (data: any) => (
    <div>
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
            💰 Total Revenue
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#2e7d32' }}>
            {formatCurrency(data.revenue.total_revenue)}
          </div>
        </div>

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
            {formatCurrency(data.operating_expenses.total_expenses + data.other_expenses.total_expenses)}
          </div>
        </div>

        <div style={{
          padding: '24px',
          backgroundColor: data.net_profit_after_tax >= 0 ? '#e8f5e8' : '#ffebee',
          borderRadius: '8px',
          border: `1px solid ${data.net_profit_after_tax >= 0 ? '#c8e6c9' : '#ffcdd2'}`
        }}>
          <div style={{ 
            fontSize: '14px', 
            color: data.net_profit_after_tax >= 0 ? '#2e7d32' : '#c62828', 
            fontWeight: '500', 
            marginBottom: '8px' 
          }}>
            📈 Net Profit
          </div>
          <div style={{ 
            fontSize: '32px', 
            fontWeight: '700', 
            color: data.net_profit_after_tax >= 0 ? '#2e7d32' : '#c62828' 
          }}>
            {formatCurrency(data.net_profit_after_tax)}
          </div>
        </div>

        <div style={{
          padding: '24px',
          backgroundColor: '#e3f2fd',
          borderRadius: '8px',
          border: '1px solid #bbdefb'
        }}>
          <div style={{ fontSize: '14px', color: '#1976d2', fontWeight: '500', marginBottom: '8px' }}>
            📊 Gross Profit Margin
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#1976d2' }}>
            {data.gross_profit.margin_percentage.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div style={{
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '8px',
        border: '1px solid #e9ecef',
        marginBottom: '24px'
      }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#495057' }}>
          Revenue Breakdown
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
                  Revenue Source
                </th>
                <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {data.revenue.breakdown.map((item: any, index: number) => (
                <tr key={index} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '12px', color: '#495057', fontWeight: '500' }}>
                    {item.source}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', color: '#28a745', fontWeight: '600' }}>
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expense Breakdown */}
      <div style={{
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '8px',
        border: '1px solid #e9ecef',
        marginBottom: '24px'
      }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#495057' }}>
          Expense Breakdown
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
                  Expense Category
                </th>
                <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {data.operating_expenses.breakdown.map((item: any, index: number) => (
                <tr key={index} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '12px', color: '#495057', fontWeight: '500' }}>
                    {item.category}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', color: '#dc3545', fontWeight: '600' }}>
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  const renderBalanceSheetReport = (data: any) => (
    <div>
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
            💰 Total Assets
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#2e7d32' }}>
            {formatCurrency(data.assets.total_assets)}
          </div>
        </div>

        <div style={{
          padding: '24px',
          backgroundColor: '#ffebee',
          borderRadius: '8px',
          border: '1px solid #ffcdd2'
        }}>
          <div style={{ fontSize: '14px', color: '#c62828', fontWeight: '500', marginBottom: '8px' }}>
            💸 Total Liabilities
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#c62828' }}>
            {formatCurrency(data.liabilities.total_liabilities)}
          </div>
        </div>

        <div style={{
          padding: '24px',
          backgroundColor: '#e3f2fd',
          borderRadius: '8px',
          border: '1px solid #bbdefb'
        }}>
          <div style={{ fontSize: '14px', color: '#1976d2', fontWeight: '500', marginBottom: '8px' }}>
            📊 Total Equity
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#1976d2' }}>
            {formatCurrency(data.equity.total_equity)}
          </div>
        </div>
      </div>

      {/* Assets Breakdown */}
      <div style={{
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '8px',
        border: '1px solid #e9ecef',
        marginBottom: '24px'
      }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#495057' }}>
          Assets Breakdown
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
                  Asset Category
                </th>
                <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {data.assets.current_assets.breakdown.map((item: any, index: number) => (
                <tr key={index} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '12px', color: '#495057', fontWeight: '500' }}>
                    {item.category}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', color: '#28a745', fontWeight: '600' }}>
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
              {data.assets.fixed_assets.breakdown.map((item: any, index: number) => (
                <tr key={`fixed-${index}`} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '12px', color: '#495057', fontWeight: '500' }}>
                    {item.category}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', color: '#28a745', fontWeight: '600' }}>
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Liabilities Breakdown */}
      <div style={{
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '8px',
        border: '1px solid #e9ecef',
        marginBottom: '24px'
      }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#495057' }}>
          Liabilities Breakdown
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
                  Liability Category
                </th>
                <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {data.liabilities.current_liabilities.breakdown.map((item: any, index: number) => (
                <tr key={index} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '12px', color: '#495057', fontWeight: '500' }}>
                    {item.category}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', color: '#dc3545', fontWeight: '600' }}>
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
              {data.liabilities.long_term_liabilities.breakdown.map((item: any, index: number) => (
                <tr key={`long-${index}`} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '12px', color: '#495057', fontWeight: '500' }}>
                    {item.category}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', color: '#dc3545', fontWeight: '600' }}>
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  const renderCashFlowReport = (data: any) => (
    <div>
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
            💰 Operating Cash Flow
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#2e7d32' }}>
            {formatCurrency(data.operating_activities.net_cash_flow)}
          </div>
        </div>

        <div style={{
          padding: '24px',
          backgroundColor: '#e3f2fd',
          borderRadius: '8px',
          border: '1px solid #bbdefb'
        }}>
          <div style={{ fontSize: '14px', color: '#1976d2', fontWeight: '500', marginBottom: '8px' }}>
            📊 Investing Cash Flow
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#1976d2' }}>
            {formatCurrency(data.investing_activities.net_cash_flow)}
          </div>
        </div>

        <div style={{
          padding: '24px',
          backgroundColor: '#fff3e0',
          borderRadius: '8px',
          border: '1px solid #ffe0b2'
        }}>
          <div style={{ fontSize: '14px', color: '#f57c00', fontWeight: '500', marginBottom: '8px' }}>
            💳 Financing Cash Flow
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#f57c00' }}>
            {formatCurrency(data.financing_activities.net_cash_flow)}
          </div>
        </div>

        <div style={{
          padding: '24px',
          backgroundColor: data.net_cash_flow >= 0 ? '#e8f5e8' : '#ffebee',
          borderRadius: '8px',
          border: `1px solid ${data.net_cash_flow >= 0 ? '#c8e6c9' : '#ffcdd2'}`
        }}>
          <div style={{ 
            fontSize: '14px', 
            color: data.net_cash_flow >= 0 ? '#2e7d32' : '#c62828', 
            fontWeight: '500', 
            marginBottom: '8px' 
          }}>
            📈 Net Cash Flow
          </div>
          <div style={{ 
            fontSize: '32px', 
            fontWeight: '700', 
            color: data.net_cash_flow >= 0 ? '#2e7d32' : '#c62828' 
          }}>
            {formatCurrency(data.net_cash_flow)}
          </div>
        </div>
      </div>

      {/* Operating Activities */}
      <div style={{
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '8px',
        border: '1px solid #e9ecef',
        marginBottom: '24px'
      }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#495057' }}>
          Operating Activities
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
                  Activity
                </th>
                <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {data.operating_activities.breakdown.map((item: any, index: number) => (
                <tr key={index} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '12px', color: '#495057', fontWeight: '500' }}>
                    {item.description}
                  </td>
                  <td style={{ 
                    padding: '12px', 
                    textAlign: 'right', 
                    fontWeight: '600',
                    color: item.amount >= 0 ? '#28a745' : '#dc3545'
                  }}>
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div style={{ padding: '20px', maxWidth: '100%' }}>
        <div style={{ 
          marginBottom: '24px',
          paddingBottom: '12px',
          borderBottom: '2px solid #e9ecef'
        }}>
          <h1 style={{ margin: '0', fontSize: '28px', fontWeight: '600', color: '#2c3e50' }}>Financial Reports</h1>
          <p style={{ color: '#6c757d', marginTop: '8px', fontSize: '16px' }}>
            Comprehensive financial analysis and reporting
          </p>
        </div>
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          backgroundColor: 'white',
          border: '1px solid #e9ecef',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '18px', color: '#6c757d' }}>Loading financial report...</div>
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
          <h1 style={{ margin: '0', fontSize: '28px', fontWeight: '600', color: '#2c3e50' }}>Financial Reports</h1>
          <p style={{ color: '#6c757d', marginTop: '8px', fontSize: '16px' }}>
            Comprehensive financial analysis and reporting
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
        <h1 style={{ margin: '0', fontSize: '28px', fontWeight: '600', color: '#2c3e50' }}>Financial Reports</h1>
        <p style={{ color: '#6c757d', marginTop: '8px', fontSize: '16px' }}>
          Comprehensive financial analysis and reporting
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
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#495057' }}>Report Configuration</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          alignItems: 'end'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#495057' }}>
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value="profit_loss">Profit & Loss Statement</option>
              <option value="balance_sheet">Balance Sheet</option>
              <option value="cash_flow">Cash Flow Statement</option>
            </select>
          </div>
          
          {reportType !== 'balance_sheet' && (
            <>
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
            </>
          )}
          
          {reportType === 'balance_sheet' && (
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#495057' }}>
                As of Date
              </label>
              <input
                type="date"
                value={asOfDate}
                onChange={(e) => setAsOfDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
          )}
          
          <div>
            <Button onClick={loadReport} variant="primary" style={{ width: '100%' }}>
              Generate Report
            </Button>
          </div>
        </div>
      </div>

      {report && (
        <div>
          {/* Report Header */}
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            border: '1px solid #e9ecef',
            marginBottom: '24px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '16px'
            }}>
              <span style={{ fontSize: '24px' }}>{getReportTypeIcon(report.report_type)}</span>
              <h2 style={{ 
                margin: '0', 
                fontSize: '24px', 
                fontWeight: '600', 
                color: getReportTypeColor(report.report_type) 
              }}>
                {report.report_type.replace('_', ' ').toUpperCase()}
              </h2>
            </div>
            <div style={{ color: '#6c757d', fontSize: '14px' }}>
              <div>Period: {report.period.start_date && report.period.end_date ? 
                `${formatDate(report.period.start_date)} to ${formatDate(report.period.end_date)}` : 
                `As of ${formatDate(report.period.as_of_date)}`}
              </div>
              <div>Generated: {formatDate(report.generated_at)}</div>
            </div>
          </div>

          {/* Report Content */}
          {report.report_type === 'profit_loss' && renderProfitLossReport(report.data)}
          {report.report_type === 'balance_sheet' && renderBalanceSheetReport(report.data)}
          {report.report_type === 'cash_flow' && renderCashFlowReport(report.data)}
        </div>
      )}
    </div>
  )
}
