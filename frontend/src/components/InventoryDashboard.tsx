import React, { useState, useEffect } from 'react'
import { apiGetInventoryDashboard, InventoryDashboardMetrics } from '../lib/api'
import { Button } from './Button'
import { LoadingSpinner } from './LoadingSpinner'
import { ErrorMessage } from './ErrorMessage'
import { useAuth } from '../modules/AuthContext'
import { createApiErrorHandler } from '../lib/apiUtils'

interface InventoryDashboardProps {
  onClose?: () => void
}

export function InventoryDashboardComponent({ onClose }: InventoryDashboardProps) {
  const [metrics, setMetrics] = useState<InventoryDashboardMetrics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { forceLogout } = useAuth()
  const handleApiError = createApiErrorHandler(forceLogout)

  const loadMetrics = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await apiGetInventoryDashboard()
      setMetrics(data)
    } catch (err) {
      console.error('Failed to load inventory dashboard metrics:', err)
      const errorMessage = handleApiError(err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMetrics()
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadMetrics, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN')
  }

  const getStockStatusColor = (currentStock: number, minimumStock: number) => {
    if (currentStock === 0) return '#ef4444'
    if (currentStock <= minimumStock) return '#f59e0b'
    return '#10b981'
  }

  const getStockStatusText = (currentStock: number, minimumStock: number) => {
    if (currentStock === 0) return 'Out of Stock'
    if (currentStock <= minimumStock) return 'Low Stock'
    return 'In Stock'
  }

  return (
    <div style={{ padding: '20px', maxWidth: '100%' }}>
      <div style={{ 
        marginBottom: '24px',
        paddingBottom: '12px',
        borderBottom: '2px solid #e9ecef'
      }}>
        <h1 style={{ margin: '0', fontSize: '28px', fontWeight: '600', color: '#2c3e50' }}>Inventory Dashboard</h1>
        <p style={{ color: '#6c757d', marginTop: '8px', fontSize: '16px' }}>
          Real-time inventory overview with key metrics and alerts
        </p>
      </div>

      {error && (
        <div style={{ 
          padding: '12px 16px', 
          marginBottom: '20px', 
          backgroundColor: '#fee', 
          border: '1px solid #fcc', 
          borderRadius: '6px', 
          color: '#c33',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}

      {/* Refresh Button */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="primary" onClick={loadMetrics} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh Dashboard'}
        </Button>
      </div>

      {/* Dashboard Content */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <LoadingSpinner />
          <p style={{ marginTop: '16px', color: '#6c757d' }}>Loading inventory dashboard...</p>
        </div>
      )}

      {metrics && !loading && (
        <div>
          {/* Key Metrics Cards */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '16px',
            marginBottom: '32px'
          }}>
            <div style={{ 
              padding: '24px', 
              backgroundColor: '#e3f2fd', 
              borderRadius: '12px',
              textAlign: 'center',
              border: '1px solid #bbdefb'
            }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1976d2', marginBottom: '8px' }}>
                {formatNumber(metrics.total_products)}
              </div>
              <div style={{ fontSize: '16px', color: '#1976d2', fontWeight: '500' }}>Total Products</div>
            </div>
            
            <div style={{ 
              padding: '24px', 
              backgroundColor: '#e8f5e8', 
              borderRadius: '12px',
              textAlign: 'center',
              border: '1px solid #c8e6c9'
            }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#2e7d32', marginBottom: '8px' }}>
                {formatCurrency(metrics.total_stock_value)}
              </div>
              <div style={{ fontSize: '16px', color: '#2e7d32', fontWeight: '500' }}>Total Stock Value</div>
            </div>
            
            <div style={{ 
              padding: '24px', 
              backgroundColor: '#fff3e0', 
              borderRadius: '12px',
              textAlign: 'center',
              border: '1px solid #ffe0b2'
            }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f57c00', marginBottom: '8px' }}>
                {formatNumber(metrics.low_stock_items)}
              </div>
              <div style={{ fontSize: '16px', color: '#f57c00', fontWeight: '500' }}>Low Stock Items</div>
            </div>
            
            <div style={{ 
              padding: '24px', 
              backgroundColor: '#fce4ec', 
              borderRadius: '12px',
              textAlign: 'center',
              border: '1px solid #f8bbd9'
            }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#c2185b', marginBottom: '8px' }}>
                {formatNumber(metrics.out_of_stock_items)}
              </div>
              <div style={{ fontSize: '16px', color: '#c2185b', fontWeight: '500' }}>Out of Stock</div>
            </div>
            
            <div style={{ 
              padding: '24px', 
              backgroundColor: '#f3e5f5', 
              borderRadius: '12px',
              textAlign: 'center',
              border: '1px solid #e1bee7'
            }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#7b1fa2', marginBottom: '8px' }}>
                {formatNumber(metrics.recent_movements.length)}
              </div>
              <div style={{ fontSize: '16px', color: '#7b1fa2', fontWeight: '500' }}>Recent Movements</div>
            </div>
            
            <div style={{ 
              padding: '24px', 
              backgroundColor: '#e0f2f1', 
              borderRadius: '12px',
              textAlign: 'center',
              border: '1px solid #b2dfdb'
            }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#00695c', marginBottom: '8px' }}>
                {formatNumber(metrics.average_stock_level)}
              </div>
              <div style={{ fontSize: '16px', color: '#00695c', fontWeight: '500' }}>Avg Stock Level</div>
            </div>
          </div>

          {/* Alerts and Insights */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
            gap: '24px',
            marginBottom: '32px'
          }}>
            {/* Low Stock Alerts */}
            <div style={{ 
              border: '1px solid #e9ecef',
              borderRadius: '12px',
              backgroundColor: 'white',
              overflow: 'hidden'
            }}>
              <div style={{ 
                padding: '16px 20px', 
                backgroundColor: '#fff3cd', 
                borderBottom: '1px solid #e9ecef'
              }}>
                <h3 style={{ 
                  margin: '0', 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  color: '#856404',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  ⚠️ Low Stock Alerts ({metrics.low_stock_alerts.length})
                </h3>
              </div>
              
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {metrics.low_stock_alerts.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>
                    No low stock alerts
                  </div>
                ) : (
                  <div style={{ padding: '0' }}>
                    {metrics.low_stock_alerts.map((alert, index) => (
                      <div key={alert.product_id} style={{ 
                        padding: '16px 20px', 
                        borderBottom: index < metrics.low_stock_alerts.length - 1 ? '1px solid #f1f3f4' : 'none',
                        backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: '500', color: '#495057', marginBottom: '4px' }}>
                              {alert.product_name}
                            </div>
                            <div style={{ fontSize: '14px', color: '#6c757d' }}>
                              Category: {alert.category || 'Uncategorized'}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ 
                              fontSize: '18px', 
                              fontWeight: 'bold',
                              color: getStockStatusColor(alert.current_stock, alert.minimum_stock)
                            }}>
                              {formatNumber(alert.current_stock)}
                            </div>
                            <div style={{ fontSize: '12px', color: '#6c757d' }}>
                              Min: {formatNumber(alert.minimum_stock)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Top Moving Products */}
            <div style={{ 
              border: '1px solid #e9ecef',
              borderRadius: '12px',
              backgroundColor: 'white',
              overflow: 'hidden'
            }}>
              <div style={{ 
                padding: '16px 20px', 
                backgroundColor: '#d1ecf1', 
                borderBottom: '1px solid #e9ecef'
              }}>
                <h3 style={{ 
                  margin: '0', 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  color: '#0c5460',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  📊 Top Moving Products
                </h3>
              </div>
              
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {metrics.top_moving_products.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>
                    No movement data available
                  </div>
                ) : (
                  <div style={{ padding: '0' }}>
                    {metrics.top_moving_products.map((product, index) => (
                      <div key={product.product_id} style={{ 
                        padding: '16px 20px', 
                        borderBottom: index < metrics.top_moving_products.length - 1 ? '1px solid #f1f3f4' : 'none',
                        backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: '500', color: '#495057', marginBottom: '4px' }}>
                              {product.product_name}
                            </div>
                            <div style={{ fontSize: '14px', color: '#6c757d' }}>
                              Category: {product.category || 'Uncategorized'}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ 
                              fontSize: '18px', 
                              fontWeight: 'bold',
                              color: '#1976d2'
                            }}>
                              {formatNumber(product.movement_count)}
                            </div>
                            <div style={{ fontSize: '12px', color: '#6c757d' }}>
                              Stock: {formatNumber(product.current_stock)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ 
            padding: '24px',
            backgroundColor: '#f8f9fa',
            borderRadius: '12px',
            border: '1px solid #e9ecef'
          }}>
            <h3 style={{ 
              margin: '0 0 16px 0', 
              fontSize: '20px', 
              fontWeight: '600', 
              color: '#495057'
            }}>
              Quick Actions
            </h3>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '16px'
            }}>
              <Button variant="primary" onClick={() => window.location.href = '/reports/inventory'}>
                View Inventory Summary
              </Button>
              <Button variant="secondary" onClick={() => window.location.href = '/reports/stock-ledger'}>
                View Stock Ledger
              </Button>
              <Button variant="secondary" onClick={() => window.location.href = '/reports/inventory-valuation'}>
                View Valuation Report
              </Button>
              <Button variant="secondary" onClick={() => window.location.href = '/products'}>
                Manage Products
              </Button>
            </div>
          </div>

          {/* Dashboard Footer */}
          <div style={{ 
            marginTop: '24px', 
            padding: '16px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '8px',
            fontSize: '14px',
            color: '#6c757d',
            textAlign: 'center'
          }}>
            <div>
              Dashboard last updated: {formatDate(metrics.generated_at)}
            </div>
            <div style={{ marginTop: '4px', fontSize: '12px' }}>
              Auto-refreshes every 5 minutes • Click "Refresh Dashboard" for immediate update
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
