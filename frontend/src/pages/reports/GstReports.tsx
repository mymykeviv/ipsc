import { useEffect, useState } from 'react'
import { useAuth } from '../../modules/AuthContext'
import { apiGetGstFilingReport, GstFilingReport } from '../../lib/api'
import { Button } from '../../components/Button'

type Summary = { taxable_value: number; cgst: number; sgst: number; igst: number; grand_total: number; rate_breakup: { rate: number; taxable_value: number }[] }

export function GstReports() {
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
    <div style={{ padding: '20px', maxWidth: '100%' }}>
      <div style={{ 
        marginBottom: '24px',
        paddingBottom: '12px',
        borderBottom: '2px solid #e9ecef'
      }}>
        <h1 style={{ margin: '0', fontSize: '28px', fontWeight: '600', color: '#2c3e50' }}>GST Reports</h1>
        <p style={{ color: '#6c757d', marginTop: '8px', fontSize: '16px' }}>
          Generate comprehensive GST reports compliant with Indian GST portal requirements
        </p>
      </div>

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

      {/* GST Summary Report */}
      <div style={{ 
        padding: '20px', 
        border: '1px solid #e9ecef',
        borderRadius: '8px',
        backgroundColor: 'white',
        marginBottom: '24px'
      }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600', color: '#495057' }}>GST Summary Report</h2>
        
        {/* Date Range Selector */}
        <div style={{ 
          display: 'flex', 
          gap: '16px', 
          alignItems: 'center', 
          marginBottom: '24px',
          padding: '16px',
          backgroundColor: '#f8f9fa',
          borderRadius: '6px'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>From Date:</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>To Date:</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>
        </div>

        {/* GST Summary Display */}
        {summary && (
          <div style={{ 
            border: '1px solid #e9ecef', 
            borderRadius: '8px', 
            overflow: 'hidden',
            backgroundColor: 'white'
          }}>
            <h3 style={{ 
              margin: '0', 
              padding: '16px', 
              backgroundColor: '#f8f9fa', 
              borderBottom: '1px solid #e9ecef',
              fontSize: '18px',
              fontWeight: '600',
              color: '#495057'
            }}>
              GST Summary
            </h3>
            <div style={{ padding: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#e3f2fd', borderRadius: '6px' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2' }}>
                    {formatCurrency(summary.taxable_value)}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666' }}>Taxable Value</div>
                </div>
                <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#e8f5e8', borderRadius: '6px' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2e7d32' }}>
                    {formatCurrency(summary.cgst)}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666' }}>CGST</div>
                </div>
                <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#fff3e0', borderRadius: '6px' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f57c00' }}>
                    {formatCurrency(summary.sgst)}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666' }}>SGST</div>
                </div>
                <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#fce4ec', borderRadius: '6px' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#c2185b' }}>
                    {formatCurrency(summary.igst)}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666' }}>IGST</div>
                </div>
                <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#f3e5f5', borderRadius: '6px' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#7b1fa2' }}>
                    {formatCurrency(summary.grand_total)}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666' }}>Grand Total</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* GST Filing Reports */}
      <div style={{ 
        padding: '20px', 
        border: '1px solid #e9ecef',
        borderRadius: '8px',
        backgroundColor: 'white'
      }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600', color: '#495057' }}>GST Filing Reports</h2>
        
        {/* Report Configuration */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px', 
          marginBottom: '24px',
          padding: '16px',
          backgroundColor: '#f8f9fa',
          borderRadius: '6px'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>Period Type:</label>
            <select
              value={periodType}
              onChange={(e) => setPeriodType(e.target.value as 'month' | 'quarter' | 'year')}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: 'white'
              }}
            >
              <option value="month">Month</option>
              <option value="quarter">Quarter</option>
              <option value="year">Year</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>Period:</label>
            <select
              value={periodValue}
              onChange={(e) => setPeriodValue(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: 'white'
              }}
            >
              {getPeriodOptions().map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>Report Type:</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as 'gstr1' | 'gstr2' | 'gstr3b')}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: 'white'
              }}
            >
              <option value="gstr1">GSTR-1</option>
              <option value="gstr2">GSTR-2</option>
              <option value="gstr3b">GSTR-3B</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <Button 
            variant="primary" 
            onClick={() => handleGstFilingReport('json')}
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => handleGstFilingReport('csv')}
            disabled={loading}
          >
            Export CSV
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => handleGstFilingReport('excel')}
            disabled={loading}
          >
            Export Excel
          </Button>
        </div>

        {/* Report Display */}
        {gstReport && (
          <div style={{ 
            border: '1px solid #e9ecef', 
            borderRadius: '8px', 
            overflow: 'hidden',
            backgroundColor: 'white'
          }}>
            <h3 style={{ 
              margin: '0', 
              padding: '16px', 
              backgroundColor: '#f8f9fa', 
              borderBottom: '1px solid #e9ecef',
              fontSize: '18px',
              fontWeight: '600',
              color: '#495057'
            }}>
              Generated Report
            </h3>
            <div style={{ padding: '16px' }}>
              <pre style={{ 
                margin: 0, 
                fontSize: '14px', 
                color: '#495057',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {JSON.stringify(gstReport, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
