import React, { useState } from 'react'

interface CollapsibleFilterSectionProps {
  children: React.ReactNode
  title?: string
  defaultCollapsed?: boolean
  className?: string
}

export function CollapsibleFilterSection({ 
  children, 
  title = 'Filters', 
  defaultCollapsed = true,
  className = '' 
}: CollapsibleFilterSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  return (
    <div className={`collapsible-filter-section ${className}`}>
      <div
        onClick={toggleCollapse}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #e9ecef',
          borderRadius: '6px',
          cursor: 'pointer',
          marginBottom: isCollapsed ? '16px' : '0',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#e9ecef'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#f8f9fa'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ 
            fontSize: '16px', 
            fontWeight: '600', 
            color: '#495057' 
          }}>
            {title}
          </span>
          <span style={{ 
            fontSize: '12px', 
            color: '#6c757d',
            backgroundColor: '#dee2e6',
            padding: '2px 8px',
            borderRadius: '12px'
          }}>
            Filters
          </span>
        </div>
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
          padding: '16px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #e9ecef',
          borderTop: 'none',
          borderTopLeftRadius: '0',
          borderTopRightRadius: '0',
          borderRadius: '0 0 6px 6px'
        }}>
          {children}
        </div>
      </div>
    </div>
  )
}
