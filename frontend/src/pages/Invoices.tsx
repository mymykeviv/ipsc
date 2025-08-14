import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiListParties, apiGetProducts, apiCreateInvoice, apiUpdateInvoice, apiGetInvoice, apiDeleteInvoice, apiEmailInvoice, apiAddPayment, apiGetInvoicePayments, apiDeletePayment, apiGetInvoices, apiUpdateInvoiceStatus, Party, Product, Payment, PaginationInfo, Invoice } from '../lib/api'
import { useAuth } from '../modules/AuthContext'
import { createApiErrorHandler } from '../lib/apiUtils'
import { Button } from '../components/Button'
import { StatusBadge } from '../components/StatusBadge'
import { ComprehensiveInvoiceForm } from '../components/ComprehensiveInvoiceForm'
import { formStyles, getSectionHeaderColor } from '../utils/formStyles'





interface InvoiceEmailForm {
  email_address: string
  subject: string
  message: string
}

interface InvoicesProps {
  mode?: 'manage' | 'add' | 'edit' | 'payments' | 'edit-payment' | 'email' | 'print'
}

export function Invoices({ mode = 'manage' }: InvoicesProps) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { token, forceLogout } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null)
  
  // Create error handler that will automatically log out on 401 errors
  const handleApiError = createApiErrorHandler(forceLogout)
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total_count: 0,
    total_pages: 0,
    has_next: false,
    has_prev: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')



  const [emailForm, setEmailForm] = useState<InvoiceEmailForm>({
    email_address: '',
    subject: '',
    message: ''
  })

  useEffect(() => {
    if (mode === 'manage') {
      loadInvoices()
    } else if (mode === 'edit' && id) {
      loadInvoice(parseInt(id))
    } else if (mode === 'payments' && id) {
      loadInvoice(parseInt(id))
    } else if (mode === 'email' && id) {
      loadInvoice(parseInt(id))
    } else if (mode === 'print' && id) {
      loadInvoice(parseInt(id))
    } else if (mode === 'add') {
      setLoading(false)
    }
  }, [mode, id])

  const loadInvoices = async () => {
    try {
      setLoading(true)
      const data = await apiGetInvoices(undefined, undefined, pagination.page, pagination.limit)
      setInvoices(data.invoices)
      setPagination(data.pagination)
    } catch (err: any) {
      const errorMessage = handleApiError(err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const loadInvoice = async (invoiceId: number) => {
    try {
      setLoading(true)
      const data = await apiGetInvoices(undefined, undefined, 1, 1000) // Get all invoices to find the specific one
      const invoice = data.invoices.find(inv => inv.id === invoiceId)
      if (invoice) {
        setCurrentInvoice(invoice)
        // Pre-populate forms based on mode
        if (mode === 'email') {
          setEmailForm({
            email_address: '',
            subject: `Invoice ${invoice.invoice_no}`,
            message: `Please find attached invoice ${invoice.invoice_no} for ₹${invoice.grand_total.toFixed(2)}.`
          })
        }
      } else {
        setError('Invoice not found')
      }
    } catch (err: any) {
      const errorMessage = handleApiError(err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return
    
    try {
      await apiDeleteInvoice(id)
      loadInvoices()
    } catch (err: any) {
      const errorMessage = handleApiError(err)
      setError(errorMessage)
    }
  }

  const handleMarkAsSent = async (id: number) => {
    try {
      await apiUpdateInvoiceStatus(id, 'Sent')
      loadInvoices()
    } catch (err: any) {
      const errorMessage = handleApiError(err)
      setError(errorMessage)
    }
  }



  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentInvoice || !emailForm.email_address) return
    
    try {
      setLoading(true)
      await apiEmailInvoice(currentInvoice.id, emailForm.email_address)
      navigate('/invoices')
    } catch (err: any) {
      const errorMessage = handleApiError(err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = async () => {
    if (!currentInvoice) return
    
    try {
      // TODO: Implement actual PDF generation and printing
      alert('PDF generation and printing functionality will be implemented here.')
      navigate('/invoices')
    } catch (err: any) {
      const errorMessage = handleApiError(err)
      setError(errorMessage)
    }
  }

  // Render different content based on mode
  if (mode === 'add' || mode === 'edit') {
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
            {mode === 'add' ? 'Add New Invoice' : 'Edit Invoice'}
          </h1>
          <Button variant="secondary" onClick={() => navigate('/invoices')}>
            ← Back to Invoices
          </Button>
        </div>
        
        <ComprehensiveInvoiceForm 
          onSuccess={() => navigate('/invoices')}
          onCancel={() => navigate('/invoices')}
        />
      </div>
    )
  }

  if (mode === 'payments') {
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
          <Button variant="secondary" onClick={() => navigate('/invoices')}>
            ← Back to Invoices
          </Button>
        </div>
        
        <div style={{ 
          padding: '20px', 
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          backgroundColor: '#f8f9fa'
        }}>
          <p style={{ margin: '0', color: '#6c757d' }}>
            Invoice payment management functionality will be implemented here.
          </p>
        </div>
      </div>
    )




  if (mode === 'email') {
    if (loading) {
      return (
        <div style={{ padding: '20px' }}>
          <div>Loading...</div>
        </div>
      )
    }

    if (!currentInvoice) {
      return (
        <div style={{ padding: '20px' }}>
          <div>Invoice not found</div>
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
            Send Invoice {currentInvoice.invoice_no} via Email
          </h1>
          <Button variant="secondary" onClick={() => navigate('/invoices')}>
            ← Back to Invoices
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

        <form onSubmit={handleSendEmail} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Invoice Details Section */}
          <div style={formStyles.section}>
            <h2 style={{ ...formStyles.sectionHeader, backgroundColor: getSectionHeaderColor('basic') }}>
              📄 Invoice Details
            </h2>
            <div style={formStyles.grid}>
              <div style={formStyles.grid2Col}>
                <div style={formStyles.formGroup}>
                  <label style={formStyles.label}>Invoice Number</label>
                  <input
                    type="text"
                    value={currentInvoice.invoice_no}
                    disabled
                    style={{ ...formStyles.input, backgroundColor: '#f8f9fa' }}
                  />
                </div>
                <div style={formStyles.formGroup}>
                  <label style={formStyles.label}>Customer</label>
                  <input
                    type="text"
                    value={currentInvoice.customer_name}
                    disabled
                    style={{ ...formStyles.input, backgroundColor: '#f8f9fa' }}
                  />
                </div>
              </div>
              <div style={formStyles.grid2Col}>
                <div style={formStyles.formGroup}>
                  <label style={formStyles.label}>Invoice Amount</label>
                  <input
                    type="text"
                    value={`₹${currentInvoice.grand_total.toFixed(2)}`}
                    disabled
                    style={{ ...formStyles.input, backgroundColor: '#f8f9fa' }}
                  />
                </div>
                <div style={formStyles.formGroup}>
                  <label style={formStyles.label}>Due Date</label>
                  <input
                    type="text"
                    value={new Date(currentInvoice.due_date).toLocaleDateString()}
                    disabled
                    style={{ ...formStyles.input, backgroundColor: '#f8f9fa' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Email Details Section */}
          <div style={formStyles.section}>
            <h2 style={{ ...formStyles.sectionHeader, backgroundColor: getSectionHeaderColor('other') }}>
              📧 Email Details
            </h2>
            <div style={formStyles.grid}>
              <div style={formStyles.formGroup}>
                <label style={formStyles.label}>Email Address *</label>
                <input
                  type="email"
                  value={emailForm.email_address}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, email_address: e.target.value }))}
                  style={formStyles.input}
                  placeholder="Enter customer email address"
                  required
                />
              </div>

              <div style={formStyles.formGroup}>
                <label style={formStyles.label}>Subject *</label>
                <input
                  type="text"
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                  style={formStyles.input}
                  required
                />
              </div>

              <div style={formStyles.formGroup}>
                <label style={formStyles.label}>Message *</label>
                <textarea
                  value={emailForm.message}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, message: e.target.value }))}
                  rows={6}
                  style={formStyles.textarea}
                  placeholder="Enter email message"
                  required
                />
              </div>

              <div style={{ 
                padding: '12px', 
                backgroundColor: '#e7f3ff', 
                borderRadius: '6px',
                border: '1px solid #b3d9ff'
              }}>
                <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                  📎 Attachment
                </div>
                <div style={{ fontSize: '12px', color: '#6c757d' }}>
                  Invoice PDF will be automatically attached to this email.
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <Button type="button" variant="secondary" onClick={() => navigate('/invoices')}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              disabled={loading || !emailForm.email_address || !emailForm.subject || !emailForm.message}
            >
              {loading ? 'Sending Email...' : 'Send Email'}
            </Button>
          </div>
        </form>
      </div>
    )
  }

  if (mode === 'print') {
    if (loading) {
      return (
        <div style={{ padding: '20px' }}>
          <div>Loading...</div>
        </div>
      )
    }

    if (!currentInvoice) {
      return (
        <div style={{ padding: '20px' }}>
          <div>Invoice not found</div>
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
            Print Invoice {currentInvoice.invoice_no}
          </h1>
          <Button variant="secondary" onClick={() => navigate('/invoices')}>
            ← Back to Invoices
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

        <div style={{ 
          padding: '24px', 
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          backgroundColor: 'white'
        }}>
          <h2 style={{ marginBottom: '20px', color: '#2c3e50' }}>Invoice Preview</h2>
          
          <div style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>
            <div style={formStyles.grid2Col}>
              <div style={formStyles.formGroup}>
                <label style={formStyles.label}>Invoice Number</label>
                <div style={{ padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px', border: '1px solid #e9ecef' }}>
                  {currentInvoice.invoice_no}
                </div>
              </div>
              <div style={formStyles.formGroup}>
                <label style={formStyles.label}>Customer</label>
                <div style={{ padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px', border: '1px solid #e9ecef' }}>
                  {currentInvoice.customer_name}
                </div>
              </div>
            </div>
            
            <div style={formStyles.grid2Col}>
              <div style={formStyles.formGroup}>
                <label style={formStyles.label}>Amount</label>
                <div style={{ padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px', border: '1px solid #e9ecef' }}>
                  ₹{currentInvoice.grand_total.toFixed(2)}
                </div>
              </div>
              <div style={formStyles.formGroup}>
                <label style={formStyles.label}>Date</label>
                <div style={{ padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px', border: '1px solid #e9ecef' }}>
                  {new Date(currentInvoice.date).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          <div style={{ 
            padding: '12px', 
            backgroundColor: '#e7f3ff', 
            borderRadius: '6px',
            border: '1px solid #b3d9ff',
            marginBottom: '24px'
          }}>
            <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
              📄 PDF Generation
            </div>
            <div style={{ fontSize: '12px', color: '#6c757d' }}>
              The invoice will be generated as a PDF using a standard Indian GST invoice template.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => navigate('/invoices')}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handlePrint}>
              Generate PDF & Print
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Manage Invoices Mode
  if (loading) {
    return (
      <div style={{ padding: '20px' }}>
        <div>Loading...</div>
      </div>
    )
  }

  // Filter invoices
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoice_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter
    return matchesSearch && matchesStatus
  })

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
        <h1 style={{ margin: '0', fontSize: '28px', fontWeight: '600', color: '#2c3e50' }}>Manage Invoices</h1>
        <Button variant="primary" onClick={() => navigate('/invoices/add')}>
          Create Invoice
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

      {/* Search and Filters */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px',
        gap: '16px'
      }}>
        <div style={{ flex: 1 }}>
          <input
            type="text"
            placeholder="Search invoices by number or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 16px',
              border: '1px solid #ced4da',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '10px 16px',
              border: '1px solid #ced4da',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: 'white'
            }}
          >
            <option value="all">All Status</option>
            <option value="Draft">Draft</option>
            <option value="Sent">Sent</option>
            <option value="Partial Payment">Partial Payment</option>
            <option value="Paid">Paid</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>
      </div>

      <div style={{ 
        border: '1px solid #e9ecef', 
        borderRadius: '8px', 
        overflow: 'hidden',
        backgroundColor: 'white'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #e9ecef' }}>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Invoice No</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Customer</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Date</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Due Date</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Amount</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.map(invoice => (
              <tr key={invoice.id} style={{ 
                borderBottom: '1px solid #e9ecef',
                backgroundColor: 'white'
              }}>
                <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>{invoice.invoice_no}</td>
                <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>{invoice.customer_name}</td>
                <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>{new Date(invoice.date).toLocaleDateString()}</td>
                <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>{new Date(invoice.due_date).toLocaleDateString()}</td>
                <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>₹{invoice.grand_total.toFixed(2)}</td>
                <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>
                  <StatusBadge status={invoice.status} />
                </td>
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <Button 
                      variant="secondary" 
                      onClick={() => navigate(`/invoices/edit/${invoice.id}`)}
                      style={{ fontSize: '14px', padding: '6px 12px' }}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="secondary"
                      onClick={() => navigate(`/invoices/print/${invoice.id}`)}
                      style={{ fontSize: '14px', padding: '6px 12px' }}
                    >
                      Print
                    </Button>
                    <Button 
                      variant="secondary"
                      onClick={() => navigate(`/payments/invoice/add/${invoice.id}`)}
                      style={{ fontSize: '14px', padding: '6px 12px' }}
                    >
                      Add Payment
                    </Button>
                    <Button 
                      variant="secondary"
                      onClick={() => navigate(`/invoices/email/${invoice.id}`)}
                      style={{ fontSize: '14px', padding: '6px 12px' }}
                    >
                      Email
                    </Button>
                    <Button 
                      variant="secondary" 
                      onClick={() => handleDelete(invoice.id)}
                      style={{ fontSize: '14px', padding: '6px 12px' }}
                    >
                      Delete
                    </Button>
                    {invoice.status === 'Draft' && (
                      <Button 
                        variant="primary" 
                        onClick={() => handleMarkAsSent(invoice.id)}
                        style={{ fontSize: '14px', padding: '6px 12px' }}
                      >
                        Mark as Sent
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginTop: '24px', 
          padding: '16px',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          backgroundColor: '#f8f9fa'
        }}>
          <div style={{ fontSize: '14px', color: '#495057' }}>
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total_count)} of {pagination.total_count} invoices
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button 
              variant="secondary" 
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={!pagination.has_prev}
            >
              Previous
            </Button>
            <span style={{ 
              padding: '8px 12px', 
              display: 'flex', 
              alignItems: 'center',
              fontSize: '14px',
              color: '#495057',
              fontWeight: '500'
            }}>
              Page {pagination.page} of {pagination.total_pages}
            </span>
            <Button 
              variant="secondary" 
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={!pagination.has_next}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {filteredInvoices.length === 0 && !loading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          color: '#6c757d',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          backgroundColor: '#f8f9fa'
        }}>
          <div style={{ fontSize: '18px', marginBottom: '8px', fontWeight: '500' }}>
            No invoices available
          </div>
          <div style={{ fontSize: '14px' }}>
            Create your first invoice to get started
          </div>
        </div>
      )}
    </div>
  )
}
}

