import React, { useMemo, useState } from 'react'

export interface StockMovementRow {
  id?: string | number
  timestamp: string | Date
  type: string
  quantity_change: number
  sku?: string | null
  category?: string | null
  source?: string | null
  destination?: string | null
  reference?: string | null
  user?: string | null
  unit_price?: number | null
  value?: number | null
  supplier?: string | null
  balance?: number | null
  remarks?: string | null
}

interface Filters {
  dateFrom?: string
  dateTo?: string
  type?: string
  source?: string
  destination?: string
  user?: string
  search?: string
}

interface Props {
  rows: StockMovementRow[]
  onExportCSV?: () => void
}

function toDisplayDate(ts: string | Date): string {
  const d = typeof ts === 'string' ? new Date(ts) : ts
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString()
}

function formatCurrency(n?: number | null): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n)
}

function downloadCSV(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const StockMovementHistoryTable: React.FC<Props> = ({ rows, onExportCSV }) => {
  const [filters, setFilters] = useState<Filters>({})
  const [sortBy, setSortBy] = useState<'timestamp' | 'type' | 'quantity_change'>('timestamp')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [expanded, setExpanded] = useState<Set<string | number>>(new Set())

  const filtered = useMemo(() => {
    const f = rows.filter(r => {
      // Date filters
      if (filters.dateFrom && new Date(r.timestamp) < new Date(filters.dateFrom)) return false
      if (filters.dateTo && new Date(r.timestamp) > new Date(filters.dateTo)) return false
      if (filters.type && filters.type !== 'all' && r.type !== filters.type) return false
      if (filters.source && filters.source !== 'all' && (r.source || '') !== filters.source) return false
      if (filters.destination && filters.destination !== 'all' && (r.destination || '') !== filters.destination) return false
      if (filters.user && filters.user !== 'all' && (r.user || '') !== filters.user) return false
      if (filters.search) {
        const q = filters.search.toLowerCase()
        const hay = [r.reference, r.remarks, r.source, r.destination, r.user].filter(Boolean).join(' ').toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })

    const sorted = [...f].sort((a, b) => {
      let cmp = 0
      if (sortBy === 'timestamp') {
        cmp = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      } else if (sortBy === 'type') {
        cmp = a.type.localeCompare(b.type)
      } else if (sortBy === 'quantity_change') {
        cmp = (a.quantity_change || 0) - (b.quantity_change || 0)
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

    return sorted
  }, [rows, filters, sortBy, sortDir])

  const summary = useMemo(() => {
    let opening = 0 // If backend provides opening, replace later
    let inwards = 0
    let outwards = 0
    let adjustments = 0

    filtered.forEach(r => {
      if (r.type.toLowerCase().includes('purchase') || r.quantity_change > 0) inwards += r.quantity_change
      else if (r.type.toLowerCase().includes('adjust')) adjustments += r.quantity_change
      else outwards += Math.abs(r.quantity_change)
    })

    const net = opening + inwards - outwards + adjustments
    return { opening, inwards, outwards, adjustments, current: net }
  }, [filtered])

  const toggleRow = (key: string | number) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const handleCSVExport = () => {
    if (onExportCSV) return onExportCSV()
    const header = ['Date & Time','Type','Quantity','SKU','Category','From','To','Reference','User','Unit Price','Value','Supplier','Balance','Remarks']
    const lines = filtered.map(r => [
      toDisplayDate(r.timestamp),
      r.type,
      r.quantity_change,
      r.sku || '',
      r.category || '',
      r.source || '',
      r.destination || '',
      r.reference || '',
      r.user || '',
      r.unit_price ?? '',
      r.value ?? '',
      r.supplier || '',
      r.balance ?? '',
      (r.remarks || '').replace(/\n/g, ' ')
    ].join(','))
    const csv = [header.join(','), ...lines].join('\n')
    downloadCSV('stock-movement-history.csv', csv)
  }

  const unique = (arr: (string | null | undefined)[]) => Array.from(new Set(arr.filter(Boolean) as string[]))
  const typeOptions = useMemo(() => unique(rows.map(r => r.type)), [rows])
  const sourceOptions = useMemo(() => unique(rows.map(r => r.source)), [rows])
  const destOptions = useMemo(() => unique(rows.map(r => r.destination)), [rows])
  const userOptions = useMemo(() => unique(rows.map(r => r.user)), [rows])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Filters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(140px, 1fr))', gap: 8 }}>
        <input type="date" value={filters.dateFrom || ''} onChange={e => setFilters(s => ({ ...s, dateFrom: e.target.value }))} />
        <input type="date" value={filters.dateTo || ''} onChange={e => setFilters(s => ({ ...s, dateTo: e.target.value }))} />
        <select value={filters.type || 'all'} onChange={e => setFilters(s => ({ ...s, type: e.target.value }))}>
          <option value="all">All Types</option>
          {typeOptions.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filters.source || 'all'} onChange={e => setFilters(s => ({ ...s, source: e.target.value }))}>
          <option value="all">All Sources</option>
          {sourceOptions.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filters.destination || 'all'} onChange={e => setFilters(s => ({ ...s, destination: e.target.value }))}>
          <option value="all">All Destinations</option>
          {destOptions.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filters.user || 'all'} onChange={e => setFilters(s => ({ ...s, user: e.target.value }))}>
          <option value="all">All Users</option>
          {userOptions.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <input placeholder="Search notes/ref" value={filters.search || ''} onChange={e => setFilters(s => ({ ...s, search: e.target.value }))} />
      </div>

      {/* Summary */}
      <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#555' }}>
        <div>Opening: <strong>{summary.opening}</strong></div>
        <div>Inwards: <strong style={{ color: 'green' }}>{summary.inwards}</strong></div>
        <div>Outwards: <strong style={{ color: 'crimson' }}>-{summary.outwards}</strong></div>
        <div>Adjustments: <strong>{summary.adjustments}</strong></div>
        <div>Current: <strong>{summary.current}</strong></div>
        <div style={{ marginLeft: 'auto' }}>
          <button onClick={handleCSVExport}>Export CSV</button>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflow: 'auto', maxHeight: '60vh', border: '1px solid #e9ecef', borderRadius: 6 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0, background: '#fafafa' }}>
            <tr>
              {/* Expand control */}
              <th style={{ width: 36, borderBottom: '1px solid #e9ecef' }} />
              {[
                { key: 'timestamp', label: 'Date & Time' },
                { key: 'type', label: 'Type' },
                { key: 'quantity_change', label: 'Quantity' },
                { key: 'sku', label: 'SKU' },
                { key: 'category', label: 'Category' },
                { key: 'from', label: 'From' },
                { key: 'to', label: 'To' },
                { key: 'reference', label: 'Reference' },
                { key: 'user', label: 'User' },
                { key: 'unit_price', label: 'Unit Price' },
                { key: 'value', label: 'Value' },
                { key: 'supplier', label: 'Supplier' },
                { key: 'balance', label: 'Balance' },
                { key: 'remarks', label: 'Remarks' },
              ].map(col => (
                <th
                  key={col.key}
                  onClick={() => {
                    if (col.key === 'timestamp' || col.key === 'type' || col.key === 'quantity_change') {
                      if (sortBy === col.key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
                      setSortBy(col.key as any)
                    }
                  }}
                  style={{ textAlign: 'left', padding: '8px 10px', cursor: 'pointer', borderBottom: '1px solid #e9ecef' }}
                >
                  {col.label} {sortBy === col.key ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => {
              const rowKey: string | number = r.id ?? `${r.timestamp}-${r.reference ?? ''}`
              const isOpen = expanded.has(rowKey)
              return (
                <>
                  <tr key={rowKey}>
                    <td style={{ padding: '6px 8px', borderBottom: '1px solid #f1f3f5' }}>
                      <button
                        onClick={() => toggleRow(rowKey)}
                        aria-expanded={isOpen}
                        aria-label={isOpen ? 'Collapse row' : 'Expand row'}
                        style={{ border: '1px solid #dee2e6', borderRadius: 4, background: 'white', width: 22, height: 22, lineHeight: '20px', textAlign: 'center', cursor: 'pointer' }}
                      >
                        {isOpen ? '−' : '+'}
                      </button>
                    </td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #f1f3f5' }}>{toDisplayDate(r.timestamp)}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #f1f3f5' }}>{r.type}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #f1f3f5', color: r.quantity_change >= 0 ? 'green' : 'crimson' }}>
                      {r.quantity_change >= 0 ? `+${r.quantity_change}` : r.quantity_change}
                    </td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #f1f3f5' }}>{r.sku || '—'}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #f1f3f5' }}>{r.category || '—'}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #f1f3f5' }}>{r.source || '—'}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #f1f3f5' }}>{r.destination || '—'}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #f1f3f5' }}>{r.reference || '—'}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #f1f3f5' }}>{r.user || '—'}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #f1f3f5' }}>{formatCurrency(r.unit_price)}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #f1f3f5' }}>{formatCurrency(r.value)}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #f1f3f5' }}>{r.supplier || '—'}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #f1f3f5' }}>{r.balance ?? '—'}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #f1f3f5', maxWidth: 320, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.remarks || ''}>
                      {r.remarks || '—'}
                    </td>
                  </tr>
                  {isOpen && (
                    <tr key={`${rowKey}-details`}>
                      <td colSpan={15} style={{ padding: 0, background: '#fbfbfb', borderBottom: '1px solid #f1f3f5' }}>
                        <div style={{ padding: '10px 12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                          <div><strong>Date & Time:</strong><br/>{toDisplayDate(r.timestamp)}</div>
                          <div><strong>Type:</strong><br/>{r.type}</div>
                          <div><strong>Quantity Change:</strong><br/>{r.quantity_change}</div>
                          <div><strong>SKU:</strong><br/>{r.sku || '—'}</div>
                          <div><strong>Category:</strong><br/>{r.category || '—'}</div>
                          <div><strong>From:</strong><br/>{r.source || '—'}</div>
                          <div><strong>To:</strong><br/>{r.destination || '—'}</div>
                          <div><strong>Reference:</strong><br/>{r.reference || '—'}</div>
                          <div><strong>User:</strong><br/>{r.user || '—'}</div>
                          <div><strong>Unit Price:</strong><br/>{formatCurrency(r.unit_price ?? undefined)}</div>
                          <div><strong>Value:</strong><br/>{formatCurrency(r.value ?? undefined)}</div>
                          <div><strong>Supplier:</strong><br/>{r.supplier || '—'}</div>
                          <div><strong>Balance:</strong><br/>{r.balance ?? '—'}</div>
                          <div style={{ gridColumn: '1 / -1' }}><strong>Remarks:</strong><br/>{r.remarks || '—'}</div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={15} style={{ padding: 16, textAlign: 'center', color: '#6c757d' }}>
                  No movements found for the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
