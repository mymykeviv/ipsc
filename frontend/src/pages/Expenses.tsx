import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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
import { Button } from '../components/Button'
import { ExpenseForm } from '../components/ExpenseForm'

interface ExpensesProps {
  mode?: 'manage' | 'add' | 'edit'
}

export function Expenses({ mode = 'manage' }: ExpensesProps) {
  const { token } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [vendors, setVendors] = useState<Party[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [expenseTypeFilter, setExpenseTypeFilter] = useState('')
  const [currentExpense, setCurrentExpense] = useState<Expense | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)



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
    
    if (mode === 'manage') {
      loadExpenses()
    } else if (mode === 'edit' && id) {
      loadExpense()
    }
    loadVendors()
  }, [token, mode, id])

  const loadExpenses = async () => {
    try {
      setLoading(true)
      setError(null)
      const expensesData = await apiListExpenses(searchTerm, categoryFilter, expenseTypeFilter)
      setExpenses(expensesData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load expenses')
    } finally {
      setLoading(false)
    }
  }

  const loadExpense = async () => {
    if (!id) return
    try {
      setLoading(true)
      setError(null)
      const expenseData = await apiGetExpense(parseInt(id))
      setCurrentExpense(expenseData)
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

  useEffect(() => {
    if (mode === 'manage') {
      loadExpenses()
      setCurrentPage(1)
    }
  }, [searchTerm, categoryFilter, expenseTypeFilter])

  const handleDeleteExpense = async (id: number) => {
    if (!confirm('Are you sure you want to delete this expense?')) return

    try {
      setLoading(true)
      setError(null)
      await apiDeleteExpense(id)
      loadExpenses()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete expense')
    } finally {
      setLoading(false)
    }
  }

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.expense_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !categoryFilter || expense.category === categoryFilter
    const matchesType = !expenseTypeFilter || expense.expense_type === expenseTypeFilter
    return matchesSearch && matchesCategory && matchesType
  })

  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedExpenses = filteredExpenses.slice(startIndex, endIndex)

  if (loading && expenses.length === 0) {
    return (
      <div style={{ padding: '20px' }}>
        <div>Loading...</div>
      </div>
    )
  }

  // Render different modes
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
            {mode === 'add' ? 'Add Expense' : 'Edit Expense'}
          </h1>
          <Button variant="secondary" onClick={() => navigate('/expenses')}>
            Back to Expenses
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

        <ExpenseForm 
          expenseId={mode === 'edit' ? parseInt(id || '0') : undefined}
          onSuccess={() => navigate('/expenses')}
          onCancel={() => navigate('/expenses')}
        />
      </div>
    )
  }

  // Manage Expenses Mode
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
        <h1 style={{ margin: '0', fontSize: '28px', fontWeight: '600', color: '#2c3e50' }}>Manage Expenses</h1>
        <Button variant="primary" onClick={() => navigate('/expenses/add')}>
          Add Expense
        </Button>
      </div>

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
            placeholder="Search expenses by description, type, or category..."
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
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              padding: '10px 16px',
              border: '1px solid #ced4da',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: 'white'
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
              padding: '10px 16px',
              border: '1px solid #ced4da',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: 'white'
            }}
          >
            <option value="">All Types</option>
            {expenseTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
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

      {/* Expenses Table */}
      <div style={{ 
        border: '1px solid #e9ecef', 
        borderRadius: '8px', 
        overflow: 'hidden',
        backgroundColor: 'white'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #e9ecef' }}>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Date</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Type</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Category</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Description</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Amount</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Payment Method</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedExpenses.map(expense => (
              <tr key={expense.id} style={{ 
                borderBottom: '1px solid #e9ecef',
                backgroundColor: 'white'
              }}>
                <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>{new Date(expense.expense_date).toLocaleDateString()}</td>
                <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>{expense.expense_type}</td>
                <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>{expense.category}</td>
                <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>{expense.description}</td>
                <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>₹{expense.amount.toFixed(2)}</td>
                <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>{expense.payment_method}</td>
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button 
                      variant="secondary" 
                      onClick={() => navigate(`/expenses/edit/${expense.id}`)}
                      style={{ fontSize: '14px', padding: '6px 12px' }}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="secondary" 
                      onClick={() => handleDeleteExpense(expense.id)}
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
      {totalPages > 1 && (
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
            Showing {startIndex + 1} to {Math.min(endIndex, filteredExpenses.length)} of {filteredExpenses.length} expenses
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button 
              variant="secondary" 
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
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
              Page {currentPage} of {totalPages}
            </span>
            <Button 
              variant="secondary" 
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {filteredExpenses.length === 0 && !loading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          color: '#6c757d',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          backgroundColor: '#f8f9fa'
        }}>
          <div style={{ fontSize: '18px', marginBottom: '8px', fontWeight: '500' }}>
            No expenses available
          </div>
          <div style={{ fontSize: '14px' }}>
            Add your first expense to get started
          </div>
        </div>
      )}


    </div>
  )
}

