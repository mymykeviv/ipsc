import { useState, useEffect } from 'react'
import { apiCreateExpense, apiGetExpense, apiUpdateExpense, apiListParties, ExpenseCreate, Party } from '../lib/api'
import { Button } from './Button'
import { ErrorMessage } from './ErrorMessage'
import { formStyles, getSectionHeaderColor } from '../utils/formStyles'

interface ExpenseFormProps {
  expenseId?: number
  onSuccess: () => void
  onCancel: () => void
}

export function ExpenseForm({ expenseId, onSuccess, onCancel }: ExpenseFormProps) {
  const [vendors, setVendors] = useState<Party[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [vendorSearchTerm, setVendorSearchTerm] = useState('')
  
  const [formData, setFormData] = useState<ExpenseCreate>({
    expense_date: new Date().toISOString().split('T')[0],
    expense_type: '',
    category: '',
    subcategory: '',
    description: '',
    amount: 0,
    payment_method: 'Cash',
    account_head: 'Cash',
    reference_number: '',
    vendor_id: undefined,
    gst_rate: 0,
    notes: '' // This will be used for payment notes
  })

  const expenseCategories = [
    { value: 'Direct/COGS', label: 'Direct/COGS' },
    { value: 'Indirect/Operating', label: 'Indirect/Operating' }
  ]

  const expenseTypes = [
    { value: 'Salary', label: 'Salary', category: 'Indirect/Operating' },
    { value: 'Rent', label: 'Rent', category: 'Indirect/Operating' },
    { value: 'Electricity', label: 'Electricity', category: 'Indirect/Operating' },
    { value: 'Raw Materials', label: 'Raw Materials', category: 'Direct/COGS' },
    { value: 'Packing Materials', label: 'Packing Materials', category: 'Direct/COGS' },
    { value: 'Freight', label: 'Freight', category: 'Direct/COGS' },
    { value: 'Office Supplies', label: 'Office Supplies', category: 'Indirect/Operating' },
    { value: 'Marketing', label: 'Marketing', category: 'Indirect/Operating' },
    { value: 'Professional Fees', label: 'Professional Fees', category: 'Indirect/Operating' },
    { value: 'Bank Charges', label: 'Bank Charges', category: 'Indirect/Operating' }
  ]

  const paymentMethods = ['Cash', 'Bank', 'UPI', 'Cheque', 'NEFT', 'RTGS', 'IMPS']
  const accountHeads = ['Cash', 'Bank', 'Funds', 'Credit Card']
  const gstRates = [0, 5, 12, 18, 28]

  useEffect(() => {
    loadVendors()
    if (expenseId) {
      loadExpense()
    }
  }, [expenseId])

  const loadExpense = async () => {
    if (!expenseId) return
    try {
      setLoading(true)
      setError(null)
      const expenseData = await apiGetExpense(expenseId)
      setFormData({
        expense_date: expenseData.expense_date,
        expense_type: expenseData.expense_type,
        category: expenseData.category,
        subcategory: expenseData.subcategory || '',
        description: expenseData.description,
        amount: expenseData.amount,
        payment_method: expenseData.payment_method,
        account_head: expenseData.account_head,
        reference_number: expenseData.reference_number || '',
        vendor_id: expenseData.vendor_id,
        gst_rate: expenseData.gst_rate,
        notes: expenseData.notes || ''
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load expense')
    } finally {
      setLoading(false)
    }
  }

  const loadVendors = async () => {
    try {
      const vendorsData = await apiListParties()
      setVendors(vendorsData.filter(p => p.type === 'vendor'))
    } catch (err) {
      console.error('Failed to load vendors:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.expense_type || !formData.category || !formData.description || formData.amount <= 0) {
      setError('Please fill all required fields')
      return
    }

    try {
      setLoading(true)
      setError(null)
      if (expenseId) {
        await apiUpdateExpense(expenseId, formData)
      } else {
        await apiCreateExpense(formData)
      }
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${expenseId ? 'update' : 'create'} expense`)
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryChange = (category: string) => {
    setFormData(prev => ({ ...prev, category, expense_type: '' }))
  }

  const filteredVendors = vendors.filter(vendor =>
    vendor.name.toLowerCase().includes(vendorSearchTerm.toLowerCase())
  )

  return (
    <form onSubmit={handleSubmit}>
      <ErrorMessage message={error} />

      {/* Main 2-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* Expense Details Section */}
        <div style={formStyles.section}>
          <h3 style={{ ...formStyles.sectionHeader, borderBottomColor: getSectionHeaderColor('basic') }}>
            Expense Details
          </h3>
          <div style={formStyles.grid2Col}>
            <div style={formStyles.formGroup}>
              <label style={formStyles.label}>Date *</label>
              <input
                type="date"
                value={formData.expense_date}
                onChange={(e) => setFormData(prev => ({ ...prev, expense_date: e.target.value }))}
                required
                style={formStyles.input}
              />
            </div>

            <div style={formStyles.formGroup}>
              <label style={formStyles.label}>Amount *</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                required
                placeholder="Enter amount"
                style={formStyles.input}
              />
            </div>

            <div style={formStyles.formGroup}>
              <label style={formStyles.label}>Category *</label>
              <select
                value={formData.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                required
                style={formStyles.select}
              >
                <option value="">Select Category</option>
                {expenseCategories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div style={formStyles.formGroup}>
              <label style={formStyles.label}>Expense Type *</label>
              <select
                value={formData.expense_type}
                onChange={(e) => setFormData(prev => ({ ...prev, expense_type: e.target.value }))}
                required
                style={formStyles.select}
              >
                <option value="">Select Type</option>
                {expenseTypes
                  .filter(type => !formData.category || type.category === formData.category)
                  .map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
              </select>
            </div>

            <div style={{ ...formStyles.formGroup, gridColumn: '1 / -1' }}>
              <label style={formStyles.label}>Description *</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                required
                placeholder="Enter expense description"
                style={formStyles.input}
              />
            </div>
          </div>
        </div>

        {/* Payment Information Section */}
        <div style={formStyles.section}>
          <h3 style={{ ...formStyles.sectionHeader, borderBottomColor: getSectionHeaderColor('payment') }}>
            Payment Information
          </h3>
          <div style={formStyles.grid2Col}>
            <div style={formStyles.formGroup}>
              <label style={formStyles.label}>Payment Method</label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value }))}
                style={formStyles.select}
              >
                {paymentMethods.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>

            <div style={formStyles.formGroup}>
              <label style={formStyles.label}>Account Head</label>
              <select
                value={formData.account_head}
                onChange={(e) => setFormData(prev => ({ ...prev, account_head: e.target.value }))}
                style={formStyles.select}
              >
                {accountHeads.map(head => (
                  <option key={head} value={head}>{head}</option>
                ))}
              </select>
            </div>

            <div style={formStyles.formGroup}>
              <label style={formStyles.label}>Vendor</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={vendorSearchTerm}
                  onChange={(e) => setVendorSearchTerm(e.target.value)}
                  placeholder="Search vendors..."
                  style={formStyles.input}
                  onFocus={() => setVendorSearchTerm('')}
                />
                {vendorSearchTerm && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    {filteredVendors.map(vendor => (
                      <div
                        key={vendor.id}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #eee'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                        onClick={() => {
                          setFormData(prev => ({ ...prev, vendor_id: vendor.id }))
                          setVendorSearchTerm(vendor.name)
                        }}
                      >
                        {vendor.name}
                      </div>
                    ))}
                    {filteredVendors.length === 0 && (
                      <div style={{ padding: '8px 12px', color: '#666' }}>
                        No vendors found
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div style={formStyles.formGroup}>
              <label style={formStyles.label}>GST Rate (%)</label>
              <select
                value={formData.gst_rate || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, gst_rate: parseFloat(e.target.value) || 0 }))}
                style={formStyles.select}
              >
                <option value="">Select GST Rate</option>
                {gstRates.map(rate => (
                  <option key={rate} value={rate}>{rate}%</option>
                ))}
              </select>
            </div>

            <div style={formStyles.formGroup}>
              <label style={formStyles.label}>Reference Number</label>
              <input
                type="text"
                value={formData.reference_number}
                onChange={(e) => setFormData(prev => ({ ...prev, reference_number: e.target.value }))}
                placeholder="Enter bill/receipt number"
                style={formStyles.input}
              />
            </div>

            <div style={formStyles.formGroup}>
              <label style={formStyles.label}>Payment Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Enter payment notes (optional)"
                rows={3}
                style={formStyles.textarea}
              />
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? (expenseId ? 'Updating...' : 'Creating...') : (expenseId ? 'Update Expense' : 'Create Expense')}
        </Button>
      </div>
    </form>
  )
}
