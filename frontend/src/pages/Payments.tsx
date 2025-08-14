import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../modules/AuthContext'
import { createApiErrorHandler } from '../lib/apiUtils'
import { Button } from '../components/Button'
import { PaymentForm } from '../components/PaymentForm'

interface PaymentsProps {
  mode?: 'add' | 'edit'
  type?: 'purchase' | 'invoice'
}

export function Payments({ mode = 'add', type = 'purchase' }: PaymentsProps) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { forceLogout } = useAuth()
  const [error, setError] = useState<string | null>(null)

  // Create error handler that will automatically log out on 401 errors
  const handleApiError = createApiErrorHandler(forceLogout)

  const handleSuccess = () => {
    if (type === 'purchase') {
      navigate('/purchases')
    } else {
      navigate('/invoices')
    }
  }

  const handleCancel = () => {
    if (type === 'purchase') {
      navigate('/purchases')
    } else {
      navigate('/invoices')
    }
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
          {mode === 'add' ? 'Add' : 'Edit'} {type === 'purchase' ? 'Purchase' : 'Invoice'} Payment
          {id && ` for ${type === 'purchase' ? 'Purchase' : 'Invoice'} #${id}`}
        </h1>
        <Button variant="secondary" onClick={handleCancel}>
          ← Back to {type === 'purchase' ? 'Purchases' : 'Invoices'}
        </Button>
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

      <PaymentForm 
        onSuccess={handleSuccess}
        onCancel={handleCancel}
        type={type}
        purchaseId={type === 'purchase' && id ? parseInt(id) : undefined}
        invoiceId={type === 'invoice' && id ? parseInt(id) : undefined}
      />
    </div>
  )
}
