import React, { useState, useRef, useEffect } from 'react'
import { Button } from './Button'

interface ActionButton {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
  icon?: string
  disabled?: boolean
  show?: boolean
}

interface ActionButtonsProps {
  primaryActions?: ActionButton[]
  secondaryActions?: ActionButton[]
  contextualActions?: ActionButton[]
  maxVisible?: number
  showDropdown?: boolean
}

export function ActionButtons({ 
  primaryActions = [], 
  secondaryActions = [], 
  contextualActions = [],
  maxVisible = 3,
  showDropdown = true
}: ActionButtonsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const allActions = [...primaryActions, ...secondaryActions, ...contextualActions]
  const visibleActions = allActions.slice(0, maxVisible)
  const dropdownActions = allActions.slice(maxVisible)

  // If we have more than maxVisible actions, show kebab menu
  if (allActions.length > maxVisible) {
    return (
      <div style={{ position: 'relative', display: 'inline-block' }} ref={dropdownRef}>
        <Button
          variant="secondary"
          onClick={() => setIsOpen(!isOpen)}
          style={{ 
            fontSize: '12px', 
            padding: '6px 8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 'auto',
            backgroundColor: '#ffffff',
            border: '1px solid #dee2e6',
            color: '#6c757d',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
        >
          ⋯
        </Button>
        
        {isOpen && (
          <div style={{
            position: 'absolute',
            top: '100%',
            right: '0',
            zIndex: 1000,
            backgroundColor: '#ffffff',
            border: '1px solid #dee2e6',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            minWidth: '160px',
            padding: '4px 0',
            marginTop: '4px'
          }}>
            {allActions.map((action, index) => (
              <button
                key={index}
                onClick={() => {
                  action.onClick()
                  setIsOpen(false)
                }}
                disabled={action.disabled}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  textAlign: 'left',
                  fontSize: '13px',
                  cursor: action.disabled ? 'not-allowed' : 'pointer',
                  color: action.disabled ? '#adb5bd' : '#495057',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background-color 0.2s ease',
                  fontWeight: '400'
                }}
                onMouseEnter={(e) => {
                  if (!action.disabled) {
                    e.currentTarget.style.backgroundColor = '#f8f9fa'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                {action.icon && <span style={{ fontSize: '14px', opacity: '0.7' }}>{action.icon}</span>}
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // If we have few actions, show them as small buttons
  return (
    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
      {allActions.map((action, index) => (
        <Button
          key={index}
          variant={action.variant || 'secondary'}
          onClick={action.onClick}
          disabled={action.disabled}
          style={{ 
            fontSize: '11px', 
            padding: '4px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            minWidth: 'auto',
            backgroundColor: '#ffffff',
            border: '1px solid #dee2e6',
            color: '#6c757d',
            borderRadius: '3px',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
            fontWeight: '400'
          }}
        >
          {action.icon && <span style={{ fontSize: '12px', opacity: '0.7' }}>{action.icon}</span>}
          {action.label}
        </Button>
      ))}
    </div>
  )
}

// Predefined action button sets for common patterns
export const ActionButtonSets = {
  // Products pattern
  products: (item: any, actions: {
    onEdit: () => void
    onStock: () => void
    onHistory: () => void
    onToggle: () => void
  }) => ({
    primaryActions: [
      { label: 'Edit', onClick: actions.onEdit, icon: '✏️', variant: 'secondary' as const }
    ],
    secondaryActions: [
      { label: 'Stock Adjustment', onClick: actions.onStock, icon: '📦', variant: 'secondary' as const },
      { label: 'View History', onClick: actions.onHistory, icon: '📊', variant: 'secondary' as const }
    ],
    contextualActions: [
      { 
        label: item.is_active ? 'Deactivate' : 'Activate', 
        onClick: actions.onToggle, 
        icon: item.is_active ? '🚫' : '✅', 
        variant: 'secondary' as const 
      }
    ]
  }),

  // Invoices pattern
  invoices: (item: any, actions: {
    onEdit: () => void
    onPrint: () => void
    onEmail: () => void
    onPayment: () => void
    onMarkSent: () => void
    onDelete: () => void
  }) => ({
    primaryActions: [
      { label: 'Edit', onClick: actions.onEdit, icon: '✏️', variant: 'secondary' as const },
      { label: 'Add Payment', onClick: actions.onPayment, icon: '💰', variant: 'secondary' as const }
    ],
    secondaryActions: [
      { label: 'Print', onClick: actions.onPrint, icon: '🖨️', variant: 'secondary' as const },
      { label: 'Email', onClick: actions.onEmail, icon: '📧', variant: 'secondary' as const }
    ],
    contextualActions: [
      ...(item.status === 'Draft' ? [
        { label: 'Mark as Sent', onClick: actions.onMarkSent, icon: '📤', variant: 'secondary' as const }
      ] : []),
      { label: 'Delete', onClick: actions.onDelete, icon: '🗑️', variant: 'secondary' as const, show: item.status === 'Draft' }
    ]
  }),

  // Purchases pattern
  purchases: (item: any, actions: {
    onEdit: () => void
    onPayment: () => void
    onCancel: () => void
    onDelete: () => void
  }) => ({
    primaryActions: [
      { label: 'Edit', onClick: actions.onEdit, icon: '✏️', variant: 'secondary' as const },
      { label: 'Add Payment', onClick: actions.onPayment, icon: '💰', variant: 'secondary' as const }
    ],
    contextualActions: [
      ...(item.status === 'Cancelled' ? [
        { label: 'Delete', onClick: actions.onDelete, icon: '🗑️', variant: 'secondary' as const }
      ] : [
        { label: 'Cancel Purchase', onClick: actions.onCancel, icon: '❌', variant: 'secondary' as const }
      ])
    ]
  }),

  // Expenses pattern
  expenses: (item: any, actions: {
    onEdit: () => void
    onDelete: () => void
  }) => ({
    primaryActions: [
      { label: 'Edit', onClick: actions.onEdit, icon: '✏️', variant: 'secondary' as const }
    ],
    contextualActions: [
      { label: 'Delete', onClick: actions.onDelete, icon: '🗑️', variant: 'secondary' as const }
    ]
  }),

  // Parties pattern
  parties: (item: any, actions: {
    onEdit: () => void
    onToggle: () => void
  }) => ({
    primaryActions: [
      { label: 'Edit', onClick: actions.onEdit, icon: '✏️', variant: 'secondary' as const }
    ],
    contextualActions: [
      { 
        label: item.is_active ? 'Deactivate' : 'Activate', 
        onClick: actions.onToggle, 
        icon: item.is_active ? '🚫' : '✅', 
        variant: 'secondary' as const 
      }
    ]
  }),

  // Purchase Payments pattern
  purchasePayments: (item: any, actions: {
    onViewPurchase: () => void
    onAddPayment: () => void
  }) => ({
    primaryActions: [
      { label: 'View Purchase', onClick: actions.onViewPurchase, icon: '👁️', variant: 'secondary' as const },
      { label: 'Add Payment', onClick: actions.onAddPayment, icon: '💰', variant: 'secondary' as const }
    ]
  })
}
