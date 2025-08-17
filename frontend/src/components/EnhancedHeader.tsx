import React from 'react'
import { Button } from './Button'

interface ActionButton {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
  icon?: string
  disabled?: boolean
}

interface EnhancedHeaderProps {
  title: string
  breadcrumb?: string
  description?: string
  count?: number
  countLabel?: string
  primaryAction?: ActionButton
  secondaryActions?: ActionButton[]
  showRefresh?: boolean
  onRefresh?: () => void
  loading?: boolean
}

export function EnhancedHeader({
  title,
  breadcrumb,
  description,
  count,
  countLabel,
  primaryAction,
  secondaryActions = [],
  showRefresh = false,
  onRefresh,
  loading = false
}: EnhancedHeaderProps) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '24px',
      paddingBottom: '16px',
      borderBottom: '2px solid #e9ecef'
    }}>
      <div>
        {/* Breadcrumb Navigation */}
        {breadcrumb && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px',
            fontSize: '14px',
            color: '#6c757d'
          }}>
            <span>🏠</span>
            <span>Dashboard</span>
            <span>›</span>
            <span style={{ color: '#007bff', fontWeight: '500' }}>{breadcrumb}</span>
          </div>
        )}

        {/* Page Title with Context */}
        <h1 style={{
          margin: '0',
          fontSize: '28px',
          fontWeight: '600',
          color: '#2c3e50',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          {title}
          {count !== undefined && (
            <span style={{
              fontSize: '16px',
              fontWeight: '400',
              color: '#6c757d',
              backgroundColor: '#f8f9fa',
              padding: '4px 12px',
              borderRadius: '16px',
              border: '1px solid #e9ecef'
            }}>
              {count} {countLabel || 'Total'}
            </span>
          )}
        </h1>

        {/* Contextual Description */}
        {description && (
          <p style={{
            margin: '8px 0 0 0',
            fontSize: '14px',
            color: '#6c757d',
            lineHeight: '1.4'
          }}>
            {description}
          </p>
        )}
      </div>

      {/* Enhanced Action Buttons */}
      <div style={{
        display: 'flex',
        gap: '8px',
        alignItems: 'center'
      }}>
        {/* Refresh Button */}
        {showRefresh && onRefresh && (
          <Button
            onClick={onRefresh}
            disabled={loading}
            variant="secondary"
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#6c757d',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '500',
              transition: 'background-color 0.2s ease'
            }}
          >
            {loading ? '🔄 Refreshing...' : '🔄 Refresh'}
          </Button>
        )}

        {/* Primary Action */}
        {primaryAction && (
          <Button
            onClick={primaryAction.onClick}
            disabled={primaryAction.disabled}
            variant={primaryAction.variant || 'primary'}
            style={{
              padding: '12px 20px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: primaryAction.variant === 'secondary' ? '#17a2b8' : '#28a745',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              boxShadow: primaryAction.variant === 'secondary' ? '0 2px 4px rgba(23,162,184,0.3)' : '0 2px 4px rgba(40,167,69,0.3)',
              transition: 'all 0.2s ease'
            }}
          >
            {primaryAction.icon && <span>{primaryAction.icon}</span>}
            {primaryAction.label}
          </Button>
        )}

        {/* Secondary Actions */}
        {secondaryActions.length > 0 && (
          <div style={{
            display: 'flex',
            gap: '8px'
          }}>
            {secondaryActions.map((action, index) => (
              <Button
                key={index}
                onClick={action.onClick}
                disabled={action.disabled}
                variant={action.variant || 'secondary'}
                style={{
                  padding: '10px 16px',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: action.variant === 'primary' ? '#007bff' : '#ffc107',
                  color: action.variant === 'primary' ? '#fff' : '#856404',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '500',
                  transition: 'background-color 0.2s ease'
                }}
              >
                {action.icon && <span>{action.icon}</span>}
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Predefined header patterns for common screens
export const HeaderPatterns = {
  // Products header
  products: (count: number) => ({
    title: '🏷️ Products Management',
    breadcrumb: 'Products',
    description: 'Manage your product catalog with comprehensive filtering and intelligent suggestions',
    count,
    countLabel: 'Products'
  }),

  // Invoices header
  invoices: (count: number) => ({
    title: '📄 Invoices Management',
    breadcrumb: 'Invoices',
    description: 'Create, manage, and track customer invoices with payment status monitoring',
    count,
    countLabel: 'Invoices'
  }),

  // Purchases header
  purchases: (count: number) => ({
    title: '📦 Purchases Management',
    breadcrumb: 'Purchases',
    description: 'Track vendor purchases and manage payment schedules',
    count,
    countLabel: 'Purchases'
  }),

  // Expenses header
  expenses: (count: number) => ({
    title: '💰 Expenses Management',
    breadcrumb: 'Expenses',
    description: 'Track business expenses and manage cost categories',
    count,
    countLabel: 'Expenses'
  }),

  // Cashflow header
  cashflow: (count: number) => ({
    title: '💳 Cashflow Transactions',
    breadcrumb: 'Cashflow',
    description: 'Monitor cash inflows and outflows with detailed transaction tracking',
    count,
    countLabel: 'Transactions'
  }),

  // Parties header
  parties: (count: number) => ({
    title: '👥 Parties Management',
    breadcrumb: 'Parties',
    description: 'Manage your customers and vendors with comprehensive filtering and search capabilities',
    count,
    countLabel: 'Total'
  })
}
