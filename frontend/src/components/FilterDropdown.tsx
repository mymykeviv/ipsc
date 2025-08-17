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
          padding: '6px 10px', // Reduced padding
          border: '1px solid #ced4da',
          borderRadius: '4px', // Reduced border radius
          backgroundColor: disabled ? '#f8f9fa' : 'white',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontSize: '12px', // Reduced font size
          color: disabled ? '#6c757d' : '#495057',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: '32px', // Reduced min height
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.borderColor = '#adb5bd'
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            e.currentTarget.style.borderColor = '#ced4da'
          }
        }}
      >
        <span style={{ 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          whiteSpace: 'nowrap',
          flex: 1
        }}>
          {getDisplayValue()}
        </span>
        <span style={{ 
          marginLeft: '8px', 
          fontSize: '10px', // Reduced font size
          color: '#6c757d',
          transition: 'transform 0.2s ease',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
        }}>
          ▼
        </span>
      </div>

      {isOpen && !disabled && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: 'white',
          border: '1px solid #ced4da',
          borderRadius: '4px', // Reduced border radius
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
          maxHeight: '200px', // Reduced max height
          overflow: 'auto',
          marginTop: '2px' // Reduced margin
        }}>
          {searchable && (
            <div style={{ padding: '8px' }}> {/* Reduced padding */}
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '4px 8px', // Reduced padding
                  border: '1px solid #ced4da',
                  borderRadius: '3px', // Reduced border radius
                  fontSize: '11px', // Reduced font size
                  outline: 'none'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setIsOpen(false)
                  }
                }}
              />
            </div>
          )}

          <div style={{ maxHeight: '150px', overflow: 'auto' }}> {/* Reduced max height */}
            {Object.entries(groupedOptions).map(([category, options]) => (
              <div key={category}>
                {Object.keys(groupedOptions).length > 1 && (
                  <div style={{
                    padding: '4px 8px', // Reduced padding
                    backgroundColor: '#f8f9fa',
                    fontSize: '10px', // Reduced font size
                    fontWeight: '600',
                    color: '#6c757d',
                    borderBottom: '1px solid #dee2e6'
                  }}>
                    {category}
                  </div>
                )}
                {options.map((option) => (
                  <div
                    key={option.value}
                    onClick={() => handleOptionClick(option.value)}
                    style={{
                      padding: '4px 8px', // Reduced padding
                      cursor: 'pointer',
                      fontSize: '11px', // Reduced font size
                      backgroundColor: isSelected(option.value) ? '#e3f2fd' : 'transparent',
                      color: isSelected(option.value) ? '#1976d2' : '#495057',
                      borderBottom: '1px solid #f8f9fa'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected(option.value)) {
                        e.currentTarget.style.backgroundColor = '#f8f9fa'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected(option.value)) {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }
                    }}
                  >
                    {option.label}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
