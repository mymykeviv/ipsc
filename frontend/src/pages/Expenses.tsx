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
import { EnhancedFilterBar } from '../components/EnhancedFilterBar'
import { FilterDropdown } from '../components/FilterDropdown'
import { DateFilter } from '../components/DateFilter'

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
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [expenseTypeFilter, setExpenseTypeFilter] = useState('all')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all')
  const [amountRangeFilter, setAmountRangeFilter] = useState('all')
  const [financialYearFilter, setFinancialYearFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
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
    const matchesSearch = !searchTerm || 
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.expense_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter
    
    const matchesType = expenseTypeFilter === 'all' || expense.expense_type === expenseTypeFilter
    
    const matchesPaymentMethod = paymentMethodFilter === 'all' || 
      expense.payment_method.toLowerCase() === paymentMethodFilter.toLowerCase()
    
    const matchesAmountRange = amountRangeFilter === 'all' || (() => {
      const [min, max] = amountRangeFilter.split('-').map(Number)
      if (max) {
        return expense.amount >= min && expense.amount <= max
      } else {
        return expense.amount >= min
      }
    })()
    
    const matchesFinancialYear = financialYearFilter === 'all' || (() => {
      const expenseYear = new Date(expense.expense_date).getFullYear()
      const [startYear] = financialYearFilter.split('-').map(Number)
      return expenseYear === startYear
    })()
    
    return matchesSearch && matchesCategory && matchesType && matchesPaymentMethod && matchesAmountRange && matchesFinancialYear
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

      {/* Enhanced Filter Options */}
      <EnhancedFilterBar 
        title="Expense Filters"
        activeFiltersCount={
          (searchTerm ? 1 : 0) +
          (categoryFilter !== 'all' ? 1 : 0) +
          (expenseTypeFilter !== 'all' ? 1 : 0) +
          (paymentMethodFilter !== 'all' ? 1 : 0) +
          (amountRangeFilter !== 'all' ? 1 : 0) +
          (financialYearFilter !== 'all' ? 1 : 0) +
          (dateFilter !== 'all' ? 1 : 0)
        }
        onClearAll={() => {
          setSearchTerm('')
          setCategoryFilter('all')
          setExpenseTypeFilter('all')
          setPaymentMethodFilter('all')
          setAmountRangeFilter('all')
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
          <span style={{ fontSize: '12px', fontWeight: '500', color: '#495057' }}>Search</span>
          <input
            type="text"
            placeholder="Search expenses by description, type, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
          <span style={{ fontSize: '12px', fontWeight: '500', color: '#495057' }}>Category</span>
          <FilterDropdown
            value={categoryFilter}
            onChange={(value) => setCategoryFilter(Array.isArray(value) ? value[0] || 'all' : value)}
            options={[
              { value: 'all', label: 'All Categories' },
              ...expenseCategories.map(cat => ({ 
                value: cat.value, 
                label: cat.label 
              }))
            ]}
            placeholder="Select category"
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '12px', fontWeight: '500', color: '#495057' }}>Expense Type</span>
          <FilterDropdown
            value={expenseTypeFilter}
            onChange={(value) => setExpenseTypeFilter(Array.isArray(value) ? value[0] || 'all' : value)}
            options={[
              { value: 'all', label: 'All Types' },
              ...expenseTypes.map(type => ({ 
                value: type.value, 
                label: type.label 
              }))
            ]}
            placeholder="Select expense type"
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '12px', fontWeight: '500', color: '#495057' }}>Payment Method</span>
          <FilterDropdown
            value={paymentMethodFilter}
            onChange={(value) => setPaymentMethodFilter(Array.isArray(value) ? value[0] || 'all' : value)}
            options={[
              { value: 'all', label: 'All Methods' },
              ...paymentMethods.map(method => ({ 
                value: method, 
                label: method 
              }))
            ]}
            placeholder="Select payment method"
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

