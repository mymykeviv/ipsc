import React, { useState, useEffect } from 'react'

interface SessionTimerProps {
  expiryTime: number // Unix timestamp
  onExpire: () => void
  className?: string
}

export function SessionTimer({ expiryTime, onExpire, className = '' }: SessionTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Math.floor(Date.now() / 1000)
      const remaining = expiryTime - now
      
      if (remaining <= 0) {
        onExpire()
        return 0
      }
      
      return remaining
    }

    setTimeLeft(calculateTimeLeft())

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft()
      setTimeLeft(remaining)
    }, 1000)

    return () => clearInterval(timer)
  }, [expiryTime, onExpire])

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const getColorClass = (seconds: number): string => {
    if (seconds <= 300) return 'text-red-600' // 5 minutes or less
    if (seconds <= 600) return 'text-orange-600' // 10 minutes or less
    return 'text-gray-600'
  }

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className={`font-medium ${getColorClass(timeLeft)}`}>
        Session: {formatTime(timeLeft)}
      </span>
    </div>
  )
}
