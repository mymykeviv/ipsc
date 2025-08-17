import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../modules/AuthContext'
import { createApiErrorHandler } from '../lib/apiUtils'
import { Button } from '../components/Button'
import { PaymentForm } from '../components/PaymentForm'
import { apiGetInvoicePayments, Payment, apiGetAllInvoicePayments } from '../lib/api'
import { EnhancedFilterBar } from '../components/EnhancedFilterBar'
import { FilterDropdown } from '../components/FilterDropdown'
import { DateFilter } from '../components/DateFilter'

interface PaymentsProps {
  mode?: 'add' | 'edit' | 'list'
  type?: 'purchase' | 'invoice'
}

export function Payments({ mode = 'add', type = 'purchase' }: PaymentsProps) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { token, forceLogout } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(false)
  const [invoices, setInvoices] = useState<any[]>([])
  
  // Filter states
  const [invoiceNumberFilter, setInvoiceNumberFilter] = useState('all')
  const [paymentAmountFilter, setPaymentAmountFilter] = useState('all')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all')
  const [financialYearFilter, setFinancialYearFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')

  // Create error handler that will automatically log out on 401 errors
  const handleApiError = createApiErrorHandler(forceLogout)

  useEffect(() => {
    if (!token) {
      // If no token, redirect to login
      navigate('/login')
      return
    }
    
    if (mode === 'list' && type === 'invoice') {
      loadInvoicePayments()
    }
  }, [mode, type, token, navigate])

  const loadInvoicePayments = async () => {
    try {
      setLoading(true)
      // First load invoices to get invoice numbers
      const invoicesResponse = await fetch('/api/invoices', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (invoicesResponse.ok) {
        const invoicesData = await invoicesResponse.json()
        setInvoices(invoicesData.invoices)
      }
      
      const data = await apiGetAllInvoicePayments()
      setPayments(data)
      setFilteredPayments(data)
    } catch (err: any) {
      const errorMessage = handleApiError(err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Filter payments based on selected filters
  useEffect(() => {
    let filtered = payments

    if (invoiceNumberFilter !== 'all') {
      const invoice = invoices.find(inv => inv.invoice_no === invoiceNumberFilter)
      if (invoice) {
        filtered = filtered.filter(payment => payment.invoice_id === invoice.id)
      }
    }

    if (paymentAmountFilter !== 'all') {
      const [min, max] = paymentAmountFilter.split('-').map(Number)
      filtered = filtered.filter(payment => {
        if (max) {
          return payment.payment_amount >= min && payment.payment_amount <= max
        } else {
          return payment.payment_amount >= min
        }
      })
    }

    if (paymentMethodFilter !== 'all') {
      filtered = filtered.filter(payment => 
        payment.payment_method.toLowerCase() === paymentMethodFilter.toLowerCase()
      )
    }

    if (financialYearFilter !== 'all') {
      filtered = filtered.filter(payment => {
        const paymentYear = new Date(payment.payment_date).getFullYear()
        const [startYear] = financialYearFilter.split('-').map(Number)
        return paymentYear === startYear
      })
    }

    if (dateFilter !== 'all') {
      // Handle date filtering logic here
      // This would need to be implemented based on the DateFilter component
    }

    setFilteredPayments(filtered)
  }, [payments, invoices, invoiceNumberFilter, paymentAmountFilter, paymentMethodFilter, financialYearFilter, dateFilter])

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

        {/* Enhanced Filter Options */}
        <EnhancedFilterBar 
          title="Invoice Payment Filters"
          activeFiltersCount={
            (invoiceNumberFilter !== 'all' ? 1 : 0) +
            (paymentAmountFilter !== 'all' ? 1 : 0) +
            (paymentMethodFilter !== 'all' ? 1 : 0) +
            (financialYearFilter !== 'all' ? 1 : 0) +
            (dateFilter !== 'all' ? 1 : 0)
          }
          onClearAll={() => {
            setInvoiceNumberFilter('all')
            setPaymentAmountFilter('all')
            setPaymentMethodFilter('all')
            setFinancialYearFilter('all')
            setDateFilter('all')
          }}
          showQuickActions={true}
          quickActions={[
            {
              label: 'Current FY',
              action: () => {
                const currentYear = new Date().getFullYear()
                setFinancialYearFilter(`${currentYear}-${currentYear + 1}`)
              },
              icon: '📅'
            },
            {
              label: 'Cash Payment',
              action: () => {
                setPaymentMethodFilter('Cash')
              },
              icon: '💰'
            }
          ]}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: '500', color: '#495057' }}>Invoice Number</span>
            <FilterDropdown
              value={invoiceNumberFilter}
              onChange={(value) => setInvoiceNumberFilter(Array.isArray(value) ? value[0] || 'all' : value)}
              options={[
                { value: 'all', label: 'All Invoices' },
                ...invoices.map(invoice => ({ 
                  value: invoice.invoice_no, 
                  label: invoice.invoice_no 
                }))
              ]}
              placeholder="Select invoice"
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: '500', color: '#495057' }}>Payment Amount</span>
            <FilterDropdown
              value={paymentAmountFilter}
              onChange={(value) => setPaymentAmountFilter(Array.isArray(value) ? value[0] || 'all' : value)}
              options={[
                { value: 'all', label: 'All Amounts' },
                { value: '0-1000', label: '₹0 - ₹1,000' },
                { value: '1000-5000', label: '₹1,000 - ₹5,000' },
                { value: '5000-10000', label: '₹5,000 - ₹10,000' },
                { value: '10000-50000', label: '₹10,000 - ₹50,000' },
                { value: '50000-', label: '₹50,000+' }
              ]}
              placeholder="Select amount range"
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: '500', color: '#495057' }}>Payment Method</span>
            <FilterDropdown
              value={paymentMethodFilter}
              onChange={(value) => setPaymentMethodFilter(Array.isArray(value) ? value[0] || 'all' : value)}
              options={[
                { value: 'all', label: 'All Methods' },
                { value: 'Cash', label: 'Cash' },
                { value: 'Bank Transfer', label: 'Bank Transfer' },
                { value: 'Cheque', label: 'Cheque' },
                { value: 'UPI', label: 'UPI' },
                { value: 'Credit Card', label: 'Credit Card' }
              ]}
              placeholder="Select payment method"
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: '500', color: '#495057' }}>Financial Year</span>
            <FilterDropdown
              value={financialYearFilter}
              onChange={(value) => setFinancialYearFilter(Array.isArray(value) ? value[0] || 'all' : value)}
              options={[
                { value: 'all', label: 'All Years' },
                { value: '2023-2024', label: '2023-2024' },
                { value: '2024-2025', label: '2024-2025' },
                { value: '2025-2026', label: '2025-2026' }
              ]}
              placeholder="Select financial year"
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: '500', color: '#495057' }}>Date</span>
            <DateFilter
              value={dateFilter}
              onChange={setDateFilter}
              placeholder="Select date range"
            />
          </div>
        </EnhancedFilterBar>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div>Loading payments...</div>
          </div>
        ) : filteredPayments.length === 0 ? (
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
                {payments.length === 0 ? 'Add your first invoice payment to get started' : 'No payments match the selected filters'}
              </div>
          </div>
        ) : (
          <div style={{ 
            border: '1px solid #e9ecef', 
            borderRadius: '8px', 
            overflow: 'visible',
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
                {filteredPayments.map(payment => (
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
