import React from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'small' | 'medium' | 'large' | 'extra-large'
}

export function Modal({ isOpen, onClose, title, children, size = 'medium' }: ModalProps) {
  if (!isOpen) return null

  const sizeStyles = {
    small: { maxWidth: '28rem' },
    medium: { maxWidth: '42rem' },
    large: { maxWidth: '56rem' },
    'extra-large': { maxWidth: '80vw', width: '80vw' }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9999,
      overflowY: 'auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      {/* Backdrop */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          transition: 'opacity 0.2s'
        }}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div style={{
          position: 'relative',
          width: '100%',
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          ...sizeStyles[size]
        }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.5rem',
          borderBottom: '1px solid #e5e7eb',
          flexShrink: 0
        }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#111827',
            margin: 0
          }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              color: '#9ca3af',
              cursor: 'pointer',
              border: 'none',
              background: 'none',
              padding: '0.25rem',
              transition: 'color 0.2s'
            }}
          >
            <svg style={{ width: '1.5rem', height: '1.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
