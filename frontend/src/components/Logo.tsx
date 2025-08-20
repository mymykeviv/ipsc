import React from 'react'

interface LogoProps {
  size?: 'small' | 'medium' | 'large'
  showText?: boolean
  className?: string
  centered?: boolean
}

export function Logo({ size = 'medium', showText = true, className = '', centered = false }: LogoProps) {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  }

  const textSizes = {
    small: 'text-sm',
    medium: 'text-lg',
    large: 'text-2xl'
  }

  const iconSizes = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8'
  }

  return (
    <div className={`flex items-center gap-2 ${centered ? 'justify-center' : ''} ${className}`} style={{ minWidth: 0, flexShrink: 1 }}>
      {/* Circular Icon with Dollar Sign, Bar Chart, and Curved Arrow */}
      <div 
        className={`${sizeClasses[size]} rounded-full border-2 border-blue-700 flex items-center justify-center relative overflow-hidden flex-shrink-0`}
        style={{
          background: 'transparent',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}
      >
        {/* Dollar Sign - positioned upper-left */}
        <span 
          className="absolute font-bold"
          style={{ 
            fontSize: size === 'small' ? '10px' : size === 'medium' ? '14px' : '18px',
            color: '#22c55e',
            top: size === 'small' ? '2px' : size === 'medium' ? '3px' : '4px',
            left: size === 'small' ? '2px' : size === 'medium' ? '3px' : '4px',
            fontWeight: 'bold'
          }}
        >
          $
        </span>
        
        {/* Bar Chart - three vertical bars with gradient */}
        <div 
          className="absolute"
          style={{
            right: size === 'small' ? '8px' : size === 'medium' ? '10px' : '12px',
            bottom: size === 'small' ? '4px' : size === 'medium' ? '6px' : '8px',
            display: 'flex',
            alignItems: 'end',
            gap: size === 'small' ? '1px' : size === 'medium' ? '2px' : '3px'
          }}
        >
          <div 
            style={{
              width: size === 'small' ? '2px' : size === 'medium' ? '3px' : '4px',
              height: size === 'small' ? '8px' : size === 'medium' ? '12px' : '16px',
              background: 'linear-gradient(to top, #1e40af, #3b82f6)',
              borderRadius: '1px'
            }}
          />
          <div 
            style={{
              width: size === 'small' ? '2px' : size === 'medium' ? '3px' : '4px',
              height: size === 'small' ? '10px' : size === 'medium' ? '14px' : '18px',
              background: 'linear-gradient(to top, #1e40af, #3b82f6)',
              borderRadius: '1px'
            }}
          />
          <div 
            style={{
              width: size === 'small' ? '2px' : size === 'medium' ? '3px' : '4px',
              height: size === 'small' ? '12px' : size === 'medium' ? '16px' : '20px',
              background: 'linear-gradient(to top, #1e40af, #3b82f6)',
              borderRadius: '1px'
            }}
          />
        </div>
        
        {/* Curved Arrow - thick green arrow sweeping from lower-left to upper-right */}
        <svg 
          className="absolute"
          viewBox="0 0 24 24"
          fill="none"
          style={{
            width: size === 'small' ? '16px' : size === 'medium' ? '20px' : '24px',
            height: size === 'small' ? '16px' : size === 'medium' ? '20px' : '24px',
            bottom: size === 'small' ? '2px' : size === 'medium' ? '3px' : '4px',
            left: size === 'small' ? '6px' : size === 'medium' ? '8px' : '10px',
            color: '#22c55e'
          }}
        >
          <path 
            d="M8 16C8 16 12 12 16 8C12 12 8 16 8 16" 
            stroke="currentColor" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            fill="none"
          />
          <path 
            d="M16 8L14 6M16 8L18 6" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </div>
      
      {showText && (
        <div className="flex flex-col" style={{ minWidth: 0, flexShrink: 1 }}>
          <span 
            className={`${textSizes[size]} font-bold leading-none whitespace-nowrap`}
            style={{
              background: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
            }}
          >
            ProfitPath
          </span>
          <div 
            className={`${size === 'small' ? 'text-xs' : 'text-sm'} font-medium leading-tight`}
            style={{ color: '#059669' }}
          >
            Track Your Success, Step by Step
          </div>
        </div>
      )}
    </div>
  )
}
