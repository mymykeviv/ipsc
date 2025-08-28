import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
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
import { DateFilter, DateRange } from '../components/DateFilter'
import { ActionButtons, ActionButtonSets } from '../components/ActionButtons'
import { EnhancedHeader, HeaderPatterns } from '../components/EnhancedHeader'
import { useFilterNavigation } from '../utils/filterNavigation'
import { useFilterReset } from '../hooks/useFilterReset'
import { getDefaultFilterState } from '../config/defaultFilterStates'
import SummaryCardGrid, { SummaryCardItem } from '../components/common/SummaryCardGrid'

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
  const [currentExpense, setCurrentExpense] = useState<Expense | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Enhanced Filter System - Unified State Management
  const defaultState = getDefaultFilterState('expenses') as {
    searchTerm: string
    categoryFilter: string
    expenseTypeFilter: string
    paymentMethodFilter: string
    amountRangeFilter: string
    financialYearFilter: string
    dateFilter: DateRange
  }
  const { getFiltersFromURL, updateURLWithFilters, clearURLFilters } = useFilterNavigation(defaultState)
  const { resetAllFilters, getActiveFilterCount } = useFilterReset({
    pageName: 'expenses',
    onReset: (newState) => {
      // Update all filter states
      setSearchTerm(newState.searchTerm)
      setCategoryFilter(newState.categoryFilter)
      setExpenseTypeFilter(newState.expenseTypeFilter)
      setPaymentMethodFilter(newState.paymentMethodFilter)
      setAmountRangeFilter(newState.amountRangeFilter)
      setFinancialYearFilter(newState.financialYearFilter)
      setDateFilter(newState.dateFilter)
    }
  })

  // Filter states with URL integration
  const [searchTerm, setSearchTerm] = useState<string>(defaultState.searchTerm)
  const [categoryFilter, setCategoryFilter] = useState<string>(defaultState.categoryFilter)
  const [expenseTypeFilter, setExpenseTypeFilter] = useState<string>(defaultState.expenseTypeFilter)
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>(defaultState.paymentMethodFilter)
  const [amountRangeFilter, setAmountRangeFilter] = useState<string>(defaultState.amountRangeFilter)
  const [financialYearFilter, setFinancialYearFilter] = useState<string>(defaultState.financialYearFilter)
  const [dateFilter, setDateFilter] = useState<DateRange>(defaultState.dateFilter)



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

  // URL Parameter Integration - Apply filters from URL on component mount
  useEffect(() => {
    if (mode === 'manage') {
      const urlFilters = getFiltersFromURL()
      
      // Apply URL filters to state
      if (urlFilters.searchTerm) setSearchTerm(urlFilters.searchTerm)
      if (urlFilters.categoryFilter) setCategoryFilter(urlFilters.categoryFilter)
      if (urlFilters.expenseTypeFilter) setExpenseTypeFilter(urlFilters.expenseTypeFilter)
      if (urlFilters.paymentMethodFilter) setPaymentMethodFilter(urlFilters.paymentMethodFilter)
      if (urlFilters.amountRangeFilter) setAmountRangeFilter(urlFilters.amountRangeFilter)
      if (urlFilters.financialYearFilter) setFinancialYearFilter(urlFilters.financialYearFilter)
      if (urlFilters.dateFilter) setDateFilter(urlFilters.dateFilter)
    }
  }, [mode, getFiltersFromURL])

  // Update URL when filters change
  const updateFiltersAndURL = useCallback((newFilters: Partial<typeof defaultState>) => {
    const currentFilters = {
      searchTerm,
      categoryFilter,
      expenseTypeFilter,
      paymentMethodFilter,
      amountRangeFilter,
      financialYearFilter,
      dateFilter
    }
    
    const updatedFilters = { ...currentFilters, ...newFilters }
    updateURLWithFilters(updatedFilters)
  }, [searchTerm, categoryFilter, expenseTypeFilter, paymentMethodFilter, 
      amountRangeFilter, financialYearFilter, dateFilter, updateURLWithFilters])

  // Enhanced filter setters with URL integration
  const setSearchTermWithURL = useCallback((value: string) => {
    setSearchTerm(value)
    updateFiltersAndURL({ searchTerm: value })
  }, [updateFiltersAndURL])

  const setCategoryFilterWithURL = useCallback((value: string) => {
    setCategoryFilter(value)
    updateFiltersAndURL({ categoryFilter: value })
  }, [updateFiltersAndURL])

  const setExpenseTypeFilterWithURL = useCallback((value: string) => {
    setExpenseTypeFilter(value)
    updateFiltersAndURL({ expenseTypeFilter: value })
  }, [updateFiltersAndURL])

  const setPaymentMethodFilterWithURL = useCallback((value: string) => {
    setPaymentMethodFilter(value)
    updateFiltersAndURL({ paymentMethodFilter: value })
  }, [updateFiltersAndURL])

  const setAmountRangeFilterWithURL = useCallback((value: string) => {
    setAmountRangeFilter(value)
    updateFiltersAndURL({ amountRangeFilter: value })
  }, [updateFiltersAndURL])

  const setFinancialYearFilterWithURL = useCallback((value: string) => {
    setFinancialYearFilter(value)
    updateFiltersAndURL({ financialYearFilter: value })
  }, [updateFiltersAndURL])

  const setDateFilterWithURL = useCallback((value: DateRange) => {
    setDateFilter(value)
    updateFiltersAndURL({ dateFilter: value })
  }, [updateFiltersAndURL])

  // Clear all filters handler
  const handleClearAllFilters = useCallback(() => {
    const currentState = {
      searchTerm,
      categoryFilter,
      expenseTypeFilter,
      paymentMethodFilter,
      amountRangeFilter,
      financialYearFilter,
      dateFilter
    }
    
    const newState = resetAllFilters(currentState)
    
    // Update all filter states
    setSearchTerm(newState.searchTerm)
    setCategoryFilter(newState.categoryFilter)
    setExpenseTypeFilter(newState.expenseTypeFilter)
    setPaymentMethodFilter(newState.paymentMethodFilter)
    setAmountRangeFilter(newState.amountRangeFilter)
    setFinancialYearFilter(newState.financialYearFilter)
    setDateFilter(newState.dateFilter)
  }, [searchTerm, categoryFilter, expenseTypeFilter, paymentMethodFilter, 
      amountRangeFilter, financialYearFilter, dateFilter, resetAllFilters])

  // Get active filter count
  const activeFilterCount = getActiveFilterCount({
    searchTerm,
    categoryFilter,
    expenseTypeFilter,
    paymentMethodFilter,
    amountRangeFilter,
    financialYearFilter,
    dateFilter
  })

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
      const effectiveSearch = searchTerm || undefined
      const effectiveCategory = categoryFilter !== 'all' ? categoryFilter : undefined
      const effectiveType = expenseTypeFilter !== 'all' ? expenseTypeFilter : undefined
      const expensesData = await apiListExpenses(effectiveSearch, effectiveCategory, effectiveType)
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

  const filteredExpenses = expenses.filter((expense: Expense) => {
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
    
    // Date range filter (inclusive) if provided
    const matchesDate = (() => {
      if (!dateFilter?.startDate || !dateFilter?.endDate) return true
      const d = new Date(expense.expense_date)
      const start = new Date(dateFilter.startDate)
      const end = new Date(dateFilter.endDate)
      return d >= start && d <= end
    })()
    
    return matchesSearch && matchesCategory && matchesType && matchesPaymentMethod && matchesAmountRange && matchesFinancialYear && matchesDate
  })

  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedExpenses = filteredExpenses.slice(startIndex, endIndex)

  // Currency formatter (INR)
  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(n)

  // Summary totals derived from currently filtered (not paginated) expenses
  const totalAmount = filteredExpenses.reduce((acc: number, e: Expense) => acc + (e?.amount ?? 0), 0)
  const expenseCount = filteredExpenses.length
  const directCOGS = filteredExpenses.reduce((acc: number, e: Expense) => {
    const cat = (e?.category ?? '').toLowerCase()
    return acc + (cat === 'direct/cogs' ? (e.amount ?? 0) : 0)
  }, 0)
  const indirectOperating = filteredExpenses.reduce((acc: number, e: Expense) => {
    const cat = (e?.category ?? '').toLowerCase()
    return acc + (cat === 'indirect/operating' ? (e.amount ?? 0) : 0)
  }, 0)

  const summaryItems: SummaryCardItem[] = [
    {
      label: 'Total Expense',
      primary: formatCurrency(totalAmount),
      secondary: `${expenseCount.toLocaleString('en-IN')} expenses`,
      accentColor: '#0d6efd', // blue
    },
    {
      label: 'Direct/COGS',
      primary: formatCurrency(directCOGS),
      secondary: totalAmount > 0 ? `${((directCOGS / totalAmount) * 100).toFixed(1)}% of total` : undefined,
      accentColor: '#6f42c1', // purple
    },
    {
      label: 'Indirect/Operating',
      primary: formatCurrency(indirectOperating),
      secondary: totalAmount > 0 ? `${((indirectOperating / totalAmount) * 100).toFixed(1)}% of total` : undefined,
      accentColor: '#fd7e14', // orange
    },
  ]

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
          onSuccess={() => {
            loadExpenses() // Reload expenses data
            navigate('/expenses')
          }}
          onCancel={() => navigate('/expenses')}
        />
      </div>
    )
  }

  // Manage Expenses Mode
  return (
    <div style={{ padding: '20px', maxWidth: '100%' }}>
      <EnhancedHeader
        {...HeaderPatterns.expenses(expenses.length)}
        primaryAction={{
          label: 'Add Expense',
          onClick: () => navigate('/expenses/add'),
          icon: '💰'
        }}
      />

      {/* Enhanced Filter Options */}
      <EnhancedFilterBar 
        title="Expense Filters"
        activeFiltersCount={activeFilterCount}
        onClearAll={handleClearAllFilters}
        showQuickActions={true}
        showQuickFiltersWhenCollapsed={true}
        quickActions={[
          {
            id: 'currentFY',
            label: 'Current FY',
            action: () => {
              const currentYear = new Date().getFullYear()
              setFinancialYearFilterWithURL(`${currentYear}-${currentYear + 1}`)
            },
            icon: '📅',
            isActive: financialYearFilter === `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
          },
          {
            id: 'cashPayment',
            label: 'Cash Payment',
            action: () => {
              setPaymentMethodFilterWithURL('Cash')
            },
            icon: '💰',
            isActive: paymentMethodFilter === 'Cash'
          },
          {
            id: 'recentExpenses',
            label: 'Recent Expenses',
            action: () => {
              const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
              setDateFilterWithURL({
                startDate: thirtyDaysAgo,
                endDate: new Date().toISOString().slice(0, 10)
              })
            },
            icon: '📋',
            isActive: false
          },
          {
            id: 'highValueExpenses',
            label: 'High Value (>10K)',
            action: () => {
              setAmountRangeFilterWithURL('10000-')
            },
            icon: '💰',
            isActive: amountRangeFilter === '10000-'
          }
        ]}
      >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '12px', fontWeight: '500', color: '#495057' }}>Search</span>
          <input
            type="text"
            placeholder="Search expenses by description, type, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTermWithURL(e.target.value)}
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
            onChange={(value) => setCategoryFilterWithURL(Array.isArray(value) ? value[0] || 'all' : value)}
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
            onChange={(value) => setExpenseTypeFilterWithURL(Array.isArray(value) ? value[0] || 'all' : value)}
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
            onChange={(value) => setPaymentMethodFilterWithURL(Array.isArray(value) ? value[0] || 'all' : value)}
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
            onChange={(value) => setAmountRangeFilterWithURL(Array.isArray(value) ? value[0] || 'all' : value)}
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
            onChange={(value) => setFinancialYearFilterWithURL(Array.isArray(value) ? value[0] || 'all' : value)}
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
            onChange={setDateFilterWithURL}
          />
        </div>
      </EnhancedFilterBar>

      {/* Summary Totals - below filters for consistency with other screens */}
      <div style={{ margin: '16px 0 20px 0' }}>
        <SummaryCardGrid items={summaryItems} columnsMin={220} gapPx={12} />
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
        overflow: 'visible',
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
                  <ActionButtons
                    {...ActionButtonSets.expenses(expense, {
                      onEdit: () => navigate(`/expenses/edit/${expense.id}`),
                      onDelete: () => handleDeleteExpense(expense.id)
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

