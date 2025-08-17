import React, { useState, useEffect, useRef } from 'react'

interface FilterOption {
  value: string
  label: string
  category?: string
  count?: number
  disabled?: boolean
}

interface EnhancedFilterDropdownProps {
  value: string | string[]
  onChange: (value: string | string[]) => void
  options: FilterOption[]
  placeholder?: string
  label?: string
  multiple?: boolean
  searchable?: boolean
  className?: string
  disabled?: boolean
  showCounts?: boolean
  maxHeight?: string
  width?: string
  error?: string
  required?: boolean
}

export function EnhancedFilterDropdown({ 
  value, 
  onChange, 
  options, 
  placeholder = 'Select option', 
  label,
  multiple = false, 
  searchable = true,
  className = '',
  disabled = false,
  showCounts = false,
  maxHeight = '300px',
  width = '250px',
  error,
  required = false
}: EnhancedFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
        setHighlightedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen, searchable])

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.value.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleOptionClick = (optionValue: string) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : []
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter(v => v !== optionValue)
        : [...currentValues, optionValue]
      onChange(newValues)
    } else {
      onChange(optionValue)
      setIsOpen(false)
      setSearchTerm('')
      setHighlightedIndex(-1)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        setIsOpen(true)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          handleOptionClick(filteredOptions[highlightedIndex].value)
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSearchTerm('')
        setHighlightedIndex(-1)
        break
    }
  }

  const getDisplayValue = () => {
    if (multiple) {
      const values = Array.isArray(value) ? value : []
      if (values.length === 0) return placeholder
      if (values.length === 1) {
        const option = options.find(opt => opt.value === values[0])
        return option ? option.label : placeholder
      }
      return `${values.length} selected`
    } else {
      const option = options.find(opt => opt.value === value)
      return option ? option.label : placeholder
    }
  }

  const isSelected = (optionValue: string) => {
    if (multiple) {
      return Array.isArray(value) && value.includes(optionValue)
    }
    return value === optionValue
  }

  const groupedOptions = filteredOptions.reduce((groups, option) => {
    const category = option.category || 'General'
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(option)
    return groups
  }, {} as Record<string, FilterOption[]>)

  const activeFiltersCount = multiple && Array.isArray(value) ? value.length : 0

  return (
    <div 
      ref={dropdownRef}
      className={`enhanced-filter-dropdown ${className}`} 
      style={{ position: 'relative', width }}
    >
      {label && (
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: '500',
          color: '#495057',
          marginBottom: '6px'
        }}>
          {label}
          {required && <span style={{ color: '#dc3545', marginLeft: '4px' }}>*</span>}
        </label>
      )}
      
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        style={{
          padding: '12px 16px',
          border: `1px solid ${error ? '#dc3545' : disabled ? '#dee2e6' : isOpen ? '#007bff' : '#ced4da'}`,
          borderRadius: '6px',
          backgroundColor: disabled ? '#f8f9fa' : 'white',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '14px',
          opacity: disabled ? 0.6 : 1,
          transition: 'all 0.2s ease',
          boxShadow: isOpen ? '0 0 0 3px rgba(0, 123, 255, 0.1)' : 'none'
        }}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={label || placeholder}
        tabIndex={disabled ? -1 : 0}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
          <span style={{ 
            color: (multiple ? (Array.isArray(value) && value.length === 0) : !value) ? '#6c757d' : '#495057',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {getDisplayValue()}
          </span>
          {activeFiltersCount > 0 && (
            <span style={{
              fontSize: '12px',
              fontWeight: '500',
              color: '#fff',
              backgroundColor: '#007bff',
              padding: '2px 6px',
              borderRadius: '10px',
              minWidth: '16px',
              textAlign: 'center'
            }}>
              {activeFiltersCount}
            </span>
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {multiple && activeFiltersCount > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onChange([])
              }}
              style={{
                padding: '2px 6px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: '#dc3545',
                color: 'white',
                cursor: 'pointer',
                fontSize: '10px',
                fontWeight: 'bold'
              }}
              title="Clear selection"
            >
              ×
            </button>
          )}
          <span style={{ 
            color: '#6c757d', 
            fontSize: '12px',
            transition: 'transform 0.2s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
          }}>
            ▼
          </span>
        </div>
      </div>

      {error && (
        <div style={{
          fontSize: '12px',
          color: '#dc3545',
          marginTop: '4px'
        }}>
          {error}
        </div>
      )}

      {isOpen && !disabled && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'white',
            border: '1px solid #ced4da',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
            maxHeight,
            overflow: 'hidden'
          }}
        >
          {/* Search Input */}
          {searchable && (
            <div style={{ padding: '12px', borderBottom: '1px solid #e9ecef' }}>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search options..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px',
                  outline: 'none'
                }}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setIsOpen(false)
                    setSearchTerm('')
                    setHighlightedIndex(-1)
                  }
                }}
              />
            </div>
          )}

          {/* Options List */}
          <div style={{ maxHeight: 'calc(100% - 60px)', overflowY: 'auto' }}>
            {Object.entries(groupedOptions).map(([category, categoryOptions]) => (
              <div key={category}>
                {Object.keys(groupedOptions).length > 1 && (
                  <div style={{
                    padding: '8px 12px',
                    backgroundColor: '#f8f9fa',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6c757d',
                    borderBottom: '1px solid #e9ecef'
                  }}>
                    {category}
                  </div>
                )}
                {categoryOptions.map((option, index) => (
                  <div
                    key={option.value}
                    onClick={() => !option.disabled && handleOptionClick(option.value)}
                    style={{
                      padding: '10px 12px',
                      cursor: option.disabled ? 'not-allowed' : 'pointer',
                      backgroundColor: highlightedIndex === index ? '#e3f2fd' : 
                                   isSelected(option.value) ? '#f8f9fa' : 'white',
                      borderBottom: '1px solid #f8f9fa',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      opacity: option.disabled ? 0.5 : 1
                    }}
                    onMouseEnter={() => !option.disabled && setHighlightedIndex(index)}
                    onMouseLeave={() => setHighlightedIndex(-1)}
                  >
                    {multiple && (
                      <input
                        type="checkbox"
                        checked={isSelected(option.value)}
                        readOnly
                        disabled={option.disabled}
                        style={{ margin: 0 }}
                      />
                    )}
                    <span style={{ 
                      color: isSelected(option.value) ? '#007bff' : '#495057',
                      fontWeight: isSelected(option.value) ? '500' : 'normal',
                      flex: 1
                    }}>
                      {option.label}
                    </span>
                    {showCounts && option.count !== undefined && (
                      <span style={{
                        fontSize: '12px',
                        color: '#6c757d',
                        backgroundColor: '#e9ecef',
                        padding: '2px 6px',
                        borderRadius: '10px'
                      }}>
                        {option.count}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ))}
            
            {filteredOptions.length === 0 && (
              <div style={{
                padding: '20px 12px',
                textAlign: 'center',
                color: '#6c757d',
                fontSize: '14px'
              }}>
                {searchTerm ? 'No options found' : 'No options available'}
              </div>
            )}
          </div>

          {/* Multiple Selection Actions */}
          {multiple && (
            <div style={{
              padding: '12px',
              borderTop: '1px solid #e9ecef',
              display: 'flex',
              gap: '8px'
            }}>
              <button
                onClick={() => onChange([])}
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
                Clear All
              </button>
              <button
                onClick={() => {
                  setIsOpen(false)
                  setSearchTerm('')
                  setHighlightedIndex(-1)
                }}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '12px',
                  flex: 1
                }}
              >
                Done
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
