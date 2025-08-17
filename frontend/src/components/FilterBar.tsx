import React from 'react'

interface FilterBarProps {
  children: React.ReactNode
  onClearAll?: () => void
  showClearAll?: boolean
  className?: string
}

export function FilterBar({ children, onClearAll, showClearAll = true, className = '' }: FilterBarProps) {
  return (
    <div 
      className={`filter-bar ${className}`}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center',
        padding: '16px',
        backgroundColor: '#f8f9fa',
        border: '1px solid #e9ecef',
        borderRadius: '8px',
        marginBottom: '20px'
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', flex: 1 }}>
        {children}
      </div>
      
      {showClearAll && onClearAll && (
        <button
          onClick={onClearAll}
          style={{
            padding: '8px 16px',
            border: '1px solid #dc3545',
            borderRadius: '6px',
            backgroundColor: 'white',
            color: '#dc3545',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            whiteSpace: 'nowrap'
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
  )
}
