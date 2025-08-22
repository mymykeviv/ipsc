import { useCallback, useRef } from 'react'
import { DateRange } from '../components/DateFilter'

interface PerformanceMetrics {
  renderTime: number
  filterTime: number
  presetLoadTime: number
  totalOperations: number
  averageRenderTime: number
  averageFilterTime: number
}

export function useDateFilterPerformance() {
  const metricsRef = useRef<PerformanceMetrics>({
    renderTime: 0,
    filterTime: 0,
    presetLoadTime: 0,
    totalOperations: 0,
    averageRenderTime: 0,
    averageFilterTime: 0
  })

  const startTimer = useCallback(() => {
    return performance.now()
  }, [])

  const endTimer = useCallback((startTime: number, metric: keyof PerformanceMetrics) => {
    const endTime = performance.now()
    const duration = endTime - startTime
    
    const metrics = metricsRef.current
    metrics[metric] = duration
    metrics.totalOperations++
    
    // Update averages
    if (metric === 'renderTime') {
      metrics.averageRenderTime = (metrics.averageRenderTime * (metrics.totalOperations - 1) + duration) / metrics.totalOperations
    } else if (metric === 'filterTime') {
      metrics.averageFilterTime = (metrics.averageFilterTime * (metrics.totalOperations - 1) + duration) / metrics.totalOperations
    }
    
    // Log performance warnings
    if (duration > 100) {
      console.warn(`DateFilter ${metric} took ${duration.toFixed(2)}ms - consider optimization`)
    }
    
    return duration
  }, [])

  const measureFilterOperation = useCallback(async (
    operation: () => Promise<void> | void,
    range: DateRange
  ) => {
    const startTime = startTimer()
    
    try {
      await operation()
    } finally {
      endTimer(startTime, 'filterTime')
    }
  }, [startTimer, endTimer])

  const getMetrics = useCallback(() => {
    return { ...metricsRef.current }
  }, [])

  const resetMetrics = useCallback(() => {
    metricsRef.current = {
      renderTime: 0,
      filterTime: 0,
      presetLoadTime: 0,
      totalOperations: 0,
      averageRenderTime: 0,
      averageFilterTime: 0
    }
  }, [])

  const logPerformanceReport = useCallback(() => {
    const metrics = getMetrics()
    console.log('📊 DateFilter Performance Report:', {
      totalOperations: metrics.totalOperations,
      averageRenderTime: `${metrics.averageRenderTime.toFixed(2)}ms`,
      averageFilterTime: `${metrics.averageFilterTime.toFixed(2)}ms`,
      lastRenderTime: `${metrics.renderTime.toFixed(2)}ms`,
      lastFilterTime: `${metrics.filterTime.toFixed(2)}ms`
    })
  }, [getMetrics])

  return {
    startTimer,
    endTimer,
    measureFilterOperation,
    getMetrics,
    resetMetrics,
    logPerformanceReport
  }
}
