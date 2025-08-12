import { useEffect, useState } from 'react'
import { apiListParties, apiGetProducts, apiCreateInvoice, apiUpdateInvoice, apiGetInvoice, apiDeleteInvoice, apiEmailInvoice, apiAddPayment, apiGetInvoicePayments, apiDeletePayment, apiGetInvoices, Party, Product, Payment, PaginationInfo } from '../lib/api'
import { useAuth } from '../modules/AuthContext'
import { createApiErrorHandler } from '../lib/apiUtils'
import { Card } from '../components/Card'
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
    return <div>Loading...</div>
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Invoices</h1>
        <Button onClick={() => setShowModal(true)} variant="primary">
          Create Invoice
        </Button>
      </div>

      {error && (
        <div style={{ 
          padding: '12px', 
          backgroundColor: '#fecaca', 
          color: '#dc2626', 
          borderRadius: 'var(--radius)', 
          marginBottom: '16px' 
        }}>
          {error}
        </div>
      )}

      {/* Invoices List */}
      <Card>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9f9f9' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Invoice No</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Customer</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Date</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Due Date</th>
                <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid var(--border)' }}>Amount</th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(invoice => (
                <tr key={invoice.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px' }}>{invoice.invoice_no}</td>
                  <td style={{ padding: '12px' }}>{invoice.customer_name}</td>
                  <td style={{ padding: '12px' }}>{new Date(invoice.date).toLocaleDateString()}</td>
                  <td style={{ padding: '12px' }}>{new Date(invoice.due_date).toLocaleDateString()}</td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>₹{invoice.grand_total.toFixed(2)}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: 'var(--radius)',
                      fontSize: '12px',
                      fontWeight: '500',
                      backgroundColor: invoice.status === 'Paid' ? '#dcfce7' : invoice.status === 'Overdue' ? '#fef2f2' : '#fef3c7',
                      color: invoice.status === 'Paid' ? '#166534' : invoice.status === 'Overdue' ? '#dc2626' : '#d97706'
                    }}>
                      {invoice.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <Button 
                        onClick={() => handleEdit(invoice)} 
                        variant="secondary"
                      >
                        Edit
                      </Button>
                      <Button 
                        onClick={() => handlePayment(invoice)} 
                        variant="secondary"
                      >
                        Payment
                      </Button>
                      <Button 
                        onClick={() => handleEmail(invoice)} 
                        variant="secondary"
                      >
                        Email
                      </Button>
                      <Button 
                        onClick={() => handleDelete(invoice.id)} 
                        variant="secondary"
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
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
            <Button 
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={!pagination.has_prev}
              variant="secondary"
            >
              Previous
            </Button>
            <span style={{ padding: '8px 12px' }}>
              Page {pagination.page} of {pagination.total_pages}
            </span>
            <Button 
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={!pagination.has_next}
              variant="secondary"
            >
              Next
            </Button>
          </div>
        )}
      </Card>

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
          <div style={{
            backgroundColor: 'white',
            borderRadius: 'var(--radius)',
            padding: '24px',
            width: '90%',
            maxWidth: '1400px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>Create New Invoice</h2>
              <Button onClick={() => setShowModal(false)} variant="secondary">×</Button>
            </div>

            <ComprehensiveInvoiceForm 
              onSuccess={() => {
                setShowModal(false)
                loadData()
              }}
              onCancel={() => setShowModal(false)}
            />
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
          <div style={{
            backgroundColor: 'white',
            borderRadius: 'var(--radius)',
            padding: '24px',
            width: '90%',
            maxWidth: '1400px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>Edit Invoice: {editingInvoice.invoice_no}</h2>
              <Button onClick={() => {
                setShowEditModal(false)
                resetForm()
              }} variant="secondary">×</Button>
            </div>

            <ComprehensiveInvoiceForm 
              onSuccess={() => {
                setShowEditModal(false)
                resetForm()
                loadData()
              }}
              onCancel={() => {
                setShowEditModal(false)
                resetForm()
              }}
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
            backgroundColor: 'white',
            borderRadius: 'var(--radius)',
            padding: '24px',
            width: '400px',
            maxWidth: '90vw'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>Add Payment</h3>
              <Button onClick={() => setShowPaymentModal(false)} variant="secondary">×</Button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label>Invoice: {selectedInvoice.invoice_no}</label>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label>Payment Amount *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Enter payment amount"
                style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label>Payment Method *</label>
              <select style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                <option value="">Select method...</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="UPI">UPI</option>
                <option value="Credit Card">Credit Card</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label>Reference Number</label>
              <input
                type="text"
                placeholder="Optional reference number"
                style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Button type="button" onClick={() => setShowPaymentModal(false)} variant="secondary">
                Cancel
              </Button>
              <Button type="button" variant="primary">
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
            backgroundColor: 'white',
            borderRadius: 'var(--radius)',
            padding: '24px',
            width: '400px',
            maxWidth: '90vw'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>Send Invoice via Email</h3>
              <Button onClick={() => setShowEmailModal(false)} variant="secondary">×</Button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label>Invoice: {selectedInvoice.invoice_no}</label>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label>Email Address *</label>
              <input
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                required
                placeholder="Enter recipient email address"
                style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Button type="button" onClick={() => setShowEmailModal(false)} variant="secondary">
                Cancel
              </Button>
              <Button 
                type="button" 
                variant="primary" 
                disabled={!emailAddress || loading}
                onClick={async () => {
                  try {
                    setLoading(true)
                    await apiEmailInvoice(selectedInvoice.id, emailAddress)
                    setShowEmailModal(false)
                    setError('')
                  } catch (err: any) {
                    setError(err.message || 'Failed to send email')
                  } finally {
                    setLoading(false)
                  }
                }}
              >
                {loading ? 'Sending...' : 'Send Email'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

