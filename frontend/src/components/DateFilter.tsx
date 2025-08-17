import React, { useState, useEffect } from 'react'

interface DateFilterProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

interface DateRange {
  from: string
  to: string
}

const presetOptions = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7days', label: 'Last 7 Days' },
  { value: 'last30days', label: 'Last 30 Days' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'thisQuarter', label: 'This Quarter' },
  { value: 'lastQuarter', label: 'Last Quarter' },
  { value: 'thisYear', label: 'This Year' },
  { value: 'lastYear', label: 'Last Year' },
  { value: 'custom', label: 'Custom Range' }
]

export function DateFilter({ value, onChange, placeholder = 'Select date range', className = '' }: DateFilterProps) {
  const [isCustomOpen, setIsCustomOpen] = useState(false)
  const [customRange, setCustomRange] = useState<DateRange>({
    from: '',
    to: ''
  })

  useEffect(() => {
    if (value === 'custom') {
      setIsCustomOpen(true)
    } else {
      setIsCustomOpen(false)
    }
  }, [value])

  const handlePresetChange = (presetValue: string) => {
    if (presetValue === 'custom') {
      setIsCustomOpen(true)
    } else {
      setIsCustomOpen(false)
      onChange(presetValue)
    }
  }

  const handleCustomRangeApply = () => {
    if (customRange.from && customRange.to) {
      onChange(`custom:${customRange.from}:${customRange.to}`)
      setIsCustomOpen(false)
    }
  }

  const handleCustomRangeCancel = () => {
    setIsCustomOpen(false)
    setCustomRange({ from: '', to: '' })
    onChange('all')
  }

  const getDisplayValue = () => {
    if (value === 'all') return 'All Time'
    if (value.startsWith('custom:')) {
      const [, from, to] = value.split(':')
      return `${from} to ${to}`
    }
    const preset = presetOptions.find(option => option.value === value)
    return preset ? preset.label : 'Select date range'
  }

  return (
    <div className={`date-filter ${className}`} style={{ position: 'relative' }}>
      <div
        onClick={() => setIsCustomOpen(!isCustomOpen)}
        style={{
          padding: '10px 16px',
          border: '1px solid #ced4da',
          borderRadius: '6px',
          backgroundColor: 'white',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          minWidth: '200px',
          fontSize: '14px'
        }}
      >
        <span style={{ color: value === 'all' ? '#6c757d' : '#495057' }}>
          {getDisplayValue()}
        </span>
        <span style={{ color: '#6c757d' }}>▼</span>
      </div>

      {isCustomOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'white',
            border: '1px solid #ced4da',
            borderRadius: '6px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
            padding: '16px'
          }}
        >
          {/* Preset Options */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#6c757d', marginBottom: '8px' }}>
              Quick Select
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {presetOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => handlePresetChange(option.value)}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    backgroundColor: value === option.value ? '#007bff' : 'white',
                    color: value === option.value ? 'white' : '#495057',
                    cursor: 'pointer',
                    fontSize: '12px',
                    textAlign: 'left'
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Range */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#6c757d', marginBottom: '8px' }}>
              Custom Range
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input
                type="date"
                value={customRange.from}
                onChange={(e) => setCustomRange(prev => ({ ...prev, from: e.target.value }))}
                style={{
                  padding: '6px 8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '12px',
                  flex: 1
                }}
                placeholder="From"
              />
              <input
                type="date"
                value={customRange.to}
                onChange={(e) => setCustomRange(prev => ({ ...prev, to: e.target.value }))}
                style={{
                  padding: '6px 8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '12px',
                  flex: 1
                }}
                placeholder="To"
              />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleCustomRangeApply}
                disabled={!customRange.from || !customRange.to}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: customRange.from && customRange.to ? '#28a745' : '#6c757d',
                  color: 'white',
                  cursor: customRange.from && customRange.to ? 'pointer' : 'not-allowed',
                  fontSize: '12px',
                  flex: 1
                }}
              >
                Apply
              </button>
              <button
                onClick={handleCustomRangeCancel}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  color: '#495057',
                  cursor: 'pointer',
                  fontSize: '12px',
                  flex: 1
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
