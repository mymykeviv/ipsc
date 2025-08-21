import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiListParties, apiGetProducts, apiCreateInvoice, apiUpdateInvoice, apiGetInvoice, apiDeleteInvoice, apiEmailInvoice, apiAddPayment, apiGetInvoicePayments, apiDeletePayment, apiGetInvoices, apiUpdateInvoiceStatus, apiGetInvoicePDF, Party, Product, Payment, PaginationInfo, Invoice } from '../lib/api'
import { useAuth } from '../modules/AuthContext'
import { createApiErrorHandler, createInvoiceErrorHandler, createInvoiceGridErrorHandler } from '../lib/apiUtils'
import { Button } from '../components/Button'
import { StatusBadge } from '../components/StatusBadge'
import { ComprehensiveInvoiceForm } from '../components/ComprehensiveInvoiceForm'
import { PDFViewer } from '../components/PDFViewer'
import { EmailFormModal } from '../components/EmailFormModal'
import { DateFilter, DateRange } from '../components/DateFilter'
import { FilterDropdown } from '../components/FilterDropdown'
import { EnhancedFilterBar } from '../components/EnhancedFilterBar'
import { ActionButtons, ActionButtonSets } from '../components/ActionButtons'
import { EnhancedHeader, HeaderPatterns } from '../components/EnhancedHeader'
import { formStyles, getSectionHeaderColor } from '../utils/formStyles'

interface InvoicesProps {
  mode?: 'manage' | 'add' | 'edit' | 'payments' | 'edit-payment'
}

