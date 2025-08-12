import { useEffect, useState } from 'react'
import { useAuth } from '../modules/AuthContext'
import { 
  apiCreateExpense, 
  apiListExpenses, 
  apiGetExpense, 
  apiUpdateExpense, 
  apiDeleteExpense,
  apiListParties,
  Expense,
  Party,
  ExpenseCreate
} from '../lib/api'
import { Card } from '../components/Card'

export function Expenses() {
  const { token } = useAuth()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [vendors, setVendors] = useState<Party[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [expenseTypeFilter, setExpenseTypeFilter] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Form state
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
    notes: ''
  })

  // Expense categories and types
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

  useEffect(() => {
    if (!token) return
    loadData()
  }, [token])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [expensesData, vendorsData] = await Promise.all([
        apiListExpenses(searchTerm, categoryFilter, expenseTypeFilter),
        apiListParties()
      ])
      setExpenses(expensesData)
      setVendors(vendorsData.filter(p => p.type === 'vendor'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    setCurrentPage(1)
  }, [searchTerm, categoryFilter, expenseTypeFilter])

  const handleCreateExpense = async () => {
    if (!formData.expense_type || !formData.category || !formData.description || formData.amount <= 0) {
      setError('Please fill all required fields')
      return
    }

    try {
      setLoading(true)
      setError(null)
      await apiCreateExpense(formData)
      setShowCreateForm(false)
      resetForm()
      loadData()
      alert('Expense created successfully!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create expense')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateExpense = async () => {
    if (!selectedExpense) return

    if (!formData.expense_type || !formData.category || !formData.description || formData.amount <= 0) {
      setError('Please fill all required fields')
      return
    }

    try {
      setLoading(true)
      setError(null)
      await apiUpdateExpense(selectedExpense.id, formData)
      setShowEditForm(false)
      setSelectedExpense(null)
      resetForm()
      loadData()
      alert('Expense updated successfully!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update expense')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteExpense = async (id: number) => {
    if (!confirm('Are you sure you want to delete this expense?')) return

    try {
      setLoading(true)
      setError(null)
      await apiDeleteExpense(id)
      loadData()
      alert('Expense deleted successfully!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete expense')
    } finally {
      setLoading(false)
    }
  }

  const handleEditExpense = (expense: Expense) => {
    setSelectedExpense(expense)
    setFormData({
      expense_date: expense.expense_date,
      expense_type: expense.expense_type,
      category: expense.category,
      subcategory: expense.subcategory || '',
      description: expense.description,
      amount: expense.amount,
      payment_method: expense.payment_method,
      account_head: expense.account_head,
      reference_number: expense.reference_number || '',
      vendor_id: expense.vendor_id || undefined,
      gst_rate: expense.gst_rate,
      notes: expense.notes || ''
    })
    setShowEditForm(true)
  }

  const resetForm = () => {
    setFormData({
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
      notes: ''
    })
  }

  const calculateTotalAmount = () => {
    const gstAmount = formData.amount * formData.gst_rate / 100
    return formData.amount + gstAmount
  }

  // Pagination
  const totalPages = Math.ceil(expenses.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentExpenses = expenses.slice(startIndex, endIndex)

  if (loading && expenses.length === 0) {
    return (
      <Card>
        <h1>Expenses</h1>
        <div>Loading...</div>
      </Card>
    )
  }

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Expense Management</h1>
        <button 
          onClick={() => setShowCreateForm(true)}
          className="btn btn-primary"
          style={{ padding: '10px 20px' }}
        >
          Add New Expense
        </button>
      </div>

      {error && (
        <div style={{ 
          padding: '12px', 
          marginBottom: '16px', 
          backgroundColor: '#fee', 
          border: '1px solid #fcc', 
          borderRadius: '4px', 
          color: '#c33' 
        }}>
          {error}
        </div>
      )}

      {/* Search and Filters */}
      <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search expenses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            padding: '12px 16px',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            fontSize: '14px'
          }}
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{
            padding: '12px 16px',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            fontSize: '14px'
          }}
        >
          <option value="">All Categories</option>
          {expenseCategories.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
        <select
          value={expenseTypeFilter}
          onChange={(e) => setExpenseTypeFilter(e.target.value)}
          style={{
            padding: '12px 16px',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            fontSize: '14px'
          }}
        >
          <option value="">All Types</option>
          {expenseTypes.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
      </div>

      {/* Expenses Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--background-secondary)' }}>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Date</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Type</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Category</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Description</th>
              <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid var(--border)' }}>Amount</th>
              <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid var(--border)' }}>GST</th>
              <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid var(--border)' }}>Total</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>Payment Method</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentExpenses.map(expense => (
              <tr key={expense.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '12px' }}>{new Date(expense.expense_date).toLocaleDateString()}</td>
                <td style={{ padding: '12px' }}>{expense.expense_type}</td>
                <td style={{ padding: '12px' }}>{expense.category}</td>
                <td style={{ padding: '12px' }}>{expense.description}</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>₹{expense.amount.toFixed(2)}</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>₹{expense.gst_amount.toFixed(2)}</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>₹{expense.total_amount.toFixed(2)}</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    backgroundColor: '#e9ecef',
                    color: '#495057'
                  }}>
                    {expense.payment_method}
                  </span>
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button
                      onClick={() => handleEditExpense(expense)}
                      className="btn btn-secondary"
                      style={{ padding: '4px 8px', fontSize: '12px' }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteExpense(expense.id)}
                      className="btn btn-danger"
                      style={{ padding: '4px 8px', fontSize: '12px' }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="btn btn-secondary"
            style={{ padding: '8px 12px' }}
          >
            Previous
          </button>
          <span style={{ padding: '8px 12px', display: 'flex', alignItems: 'center' }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="btn btn-secondary"
            style={{ padding: '8px 12px' }}
          >
            Next
          </button>
        </div>
      )}

      {/* Create/Edit Expense Modal */}
      {(showCreateForm || showEditForm) && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>{showEditForm ? 'Edit Expense' : 'Add New Expense'}</h2>
              <button
                onClick={() => {
                  setShowCreateForm(false)
                  setShowEditForm(false)
                  setSelectedExpense(null)
                  resetForm()
                }}
                className="btn btn-secondary"
                style={{ padding: '8px 12px' }}
              >
                Close
              </button>
            </div>

            {/* Expense Details Section */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ marginBottom: '16px', color: '#333', borderBottom: '2px solid #007bff', paddingBottom: '8px' }}>
                Expense Details
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <label>
                  <div>Expense Date *</div>
                  <input
                    type="date"
                    value={formData.expense_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, expense_date: e.target.value }))}
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px' }}
                  />
                </label>

                <label>
                  <div>Expense Type *</div>
                  <select
                    value={formData.expense_type}
                    onChange={(e) => {
                      const selectedType = expenseTypes.find(type => type.value === e.target.value)
                      setFormData(prev => ({ 
                        ...prev, 
                        expense_type: e.target.value,
                        category: selectedType?.category || ''
                      }))
                    }}
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px' }}
                  >
                    <option value="">Select Type...</option>
                    {expenseTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </label>

                <label>
                  <div>Category *</div>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px' }}
                  >
                    <option value="">Select Category...</option>
                    {expenseCategories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </label>

                <label>
                  <div>Subcategory</div>
                  <input
                    type="text"
                    value={formData.subcategory}
                    onChange={(e) => setFormData(prev => ({ ...prev, subcategory: e.target.value }))}
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px' }}
                  />
                </label>
              </div>
            </div>

            {/* Payment Information Section */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ marginBottom: '16px', color: '#333', borderBottom: '2px solid #28a745', paddingBottom: '8px' }}>
                Payment Information
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <label>
                  <div>Amount *</div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: Number(e.target.value) }))}
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px' }}
                  />
                </label>

                <label>
                  <div>GST Rate %</div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.gst_rate}
                    onChange={(e) => setFormData(prev => ({ ...prev, gst_rate: Number(e.target.value) }))}
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px' }}
                  />
                </label>

                <label>
                  <div>Payment Method *</div>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value }))}
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px' }}
                  >
                    {paymentMethods.map(method => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </label>

                <label>
                  <div>Account Head *</div>
                  <select
                    value={formData.account_head}
                    onChange={(e) => setFormData(prev => ({ ...prev, account_head: e.target.value }))}
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px' }}
                  >
                    {accountHeads.map(head => (
                      <option key={head} value={head}>{head}</option>
                    ))}
                  </select>
                </label>
              </div>

              {/* Description and Reference */}
              <div style={{ display: 'grid', gap: '16px' }}>
                <label>
                  <div>Description *</div>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px' }}
                  />
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <label>
                    <div>Reference Number</div>
                    <input
                      type="text"
                      value={formData.reference_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, reference_number: e.target.value }))}
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px' }}
                    />
                  </label>

                  <label>
                    <div>Vendor (Optional)</div>
                    <select
                      value={formData.vendor_id || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, vendor_id: e.target.value ? Number(e.target.value) : undefined }))}
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px' }}
                    >
                      <option value="">Select Vendor...</option>
                      {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                  </label>
                </div>
              </div>

              {/* Notes */}
              <label>
                <div>Notes</div>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px', minHeight: '60px' }}
                />
              </label>

              {/* Total Calculation */}
              {formData.amount > 0 && (
                <div style={{ 
                  padding: '16px', 
                  backgroundColor: 'var(--background-secondary)', 
                  borderRadius: '4px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px'
                }}>
                  <div>
                    <strong>Base Amount:</strong> ₹{formData.amount.toFixed(2)}
                  </div>
                  <div>
                    <strong>GST Amount:</strong> ₹{(formData.amount * formData.gst_rate / 100).toFixed(2)}
                  </div>
                  <div>
                    <strong>Total Amount:</strong> ₹{calculateTotalAmount().toFixed(2)}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setShowCreateForm(false)
                    setShowEditForm(false)
                    setSelectedExpense(null)
                    resetForm()
                  }}
                  className="btn btn-secondary"
                  style={{ padding: '12px 24px' }}
                >
                  Cancel
                </button>
                <button
                  onClick={showEditForm ? handleUpdateExpense : handleCreateExpense}
                  disabled={loading || !formData.expense_type || !formData.category || !formData.description || formData.amount <= 0}
                  className="btn btn-primary"
                  style={{ padding: '12px 24px' }}
                >
                  {loading ? (showEditForm ? 'Updating...' : 'Creating...') : (showEditForm ? 'Update Expense' : 'Create Expense')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
