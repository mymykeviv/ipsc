import { useEffect, useState } from 'react'
import { apiListParties, apiGetProducts, apiCreateInvoice, apiUpdateInvoice, apiGetInvoice, apiDeleteInvoice, apiEmailInvoice, apiAddPayment, apiGetInvoicePayments, apiDeletePayment, apiGetInvoices, Party, Product, Payment, PaginationInfo } from '../lib/api'
import { useAuth } from '../modules/AuthContext'
import { createApiErrorHandler } from '../lib/apiUtils'
import { Button } from '../components/Button'
import { ComprehensiveInvoiceForm } from '../components/ComprehensiveInvoiceForm'

interface Invoice {
  id: number
  invoice_no: string
  customer_name: string
  date: string
  due_date: string
  grand_total: number
  status: string
}

export function Invoices() {
  const { token, forceLogout } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  
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
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [emailAddress, setEmailAddress] = useState('')

  useEffect(() => {
    loadData()
  }, [pagination.page])

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await apiGetInvoices(pagination.page, pagination.limit)
      setInvoices(data.invoices)
      setPagination(data.pagination)
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
      loadData()
    } catch (err: any) {
      const errorMessage = handleApiError(err)
      setError(errorMessage)
    }
  }

  const handleEmail = async (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setShowEmailModal(true)
  }

  const handlePayment = async (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setShowPaymentModal(true)
  }

  const handleEdit = async (invoice: Invoice) => {
    setEditingInvoice(invoice)
    setShowEditModal(true)
  }

  const resetForm = () => {
    setEditingInvoice(null)
    setError('')
  }

  if (loading && invoices.length === 0) {
    return (
      <div style={{ padding: '20px' }}>
        <div>Loading...</div>
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
        <h1 style={{ margin: '0', fontSize: '28px', fontWeight: '600', color: '#2c3e50' }}>Invoices</h1>
        <Button variant="primary" onClick={() => setShowModal(true)}>
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
            {invoices.map(invoice => (
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
                  <span style={{ 
                    padding: '6px 12px', 
                    borderRadius: '6px', 
                    fontSize: '14px',
                    fontWeight: '500',
                    backgroundColor: invoice.status === 'paid' ? '#d4edda' : '#fff3cd',
                    color: invoice.status === 'paid' ? '#155724' : '#856404'
                  }}>
                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button 
                      variant="secondary" 
                      onClick={() => handleEdit(invoice)}
                      style={{ fontSize: '14px', padding: '6px 12px' }}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="secondary"
                      onClick={() => handlePayment(invoice)}
                      style={{ fontSize: '14px', padding: '6px 12px' }}
                    >
                      Payment
                    </Button>
                    <Button 
                      variant="secondary"
                      onClick={() => handleEmail(invoice)}
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
              onClick={() => setPagination({...pagination, page: pagination.page - 1})}
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
              onClick={() => setPagination({...pagination, page: pagination.page + 1})}
              disabled={!pagination.has_next}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {invoices.length === 0 && !loading && (
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

      {/* Create Invoice Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{ width: '80%', height: '80%', maxWidth: '1400px', maxHeight: '80vh', overflow: 'auto' }}>
            <ComprehensiveInvoiceForm onClose={() => setShowModal(false)} />
          </div>
        </div>
      )}

      {/* Edit Invoice Modal */}
      {showEditModal && editingInvoice && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{ width: '80%', height: '80%', maxWidth: '1400px', maxHeight: '80vh', overflow: 'auto' }}>
            <ComprehensiveInvoiceForm 
              invoiceId={editingInvoice.id}
              onClose={() => setShowEditModal(false)} 
            />
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{ 
            width: '80%', 
            height: '80%', 
            maxWidth: '1400px', 
            maxHeight: '80vh', 
            overflow: 'auto',
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px'
          }}>
            <h2>Add Payment for Invoice {selectedInvoice.invoice_no}</h2>
            {/* Payment form would go here */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>
                Cancel
              </Button>
              <Button variant="primary">
                Add Payment
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && selectedInvoice && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{ 
            width: '80%', 
            height: '80%', 
            maxWidth: '1400px', 
            maxHeight: '80vh', 
            overflow: 'auto',
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px'
          }}>
            <h2>Email Invoice {selectedInvoice.invoice_no}</h2>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Email Address:</label>
              <input
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
                placeholder="Enter email address"
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setShowEmailModal(false)}>
                Cancel
              </Button>
              <Button variant="primary">
                Send Email
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

