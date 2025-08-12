import { useEffect, useState } from 'react'
import { useAuth } from '../modules/AuthContext'
import { apiGetGstFilingReport, GstFilingReport } from '../lib/api'
import { Card } from '../components/Card'

type Summary = { taxable_value: number; cgst: number; sgst: number; igst: number; grand_total: number; rate_breakup: { rate: number; taxable_value: number }[] }

export function Reports() {
  const { token } = useAuth()
  const [summary, setSummary] = useState<Summary | null>(null)
  const [gstReport, setGstReport] = useState<GstFilingReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [from, setFrom] = useState<string>(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10))
  const [to, setTo] = useState<string>(() => new Date().toISOString().slice(0,10))
  
  // GST Filing Report State
  const [periodType, setPeriodType] = useState<'month' | 'quarter' | 'year'>('month')
  const [periodValue, setPeriodValue] = useState<string>(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [reportType, setReportType] = useState<'gstr1' | 'gstr2' | 'gstr3b'>('gstr1')
  const [activeTab, setActiveTab] = useState<'summary' | 'gst-filing'>('gst-filing')

  useEffect(() => {
    if (!token) return
    fetch(`/api/reports/gst-summary?from=${from}&to=${to}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setSummary)
      .catch(() => setError('Failed to load'))
  }, [token, from, to])

  const handleGstFilingReport = async (format: 'json' | 'csv' | 'excel' = 'json') => {
    try {
      setLoading(true)
      setError(null)
      const report = await apiGetGstFilingReport(periodType, periodValue, reportType, format)
      if (format === 'json') {
        setGstReport(report)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate GST filing report')
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

  const getPeriodOptions = () => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    
    if (periodType === 'month') {
      const options = []
      for (let year = currentYear - 2; year <= currentYear; year++) {
        for (let month = 1; month <= 12; month++) {
          const value = `${year}-${String(month).padStart(2, '0')}`
          const label = `${year}-${String(month).padStart(2, '0')}`
          options.push({ value, label })
        }
      }
      return options.reverse()
    } else if (periodType === 'quarter') {
      const options = []
      for (let year = currentYear - 2; year <= currentYear; year++) {
        for (let quarter = 1; quarter <= 4; quarter++) {
          const value = `${year}-Q${quarter}`
          const label = `${year} Q${quarter}`
          options.push({ value, label })
        }
      }
      return options.reverse()
    } else {
      const options = []
      for (let year = currentYear - 2; year <= currentYear; year++) {
        options.push({ value: String(year), label: String(year) })
      }
      return options.reverse()
    }
  }

  return (
    <Card>
      <div style={{ marginBottom: '24px' }}>
        <h1>Reports & GST Filing</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
          Generate comprehensive GST reports compliant with Indian GST portal requirements
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        borderBottom: '1px solid var(--border)',
        marginBottom: '24px'
      }}>
        <button
          onClick={() => setActiveTab('gst-filing')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: activeTab === 'gst-filing' ? '#007bff' : 'transparent',
            color: activeTab === 'gst-filing' ? 'white' : 'var(--text)',
            cursor: 'pointer',
            borderBottom: activeTab === 'gst-filing' ? '2px solid #007bff' : 'none',
            fontWeight: activeTab === 'gst-filing' ? '600' : 'normal'
          }}
        >
          📊 GST Filing Reports
        </button>
        <button
          onClick={() => setActiveTab('summary')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: activeTab === 'summary' ? '#007bff' : 'transparent',
            color: activeTab === 'summary' ? 'white' : 'var(--text)',
            cursor: 'pointer',
            borderBottom: activeTab === 'summary' ? '2px solid #007bff' : 'none',
            fontWeight: activeTab === 'summary' ? '600' : 'normal'
          }}
        >
          📈 Summary Reports
        </button>
      </div>

      {activeTab === 'gst-filing' && (
        <div>
          {/* GST Filing Report Configuration */}
          <div style={{ 
            padding: '20px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '8px',
            border: '1px solid #e9ecef',
            marginBottom: '24px'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#495057' }}>
              🎯 GST Filing Report Configuration
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              {/* Period Type */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Period Type
                </label>
                <select
                  value={periodType}
                  onChange={(e) => {
                    setPeriodType(e.target.value as 'month' | 'quarter' | 'year')
                    // Reset period value based on new type
                    const now = new Date()
                    if (e.target.value === 'month') {
                      setPeriodValue(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
                    } else if (e.target.value === 'quarter') {
                      const quarter = Math.ceil((now.getMonth() + 1) / 3)
                      setPeriodValue(`${now.getFullYear()}-Q${quarter}`)
                    } else {
                      setPeriodValue(String(now.getFullYear()))
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    fontSize: '14px'
                  }}
                >
                  <option value="month">Monthly</option>
                  <option value="quarter">Quarterly</option>
                  <option value="year">Yearly</option>
                </select>
              </div>

              {/* Period Value */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Period
                </label>
                <select
                  value={periodValue}
                  onChange={(e) => setPeriodValue(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    fontSize: '14px'
                  }}
                >
                  {getPeriodOptions().map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Report Type */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Report Type
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as 'gstr1' | 'gstr2' | 'gstr3b')}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    fontSize: '14px'
                  }}
                >
                  <option value="gstr1">GSTR-1 (Outward Supplies)</option>
                  <option value="gstr2">GSTR-2 (Inward Supplies)</option>
                  <option value="gstr3b">GSTR-3B (Summary)</option>
                </select>
              </div>
            </div>

            {/* Report Description */}
            <div style={{ 
              padding: '12px', 
              backgroundColor: '#e7f3ff', 
              borderRadius: '4px',
              border: '1px solid #b3d9ff'
            }}>
              <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                {reportType === 'gstr1' && 'GSTR-1: Outward Supplies Report'}
                {reportType === 'gstr2' && 'GSTR-2: Inward Supplies Report'}
                {reportType === 'gstr3b' && 'GSTR-3B: Summary Report'}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>
                {reportType === 'gstr1' && 'Details of all outward supplies made to registered and unregistered persons'}
                {reportType === 'gstr2' && 'Details of all inward supplies received from registered and unregistered persons'}
                {reportType === 'gstr3b' && 'Summary of outward and inward supplies with net tax liability calculation'}
              </div>
            </div>
          </div>

          {/* Generate Report Buttons */}
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            marginBottom: '24px',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => handleGstFilingReport('json')}
              disabled={loading}
              style={{
                padding: '12px 24px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? 'Generating...' : '📊 View Report'}
            </button>
            
            <button
              onClick={() => handleGstFilingReport('csv')}
              disabled={loading}
              style={{
                padding: '12px 24px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                opacity: loading ? 0.6 : 1
              }}
            >
              📄 Download CSV
            </button>
            
            <button
              onClick={() => handleGstFilingReport('excel')}
              disabled={loading}
              style={{
                padding: '12px 24px',
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                opacity: loading ? 0.6 : 1
              }}
            >
              📊 Download Excel
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

          {/* Report Display */}
          {gstReport && (
            <div style={{ 
              padding: '20px', 
              backgroundColor: 'white', 
              borderRadius: '8px',
              border: '1px solid var(--border)'
            }}>
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 8px 0' }}>
                  {gstReport.report_type} Report
                </h3>
                <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                  Period: {gstReport.period} | Generated: {new Date(gstReport.generated_on).toLocaleString()}
                </div>
              </div>

              {reportType === 'gstr1' && (
                <div>
                  {/* B2B Section */}
                  <div style={{ marginBottom: '24px' }}>
                    <h4 style={{ margin: '0 0 12px 0', color: '#495057' }}>
                      B2B Invoices ({gstReport.sections.b2b.length})
                    </h4>
                    {gstReport.sections.b2b.length > 0 ? (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ backgroundColor: '#f8f9fa' }}>
                              <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #dee2e6' }}>Invoice No</th>
                              <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #dee2e6' }}>Date</th>
                              <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #dee2e6' }}>Customer</th>
                              <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #dee2e6' }}>GSTIN</th>
                              <th style={{ padding: '8px', textAlign: 'right', border: '1px solid #dee2e6' }}>Taxable Value</th>
                              <th style={{ padding: '8px', textAlign: 'right', border: '1px solid #dee2e6' }}>CGST</th>
                              <th style={{ padding: '8px', textAlign: 'right', border: '1px solid #dee2e6' }}>SGST</th>
                              <th style={{ padding: '8px', textAlign: 'right', border: '1px solid #dee2e6' }}>IGST</th>
                              <th style={{ padding: '8px', textAlign: 'right', border: '1px solid #dee2e6' }}>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {gstReport.sections.b2b.map((invoice, index) => (
                              <tr key={index} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa' }}>
                                <td style={{ padding: '8px', border: '1px solid #dee2e6' }}>{invoice.invoice_no}</td>
                                <td style={{ padding: '8px', border: '1px solid #dee2e6' }}>{new Date(invoice.invoice_date).toLocaleDateString()}</td>
                                <td style={{ padding: '8px', border: '1px solid #dee2e6' }}>{invoice.customer_name}</td>
                                <td style={{ padding: '8px', border: '1px solid #dee2e6' }}>{invoice.customer_gstin}</td>
                                <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #dee2e6' }}>{formatCurrency(invoice.total_taxable_value)}</td>
                                <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #dee2e6' }}>{formatCurrency(invoice.total_cgst)}</td>
                                <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #dee2e6' }}>{formatCurrency(invoice.total_sgst)}</td>
                                <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #dee2e6' }}>{formatCurrency(invoice.total_igst)}</td>
                                <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #dee2e6', fontWeight: 'bold' }}>{formatCurrency(invoice.grand_total)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No B2B invoices found for the selected period
                      </div>
                    )}
                  </div>

                  {/* Rate-wise Summary */}
                  <div>
                    <h4 style={{ margin: '0 0 12px 0', color: '#495057' }}>
                      Rate-wise Summary
                    </h4>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f8f9fa' }}>
                            <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #dee2e6' }}>GST Rate (%)</th>
                            <th style={{ padding: '8px', textAlign: 'right', border: '1px solid #dee2e6' }}>Taxable Value</th>
                            <th style={{ padding: '8px', textAlign: 'right', border: '1px solid #dee2e6' }}>CGST</th>
                            <th style={{ padding: '8px', textAlign: 'right', border: '1px solid #dee2e6' }}>SGST</th>
                            <th style={{ padding: '8px', textAlign: 'right', border: '1px solid #dee2e6' }}>IGST</th>
                          </tr>
                        </thead>
                        <tbody>
                          {gstReport.sections.rate_wise_summary.map((rate, index) => (
                            <tr key={index} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa' }}>
                              <td style={{ padding: '8px', border: '1px solid #dee2e6', fontWeight: 'bold' }}>{rate.gst_rate}%</td>
                              <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #dee2e6' }}>{formatCurrency(rate.taxable_value)}</td>
                              <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #dee2e6' }}>{formatCurrency(rate.cgst)}</td>
                              <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #dee2e6' }}>{formatCurrency(rate.sgst)}</td>
                              <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #dee2e6' }}>{formatCurrency(rate.igst)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {reportType === 'gstr3b' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                    {/* Outward Supplies */}
                    <div style={{ 
                      padding: '16px', 
                      backgroundColor: '#d4edda', 
                      borderRadius: '8px',
                      border: '1px solid #c3e6cb'
                    }}>
                      <h4 style={{ margin: '0 0 12px 0', color: '#155724' }}>
                        Outward Supplies
                      </h4>
                      <div style={{ display: 'grid', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Taxable Value:</span>
                          <strong>{formatCurrency(gstReport.sections.outward_supplies.total_taxable_value)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>CGST:</span>
                          <strong>{formatCurrency(gstReport.sections.outward_supplies.total_cgst)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>SGST:</span>
                          <strong>{formatCurrency(gstReport.sections.outward_supplies.total_sgst)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>IGST:</span>
                          <strong>{formatCurrency(gstReport.sections.outward_supplies.total_igst)}</strong>
                        </div>
                        <hr style={{ border: 'none', borderTop: '1px solid #c3e6cb', margin: '8px 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                          <span>Total Tax:</span>
                          <span>{formatCurrency(gstReport.sections.outward_supplies.total_tax)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Inward Supplies */}
                    <div style={{ 
                      padding: '16px', 
                      backgroundColor: '#f8d7da', 
                      borderRadius: '8px',
                      border: '1px solid #f5c6cb'
                    }}>
                      <h4 style={{ margin: '0 0 12px 0', color: '#721c24' }}>
                        Inward Supplies
                      </h4>
                      <div style={{ display: 'grid', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Taxable Value:</span>
                          <strong>{formatCurrency(gstReport.sections.inward_supplies.total_taxable_value)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>CGST:</span>
                          <strong>{formatCurrency(gstReport.sections.inward_supplies.total_cgst)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>SGST:</span>
                          <strong>{formatCurrency(gstReport.sections.inward_supplies.total_sgst)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>IGST:</span>
                          <strong>{formatCurrency(gstReport.sections.inward_supplies.total_igst)}</strong>
                        </div>
                        <hr style={{ border: 'none', borderTop: '1px solid #f5c6cb', margin: '8px 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                          <span>Total Tax:</span>
                          <span>{formatCurrency(gstReport.sections.inward_supplies.total_tax)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Net Summary */}
                    <div style={{ 
                      padding: '16px', 
                      backgroundColor: '#e2e3e5', 
                      borderRadius: '8px',
                      border: '1px solid #d6d8db'
                    }}>
                      <h4 style={{ margin: '0 0 12px 0', color: '#383d41' }}>
                        Net Tax Liability
                      </h4>
                      <div style={{ display: 'grid', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Net CGST:</span>
                          <strong style={{ color: gstReport.sections.summary.net_cgst >= 0 ? '#28a745' : '#dc3545' }}>
                            {formatCurrency(gstReport.sections.summary.net_cgst)}
                          </strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Net SGST:</span>
                          <strong style={{ color: gstReport.sections.summary.net_sgst >= 0 ? '#28a745' : '#dc3545' }}>
                            {formatCurrency(gstReport.sections.summary.net_sgst)}
                          </strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Net IGST:</span>
                          <strong style={{ color: gstReport.sections.summary.net_igst >= 0 ? '#28a745' : '#dc3545' }}>
                            {formatCurrency(gstReport.sections.summary.net_igst)}
                          </strong>
                        </div>
                        <hr style={{ border: 'none', borderTop: '1px solid #d6d8db', margin: '8px 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '16px' }}>
                          <span>Total Net Tax:</span>
                          <span style={{ color: gstReport.sections.summary.total_net_tax >= 0 ? '#28a745' : '#dc3545' }}>
                            {formatCurrency(gstReport.sections.summary.total_net_tax)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'summary' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: '20px' }}>
            <label>From <input type="date" value={from} onChange={e => setFrom(e.target.value)} /></label>
            <label>To <input type="date" value={to} onChange={e => setTo(e.target.value)} /></label>
            {summary && <a href={`/api/reports/gst-summary.csv?from=${from}&to=${to}`} target="_blank">Export CSV</a>}
          </div>
          {error && <div style={{ color: 'crimson' }}>{error}</div>}
          {summary && (
            <div style={{ marginTop: 12 }}>
              <div>Total taxable: {summary.taxable_value} | Total tax: {summary.cgst + summary.sgst + summary.igst} | Grand: {summary.grand_total}</div>
              <h3>Rate-wise</h3>
              <ul>
                {summary.rate_breakup.map(r => <li key={r.rate}>{r.rate}%: {r.taxable_value}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

