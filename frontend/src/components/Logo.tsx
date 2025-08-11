import React from 'react'

interface LogoProps {
  size?: 'small' | 'medium' | 'large'
  showText?: boolean
  className?: string
}

export function Logo({ size = 'medium', showText = true, className = '' }: LogoProps) {
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

  return (
    <div className={`flex items-center gap-2 ${className}`} style={{ minWidth: 0, flexShrink: 1 }}>
      <div className={`${sizeClasses[size]} bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0`}>
        <span className={size === 'small' ? 'text-xs' : size === 'medium' ? 'text-sm' : 'text-lg'}>
          CF
        </span>
      </div>
      {showText && (
        <div className="flex flex-col" style={{ minWidth: 0, flexShrink: 1 }}>
          <span className={`${textSizes[size]} font-bold text-gray-900`} style={{ wordBreak: 'break-word' }}>CASHFLOW</span>
          <div className={`${size === 'small' ? 'text-xs' : 'text-sm'} text-gray-600 font-medium leading-tight`} style={{ wordBreak: 'break-word' }}>
            <div>Financial Management</div>
            <div>System</div>
          </div>
        </div>
      )}
    </div>
  )
}
