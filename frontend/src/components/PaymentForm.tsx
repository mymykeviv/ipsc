import { useState, useEffect } from 'react'
import { apiListPurchases, apiListInvoices, apiAddPurchasePayment, apiAddPayment, Purchase, Invoice } from '../lib/api'
import { Button } from './Button'
import { ErrorMessage } from './ErrorMessage'
import { formStyles, getSectionHeaderColor } from '../utils/formStyles'

interface PaymentFormProps {
  onSuccess: () => void
  onCancel: () => void
  type: 'purchase' | 'invoice'
  purchaseId?: number
  invoiceId?: number
}

interface PaymentFormData {
  // Purchase/Invoice Details
  purchase_id?: number
  invoice_id?: number
  purchase_no?: string
  invoice_no?: string
  vendor_name?: string
  customer_name?: string
  total_amount: number
  pending_amount: number
  terms?: string
  due_date?: string
  reference_bill_number: string
  
  // Payment Details
  payment_amount: number
  payment_method: string
  payment_date: string
  payment_notes: string
}

export function PaymentForm({ onSuccess, onCancel, type, purchaseId, invoiceId }: PaymentFormProps) {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  
  const [formData, setFormData] = useState<PaymentFormData>({
    total_amount: 0,
    pending_amount: 0,
    reference_bill_number: '',
    payment_amount: 0,
    payment_method: 'Cash',
    payment_date: new Date().toISOString().split('T')[0],
    payment_notes: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (purchaseId && type === 'purchase') {
      const purchase = purchases.find(p => p.id === purchaseId)
      if (purchase) {
        setSelectedPurchase(purchase)
        updateFormDataFromPurchase(purchase)
      }
    }
    if (invoiceId && type === 'invoice') {
      const invoice = invoices.find(i => i.id === invoiceId)
      if (invoice) {
        setSelectedInvoice(invoice)
        updateFormDataFromInvoice(invoice)
      }
    }
  }, [purchaseId, invoiceId, purchases, invoices, type])

  const loadData = async () => {
    try {
      if (type === 'purchase') {
        const purchasesData = await apiListPurchases()
        setPurchases(purchasesData)
      } else {
        const invoicesData = await apiListInvoices()
        setInvoices(invoicesData)
      }
    } catch (err) {
      console.error('Failed to load data:', err)
      setError('Failed to load data')
    }
  }

  const updateFormDataFromPurchase = (purchase: Purchase) => {
    setFormData(prev => ({
      ...prev,
      purchase_id: purchase.id,
      purchase_no: purchase.purchase_no,
      vendor_name: purchase.vendor_name,
      total_amount: purchase.grand_total,
      pending_amount: purchase.balance_amount, // Use actual balance amount
      terms: purchase.terms,
      due_date: purchase.due_date?.split('T')[0],
      payment_amount: purchase.balance_amount // Set default payment amount to balance
    }))
  }

  const updateFormDataFromInvoice = (invoice: Invoice) => {
    setFormData(prev => ({
      ...prev,
      invoice_id: invoice.id,
      invoice_no: invoice.invoice_no,
      customer_name: invoice.customer_name,
      total_amount: invoice.grand_total,
      pending_amount: invoice.balance_amount, // Use actual balance amount
      terms: 'Due on Receipt', // Default terms since Invoice type doesn't have terms property
      due_date: invoice.due_date?.split('T')[0],
      payment_amount: invoice.balance_amount // Set default payment amount to balance
    }))
  }

  const handlePurchaseSelect = (purchaseId: number) => {
    const purchase = purchases.find(p => p.id === purchaseId)
    if (purchase) {
      setSelectedPurchase(purchase)
      updateFormDataFromPurchase(purchase)
    }
  }

  const handleInvoiceSelect = (invoiceId: number) => {
    const invoice = invoices.find(i => i.id === invoiceId)
    if (invoice) {
      setSelectedInvoice(invoice)
      updateFormDataFromInvoice(invoice)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.payment_amount || formData.payment_amount <= 0) {
      setError('Please enter a valid payment amount')
      return
    }

    if (formData.payment_amount > (formData.pending_amount || 0)) {
      setError('Payment amount cannot exceed pending amount')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      if (type === 'purchase' && formData.purchase_id) {
        // Submit purchase payment
        await apiAddPurchasePayment(formData.purchase_id, {
          amount: formData.payment_amount,
          method: formData.payment_method,
          account_head: 'Purchase Payments',
          reference_number: formData.reference_bill_number || undefined,
          notes: formData.payment_notes || undefined
        })
      } else if (type === 'invoice' && formData.invoice_id) {
        // Submit invoice payment
        await apiAddPayment(formData.invoice_id, {
          payment_date: formData.payment_date,
          payment_amount: formData.payment_amount,
          payment_method: formData.payment_method,
          account_head: 'Invoice Payments',
          reference_number: formData.reference_bill_number || undefined,
          notes: formData.payment_notes || undefined
        })
      } else {
        throw new Error('Invalid payment type or missing ID')
      }
      
      onSuccess()
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add payment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <ErrorMessage message={error} />

      {/* Row 1: Purchase/Invoice Details | Payment Details */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        
        {/* Purchase/Invoice Details Section */}
        <div>
          <h3 style={{ marginBottom: '4px', color: '#333', borderBottom: '2px solid #007bff', paddingBottom: '2px', fontSize: '1.5rem' }}>
            {type === 'purchase' ? '📦 Purchase Details' : '📄 Invoice Details'}
          </h3>
          
          {/* Purchase/Invoice Selection (if not pre-selected) */}
          {!purchaseId && !invoiceId && (
            <div style={{ marginBottom: '16px' }}>
              <label style={formStyles.label}>
                {type === 'purchase' ? 'Select Purchase' : 'Select Invoice'} *
              </label>
              <select
                value={type === 'purchase' ? (selectedPurchase?.id || '') : (selectedInvoice?.id || '')}
                onChange={(e) => {
                  const id = parseInt(e.target.value)
                  if (type === 'purchase') {
                    handlePurchaseSelect(id)
                  } else {
                    handleInvoiceSelect(id)
                  }
                }}
                required
                style={formStyles.select}
              >
                <option value="">
                  {type === 'purchase' ? 'Select Purchase Number...' : 'Select Invoice Number...'}
                </option>
                {type === 'purchase' 
                  ? purchases.map(purchase => (
                      <option key={purchase.id} value={purchase.id}>
                        {purchase.purchase_no} - {purchase.vendor_name}
                      </option>
                    ))
                  : invoices.map(invoice => (
                      <option key={invoice.id} value={invoice.id}>
                        {invoice.invoice_no} - {invoice.customer_name}
                      </option>
                    ))
                }
              </select>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* Row 1: Purchase/Invoice Number | Vendor/Customer */}
            <div style={formStyles.formGroup}>
              <label style={formStyles.label}>
                {type === 'purchase' ? 'Purchase Number' : 'Invoice Number'}
              </label>
              <input
                type="text"
                value={type === 'purchase' ? formData.purchase_no : formData.invoice_no}
                readOnly
                style={{ ...formStyles.input, backgroundColor: '#f9f9f9' }}
              />
            </div>
            <div style={formStyles.formGroup}>
              <label style={formStyles.label}>
                {type === 'purchase' ? 'Vendor/Supplier' : 'Customer'}
              </label>
              <input
                type="text"
                value={type === 'purchase' ? formData.vendor_name : formData.customer_name}
                readOnly
                style={{ ...formStyles.input, backgroundColor: '#f9f9f9' }}
              />
            </div>
            
            {/* Row 2: Amount | Pending Amount */}
            <div style={formStyles.formGroup}>
              <label style={formStyles.label}>Amount (Total)</label>
              <input
                type="text"
                value={`₹${(formData.total_amount || 0).toFixed(2)}`}
                readOnly
                style={{ ...formStyles.input, backgroundColor: '#f9f9f9' }}
              />
            </div>
            <div style={formStyles.formGroup}>
              <label style={formStyles.label}>Pending Amount</label>
              <input
                type="text"
                value={`₹${(formData.pending_amount || 0).toFixed(2)}`}
                readOnly
                style={{ ...formStyles.input, backgroundColor: '#f9f9f9' }}
              />
            </div>
            
            {/* Row 3: Terms (optional) | Due Date (optional) */}
            <div style={formStyles.formGroup}>
              <label style={formStyles.label}>Terms (optional)</label>
              <input
                type="text"
                value={formData.terms || ''}
                readOnly
                style={{ ...formStyles.input, backgroundColor: '#f9f9f9' }}
              />
            </div>
            <div style={formStyles.formGroup}>
              <label style={formStyles.label}>Due Date (optional)</label>
              <input
                type="text"
                value={formData.due_date || ''}
                readOnly
                style={{ ...formStyles.input, backgroundColor: '#f9f9f9' }}
              />
            </div>
            
            {/* Row 4: Reference Bill Number (optional) */}
            <div style={{ ...formStyles.formGroup, gridColumn: 'span 2' }}>
              <label style={formStyles.label}>Reference Bill Number (optional)</label>
              <input
                type="text"
                value={formData.reference_bill_number}
                onChange={(e) => setFormData(prev => ({ ...prev, reference_bill_number: e.target.value }))}
                placeholder="Enter reference bill number"
                style={formStyles.input}
              />
            </div>
          </div>
        </div>

        {/* Payment Details Section */}
        <div>
          <h3 style={{ marginBottom: '4px', color: '#333', borderBottom: '2px solid #28a745', paddingBottom: '2px', fontSize: '1.5rem' }}>
            💰 Payment Details
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* Row 1: Payment Amount | Payment Method * */}
            <div style={formStyles.formGroup}>
              <label style={formStyles.label}>Payment Amount</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max={formData.pending_amount || 0}
                value={formData.payment_amount}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_amount: Number(e.target.value) }))}
                required
                style={formStyles.input}
              />
            </div>
            <div style={formStyles.formGroup}>
              <label style={formStyles.label}>Payment Method *</label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value }))}
                required
                style={formStyles.select}
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="UPI">UPI</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
              </select>
            </div>
            
            {/* Row 2: Payment Date * */}
            <div style={formStyles.formGroup}>
              <label style={formStyles.label}>Payment Date *</label>
              <input
                type="date"
                value={formData.payment_date}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_date: e.target.value }))}
                required
                style={formStyles.input}
              />
            </div>
            
            {/* Row 3: Payment Notes (optional) */}
            <div style={{ ...formStyles.formGroup, gridColumn: 'span 2' }}>
              <label style={formStyles.label}>Payment Notes (optional)</label>
              <textarea
                value={formData.payment_notes}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_notes: e.target.value }))}
                maxLength={200}
                rows={3}
                placeholder="Enter payment notes (max 200 characters)"
                style={formStyles.textarea}
              />
              <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                {formData.payment_notes.length}/200 characters
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          variant="primary" 
          disabled={loading || formData.payment_amount <= 0 || formData.payment_amount > (formData.pending_amount || 0)}
        >
          {loading ? 'Adding Payment...' : 'Add Payment'}
        </Button>
      </div>
    </form>
  )
}
