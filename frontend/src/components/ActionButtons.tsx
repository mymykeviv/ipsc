import React from 'react'
import { Button } from './Button'

interface ActionButton {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'danger'
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
  const allActions = [...primaryActions, ...secondaryActions, ...contextualActions]
  const visibleActions = allActions.slice(0, maxVisible)
  const dropdownActions = allActions.slice(maxVisible)

  return (
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
      {/* Primary Actions */}
      {primaryActions.map((action, index) => (
        <Button
          key={`primary-${index}`}
          variant={action.variant || 'primary'}
          onClick={action.onClick}
          disabled={action.disabled}
          style={{ 
            fontSize: '12px', 
            padding: '6px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            minWidth: 'auto'
          }}
        >
          {action.icon && <span>{action.icon}</span>}
          {action.label}
        </Button>
      ))}

      {/* Secondary Actions */}
      {secondaryActions.map((action, index) => (
        <Button
          key={`secondary-${index}`}
          variant={action.variant || 'secondary'}
          onClick={action.onClick}
          disabled={action.disabled}
          style={{ 
            fontSize: '12px', 
            padding: '6px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            minWidth: 'auto'
          }}
        >
          {action.icon && <span>{action.icon}</span>}
          {action.label}
        </Button>
      ))}

      {/* Contextual Actions */}
      {contextualActions.map((action, index) => (
        <Button
          key={`contextual-${index}`}
          variant={action.variant || 'secondary'}
          onClick={action.onClick}
          disabled={action.disabled}
          style={{ 
            fontSize: '12px', 
            padding: '6px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            minWidth: 'auto',
            backgroundColor: action.variant === 'danger' ? '#dc3545' : undefined,
            color: action.variant === 'danger' ? '#fff' : undefined
          }}
        >
          {action.icon && <span>{action.icon}</span>}
          {action.label}
        </Button>
      ))}

      {/* Dropdown for additional actions */}
      {showDropdown && dropdownActions.length > 0 && (
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <Button
            variant="secondary"
            style={{ 
              fontSize: '12px', 
              padding: '6px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              minWidth: 'auto'
            }}
            onClick={() => {
              // Toggle dropdown - this would need state management
              console.log('Toggle dropdown')
            }}
          >
            ⋯ More
          </Button>
          {/* Dropdown menu would be implemented here */}
        </div>
      )}
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
      { label: 'Edit', onClick: actions.onEdit, icon: '✏️', variant: 'primary' as const }
    ],
    secondaryActions: [
      { label: 'Stock', onClick: actions.onStock, icon: '📦', variant: 'secondary' as const },
      { label: 'History', onClick: actions.onHistory, icon: '📊', variant: 'secondary' as const }
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
      { label: 'Edit', onClick: actions.onEdit, icon: '✏️', variant: 'primary' as const },
      { label: 'Add Payment', onClick: actions.onPayment, icon: '💰', variant: 'primary' as const }
    ],
    secondaryActions: [
      { label: 'Print', onClick: actions.onPrint, icon: '🖨️', variant: 'secondary' as const },
      { label: 'Email', onClick: actions.onEmail, icon: '📧', variant: 'secondary' as const }
    ],
    contextualActions: [
      ...(item.status === 'Draft' ? [
        { label: 'Mark as Sent', onClick: actions.onMarkSent, icon: '📤', variant: 'secondary' as const }
      ] : []),
      { label: 'Delete', onClick: actions.onDelete, icon: '🗑️', variant: 'danger' as const, show: item.status === 'Draft' }
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
      { label: 'Edit', onClick: actions.onEdit, icon: '✏️', variant: 'primary' as const },
      { label: 'Add Payment', onClick: actions.onPayment, icon: '💰', variant: 'primary' as const }
    ],
    contextualActions: [
      ...(item.status === 'Cancelled' ? [
        { label: 'Delete', onClick: actions.onDelete, icon: '🗑️', variant: 'danger' as const }
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
      { label: 'Edit', onClick: actions.onEdit, icon: '✏️', variant: 'primary' as const }
    ],
    contextualActions: [
      { label: 'Delete', onClick: actions.onDelete, icon: '🗑️', variant: 'danger' as const }
    ]
  }),

  // Parties pattern
  parties: (item: any, actions: {
    onEdit: () => void
    onToggle: () => void
  }) => ({
    primaryActions: [
      { label: 'Edit', onClick: actions.onEdit, icon: '✏️', variant: 'primary' as const }
    ],
    contextualActions: [
      { 
        label: item.is_active ? 'Deactivate' : 'Activate', 
        onClick: actions.onToggle, 
        icon: item.is_active ? '🚫' : '✅', 
        variant: 'secondary' as const 
      }
    ]
  })
}
