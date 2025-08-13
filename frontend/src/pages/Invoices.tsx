import { useEffect, useState } from 'react'
import { useParams, useLocation } from 'react-router-dom'
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

interface InvoicePaymentForm {
  payment_amount: number
  payment_date: string
  payment_method: string
  payment_notes: string
}

export function Invoices() {
  const { token, forceLogout } = useAuth()
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const mode = searchParams.get('mode') || 'manage'
  
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
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [emailAddress, setEmailAddress] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailMessage, setEmailMessage] = useState('')
  const [paymentForm, setPaymentForm] = useState<InvoicePaymentForm>({
    payment_amount: 0,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'Cash',
    payment_notes: ''
  })

  useEffect(() => {
    if (mode === 'manage') {
      loadData()
    }
  }, [pagination.page, mode])

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
    setEmailSubject(`Invoice ${invoice.invoice_no}`)
    setEmailMessage(`Please find attached invoice ${invoice.invoice_no} for ₹${invoice.grand_total.toFixed(2)}.`)
    setShowEmailModal(true)
  }

  const handlePayment = async (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setPaymentForm({
      payment_amount: invoice.grand_total,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'Cash',
      payment_notes: ''
    })
    setShowPaymentModal(true)
  }

  const handlePrint = async (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setShowPrintModal(true)
  }

  const handleEdit = async (invoice: Invoice) => {
    setEditingInvoice(invoice)
    setShowEditModal(true)
  }

  const handleSendEmail = async () => {
    if (!selectedInvoice || !emailAddress) return
    
    try {
      await apiEmailInvoice(selectedInvoice.id, {
        email: emailAddress,
        subject: emailSubject,
        message: emailMessage
      })
      setShowEmailModal(false)
      setError('')
      alert('Email sent successfully!')
    } catch (err: any) {
      const errorMessage = handleApiError(err)
      setError(errorMessage)
    }
  }

  const handleAddPayment = async () => {
    if (!selectedInvoice || paymentForm.payment_amount <= 0) return
    
    try {
      await apiAddPayment(selectedInvoice.id, {
        amount: paymentForm.payment_amount,
        payment_date: paymentForm.payment_date,
        payment_method: paymentForm.payment_method,
        reference_number: `PAY-${Date.now()}`,
        notes: paymentForm.payment_notes
      })
      setShowPaymentModal(false)
      setError('')
      alert('Payment added successfully!')
      loadData()
    } catch (err: any) {
      const errorMessage = handleApiError(err)
      setError(errorMessage)
    }
  }

  const resetForm = () => {
    setEditingInvoice(null)
    setError('')
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
          <Button variant="secondary" onClick={() => window.history.back()}>
            ← Back to Invoices
          </Button>
        </div>
        
        <ComprehensiveInvoiceForm 
          mode={mode}
          invoiceId={mode === 'edit' && id ? parseInt(id) : undefined}
          onSuccess={() => window.history.back()}
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
          <Button variant="secondary" onClick={() => window.history.back()}>
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
        <h1 style={{ margin: '0', fontSize: '28px', fontWeight: '600', color: '#2c3e50' }}>Manage Invoices</h1>
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
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <Button 
                      variant="secondary" 
                      onClick={() => handleEdit(invoice)}
                      style={{ fontSize: '14px', padding: '6px 12px' }}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="secondary"
                      onClick={() => handlePrint(invoice)}
                      style={{ fontSize: '14px', padding: '6px 12px' }}
                    >
                      Print
                    </Button>
                    <Button 
                      variant="secondary"
                      onClick={() => handlePayment(invoice)}
                      style={{ fontSize: '14px', padding: '6px 12px' }}
                    >
                      Add Payment
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
              mode="edit"
              invoiceId={editingInvoice.id}
              onClose={() => setShowEditModal(false)} 
            />
          </div>
        </div>
      )}

      {/* Print Invoice Modal */}
      {showPrintModal && selectedInvoice && (
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
            <h2>Print Invoice {selectedInvoice.invoice_no}</h2>
            <div style={{ marginBottom: '20px' }}>
              <p><strong>Customer:</strong> {selectedInvoice.customer_name}</p>
              <p><strong>Amount:</strong> ₹{selectedInvoice.grand_total.toFixed(2)}</p>
              <p><strong>Date:</strong> {new Date(selectedInvoice.date).toLocaleDateString()}</p>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <Button variant="secondary" onClick={() => setShowPrintModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => {
                // TODO: Implement actual PDF generation and printing
                alert('PDF generation and printing functionality will be implemented here.')
                setShowPrintModal(false)
              }}>
                Generate PDF & Print
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
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
            
            <div style={{ marginBottom: '20px' }}>
              <p><strong>Invoice Amount:</strong> ₹{selectedInvoice.grand_total.toFixed(2)}</p>
              <p><strong>Customer:</strong> {selectedInvoice.customer_name}</p>
            </div>

            <div style={{ display: 'grid', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                  Payment Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={selectedInvoice.grand_total}
                  value={paymentForm.payment_amount}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_amount: Number(e.target.value) }))}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    border: '1px solid #ced4da',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                  Payment Date *
                </label>
                <input
                  type="date"
                  value={paymentForm.payment_date}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_date: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    border: '1px solid #ced4da',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                  Payment Method *
                </label>
                <select
                  value={paymentForm.payment_method}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_method: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    border: '1px solid #ced4da',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                  <option value="UPI">UPI</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                  Payment Notes (Optional)
                </label>
                <textarea
                  value={paymentForm.payment_notes}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_notes: e.target.value }))}
                  maxLength={200}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    border: '1px solid #ced4da',
                    borderRadius: '6px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                  placeholder="Enter payment notes (max 200 characters)"
                />
                <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                  {paymentForm.payment_notes.length}/200 characters
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={handleAddPayment}
                disabled={paymentForm.payment_amount <= 0 || paymentForm.payment_amount > selectedInvoice.grand_total}
              >
                Add Payment
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Email Invoice Modal */}
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
            <h2>Send Invoice {selectedInvoice.invoice_no} via Email</h2>
            
            <div style={{ marginBottom: '20px' }}>
              <p><strong>Invoice Amount:</strong> ₹{selectedInvoice.grand_total.toFixed(2)}</p>
              <p><strong>Customer:</strong> {selectedInvoice.customer_name}</p>
            </div>

            <div style={{ display: 'grid', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    border: '1px solid #ced4da',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  placeholder="Enter customer email address"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                  Subject *
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    border: '1px solid #ced4da',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                  Message *
                </label>
                <textarea
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  rows={6}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    border: '1px solid #ced4da',
                    borderRadius: '6px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                  placeholder="Enter email message"
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

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <Button variant="secondary" onClick={() => setShowEmailModal(false)}>
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={handleSendEmail}
                disabled={!emailAddress || !emailSubject || !emailMessage}
              >
                Send Email
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

