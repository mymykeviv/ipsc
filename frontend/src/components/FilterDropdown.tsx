import React, { useState, useEffect, useRef } from 'react'

interface FilterOption {
  value: string
  label: string
  category?: string
}

interface FilterDropdownProps {
  value: string | string[]
  onChange: (value: string | string[]) => void
  options: FilterOption[]
  placeholder?: string
  multiple?: boolean
  searchable?: boolean
  className?: string
  disabled?: boolean
}

export function FilterDropdown({ 
  value, 
  onChange, 
  options, 
  placeholder = 'Select option', 
  multiple = false, 
  searchable = true,
  className = '',
  disabled = false
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

  return (
    <div 
      ref={dropdownRef}
      className={`filter-dropdown ${className}`} 
      style={{ position: 'relative' }}
    >
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          padding: '10px 16px',
          border: '1px solid #ced4da',
          borderRadius: '6px',
          backgroundColor: disabled ? '#f8f9fa' : 'white',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          minWidth: '200px',
          fontSize: '14px',
          opacity: disabled ? 0.6 : 1
        }}
      >
        <span style={{ 
          color: (multiple ? (Array.isArray(value) && value.length === 0) : !value) ? '#6c757d' : '#495057' 
        }}>
          {getDisplayValue()}
        </span>
        <span style={{ color: '#6c757d' }}>▼</span>
      </div>

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
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
            maxHeight: '300px',
            overflow: 'hidden'
          }}
        >
          {/* Search Input */}
          {searchable && (
            <div style={{ padding: '12px', borderBottom: '1px solid #e9ecef' }}>
              <input
                type="text"
                placeholder="Search options..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          {/* Options List */}
          <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
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
                {categoryOptions.map(option => (
                  <div
                    key={option.value}
                    onClick={() => handleOptionClick(option.value)}
                    style={{
                      padding: '10px 12px',
                      cursor: 'pointer',
                      backgroundColor: isSelected(option.value) ? '#e3f2fd' : 'white',
                      borderBottom: '1px solid #f8f9fa',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected(option.value)) {
                        e.currentTarget.style.backgroundColor = '#f8f9fa'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected(option.value)) {
                        e.currentTarget.style.backgroundColor = 'white'
                      }
                    }}
                  >
                    {multiple && (
                      <input
                        type="checkbox"
                        checked={isSelected(option.value)}
                        readOnly
                        style={{ margin: 0 }}
                      />
                    )}
                    <span style={{ 
                      color: isSelected(option.value) ? '#1976d2' : '#495057',
                      fontWeight: isSelected(option.value) ? '500' : 'normal'
                    }}>
                      {option.label}
                    </span>
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
                No options found
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
                onClick={() => setIsOpen(false)}
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
