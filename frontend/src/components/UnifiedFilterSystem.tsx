import React, { useState, useEffect, useRef } from 'react'

// Types for the unified filter system
export interface FilterOption {
  value: string
  label: string
  count?: number
}

export interface DateRange {
  startDate: string
  endDate: string
}

export interface FilterConfig {
  id: string
  type: 'search' | 'dropdown' | 'date-range' | 'amount-range' | 'stock-level'
  label: string
  placeholder?: string
  options?: FilterOption[]
  defaultValue?: string | DateRange
  width?: 'full' | 'half' | 'third' | 'quarter'
  searchFields?: string[] // For search type filters
  predefinedRanges?: { label: string; startDate: string; endDate: string }[]
}

export interface QuickFilter {
  id: string
  label: string
  icon?: string
  action: () => void
  isActive?: boolean
}

export interface UnifiedFilterProps {
  title?: string
  filters: FilterConfig[]
  quickFilters?: QuickFilter[]
  onFilterChange: (filters: Record<string, any>) => void
  onClearAll?: () => void
  className?: string
  showQuickActions?: boolean
  activeFiltersCount?: number
  defaultCollapsed?: boolean // New prop for controlling default state
}

export function UnifiedFilterSystem({
  title = "Filters",
  filters,
  quickFilters = [],
  onFilterChange,
  onClearAll,
  className = "",
  showQuickActions = true,
  activeFiltersCount = 0,
  defaultCollapsed = true // Default to collapsed state
}: UnifiedFilterProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)
  const [filterValues, setFilterValues] = useState<Record<string, any>>({})
  const [isOpen, setIsOpen] = useState<Record<string, boolean>>({})
  // Keep a stable ref to the callback so effect depends only on value changes
  const onFilterChangeRef = useRef(onFilterChange)

  useEffect(() => {
    onFilterChangeRef.current = onFilterChange
  }, [onFilterChange])

  // Initialize filter values (only once on mount)
  useEffect(() => {
    const initialValues: Record<string, any> = {}
    filters.forEach(filter => {
      if (filter.defaultValue) {
        initialValues[filter.id] = filter.defaultValue
      } else {
        switch (filter.type) {
          case 'search':
            initialValues[filter.id] = ''
            break
          case 'dropdown':
            initialValues[filter.id] = 'all'
            break
          case 'date-range':
            initialValues[filter.id] = {
              startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
              endDate: new Date().toISOString().slice(0, 10)
            }
            break
          case 'amount-range':
            initialValues[filter.id] = 'all'
            break
          case 'stock-level':
            initialValues[filter.id] = 'all'
            break
        }
      }
    })
    setFilterValues(initialValues)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Notify parent of filter changes (only when values change)
  useEffect(() => {
    onFilterChangeRef.current(filterValues)
  }, [filterValues])

  const handleFilterChange = (filterId: string, value: any) => {
    setFilterValues(prev => ({
      ...prev,
      [filterId]: value
    }))
  }

  const handleClearAll = () => {
    const resetValues: Record<string, any> = {}
    filters.forEach(filter => {
      if (filter.defaultValue) {
        resetValues[filter.id] = filter.defaultValue
      } else {
        switch (filter.type) {
          case 'search':
            resetValues[filter.id] = ''
            break
          case 'dropdown':
            resetValues[filter.id] = 'all'
            break
          case 'date-range':
            resetValues[filter.id] = {
              startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
              endDate: new Date().toISOString().slice(0, 10)
            }
            break
          case 'amount-range':
            resetValues[filter.id] = 'all'
            break
          case 'stock-level':
            resetValues[filter.id] = 'all'
            break
        }
      }
    })
    setFilterValues(resetValues)
    onClearAll?.()
  }

  const toggleDropdown = (filterId: string) => {
    setIsOpen(prev => ({
      ...prev,
      [filterId]: !prev[filterId]
    }))
  }

  const closeAllDropdowns = () => {
    setIsOpen({})
  }

  // Group filters by rows based on width - Improved layout logic
  const groupFiltersByRows = () => {
    const rows: FilterConfig[][] = []
    let currentRow: FilterConfig[] = []
    let currentRowWidth = 0

    filters.forEach(filter => {
      const filterWidth = filter.width === 'full' ? 4 : 
                         filter.width === 'half' ? 2 : 
                         filter.width === 'third' ? 1.33 : 
                         filter.width === 'quarter' ? 1 : 1

      if (currentRowWidth + filterWidth > 4) {
        rows.push(currentRow)
        currentRow = [filter]
        currentRowWidth = filterWidth
      } else {
        currentRow.push(filter)
        currentRowWidth += filterWidth
      }
    })

    if (currentRow.length > 0) {
      rows.push(currentRow)
    }

    return rows
  }

  const filterRows = groupFiltersByRows()

  return (
    <div 
      className={`unified-filter-system ${className}`}
      style={{
        backgroundColor: 'white',
        border: '1px solid #e9ecef',
        borderRadius: '8px',
        marginBottom: '20px',
        overflow: 'visible'
      }}
      onClick={closeAllDropdowns}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 20px',
        borderBottom: isCollapsed ? 'none' : '1px solid #e9ecef',
        backgroundColor: '#f8f9fa',
        borderRadius: isCollapsed ? '8px' : '8px 8px 0 0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h3 style={{ 
            margin: 0, 
            fontSize: '16px', 
            fontWeight: '600', 
            color: '#2c3e50' 
          }}>
            {title}
          </h3>
          <span style={{
            backgroundColor: '#6c757d',
            color: 'white',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '500'
          }}>
            Filters
          </span>
          {activeFiltersCount > 0 && (
            <span style={{
              backgroundColor: '#007bff',
              color: 'white',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: '500'
            }}>
              {activeFiltersCount} active
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Quick Actions */}
          {showQuickActions && quickFilters.length > 0 && !isCollapsed && (
            <div style={{ display: 'flex', gap: '8px' }}>
              {quickFilters.map(filter => (
                <button
                  key={filter.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    filter.action()
                  }}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '6px',
                    backgroundColor: filter.isActive ? '#007bff' : 'white',
                    color: filter.isActive ? 'white' : '#495057',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '500',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  onMouseEnter={(e) => {
                    if (!filter.isActive) {
                      e.currentTarget.style.backgroundColor = '#f8f9fa'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!filter.isActive) {
                      e.currentTarget.style.backgroundColor = 'white'
                    }
                  }}
                >
                  {filter.icon && <span>{filter.icon}</span>}
                  {filter.label}
                </button>
              ))}
            </div>
          )}

          {/* Clear All Button */}
          {onClearAll && activeFiltersCount > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleClearAll()
              }}
              style={{
                padding: '6px 12px',
                border: '1px solid #ced4da',
                borderRadius: '6px',
                backgroundColor: '#dc3545',
                color: 'white',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c82333'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dc3545'}
            >
              Clear All
            </button>
          )}

          {/* Collapse Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsCollapsed(!isCollapsed)
            }}
            style={{
              padding: '8px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              transition: 'transform 0.3s ease',
              transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)'
            }}
            aria-label={isCollapsed ? 'Expand filters' : 'Collapse filters'}
          >
            <span style={{ color: '#6c757d', fontSize: '14px' }}>▼</span>
          </button>
        </div>
      </div>

      {/* Filter Content */}
      {!isCollapsed && (
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '0 0 8px 8px',
          width: '100%'
        }}>
          {/* Filter Rows */}
          {filterRows.map((row, rowIndex) => (
            <div
              key={rowIndex}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '16px',
                marginBottom: rowIndex < filterRows.length - 1 ? '20px' : '0',
                alignItems: 'end',
                width: '100%'
              }}
            >
              {row.map(filter => (
                <div key={filter.id} style={{ gridColumn: getGridColumnSpan(filter.width) }}>
                  <FilterField
                    filter={filter}
                    value={filterValues[filter.id]}
                    onChange={(value) => handleFilterChange(filter.id, value)}
                    isOpen={isOpen[filter.id]}
                    onToggle={() => toggleDropdown(filter.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              ))}
            </div>
          ))}

          {/* Filter Status */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '16px',
            borderTop: '1px solid #e9ecef',
            marginTop: '16px'
          }}>
            <div style={{ fontSize: '12px', color: '#6c757d' }}>
              {activeFiltersCount > 0 ? `${activeFiltersCount} active filter${activeFiltersCount !== 1 ? 's' : ''}` : 'No filters applied'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Individual Filter Field Component
interface FilterFieldProps {
  filter: FilterConfig
  value: any
  onChange: (value: any) => void
  isOpen: boolean
  onToggle: () => void
  onClick: (e: React.MouseEvent) => void
}

// Helper function to get grid column span
const getGridColumnSpan = (width: string | undefined) => {
  switch (width) {
    case 'full': return 'span 4'
    case 'half': return 'span 2'
    case 'third': return 'span 1'
    case 'quarter': return 'span 1'
    default: return 'span 1'
  }
}

function FilterField({ filter, value, onChange, isOpen, onToggle, onClick }: FilterFieldProps) {
  const fieldRef = useRef<HTMLDivElement>(null)

  const renderFilterInput = () => {
    switch (filter.type) {
      case 'search':
        return (
          <input
            type="text"
            placeholder={filter.placeholder || `Search ${filter.label.toLowerCase()}...`}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #ced4da',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = '#007bff'}
            onBlur={(e) => e.target.style.borderColor = '#ced4da'}
          />
        )

      case 'dropdown':
        return (
          <div ref={fieldRef} style={{ position: 'relative', width: '100%' }}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggle()
              }}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ced4da',
                borderRadius: '6px',
                backgroundColor: 'white',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                outline: 'none',
                transition: 'border-color 0.2s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#007bff'}
              onBlur={(e) => e.target.style.borderColor = '#ced4da'}
            >
              <span>
                {filter.options?.find(opt => opt.value === value)?.label || filter.placeholder || 'Select...'}
              </span>
              <span style={{ fontSize: '12px', color: '#6c757d' }}>▼</span>
            </button>

            {isOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: 'white',
                border: '1px solid #ced4da',
                borderRadius: '6px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                zIndex: 1000,
                maxHeight: '200px',
                overflow: 'auto',
                marginTop: '4px'
              }}>
                {filter.options?.map(option => (
                  <button
                    key={option.value}
                    onClick={(e) => {
                      e.stopPropagation()
                      onChange(option.value)
                      onToggle()
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <span>{option.label}</span>
                    {option.count !== undefined && (
                      <span style={{ fontSize: '12px', color: '#6c757d' }}>
                        ({option.count})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )

      case 'date-range':
        return (
          <DateRangeFilter
            value={value}
            onChange={onChange}
            predefinedRanges={filter.predefinedRanges}
            placeholder={filter.placeholder}
          />
        )

      case 'amount-range':
        return (
          <AmountRangeFilter
            value={value}
            onChange={onChange}
            options={filter.options}
          />
        )

      case 'stock-level':
        return (
          <StockLevelFilter
            value={value}
            onChange={onChange}
            options={filter.options}
          />
        )

      default:
        return null
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        width: '100%'
      }}
      onClick={onClick}
    >
      <label style={{
        fontSize: '12px',
        fontWeight: '500',
        color: '#495057',
        marginBottom: '4px'
      }}>
        {filter.label}
      </label>
      {renderFilterInput()}
    </div>
  )
}

// Date Range Filter Component - Standardized sizing
interface DateRangeFilterProps {
  value: DateRange
  onChange: (value: DateRange) => void
  predefinedRanges?: { label: string; startDate: string; endDate: string }[]
  placeholder?: string
}

function DateRangeFilter({ value, onChange, predefinedRanges, placeholder }: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const defaultRanges = [
    { label: 'Today', startDate: new Date().toISOString().slice(0, 10), endDate: new Date().toISOString().slice(0, 10) },
    { label: 'Yesterday', startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10), endDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10) },
    { label: 'This Week', startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), endDate: new Date().toISOString().slice(0, 10) },
    { label: 'This Month', startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10), endDate: new Date().toISOString().slice(0, 10) },
    { label: 'Last Month', startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().slice(0, 10), endDate: new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString().slice(0, 10) },
    { label: 'Last 30 Days', startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), endDate: new Date().toISOString().slice(0, 10) },
    { label: 'Last 90 Days', startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), endDate: new Date().toISOString().slice(0, 10) }
  ]

  const ranges = predefinedRanges || defaultRanges

  const formatDateRange = (range: DateRange) => {
    const start = new Date(range.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    const end = new Date(range.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    return `${start} - ${end}`
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <button
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        style={{
          width: '100%',
          padding: '10px 12px',
          border: '1px solid #ced4da',
          borderRadius: '6px',
          backgroundColor: 'white',
          textAlign: 'left',
          cursor: 'pointer',
          fontSize: '14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          outline: 'none',
          transition: 'border-color 0.2s ease'
        }}
        onFocus={(e) => e.target.style.borderColor = '#007bff'}
        onBlur={(e) => e.target.style.borderColor = '#ced4da'}
      >
        <span>
          {value ? formatDateRange(value) : placeholder || 'Select date range...'}
        </span>
        <span style={{ fontSize: '12px', color: '#6c757d' }}>📅</span>
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: 'white',
          border: '1px solid #ced4da',
          borderRadius: '6px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
          padding: '12px',
          marginTop: '4px',
          width: '100%'
        }}>
          {/* Predefined Ranges */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: '500', color: '#495057', marginBottom: '8px' }}>
              Quick Select
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {ranges.map(range => (
                <button
                  key={range.label}
                  onClick={(e) => {
                    e.stopPropagation()
                    onChange({ startDate: range.startDate, endDate: range.endDate })
                    setIsOpen(false)
                  }}
                  style={{
                    padding: '6px 8px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '12px',
                    borderRadius: '4px',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Inputs */}
          <div style={{ borderTop: '1px solid #e9ecef', paddingTop: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: '500', color: '#495057', marginBottom: '8px' }}>
              Custom Range
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="date"
                value={value?.startDate || ''}
                onChange={(e) => onChange({ ...value, startDate: e.target.value })}
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
              />
              <span style={{ fontSize: '12px', color: '#6c757d' }}>to</span>
              <input
                type="date"
                value={value?.endDate || ''}
                onChange={(e) => onChange({ ...value, endDate: e.target.value })}
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Amount Range Filter Component
function AmountRangeFilter({ value, onChange, options }: { value: string; onChange: (value: string) => void; options?: FilterOption[] }) {
  const defaultOptions = [
    { value: 'all', label: 'All Amounts' },
    { value: '0-1000', label: '₹0 - ₹1,000' },
    { value: '1000-5000', label: '₹1,000 - ₹5,000' },
    { value: '5000-10000', label: '₹5,000 - ₹10,000' },
    { value: '10000-50000', label: '₹10,000 - ₹50,000' },
    { value: '50000+', label: '₹50,000+' }
  ]

  const filterOptions = options || defaultOptions

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%',
        padding: '10px 12px',
        border: '1px solid #ced4da',
        borderRadius: '6px',
        backgroundColor: 'white',
        fontSize: '14px',
        outline: 'none',
        cursor: 'pointer'
      }}
    >
      {filterOptions.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

// Stock Level Filter Component
function StockLevelFilter({ value, onChange, options }: { value: string; onChange: (value: string) => void; options?: FilterOption[] }) {
  const defaultOptions = [
    { value: 'all', label: 'All Stock Levels' },
    { value: 'low', label: 'Low Stock (< 10)' },
    { value: 'normal', label: 'Normal Stock (10-50)' },
    { value: 'high', label: 'High Stock (> 50)' },
    { value: 'out', label: 'Out of Stock (0)' }
  ]

  const filterOptions = options || defaultOptions

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%',
        padding: '10px 12px',
        border: '1px solid #ced4da',
        borderRadius: '6px',
        backgroundColor: 'white',
        fontSize: '14px',
        outline: 'none',
        cursor: 'pointer'
      }}
    >
      {filterOptions.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

