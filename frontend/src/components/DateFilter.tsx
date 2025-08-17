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
    <div className={`date-filter ${className}`} style={{ 
      position: 'relative',
      zIndex: 9999 // Ensure the dropdown container has high z-index
    }}>
      <div
        onClick={() => setIsCustomOpen(!isCustomOpen)}
        style={{
          padding: '6px 10px', // Reduced padding
          border: '1px solid #ced4da',
          borderRadius: '4px', // Reduced border radius
          backgroundColor: 'white',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          minWidth: '160px', // Reduced min width
          fontSize: '12px', // Reduced font size
          minHeight: '32px' // Reduced min height
        }}
      >
        <span style={{ 
          color: value === 'all' ? '#6c757d' : '#495057',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1
        }}>
          {getDisplayValue()}
        </span>
        <span style={{ 
          color: '#6c757d',
          fontSize: '10px', // Reduced font size
          marginLeft: '8px'
        }}>▼</span>
      </div>

      {isCustomOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: 'white',
          border: '1px solid #ced4da',
          borderRadius: '4px', // Reduced border radius
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          zIndex: 9999, // Increased z-index to ensure it appears above other elements
          marginTop: '2px' // Reduced margin
        }}>
          {/* Preset Options */}
          <div style={{ maxHeight: '150px', overflow: 'auto' }}> {/* Reduced max height */}
            {presetOptions.map((option) => (
              <div
                key={option.value}
                onClick={() => handlePresetChange(option.value)}
                style={{
                  padding: '4px 8px', // Reduced padding
                  cursor: 'pointer',
                  fontSize: '11px', // Reduced font size
                  backgroundColor: value === option.value ? '#e3f2fd' : 'transparent',
                  color: value === option.value ? '#1976d2' : '#495057',
                  borderBottom: '1px solid #f8f9fa'
                }}
                onMouseEnter={(e) => {
                  if (value !== option.value) {
                    e.currentTarget.style.backgroundColor = '#f8f9fa'
                  }
                }}
                onMouseLeave={(e) => {
                  if (value !== option.value) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
                {option.label}
              </div>
            ))}
          </div>

          {/* Custom Range Input */}
          {isCustomOpen && (
            <div style={{ 
              padding: '8px', // Reduced padding
              borderTop: '1px solid #e9ecef',
              backgroundColor: '#f8f9fa'
            }}>
              <div style={{ marginBottom: '6px' }}> {/* Reduced margin */}
                <label style={{ 
                  fontSize: '10px', // Reduced font size
                  color: '#495057',
                  fontWeight: '500',
                  display: 'block',
                  marginBottom: '2px' // Reduced margin
                }}>
                  From Date:
                </label>
                <input
                  type="date"
                  value={customRange.from}
                  onChange={(e) => setCustomRange(prev => ({ ...prev, from: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '3px 6px', // Reduced padding
                    border: '1px solid #ced4da',
                    borderRadius: '3px', // Reduced border radius
                    fontSize: '11px', // Reduced font size
                    outline: 'none'
                  }}
                />
              </div>
              <div style={{ marginBottom: '6px' }}> {/* Reduced margin */}
                <label style={{ 
                  fontSize: '10px', // Reduced font size
                  color: '#495057',
                  fontWeight: '500',
                  display: 'block',
                  marginBottom: '2px' // Reduced margin
                }}>
                  To Date:
                </label>
                <input
                  type="date"
                  value={customRange.to}
                  onChange={(e) => setCustomRange(prev => ({ ...prev, to: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '3px 6px', // Reduced padding
                    border: '1px solid #ced4da',
                    borderRadius: '3px', // Reduced border radius
                    fontSize: '11px', // Reduced font size
                    outline: 'none'
                  }}
                />
              </div>
              <div style={{ 
                display: 'flex', 
                gap: '4px', // Reduced gap
                marginTop: '6px' // Reduced margin
              }}>
                <button
                  onClick={handleCustomRangeApply}
                  disabled={!customRange.from || !customRange.to}
                  style={{
                    flex: 1,
                    padding: '4px 8px', // Reduced padding
                    border: '1px solid #007bff',
                    borderRadius: '3px', // Reduced border radius
                    backgroundColor: '#007bff',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '10px', // Reduced font size
                    opacity: (!customRange.from || !customRange.to) ? 0.5 : 1
                  }}
                >
                  Apply
                </button>
                <button
                  onClick={handleCustomRangeCancel}
                  style={{
                    flex: 1,
                    padding: '4px 8px', // Reduced padding
                    border: '1px solid #ced4da',
                    borderRadius: '3px', // Reduced border radius
                    backgroundColor: 'white',
                    color: '#495057',
                    cursor: 'pointer',
                    fontSize: '10px' // Reduced font size
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
