import React, { useState, useEffect } from 'react'
import { apiGetInventorySummary, InventorySummaryReport } from '../lib/api'
import { Button } from './Button'
import { LoadingSpinner } from './LoadingSpinner'
import { ErrorMessage } from './ErrorMessage'
import { useAuth } from '../modules/AuthContext'
import { createApiErrorHandler } from '../lib/apiUtils'

interface InventorySummaryReportProps {
  onClose?: () => void
}

export function InventorySummaryReport({ onClose }: InventorySummaryReportProps) {
  const [report, setReport] = useState<InventorySummaryReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { forceLogout } = useAuth()
  const handleApiError = createApiErrorHandler(forceLogout)

  const loadReport = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await apiGetInventorySummary()
      setReport(data)
    } catch (err) {
      console.error('Failed to load inventory summary:', err)
      const errorMessage = handleApiError(err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReport()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount)
  }

  return (
    <div style={{ padding: '20px', maxWidth: '100%' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px',
        paddingBottom: '12px',
        borderBottom: '2px solid #e9ecef'
      }}>
        <h1 style={{ margin: '0', fontSize: '28px', fontWeight: '600', color: '#2c3e50' }}>
          Inventory Summary Report
        </h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Button onClick={onClose} variant="secondary">
            ← Back to Reports
          </Button>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <LoadingSpinner />
          <div style={{ marginTop: '16px', color: '#6c757d' }}>
            Generating inventory summary report...
          </div>
        </div>
      ) : report ? (
        <div>
          <h2>Inventory Summary</h2>
          <p>Total Products: {report.total_products}</p>
          <p>Total Stock Value: {formatCurrency(report.total_stock_value)}</p>
          <p>Low Stock Items: {report.low_stock_items}</p>
          <p>Out of Stock Items: {report.out_of_stock_items}</p>
        </div>
      ) : (
        <div>No data available</div>
      )}
    </div>
  )
}
