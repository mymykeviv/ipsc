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
  defaultCollapsed = false,
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
        marginBottom: '20px',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e9ecef'
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
          padding: '16px 20px',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ 
              fontSize: '16px', 
              fontWeight: '600', 
              color: '#495057' 
            }}>
              {title}
            </span>
            {showFilterCount && activeFiltersCount > 0 && (
              <span style={{ 
                fontSize: '12px',
                fontWeight: '500',
                color: '#fff',
                backgroundColor: '#007bff',
                padding: '2px 8px',
                borderRadius: '12px',
                minWidth: '20px',
                textAlign: 'center'
              }}>
                {activeFiltersCount}
              </span>
            )}
          </div>
          <span style={{ 
            fontSize: '12px', 
            color: '#6c757d',
            backgroundColor: '#dee2e6',
            padding: '4px 10px',
            borderRadius: '12px',
            fontWeight: '500'
          }}>
            Filters
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {showQuickActions && !isCollapsed && (
            <div style={{ display: 'flex', gap: '8px' }}>
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation()
                    action.action()
                  }}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    color: '#495057',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
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
            gap: '8px',
            transition: 'transform 0.3s ease',
            transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)'
          }}>
            <span style={{ color: '#6c757d', fontSize: '14px' }}>
              ▼
            </span>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div
        style={{
          maxHeight: isCollapsed ? '0' : '1000px',
          overflow: 'hidden',
          transition: 'max-height 0.3s ease-in-out',
          opacity: isCollapsed ? '0' : '1',
          transitionDelay: isCollapsed ? '0s' : '0.1s'
        }}
      >
        <div style={{ 
          padding: '20px',
          backgroundColor: 'white'
        }}>
                         {/* Filter Content */}
               <div style={{
                 display: 'grid',
                 gridTemplateColumns: 'repeat(4, 1fr)',
                 gap: '12px',
                 alignItems: 'start',
                 marginBottom: '16px'
               }}>
                 {children}
               </div>
          
          {/* Actions */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            paddingTop: '16px',
            borderTop: '1px solid #e9ecef'
          }}>
            <div style={{ fontSize: '14px', color: '#6c757d' }}>
              {activeFiltersCount > 0 ? `${activeFiltersCount} active filter${activeFiltersCount !== 1 ? 's' : ''}` : 'No filters applied'}
            </div>
            
            {showClearAll && onClearAll && activeFiltersCount > 0 && (
              <button
                onClick={handleClearAll}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #dc3545',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  color: '#dc3545',
                  cursor: 'pointer',
                  fontSize: '14px',
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
      </div>
    </div>
  )
}
