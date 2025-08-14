import React from 'react'

interface StatusBadgeProps {
  status: string
  size?: 'small' | 'medium' | 'large'
  onClick?: () => void
  clickable?: boolean
}

export function StatusBadge({ status, size = 'medium', onClick, clickable = false }: StatusBadgeProps) {
  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase()
    switch (statusLower) {
      case 'draft':
        return { bg: '#fff3cd', color: '#856404', border: '#ffeaa7' } // Orange
      case 'sent':
        return { bg: '#d4edda', color: '#155724', border: '#c3e6cb' } // Green
      case 'partial payment':
      case 'partially paid':
        return { bg: '#fff3cd', color: '#856404', border: '#ffeaa7' } // Yellow
      case 'paid':
        return { bg: '#d4edda', color: '#155724', border: '#c3e6cb' } // Green
      case 'cancelled':
        return { bg: '#f8d7da', color: '#721c24', border: '#f5c6cb' } // Red
      case 'overdue':
        return { bg: '#f8d7da', color: '#721c24', border: '#f5c6cb' } // Red
      default:
        return { bg: '#e2e3e5', color: '#383d41', border: '#d6d8db' } // Gray
    }
  }

  const getSizeStyles = (size: string) => {
    switch (size) {
      case 'small':
        return { padding: '4px 8px', fontSize: '12px' }
      case 'large':
        return { padding: '8px 16px', fontSize: '16px' }
      default: // medium
        return { padding: '6px 12px', fontSize: '14px' }
    }
  }

  const colors = getStatusColor(status)
  const sizeStyles = getSizeStyles(size)

  const baseStyles = {
    display: 'inline-block',
    borderRadius: '6px',
    fontWeight: '500',
    textAlign: 'center' as const,
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.bg,
    color: colors.color,
    cursor: clickable ? 'pointer' : 'default',
    transition: 'all 0.2s ease-in-out',
    ...sizeStyles
  }

  const hoverStyles = clickable ? {
    ':hover': {
      opacity: 0.8,
      transform: 'translateY(-1px)',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }
  } : {}

  return (
    <span
      style={{ ...baseStyles, ...hoverStyles }}
      onClick={onClick}
      title={clickable ? `Click to change status from ${status}` : status}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}
