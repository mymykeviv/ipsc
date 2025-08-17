import React, { useState, useEffect } from 'react'

interface FilterOption {
  value: string
  label: string
  category?: string
  count?: number
}

interface EnhancedFilterBarProps {
  children: React.ReactNode
  onClearAll?: () => void
  showClearAll?: boolean
  className?: string
  title?: string
  activeFiltersCount?: number
  onToggleCollapse?: (collapsed: boolean) => void
  defaultCollapsed?: boolean
  showFilterCount?: boolean
  showQuickActions?: boolean
  quickActions?: Array<{
    label: string
    action: () => void
    icon?: string
  }>
}

export function EnhancedFilterBar({
  children,
  onClearAll,
  showClearAll = true,
  className = '',
  title = 'Advanced Filters',
  activeFiltersCount = 0,
  onToggleCollapse,
  defaultCollapsed = false, // Changed to false to keep filters expanded by default
  showFilterCount = true,
  showQuickActions = false,
  quickActions = []
}: EnhancedFilterBarProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)
  const [isHovered, setIsHovered] = useState(false)

  const toggleCollapse = () => {
    const newCollapsed = !isCollapsed
    setIsCollapsed(newCollapsed)
    onToggleCollapse?.(newCollapsed)
  }

  const handleClearAll = () => {
    onClearAll?.()
  }

  return (
    <div 
      className={`enhanced-filter-bar ${className}`}
      style={{
        marginBottom: '16px', // Reduced margin
        borderRadius: '6px', // Reduced border radius
        // Removed overflow: 'hidden' to prevent dropdown clipping
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', // Reduced shadow
        border: '1px solid #e9ecef',
        position: 'relative' // Added to ensure proper stacking context
      }}
    >
      {/* Header */}
      <div
        onClick={toggleCollapse}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px', // Reduced padding
          backgroundColor: isHovered ? '#e9ecef' : '#f8f9fa',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          borderBottom: isCollapsed ? 'none' : '1px solid #dee2e6'
        }}
        role="button"
        tabIndex={0}
        aria-expanded={!isCollapsed}
        aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${title}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            toggleCollapse()
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}> {/* Reduced gap */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}> {/* Reduced gap */}
            <span style={{ 
              fontSize: '14px', // Reduced font size
              fontWeight: '600', 
              color: '#495057' 
            }}>
              {title}
            </span>
            {showFilterCount && activeFiltersCount > 0 && (
              <span style={{ 
                fontSize: '11px', // Reduced font size
                fontWeight: '500',
                color: '#fff',
                backgroundColor: '#007bff',
                padding: '1px 6px', // Reduced padding
                borderRadius: '10px', // Reduced border radius
                minWidth: '16px', // Reduced min width
                textAlign: 'center'
              }}>
                {activeFiltersCount}
              </span>
            )}
          </div>
          <span style={{ 
            fontSize: '11px', // Reduced font size
            color: '#6c757d',
            backgroundColor: '#dee2e6',
            padding: '2px 8px', // Reduced padding
            borderRadius: '10px', // Reduced border radius
            fontWeight: '500'
          }}>
            Filters
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}> {/* Reduced gap */}
          {showQuickActions && (
            <div style={{ display: 'flex', gap: '6px' }}> {/* Reduced gap - removed !isCollapsed condition */}
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation()
                    action.action()
                  }}
                  style={{
                    padding: '4px 8px', // Reduced padding
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    color: '#495057',
                    cursor: 'pointer',
                    fontSize: '11px', // Reduced font size
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px', // Reduced gap
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f9fa'
                    e.currentTarget.style.borderColor = '#adb5bd'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white'
                    e.currentTarget.style.borderColor = '#ced4da'
                  }}
                >
                  {action.icon && <span>{action.icon}</span>}
                  {action.label}
                </button>
              ))}
            </div>
          )}
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px', // Reduced gap
            transition: 'transform 0.3s ease',
            transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)'
          }}>
            <span style={{ color: '#6c757d', fontSize: '12px' }}> {/* Reduced font size */}
              ▼
            </span>
          </div>
        </div>
      </div>
      
      {/* Content */}
      {!isCollapsed && (
        <div 
          style={{
            padding: '16px', // Reduced padding
            backgroundColor: 'white',
            overflow: 'visible' // Ensure dropdowns are not clipped
          }}
        >
          {/* Filter Content */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)', // 4-column grid as requested
            gap: '8px', // Reduced gap for more compact layout
            alignItems: 'start',
            marginBottom: '12px' // Reduced margin
          }}>
            {children}
          </div>
          
          {/* Actions */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            paddingTop: '12px', // Reduced padding
            borderTop: '1px solid #e9ecef'
          }}>
            <div style={{ fontSize: '12px', color: '#6c757d' }}> {/* Reduced font size */}
              {activeFiltersCount > 0 ? `${activeFiltersCount} active filter${activeFiltersCount !== 1 ? 's' : ''}` : 'No filters applied'}
            </div>
            
            {showClearAll && onClearAll && activeFiltersCount > 0 && (
              <button
                onClick={handleClearAll}
                style={{
                  padding: '6px 12px', // Reduced padding
                  border: '1px solid #dc3545',
                  borderRadius: '4px', // Reduced border radius
                  backgroundColor: 'white',
                  color: '#dc3545',
                  cursor: 'pointer',
                  fontSize: '12px', // Reduced font size
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#dc3545'
                  e.currentTarget.style.color = 'white'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white'
                  e.currentTarget.style.color = '#dc3545'
                }}
              >
                Clear All Filters
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
