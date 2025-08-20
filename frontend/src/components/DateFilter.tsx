import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Button } from './Button'

export interface DateRange {
  startDate: string
  endDate: string
}

export interface DateFilterProps {
  value: DateRange
  onChange: (range: DateRange) => void
  presets?: Array<{
    label: string
    value: string
    getRange: () => DateRange
  }>
  showFinancialPeriods?: boolean
  showComparison?: boolean
  comparisonRange?: DateRange | null
  onComparisonChange?: (range: DateRange | null) => void
  disabled?: boolean
  className?: string
}

export function DateFilter({
  value,
  onChange,
  presets = [],
  showFinancialPeriods = true,
  showComparison = false,
  comparisonRange,
  onComparisonChange,
  disabled = false,
  className = ''
}: DateFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [tempRange, setTempRange] = useState<DateRange>(value)
  const [tempComparisonRange, setTempComparisonRange] = useState<DateRange | null>(comparisonRange || null)
  const dateFilterRef = useRef<HTMLDivElement>(null)

  // Default presets
  const defaultPresets = useMemo(() => [
    {
      label: 'Today',
      value: 'today',
      getRange: () => {
        const today = new Date()
        return {
          startDate: today.toISOString().slice(0, 10),
          endDate: today.toISOString().slice(0, 10)
        }
      }
    },
    {
      label: 'Yesterday',
      value: 'yesterday',
      getRange: () => {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        return {
          startDate: yesterday.toISOString().slice(0, 10),
          endDate: yesterday.toISOString().slice(0, 10)
        }
      }
    },
    {
      label: 'Last 7 Days',
      value: 'last7days',
      getRange: () => {
        const end = new Date()
        const start = new Date()
        start.setDate(start.getDate() - 6)
        return {
          startDate: start.toISOString().slice(0, 10),
          endDate: end.toISOString().slice(0, 10)
        }
      }
    },
    {
      label: 'Last 30 Days',
      value: 'last30days',
      getRange: () => {
        const end = new Date()
        const start = new Date()
        start.setDate(start.getDate() - 29)
        return {
          startDate: start.toISOString().slice(0, 10),
          endDate: end.toISOString().slice(0, 10)
        }
      }
    },
    {
      label: 'Last 90 Days',
      value: 'last90days',
      getRange: () => {
        const end = new Date()
        const start = new Date()
        start.setDate(start.getDate() - 89)
        return {
          startDate: start.toISOString().slice(0, 10),
          endDate: end.toISOString().slice(0, 10)
        }
      }
    },
    {
      label: 'This Month',
      value: 'thisMonth',
      getRange: () => {
        const now = new Date()
        const start = new Date(now.getFullYear(), now.getMonth(), 1)
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        return {
          startDate: start.toISOString().slice(0, 10),
          endDate: end.toISOString().slice(0, 10)
        }
      }
    },
    {
      label: 'Last Month',
      value: 'lastMonth',
      getRange: () => {
        const now = new Date()
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const end = new Date(now.getFullYear(), now.getMonth(), 0)
        return {
          startDate: start.toISOString().slice(0, 10),
          endDate: end.toISOString().slice(0, 10)
        }
      }
    },
    {
      label: 'This Quarter',
      value: 'thisQuarter',
      getRange: () => {
        const now = new Date()
        const quarter = Math.floor(now.getMonth() / 3)
        const start = new Date(now.getFullYear(), quarter * 3, 1)
        const end = new Date(now.getFullYear(), (quarter + 1) * 3, 0)
        return {
          startDate: start.toISOString().slice(0, 10),
          endDate: end.toISOString().slice(0, 10)
        }
      }
    },
    {
      label: 'This Year',
      value: 'thisYear',
      getRange: () => {
        const now = new Date()
        const start = new Date(now.getFullYear(), 0, 1)
        const end = new Date(now.getFullYear(), 11, 31)
        return {
          startDate: start.toISOString().slice(0, 10),
          endDate: end.toISOString().slice(0, 10)
        }
      }
    }
  ], [])

  // Financial year presets (April to March)
  const financialYearPresets = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth()
    const financialYear = currentMonth >= 3 ? currentYear : currentYear - 1
    
    return [
      {
        label: `FY ${financialYear}-${financialYear + 1}`,
        value: 'currentFY',
        getRange: () => {
          const start = new Date(financialYear, 3, 1) // April 1st
          const end = new Date(financialYear + 1, 2, 31) // March 31st
          return {
            startDate: start.toISOString().slice(0, 10),
            endDate: end.toISOString().slice(0, 10)
          }
        }
      },
      {
        label: `FY ${financialYear - 1}-${financialYear}`,
        value: 'previousFY',
        getRange: () => {
          const start = new Date(financialYear - 1, 3, 1) // April 1st
          const end = new Date(financialYear, 2, 31) // March 31st
          return {
            startDate: start.toISOString().slice(0, 10),
            endDate: end.toISOString().slice(0, 10)
          }
        }
      }
    ]
  }, [])

  const allPresets = [...defaultPresets, ...(showFinancialPeriods ? financialYearPresets : []), ...presets]

  useEffect(() => {
    setTempRange(value)
  }, [value])

  useEffect(() => {
    setTempComparisonRange(comparisonRange || null)
  }, [comparisonRange])

  const handlePresetClick = (preset: typeof allPresets[0]) => {
    const newRange = preset.getRange()
    setTempRange(newRange)
    onChange(newRange)
    setIsOpen(false)
  }

  const handleApply = () => {
    onChange(tempRange)
    if (showComparison && onComparisonChange) {
      onComparisonChange(tempComparisonRange)
    }
    setIsOpen(false)
  }

  const handleCancel = () => {
    setTempRange(value)
    setTempComparisonRange(comparisonRange || null)
    setIsOpen(false)
  }

  const formatDateRange = (range: DateRange) => {
    const start = new Date(range.startDate).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
    const end = new Date(range.endDate).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
    return start === end ? start : `${start} - ${end}`
  }

  const getActivePreset = () => {
    return allPresets.find(preset => {
      const presetRange = preset.getRange()
      return presetRange.startDate === value.startDate && presetRange.endDate === value.endDate
    })
  }

  const activePreset = getActivePreset()

  return (
    <div ref={dateFilterRef} className={`date-filter ${className}`} style={{ position: 'relative' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          border: '1px solid #ced4da',
          borderRadius: '4px',
          backgroundColor: disabled ? '#f8f9fa' : 'white',
          cursor: disabled ? 'not-allowed' : 'pointer',
          minWidth: '200px'
        }}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span style={{ fontSize: '16px' }}>📅</span>
        <span style={{ 
          fontSize: '14px', 
          color: disabled ? '#6c757d' : '#495057',
          flex: 1,
          textAlign: 'left'
        }}>
          {activePreset ? activePreset.label : formatDateRange(value)}
        </span>
        <span style={{ fontSize: '12px', color: '#6c757d' }}>
          {isOpen ? '▲' : '▼'}
        </span>
      </div>

      {isOpen && !disabled && (
        <div style={{
          position: 'fixed', // Use fixed positioning to escape parent containers
          top: dateFilterRef.current ? dateFilterRef.current.getBoundingClientRect().bottom + 4 : '100%',
          left: dateFilterRef.current ? dateFilterRef.current.getBoundingClientRect().left : 0,
          width: '400px', // Fixed width for date picker
          backgroundColor: 'white',
          border: '1px solid #ced4da',
          borderRadius: '4px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          zIndex: 9999,
          padding: '16px',
          marginTop: '4px'
        }}>
          {/* Presets */}
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ 
              margin: '0 0 12px 0', 
              fontSize: '14px', 
              fontWeight: '600', 
              color: '#495057' 
            }}>
              Quick Presets
            </h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '8px'
            }}>
              {allPresets.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => handlePresetClick(preset)}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    fontSize: '12px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f9fa'
                    e.currentTarget.style.borderColor = '#007bff'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white'
                    e.currentTarget.style.borderColor = '#ced4da'
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Range */}
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ 
              margin: '0 0 12px 0', 
              fontSize: '14px', 
              fontWeight: '600', 
              color: '#495057' 
            }}>
              Custom Range
            </h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px'
            }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '4px', 
                  fontSize: '12px', 
                  color: '#6c757d' 
                }}>
                  Start Date
                </label>
                <input
                  type="date"
                  value={tempRange.startDate}
                  onChange={(e) => setTempRange(prev => ({ ...prev, startDate: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}
                />
              </div>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '4px', 
                  fontSize: '12px', 
                  color: '#6c757d' 
                }}>
                  End Date
                </label>
                <input
                  type="date"
                  value={tempRange.endDate}
                  onChange={(e) => setTempRange(prev => ({ ...prev, endDate: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Comparison Range */}
          {showComparison && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px'
              }}>
                <input
                  type="checkbox"
                  id="enableComparison"
                  checked={tempComparisonRange !== null}
                  onChange={(e) => {
                    if (e.target.checked) {
                      const comparisonRange = {
                        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
                        endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
                      }
                      setTempComparisonRange(comparisonRange)
                    } else {
                      setTempComparisonRange(null)
                    }
                  }}
                  style={{ margin: 0 }}
                />
                <label htmlFor="enableComparison" style={{ 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: '#495057',
                  cursor: 'pointer'
                }}>
                  Compare with Previous Period
                </label>
              </div>
              
              {tempComparisonRange && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  padding: '12px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '4px'
                }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '4px', 
                      fontSize: '12px', 
                      color: '#6c757d' 
                    }}>
                      Comparison Start
                    </label>
                    <input
                      type="date"
                      value={tempComparisonRange.startDate}
                      onChange={(e) => setTempComparisonRange(prev => 
                        prev ? { ...prev, startDate: e.target.value } : null
                      )}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '4px', 
                      fontSize: '12px', 
                      color: '#6c757d' 
                    }}>
                      Comparison End
                    </label>
                    <input
                      type="date"
                      value={tempComparisonRange.endDate}
                      onChange={(e) => setTempComparisonRange(prev => 
                        prev ? { ...prev, endDate: e.target.value } : null
                      )}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'flex-end'
          }}>
            <Button
              onClick={handleCancel}
              variant="secondary"
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApply}
              variant="primary"
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              Apply
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