export function Invoices({ mode = 'manage' }: InvoicesProps) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { token, forceLogout } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null)
  
  // Modal states
  const [pdfModalOpen, setPdfModalOpen] = useState(false)
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  
  // Create enhanced error handlers for different operations
  const handleInvoiceError = createInvoiceErrorHandler(forceLogout)
  const handleGridError = createInvoiceGridErrorHandler(forceLogout)
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
  const [customerFilter, setCustomerFilter] = useState<string>('all')
  const [amountRangeFilter, setAmountRangeFilter] = useState<string>('all')
  const [gstTypeFilter, setGstTypeFilter] = useState<string>('all')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<DateRange>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10)
  })
  const [isDateFilterActive, setIsDateFilterActive] = useState(true)

  useEffect(() => {
    if (mode === 'manage') {
      loadInvoices()
    } else if (mode === 'edit' && id) {
      loadInvoice(parseInt(id))
    } else if (mode === 'payments' && id) {
      loadInvoice(parseInt(id))
    } else if (mode === 'add') {
      setLoading(false)
    }
  }, [mode, id])

  // Reload invoices when filters change
  useEffect(() => {
    if (mode === 'manage') {
      loadInvoices()
    }
  }, [searchTerm, statusFilter, customerFilter, amountRangeFilter, gstTypeFilter, paymentStatusFilter, dateFilter, isDateFilterActive])

  const loadInvoices = async () => {
    try {
      setLoading(true)
      
      // Build query parameters
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (customerFilter !== 'all') params.append('customer_id', customerFilter)
      if (amountRangeFilter !== 'all') {
        const [min, max] = amountRangeFilter.split('-')
        if (min) params.append('amount_min', min)
        if (max) params.append('amount_max', max)
      }
      if (gstTypeFilter !== 'all') params.append('gst_type', gstTypeFilter)
      if (paymentStatusFilter !== 'all') params.append('payment_status', paymentStatusFilter)
      // Only apply date filter when it's active
      if (isDateFilterActive) {
        params.append('date_from', dateFilter.startDate)
        params.append('date_to', dateFilter.endDate)
      }
      
      params.append('page', pagination.page.toString())
      params.append('limit', pagination.limit.toString())
      
      const url = `/api/invoices?${params.toString()}`
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (!response.ok) throw new Error('Failed to load invoices')
      
      const data = await response.json()
      setInvoices(data.invoices)
      setPagination(data.pagination)
    } catch (err: any) {
      const errorMessage = handleGridError(err)
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

  const handleMarkAsSent = async (id: number) => {
    try {
      await apiUpdateInvoiceStatus(id, 'Sent')
      loadInvoices()
    } catch (err: any) {
      const errorMessage = handleApiError(err)
      setError(errorMessage)
    }
  }

  const handlePrint = async (id: number) => {
    try {
      const data = await apiGetInvoices(undefined, undefined, 1, 1000)
      const invoice = data.invoices.find(inv => inv.id === id)
      if (invoice) {
        setSelectedInvoice(invoice)
        setPdfModalOpen(true)
      }
    } catch (err: any) {
      const errorMessage = handleApiError(err)
      setError(errorMessage)
    }
  }

  const handleEmail = async (id: number) => {
    try {
      const data = await apiGetInvoices(undefined, undefined, 1, 1000)
      const invoice = data.invoices.find(inv => inv.id === id)
      if (invoice) {
      setSelectedInvoice(invoice)
        setEmailModalOpen(true)
      }
    } catch (err: any) {
      const errorMessage = handleApiError(err)
      setError(errorMessage)
    }
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await apiDeleteInvoice(id)
        loadInvoices()
    } catch (err: any) {
        const errorMessage = handleApiError(err)
        setError(errorMessage)
      }
    }
  }

  // Filter invoices based on search term and status
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = searchTerm === '' || 
      invoice.invoice_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Add Invoice Mode
  if (mode === 'add') {
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
            Create New Invoice
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

  // Edit Invoice Mode
  if (mode === 'edit' && currentInvoice) {
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
            Edit Invoice {currentInvoice.invoice_no}
          </h1>
          <Button variant="secondary" onClick={() => navigate('/invoices')}>
            ← Back to Invoices
          </Button>
        </div>

        <ComprehensiveInvoiceForm
          onSuccess={() => navigate('/invoices')}
          onCancel={() => navigate('/invoices')}
          initialData={currentInvoice}
        />
      </div>
    )
  }

  // Manage Invoices Mode (Default)
  if (loading) {
    return (
      <div style={{ padding: '20px' }}>
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px' }}>
      <EnhancedHeader
        {...HeaderPatterns.invoices(invoices.length)}
        primaryAction={{
          label: 'Add Invoice',
          onClick: () => navigate('/invoices/add'),
          icon: '📄'
        }}
      />

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
        title="Invoice Filters"
        activeFiltersCount={
          (searchTerm ? 1 : 0) +
          (statusFilter !== 'all' ? 1 : 0) +
          (customerFilter !== 'all' ? 1 : 0) +
          (amountRangeFilter !== 'all' ? 1 : 0) +
          (gstTypeFilter !== 'all' ? 1 : 0) +
          (paymentStatusFilter !== 'all' ? 1 : 0) +
          (isDateFilterActive ? 1 : 0)
        }
        onClearAll={() => {
          setSearchTerm('')
          setStatusFilter('all')
          setCustomerFilter('all')
          setAmountRangeFilter('all')
          setGstTypeFilter('all')
          setPaymentStatusFilter('all')
          setIsDateFilterActive(false)
          setDateFilter({
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
            endDate: new Date().toISOString().slice(0, 10)
          })
        }}
        showQuickActions={true}
        quickActions={[
          {
            label: 'Pending Payment',
            action: () => {
              setPaymentStatusFilter('unpaid')
            },
            icon: '💰'
          },
          {
            label: 'Last 10',
            action: () => {
              // This would need to be implemented in the backend
              setDateFilter({
                startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
                endDate: new Date().toISOString().slice(0, 10)
              })
            },
            icon: '📋'
          }
        ]}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '12px', fontWeight: '500', color: '#495057' }}>Search</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search invoices..."
            style={{
              padding: '8px 12px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '13px',
              minWidth: '160px'
            }}
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '12px', fontWeight: '500', color: '#495057' }}>Status</span>
          <FilterDropdown
            value={statusFilter}
            onChange={(value) => setStatusFilter(Array.isArray(value) ? value[0] || 'all' : value)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'Draft', label: 'Draft' },
              { value: 'Sent', label: 'Sent' },
              { value: 'Partial Payment', label: 'Partial Payment' },
              { value: 'Paid', label: 'Paid' },
              { value: 'Overdue', label: 'Overdue' }
            ]}
            placeholder="Select status"
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '12px', fontWeight: '500', color: '#495057' }}>Payment Status</span>
          <FilterDropdown
            value={paymentStatusFilter}
            onChange={(value) => setPaymentStatusFilter(Array.isArray(value) ? value[0] || 'all' : value)}
            options={[
              { value: 'all', label: 'All Payment Status' },
              { value: 'paid', label: 'Paid' },
              { value: 'partially_paid', label: 'Partially Paid' },
              { value: 'unpaid', label: 'Unpaid' },
              { value: 'overdue', label: 'Overdue' }
            ]}
            placeholder="Select payment status"
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '12px', fontWeight: '500', color: '#495057' }}>Amount Range</span>
          <FilterDropdown
            value={amountRangeFilter}
            onChange={(value) => setAmountRangeFilter(Array.isArray(value) ? value[0] || 'all' : value)}
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
          <span style={{ fontSize: '12px', fontWeight: '500', color: '#495057' }}>GST Type</span>
          <FilterDropdown
            value={gstTypeFilter}
            onChange={(value) => setGstTypeFilter(Array.isArray(value) ? value[0] || 'all' : value)}
            options={[
              { value: 'all', label: 'All GST Types' },
              { value: 'cgst_sgst', label: 'CGST + SGST' },
              { value: 'igst', label: 'IGST' }
            ]}
            placeholder="Select GST type"
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '12px', fontWeight: '500', color: '#495057' }}>Date</span>
          <DateFilter
            value={dateFilter}
            onChange={(newDateFilter) => {
              setDateFilter(newDateFilter)
              setIsDateFilterActive(true)
            }}
          />
        </div>
      </EnhancedFilterBar>

        {/* Invoices Table */}
      <div style={{ 
        border: '1px solid #e9ecef', 
        borderRadius: '8px', 
        overflow: 'visible',
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
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Payment Status</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Days Overdue</th>
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
                <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>
                  {new Date(invoice.date).toLocaleDateString()}
                    </td>
                <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>
                  {new Date(invoice.due_date).toLocaleDateString()}
                </td>
                <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>
                  ₹{invoice.grand_total.toFixed(2)}
                </td>
                <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '500',
                    backgroundColor: invoice.balance_amount === 0 ? '#d4edda' : 
                                   invoice.paid_amount > 0 ? '#fff3cd' : '#f8d7da',
                    color: invoice.balance_amount === 0 ? '#155724' : 
                          invoice.paid_amount > 0 ? '#856404' : '#721c24'
                  }}>
                    {invoice.balance_amount === 0 ? 'Paid' : 
                     invoice.paid_amount > 0 ? 'Partial' : 'Unpaid'}
                  </span>
                </td>
                <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>
                  {(() => {
                    const dueDate = new Date(invoice.due_date)
                    const today = new Date()
                    const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                    if (daysDiff < 0) {
                      return (
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: '#f8d7da',
                          color: '#721c24'
                        }}>
                          {Math.abs(daysDiff)} days overdue
                        </span>
                      )
                    } else if (daysDiff <= 7) {
                      return (
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: '#fff3cd',
                          color: '#856404'
                        }}>
                          Due in {daysDiff} days
                        </span>
                      )
                    } else {
                      return (
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: '#d4edda',
                          color: '#155724'
                        }}>
                          {daysDiff} days
                        </span>
                      )
                    }
                  })()}
                </td>
                <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>
                  {(() => {
                    // Determine invoice state based on status and payment
                    let invoiceState = invoice.status
                    
                    // If status is payment-related, determine actual invoice state
                    if (invoice.status === 'Partially Paid' || invoice.status === 'Paid') {
                      if (invoice.balance_amount === 0) {
                        invoiceState = 'Complete' // Fully paid
                      } else if (invoice.paid_amount > 0) {
                        invoiceState = 'Sent' // Partially paid but invoice was sent
                      } else {
                        invoiceState = 'Draft' // No payments made
                      }
                    } else if (invoice.status === 'Overdue') {
                      invoiceState = 'Sent' // Overdue invoices were sent
                    }
                    
                    return <StatusBadge status={invoiceState} />
                  })()}
                </td>
                <td style={{ padding: '12px' }}>
                  <ActionButtons
                    {...ActionButtonSets.invoices(invoice, {
                      onEdit: () => navigate(`/invoices/edit/${invoice.id}`),
                      onPrint: () => handlePrint(invoice.id),
                      onEmail: () => handleEmail(invoice.id),
                      onPayment: () => navigate(`/payments/invoice/add/${invoice.id}`),
                      onMarkSent: () => handleMarkAsSent(invoice.id),
                      onDelete: () => handleDelete(invoice.id)
                    })}
                    maxVisible={1}
                  />
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

      {/* Modal Components */}
      {selectedInvoice && (
        <>
          <PDFViewer
            isOpen={pdfModalOpen}
            onClose={() => setPdfModalOpen(false)}
            type="invoice"
            title={`Invoice ${selectedInvoice.invoice_no}`}
            invoiceId={selectedInvoice.id}
            invoiceNo={selectedInvoice.invoice_no}
          />
          
          <EmailFormModal
            isOpen={emailModalOpen}
            onClose={() => setEmailModalOpen(false)}
            invoiceId={selectedInvoice.id}
            invoiceNo={selectedInvoice.invoice_no}
            customerName={selectedInvoice.customer_name}
            grandTotal={selectedInvoice.grand_total}
            dueDate={selectedInvoice.due_date}
          />
        </>
      )}
             </div>
  )
}

export default Invoices

