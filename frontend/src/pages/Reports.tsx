import { useEffect, useState } from 'react'
import { useAuth } from '../modules/AuthContext'

type Summary = { taxable_value: number; cgst: number; sgst: number; igst: number; grand_total: number; rate_breakup: { rate: number; taxable_value: number }[] }

export function Reports() {
  const { token } = useAuth()
  const [summary, setSummary] = useState<Summary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [from, setFrom] = useState<string>(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10))
  const [to, setTo] = useState<string>(() => new Date().toISOString().slice(0,10))

  useEffect(() => {
    if (!token) return
    fetch(`/api/reports/gst-summary?from=${from}&to=${to}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setSummary)
      .catch(() => setError('Failed to load'))
  }, [token, from, to])

  return (
    <div>
      <h1>Reports</h1>
      <div style={{ display: 'flex', gap: 8 }}>
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
  )
}

