import { useEffect, useState } from 'react'
import { useAuth } from '../modules/AuthContext'
import { 
  apiGetCashflowTransactions,
  CashflowTransaction
} from '../lib/api'
import { Button } from '../components/Button'
import { DateFilter, DateRange } from '../components/DateFilter'
import { FilterDropdown } from '../components/FilterDropdown'
import { EnhancedFilterBar } from '../components/EnhancedFilterBar'
import { EnhancedHeader, HeaderPatterns } from '../components/EnhancedHeader'

export function Cashflow() {
  const { token } = useAuth()
  const [transactions, setTransactions] = useState<CashflowTransaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'inflow' | 'outflow'>('all')
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<string>('all')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all')
  const [accountHeadFilter, setAccountHeadFilter] = useState<string>('all')
  const [amountRangeFilter, setAmountRangeFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<DateRange>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10)
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(25)

  useEffect(() => {
    if (!token) return
    loadTransactions()
  }, [token])

  // Reload transactions when filters change
  useEffect(() => {
    if (token) {
      loadTransactions()
    }
  }, [searchTerm, typeFilter, transactionTypeFilter, paymentMethodFilter, accountHeadFilter, amountRangeFilter, dateFilter, currentPage])

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
      // Always use the date range from the DateFilter component
      params.append('start_date', dateFilter.startDate)
      params.append('end_date', dateFilter.endDate)
      
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

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.payment_method.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || transaction.type === typeFilter
    
    // Date filtering using DateRange
    const transactionDate = new Date(transaction.transaction_date)
    const startDate = new Date(dateFilter.startDate)
    const endDate = new Date(dateFilter.endDate)
    const matchesDate = transactionDate >= startDate && transactionDate <= endDate
    
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
        activeFiltersCount={
          (searchTerm ? 1 : 0) +
          (typeFilter !== 'all' ? 1 : 0) +
          (transactionTypeFilter !== 'all' ? 1 : 0) +
          (paymentMethodFilter !== 'all' ? 1 : 0) +
          (accountHeadFilter !== 'all' ? 1 : 0) +
          (amountRangeFilter !== 'all' ? 1 : 0) +
          1 // Date filter is always active
        }
        onClearAll={() => {
          setSearchTerm('')
          setTypeFilter('all')
          setTransactionTypeFilter('all')
          setPaymentMethodFilter('all')
          setAccountHeadFilter('all')
          setAmountRangeFilter('all')
          setDateFilter({
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
            endDate: new Date().toISOString().slice(0, 10)
          })
        }}
        showQuickActions={true}
        quickActions={[
          {
            label: 'Current FY',
            action: () => {
              const currentYear = new Date().getFullYear()
              setDateFilter({
                startDate: `${currentYear}-04-01`,
                endDate: `${currentYear + 1}-03-31`
              })
            },
            icon: '📅'
          },
          {
            label: 'Cash Only',
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
            placeholder="Search transactions..."
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
          <span style={{ fontSize: '12px', fontWeight: '500', color: '#495057' }}>Type</span>
          <FilterDropdown
            value={typeFilter}
            onChange={(value) => {
              const newValue = Array.isArray(value) ? value[0] || 'all' : value
              setTypeFilter(newValue as 'all' | 'inflow' | 'outflow')
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
            onChange={(value) => setTransactionTypeFilter(Array.isArray(value) ? value[0] || 'all' : value)}
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
            onChange={(value) => setPaymentMethodFilter(Array.isArray(value) ? value[0] || 'all' : value)}
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
            onChange={(value) => setAccountHeadFilter(Array.isArray(value) ? value[0] || 'all' : value)}
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
          <span style={{ fontSize: '12px', fontWeight: '500', color: '#495057' }}>Date</span>
          <DateFilter
            value={dateFilter}
            onChange={setDateFilter}
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
