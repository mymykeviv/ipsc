import { useEffect, useState, useCallback, useMemo } from 'react'
import { useAuth } from '../modules/AuthContext'
import { useSearchParams } from 'react-router-dom'
import { 
  apiGetCashflowTransactions,
  CashflowTransaction
} from '../lib/api'
import { Button } from '../components/Button'
import { DateFilter, DateRange } from '../components/DateFilter'
import { FilterDropdown } from '../components/FilterDropdown'
import { EnhancedFilterBar } from '../components/EnhancedFilterBar'
import { EnhancedHeader, HeaderPatterns } from '../components/EnhancedHeader'
import { SummaryCardGrid, SummaryCardItem } from '../components/common/SummaryCardGrid'
import { useFilterNavigation } from '../utils/filterNavigation'
import { useFilterReset } from '../hooks/useFilterReset'
import { getDefaultFilterState } from '../config/defaultFilterStates'

export function CashflowTransactions() {
  const { token } = useAuth()
  const [transactions, setTransactions] = useState<CashflowTransaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(25)

  // Enhanced Filter System - Unified State Management
  const defaultState = getDefaultFilterState('cashflow') as {
    searchTerm: string
    typeFilter: 'all' | 'inflow' | 'outflow'
    transactionTypeFilter: string
    paymentMethodFilter: string
    accountHeadFilter: string
    amountRangeFilter: string
    dateFilter: DateRange
  }
  const { getFiltersFromURL, updateURLWithFilters, clearURLFilters } = useFilterNavigation(defaultState)
  const { resetAllFilters, getActiveFilterCount } = useFilterReset({
    pageName: 'cashflow',
    onReset: (newState) => {
      // Update all filter states
      setSearchTerm(newState.searchTerm)
      setTypeFilter(newState.typeFilter)
      setTransactionTypeFilter(newState.transactionTypeFilter)
      setPaymentMethodFilter(newState.paymentMethodFilter)
      setAccountHeadFilter(newState.accountHeadFilter)
      setAmountRangeFilter(newState.amountRangeFilter)
      setDateFilter(newState.dateFilter)
    }
  })

  // Filter states with URL integration
  const [searchTerm, setSearchTerm] = useState<string>(defaultState.searchTerm)
  const [typeFilter, setTypeFilter] = useState<'all' | 'inflow' | 'outflow'>(defaultState.typeFilter)
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<string>(defaultState.transactionTypeFilter)
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>(defaultState.paymentMethodFilter)
  const [accountHeadFilter, setAccountHeadFilter] = useState<string>(defaultState.accountHeadFilter)
  const [amountRangeFilter, setAmountRangeFilter] = useState<string>(defaultState.amountRangeFilter)
  const [dateFilter, setDateFilter] = useState<DateRange>(defaultState.dateFilter)
  const [isDateFilterActive, setIsDateFilterActive] = useState(false)

  // URL Parameter Integration - Apply filters from URL on component mount
  useEffect(() => {
    const urlFilters = getFiltersFromURL()
    
    // Apply URL filters to state
    if (urlFilters.searchTerm) setSearchTerm(urlFilters.searchTerm)
    if (urlFilters.typeFilter) setTypeFilter(urlFilters.typeFilter)
    if (urlFilters.transactionTypeFilter) setTransactionTypeFilter(urlFilters.transactionTypeFilter)
    if (urlFilters.paymentMethodFilter) setPaymentMethodFilter(urlFilters.paymentMethodFilter)
    if (urlFilters.accountHeadFilter) setAccountHeadFilter(urlFilters.accountHeadFilter)
    if (urlFilters.amountRangeFilter) setAmountRangeFilter(urlFilters.amountRangeFilter)
    if (urlFilters.dateFilter) setDateFilter(urlFilters.dateFilter)
  }, [getFiltersFromURL])

  // Update URL when filters change
  const updateFiltersAndURL = useCallback((newFilters: Partial<typeof defaultState>) => {
    const currentFilters = {
      searchTerm,
      typeFilter,
      transactionTypeFilter,
      paymentMethodFilter,
      accountHeadFilter,
      amountRangeFilter,
      dateFilter
    }
    
    const updatedFilters = { ...currentFilters, ...newFilters }
    updateURLWithFilters(updatedFilters)
  }, [searchTerm, typeFilter, transactionTypeFilter, paymentMethodFilter, 
      accountHeadFilter, amountRangeFilter, dateFilter, updateURLWithFilters])

  // Enhanced filter setters with URL integration
  const setSearchTermWithURL = useCallback((value: string) => {
    setSearchTerm(value)
    updateFiltersAndURL({ searchTerm: value })
  }, [updateFiltersAndURL])

  const setTypeFilterWithURL = useCallback((value: 'all' | 'inflow' | 'outflow') => {
    setTypeFilter(value)
    updateFiltersAndURL({ typeFilter: value })
  }, [updateFiltersAndURL])

  const setTransactionTypeFilterWithURL = useCallback((value: string) => {
    setTransactionTypeFilter(value)
    updateFiltersAndURL({ transactionTypeFilter: value })
  }, [updateFiltersAndURL])

  const setPaymentMethodFilterWithURL = useCallback((value: string) => {
    setPaymentMethodFilter(value)
    updateFiltersAndURL({ paymentMethodFilter: value })
  }, [updateFiltersAndURL])

  const setAccountHeadFilterWithURL = useCallback((value: string) => {
    setAccountHeadFilter(value)
    updateFiltersAndURL({ accountHeadFilter: value })
  }, [updateFiltersAndURL])

  const setAmountRangeFilterWithURL = useCallback((value: string) => {
    setAmountRangeFilter(value)
    updateFiltersAndURL({ amountRangeFilter: value })
  }, [updateFiltersAndURL])

  const setDateFilterWithURL = useCallback((value: DateRange) => {
    setDateFilter(value)
    updateFiltersAndURL({ dateFilter: value })
  }, [updateFiltersAndURL])

  // Clear all filters handler
  const handleClearAllFilters = useCallback(() => {
    const currentState = {
      searchTerm,
      typeFilter,
      transactionTypeFilter,
      paymentMethodFilter,
      accountHeadFilter,
      amountRangeFilter,
      dateFilter
    }
    
    const newState = resetAllFilters(currentState)
    
    // Update all filter states
    setSearchTerm(newState.searchTerm)
    setTypeFilter(newState.typeFilter)
    setTransactionTypeFilter(newState.transactionTypeFilter)
    setPaymentMethodFilter(newState.paymentMethodFilter)
    setAccountHeadFilter(newState.accountHeadFilter)
    setAmountRangeFilter(newState.amountRangeFilter)
    setDateFilter(newState.dateFilter)
  }, [searchTerm, typeFilter, transactionTypeFilter, paymentMethodFilter, 
      accountHeadFilter, amountRangeFilter, dateFilter, resetAllFilters])

  // Get active filter count
  const activeFilterCount = getActiveFilterCount({
    searchTerm,
    typeFilter,
    transactionTypeFilter,
    paymentMethodFilter,
    accountHeadFilter,
    amountRangeFilter,
    dateFilter
  })

  useEffect(() => {
    if (!token) return
    loadTransactions()
  }, [token])

  // Reload transactions when filters change
  useEffect(() => {
    if (token) {
      loadTransactions()
    }
  }, [searchTerm, typeFilter, transactionTypeFilter, paymentMethodFilter, accountHeadFilter, amountRangeFilter, dateFilter, isDateFilterActive, currentPage])

  const loadTransactions = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Build query parameters
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (typeFilter !== 'all') params.append('type_filter', typeFilter)
      if (transactionTypeFilter !== 'all') params.append('transaction_type', transactionTypeFilter)
      if (paymentMethodFilter !== 'all') params.append('payment_method', paymentMethodFilter)
      if (accountHeadFilter !== 'all') params.append('account_head', accountHeadFilter)
      if (amountRangeFilter !== 'all') {
        const [min, max] = amountRangeFilter.split('-')
        if (min) params.append('amount_min', min)
        if (max) params.append('amount_max', max)
      }
      // Only use date range if filter is active
      if (isDateFilterActive) {
        params.append('start_date', dateFilter.startDate)
        params.append('end_date', dateFilter.endDate)
      }
      
      params.append('page', currentPage.toString())
      params.append('limit', itemsPerPage.toString())
      
      const url = `/api/cashflow/transactions?${params.toString()}`
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (!response.ok) throw new Error('Failed to load transactions')
      
      const data = await response.json()
      setTransactions(data.transactions || data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }

  // Add manual refresh function
  const handleRefresh = () => {
    loadTransactions()
  }

  const filteredTransactions = transactions.filter((transaction: CashflowTransaction) => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.payment_method.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || transaction.type === typeFilter
    
    // Date filtering using DateRange (only if active)
    let matchesDate = true
    if (isDateFilterActive) {
      const transactionDate = new Date(transaction.transaction_date)
      const startDate = new Date(dateFilter.startDate)
      const endDate = new Date(dateFilter.endDate)
      matchesDate = transactionDate >= startDate && transactionDate <= endDate
    }
    
    return matchesSearch && matchesType && matchesDate
  })

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount)
  }

  // Summary totals derived from currently filtered dataset (not paginated)
  const summaryItems: SummaryCardItem[] = useMemo(() => {
    const inflow = filteredTransactions
      .filter((t: CashflowTransaction) => t.type === 'inflow')
      .reduce((acc: number, t: CashflowTransaction) => acc + t.amount, 0)
    const outflow = filteredTransactions
      .filter((t: CashflowTransaction) => t.type === 'outflow')
      .reduce((acc: number, t: CashflowTransaction) => acc + t.amount, 0)
    const net = inflow - outflow

    const inflowCount = filteredTransactions.filter((t: CashflowTransaction) => t.type === 'inflow').length
    const outflowCount = filteredTransactions.filter((t: CashflowTransaction) => t.type === 'outflow').length

    // Payment method breakdown (core methods commonly used in app)
    const byMethod = filteredTransactions.reduce<Record<string, number>>((acc: Record<string, number>, t: CashflowTransaction) => {
      acc[t.payment_method] = (acc[t.payment_method] || 0) + t.amount * (t.type === 'inflow' ? 1 : -1)
      return acc
    }, {})

    const items: SummaryCardItem[] = [
      { label: 'Total Inflow', primary: formatCurrency(inflow), secondary: `${inflowCount} inflow txns`, accentColor: '#198754' },
      { label: 'Total Outflow', primary: formatCurrency(outflow), secondary: `${outflowCount} outflow txns`, accentColor: '#dc3545' },
      { label: 'Net Cashflow', primary: formatCurrency(net), secondary: net >= 0 ? 'Surplus' : 'Deficit', accentColor: net >= 0 ? '#0d6efd' : '#dc3545' },
      { label: 'Transactions', primary: filteredTransactions.length.toString(), secondary: `${startIndex + 1}-${Math.min(endIndex, filteredTransactions.length)} shown` },
    ]

    // Add a couple of common method breakdown cards if present
    const commonMethods = ['Cash', 'Bank Transfer', 'UPI']
    for (const m of commonMethods) {
      if (byMethod[m] !== undefined) {
        items.push({ label: `${m} Net`, primary: formatCurrency(byMethod[m]), accentColor: byMethod[m] >= 0 ? '#198754' : '#dc3545' })
      }
    }

    return items
  }, [filteredTransactions, startIndex, endIndex])

  if (loading && transactions.length === 0) {
    return (
      <div style={{ padding: '20px' }}>
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: '100%' }}>
      <EnhancedHeader
        {...HeaderPatterns.cashflow(transactions.length)}
        showRefresh={true}
        onRefresh={handleRefresh}
        loading={loading}
      />

      {/* Enhanced Filter Options */}
      <EnhancedFilterBar 
        title="Cashflow Transaction Filters"
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
              setDateFilterWithURL({
                startDate: `${currentYear}-04-01`,
                endDate: `${currentYear + 1}-03-31`
              })
              setIsDateFilterActive(true)
            },
            icon: '📅',
            isActive: false
          },
          {
            id: 'cashOnly',
            label: 'Cash Only',
            action: () => {
              setPaymentMethodFilterWithURL('Cash')
            },
            icon: '💰',
            isActive: paymentMethodFilter === 'Cash'
          },
          {
            id: 'recentTransactions',
            label: 'Recent Transactions',
            action: () => {
              const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
              setDateFilterWithURL({
                startDate: thirtyDaysAgo,
                endDate: new Date().toISOString().slice(0, 10)
              })
              setIsDateFilterActive(true)
            },
            icon: '📋',
            isActive: false
          },
          {
            id: 'highValueTransactions',
            label: 'High Value (>50K)',
            action: () => {
              setAmountRangeFilterWithURL('50000-')
            },
            icon: '💰',
            isActive: amountRangeFilter === '50000-'
          },
          {
            id: 'inflowOnly',
            label: 'Inflow Only',
            action: () => {
              setTypeFilterWithURL('inflow')
            },
            icon: '📈',
            isActive: typeFilter === 'inflow'
          },
          {
            id: 'outflowOnly',
            label: 'Outflow Only',
            action: () => {
              setTypeFilterWithURL('outflow')
            },
            icon: '📉',
            isActive: typeFilter === 'outflow'
          }
        ]}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '12px', fontWeight: '500', color: '#495057' }}>Search</span>
          <input
            type="text"
            placeholder="Search transactions..."
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
          <span style={{ fontSize: '12px', fontWeight: '500', color: '#495057' }}>Type</span>
          <FilterDropdown
            value={typeFilter}
            onChange={(value) => {
              const newValue = Array.isArray(value) ? value[0] || 'all' : value
              setTypeFilterWithURL(newValue as 'all' | 'inflow' | 'outflow')
            }}
            options={[
              { value: 'all', label: 'All Transactions' },
              { value: 'inflow', label: 'Cash Inflow' },
              { value: 'outflow', label: 'Cash Outflow' }
            ]}
            placeholder="Select type"
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '12px', fontWeight: '500', color: '#495057' }}>Transaction Type</span>
          <FilterDropdown
            value={transactionTypeFilter}
            onChange={(value) => setTransactionTypeFilterWithURL(Array.isArray(value) ? value[0] || 'all' : value)}
            options={[
              { value: 'all', label: 'All Types' },
              { value: 'invoice_payment', label: 'Invoice Payment' },
              { value: 'purchase_payment', label: 'Purchase Payment' },
              { value: 'expense', label: 'Expense' },
              { value: 'income', label: 'Income' }
            ]}
            placeholder="Select transaction type"
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '12px', fontWeight: '500', color: '#495057' }}>Payment Method</span>
          <FilterDropdown
            value={paymentMethodFilter}
            onChange={(value) => setPaymentMethodFilterWithURL(Array.isArray(value) ? value[0] || 'all' : value)}
            options={[
              { value: 'all', label: 'All Methods' },
              { value: 'Cash', label: 'Cash' },
              { value: 'Bank Transfer', label: 'Bank Transfer' },
              { value: 'Cheque', label: 'Cheque' },
              { value: 'UPI', label: 'UPI' },
              { value: 'Credit Card', label: 'Credit Card' }
            ]}
            placeholder="Select payment method"
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '12px', fontWeight: '500', color: '#495057' }}>Account Head</span>
          <FilterDropdown
            value={accountHeadFilter}
            onChange={(value) => setAccountHeadFilterWithURL(Array.isArray(value) ? value[0] || 'all' : value)}
            options={[
              { value: 'all', label: 'All Accounts' },
              { value: 'Cash', label: 'Cash' },
              { value: 'Bank', label: 'Bank' },
              { value: 'Funds', label: 'Funds' }
            ]}
            placeholder="Select account head"
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
          <span style={{ fontSize: '12px', fontWeight: '500', color: '#495057' }}>Date</span>
          <DateFilter
            value={dateFilter}
            onChange={(newDateFilter) => {
              setDateFilterWithURL(newDateFilter)
              setIsDateFilterActive(true)
            }}
          />
        </div>
      </EnhancedFilterBar>

      {/* Summary totals based on filtered transactions */}
      <SummaryCardGrid items={summaryItems} />

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

      {/* Transactions Table */}
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
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Description</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Reference</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Payment Method</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Amount</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Account Head</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTransactions.map(transaction => (
              <tr key={transaction.id} style={{ 
                borderBottom: '1px solid #e9ecef',
                backgroundColor: 'white'
              }}>
                <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>
                  {new Date(transaction.transaction_date).toLocaleDateString()}
                </td>
                <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>
                  <span style={{ 
                    padding: '6px 12px', 
                    borderRadius: '6px', 
                    fontSize: '14px',
                    fontWeight: '500',
                    backgroundColor: transaction.type === 'inflow' ? '#d4edda' : '#f8d7da',
                    color: transaction.type === 'inflow' ? '#155724' : '#721c24'
                  }}>
                    {transaction.type === 'inflow' ? 'Cash Inflow' : 'Cash Outflow'}
                  </span>
                </td>
                <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>{transaction.description}</td>
                <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>{transaction.reference_number || '-'}</td>
                <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>{transaction.payment_method}</td>
                <td style={{ 
                  padding: '12px', 
                  borderRight: '1px solid #e9ecef',
                  color: transaction.type === 'inflow' ? '#28a745' : '#dc3545',
                  fontWeight: '600'
                }}>
                  {transaction.type === 'inflow' ? '+' : '-'}{formatCurrency(transaction.amount)}
                </td>
                <td style={{ padding: '12px' }}>{transaction.account_head}</td>
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
            Showing {startIndex + 1} to {Math.min(endIndex, filteredTransactions.length)} of {filteredTransactions.length} transactions
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

      {filteredTransactions.length === 0 && !loading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          color: '#6c757d',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          backgroundColor: '#f8f9fa'
        }}>
          <div style={{ fontSize: '18px', marginBottom: '8px', fontWeight: '500' }}>
            No transactions available
          </div>
          <div style={{ fontSize: '14px' }}>
            Transactions will appear here as you create invoices and payments
          </div>
        </div>
      )}
    </div>
  )
}
