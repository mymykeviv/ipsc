import React from 'react'

interface LoadingSpinnerProps {
  message?: string
  size?: 'small' | 'medium' | 'large'
  color?: string
}

export function LoadingSpinner({ 
  message = "Loading...", 
  size = 'medium',
  color = '#007bff'
}: LoadingSpinnerProps) {
  const sizeMap = {
    small: '16px',
    medium: '24px',
    large: '32px'
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      gap: '12px'
    }}>
      <div
        style={{
          width: sizeMap[size],
          height: sizeMap[size],
          border: `2px solid #f3f3f3`,
          borderTop: `2px solid ${color}`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}
      />
      {message && (
        <p style={{
          margin: 0,
          fontSize: '14px',
          color: '#6c757d',
          textAlign: 'center'
        }}>
          {message}
        </p>
      )}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  )
}

// Full page loading spinner
export function FullPageSpinner({ message = "Loading..." }: { message?: string }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <LoadingSpinner message={message} size="large" />
    </div>
  )
}

// Inline loading spinner
export function InlineSpinner({ size = 'small' }: { size?: 'small' | 'medium' | 'large' }) {
  return <LoadingSpinner size={size} message="" />
}
