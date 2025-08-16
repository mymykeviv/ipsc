import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../modules/AuthContext'
import { createApiErrorHandler } from '../lib/apiUtils'
import { Button } from '../components/Button'
import { PaymentForm } from '../components/PaymentForm'
import { apiGetInvoicePayments, Payment, apiGetAllInvoicePayments } from '../lib/api'

interface PaymentsProps {
  mode?: 'add' | 'edit' | 'list'
  type?: 'purchase' | 'invoice'
}

export function Payments({ mode = 'add', type = 'purchase' }: PaymentsProps) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { forceLogout } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(false)
  const [invoices, setInvoices] = useState<any[]>([])

  // Create error handler that will automatically log out on 401 errors
  const handleApiError = createApiErrorHandler(forceLogout)

  useEffect(() => {
    if (mode === 'list' && type === 'invoice') {
      loadInvoicePayments()
    }
  }, [mode, type])

  const loadInvoicePayments = async () => {
    try {
      setLoading(true)
      // First load invoices to get invoice numbers
      const invoicesResponse = await fetch('/api/invoices', {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
      })
      if (invoicesResponse.ok) {
        const invoicesData = await invoicesResponse.json()
        setInvoices(invoicesData.invoices)
      }
      
      const data = await apiGetAllInvoicePayments()
      setPayments(data)
    } catch (err: any) {
      const errorMessage = handleApiError(err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const getInvoiceNumber = (invoiceId: number) => {
    const invoice = invoices.find(inv => inv.id === invoiceId)
    return invoice ? invoice.invoice_no : `Invoice #${invoiceId}`
  }

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

  // List mode for invoice payments
  if (mode === 'list' && type === 'invoice') {
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
            Invoice Payments
          </h1>
          <Button variant="primary" onClick={() => navigate('/payments/invoice/add')}>
            Add Payment
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

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div>Loading payments...</div>
          </div>
        ) : payments.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            color: '#6c757d',
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            backgroundColor: '#f8f9fa'
          }}>
            <div style={{ fontSize: '18px', marginBottom: '8px', fontWeight: '500' }}>
              No invoice payments found
            </div>
            <div style={{ fontSize: '14px' }}>
              Add your first invoice payment to get started
            </div>
          </div>
        ) : (
          <div style={{ 
            border: '1px solid #e9ecef', 
            borderRadius: '8px', 
            overflow: 'hidden',
            backgroundColor: 'white'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #e9ecef' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Invoice</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Payment Date</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Amount</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Payment Method</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Reference</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(payment => (
                  <tr key={payment.id} style={{ 
                    borderBottom: '1px solid #e9ecef',
                    backgroundColor: 'white'
                  }}>
                    <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>
                      {getInvoiceNumber(payment.invoice_id)}
                    </td>
                    <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>
                      ₹{payment.payment_amount.toFixed(2)}
                    </td>
                    <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>
                      {payment.payment_method}
                    </td>
                    <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>
                      {payment.reference_number || '-'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Button 
                          variant="secondary"
                          onClick={() => navigate(`/payments/invoice/edit/${payment.id}`)}
                          style={{ fontSize: '14px', padding: '6px 12px' }}
                        >
                          Edit
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
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
