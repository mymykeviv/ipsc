import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../modules/AuthContext'
import { createApiErrorHandler } from '../lib/apiUtils'
import { Button } from '../components/Button'
import { PaymentForm } from '../components/PaymentForm'
import { Modal } from '../components/Modal'
import { Payment, apiGetAllInvoicePayments, apiGetInvoicePaymentsSummary, type InvoicePaymentSummaryTotals, type InvoicePaymentFilters } from '../lib/api'
import { SummaryCardGrid, type SummaryCardItem } from '../components/common/SummaryCardGrid'
import { EnhancedFilterBar } from '../components/EnhancedFilterBar'
import { FilterDropdown } from '../components/FilterDropdown'
import { DateFilter, DateRange } from '../components/DateFilter'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { useFilterNavigation } from '../utils/filterNavigation'
import { useFilterReset } from '../hooks/useFilterReset'
import { getDefaultFilterState } from '../config/defaultFilterStates'

interface PaymentsProps {
  mode?: 'add' | 'edit' | 'list'
  type?: 'purchase' | 'invoice'
}

export function Payments({ mode = 'add', type = 'purchase' }: PaymentsProps) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { token, forceLogout } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(false)
  // Backend summary state (INR-only)
  const [summaryTotals, setSummaryTotals] = useState<InvoicePaymentSummaryTotals | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryError, setSummaryError] = useState<string | null>(null)
  const [invoices, setInvoices] = useState<any[]>([])
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)

  // Enhanced Filter System - Unified State Management
  const defaultState = getDefaultFilterState('payments') as {
    invoiceNumberFilter: string
    paymentAmountFilter: string
    paymentMethodFilter: string
    financialYearFilter: string
    dateFilter: DateRange
  }
  const { getFiltersFromURL, updateURLWithFilters, clearURLFilters } = useFilterNavigation(defaultState)
  const { resetAllFilters, getActiveFilterCount } = useFilterReset({
    pageName: 'payments',
    onReset: (newState) => {
      // Update all filter states
      setInvoiceNumberFilter(newState.invoiceNumberFilter)
      setPaymentAmountFilter(newState.paymentAmountFilter)
      setPaymentMethodFilter(newState.paymentMethodFilter)
      setFinancialYearFilter(newState.financialYearFilter)
      setDateFilter(newState.dateFilter)
    }
  })

  // Filter states with URL integration
  const [invoiceNumberFilter, setInvoiceNumberFilter] = useState<string>(defaultState.invoiceNumberFilter)
  const [paymentAmountFilter, setPaymentAmountFilter] = useState<string>(defaultState.paymentAmountFilter)
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>(defaultState.paymentMethodFilter)
  const [financialYearFilter, setFinancialYearFilter] = useState<string>(defaultState.financialYearFilter)
  const [dateFilter, setDateFilter] = useState<DateRange>(defaultState.dateFilter)
  const [isDateFilterActive, setIsDateFilterActive] = useState(false)

  // Create error handler that will automatically log out on 401 errors (memoized)
  const handleApiError = useMemo(() => createApiErrorHandler(() => forceLogout()), [forceLogout])

  // URL Parameter Integration - Apply filters from URL on component mount
  useEffect(() => {
    if (mode === 'list') {
      const urlFilters = getFiltersFromURL()
      
      // Apply URL filters to state
      if (urlFilters.invoiceNumberFilter) setInvoiceNumberFilter(urlFilters.invoiceNumberFilter)
      if (urlFilters.paymentAmountFilter) setPaymentAmountFilter(urlFilters.paymentAmountFilter)
      if (urlFilters.paymentMethodFilter) setPaymentMethodFilter(urlFilters.paymentMethodFilter)
      if (urlFilters.financialYearFilter) setFinancialYearFilter(urlFilters.financialYearFilter)
      if (urlFilters.dateFilter) setDateFilter(urlFilters.dateFilter)
    }
  }, [mode, getFiltersFromURL])

  // Update URL when filters change
  const updateFiltersAndURL = useCallback((newFilters: Partial<typeof defaultState>) => {
    const currentFilters = {
      invoiceNumberFilter,
      paymentAmountFilter,
      paymentMethodFilter,
      financialYearFilter,
      dateFilter
    }
    
    const updatedFilters = { ...currentFilters, ...newFilters }
    updateURLWithFilters(updatedFilters)
  }, [invoiceNumberFilter, paymentAmountFilter, paymentMethodFilter, 
      financialYearFilter, dateFilter, updateURLWithFilters])

  // Enhanced filter setters with URL integration
  const setInvoiceNumberFilterWithURL = useCallback((value: string) => {
    setInvoiceNumberFilter(value)
    updateFiltersAndURL({ invoiceNumberFilter: value })
  }, [updateFiltersAndURL])

  const setPaymentAmountFilterWithURL = useCallback((value: string) => {
    setPaymentAmountFilter(value)
    updateFiltersAndURL({ paymentAmountFilter: value })
  }, [updateFiltersAndURL])

  const setPaymentMethodFilterWithURL = useCallback((value: string) => {
    setPaymentMethodFilter(value)
    updateFiltersAndURL({ paymentMethodFilter: value })
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
      invoiceNumberFilter,
      paymentAmountFilter,
      paymentMethodFilter,
      financialYearFilter,
      dateFilter
    }
    
    const newState = resetAllFilters(currentState)
    
    // Update all filter states
    setInvoiceNumberFilter(newState.invoiceNumberFilter)
    setPaymentAmountFilter(newState.paymentAmountFilter)
    setPaymentMethodFilter(newState.paymentMethodFilter)
    setFinancialYearFilter(newState.financialYearFilter)
    setDateFilter(newState.dateFilter)
  }, [invoiceNumberFilter, paymentAmountFilter, paymentMethodFilter, 
      financialYearFilter, dateFilter, resetAllFilters])

  // Get active filter count
  const activeFilterCount = getActiveFilterCount({
    invoiceNumberFilter,
    paymentAmountFilter,
    paymentMethodFilter,
    financialYearFilter,
    dateFilter
  })

  useEffect(() => {
    if (!token) {
      // If no token, redirect to login
      navigate('/login')
      return
    }
    
    if (mode === 'list' && type === 'invoice') {
      loadInvoicePayments()
    }
  }, [mode, type, token, navigate])

  // Fetch backend summary when filters change for invoice payments list
  useEffect(() => {
    if (!token) return
    if (!(mode === 'list' && type === 'invoice')) return

    const fetchSummary = async () => {
      try {
        setSummaryLoading(true)
        setSummaryError(null)

        // Build filters for summary API
        const filters: Partial<InvoicePaymentFilters> = {}

        // Invoice number search (exact match acceptable for backend generic search)
        if (invoiceNumberFilter && invoiceNumberFilter !== 'all') {
          filters.search = invoiceNumberFilter
        }

        // Payment method
        if (paymentMethodFilter && paymentMethodFilter !== 'all') {
          filters.payment_method = paymentMethodFilter
        }

        // Amount range
        if (paymentAmountFilter && paymentAmountFilter !== 'all') {
          const [minStr, maxStr] = paymentAmountFilter.split('-')
          if (minStr) filters.amount_min = Number(minStr)
          if (maxStr) filters.amount_max = Number(maxStr)
        }

        // Date range: prefer explicit date filter when active
        if (isDateFilterActive && dateFilter?.startDate && dateFilter?.endDate) {
          filters.date_from = dateFilter.startDate
          filters.date_to = dateFilter.endDate
        } else if (financialYearFilter && financialYearFilter !== 'all') {
          // Map FY like "2024-2025" -> 2024-04-01 to 2025-03-31
          const [startYearStr, endYearStr] = financialYearFilter.split('-')
          const startYear = Number(startYearStr)
          const endYear = Number(endYearStr)
          if (!Number.isNaN(startYear) && !Number.isNaN(endYear)) {
            filters.date_from = `${startYear}-04-01`
            filters.date_to = `${endYear}-03-31`
          }
        }

        const resp = await apiGetInvoicePaymentsSummary(filters)
        setSummaryTotals(resp?.meta?.totals ?? null)
      } catch (e: any) {
        setSummaryError(e?.message || 'Failed to load payment summary')
        setSummaryTotals(null)
      } finally {
        setSummaryLoading(false)
      }
    }

    fetchSummary()
  }, [mode, type, token, invoiceNumberFilter, paymentAmountFilter, paymentMethodFilter, financialYearFilter, dateFilter, isDateFilterActive])

  const loadInvoicePayments = async () => {
    try {
      setLoading(true)
      // First load invoices to get invoice numbers
      const invoicesResponse = await fetch('/api/invoices', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (invoicesResponse.ok) {
        const invoicesData = await invoicesResponse.json()
        setInvoices(invoicesData.invoices)
      }
      
      const data = await apiGetAllInvoicePayments()
      setPayments(data)
      setFilteredPayments(data)
    } catch (err: any) {
      const errorMessage = handleApiError(err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Filter payments based on selected filters
  useEffect(() => {
    let filtered = payments

    if (invoiceNumberFilter !== 'all') {
      const invoice = invoices.find(inv => inv.invoice_no === invoiceNumberFilter)
      if (invoice) {
        filtered = filtered.filter(payment => payment.invoice_id === invoice.id)
      }
    }

    if (paymentAmountFilter !== 'all') {
      const [min, max] = paymentAmountFilter.split('-').map(Number)
      filtered = filtered.filter(payment => {
        if (max) {
          return payment.payment_amount >= min && payment.payment_amount <= max
        } else {
          return payment.payment_amount >= min
        }
      })
    }

    if (paymentMethodFilter !== 'all') {
      filtered = filtered.filter(payment => 
        payment.payment_method.toLowerCase() === paymentMethodFilter.toLowerCase()
      )
    }

    if (financialYearFilter !== 'all') {
      filtered = filtered.filter(payment => {
        const paymentYear = new Date(payment.payment_date).getFullYear()
        const [startYear] = financialYearFilter.split('-').map(Number)
        return paymentYear === startYear
      })
    }

    // Date filtering is handled by the DateFilter component
    // Filter payments based on date range only when date filter is active
    if (isDateFilterActive) {
      filtered = filtered.filter(payment => {
        const paymentDate = new Date(payment.payment_date)
        const startDate = new Date(dateFilter.startDate)
        const endDate = new Date(dateFilter.endDate)
        return paymentDate >= startDate && paymentDate <= endDate
      })
    }

    setFilteredPayments(filtered)
  }, [payments, invoices, invoiceNumberFilter, paymentAmountFilter, paymentMethodFilter, financialYearFilter, dateFilter, isDateFilterActive])

  // Summary totals for Invoice Payments (from backend API - INR only)
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount)

  const summaryItems: SummaryCardItem[] = summaryTotals ? [
    {
      label: 'Total Paid',
      primary: formatCurrency(summaryTotals.total_paid || 0),
      secondary: `${(summaryTotals.payment_count || 0).toLocaleString('en-IN')} Payments`,
      accentColor: '#198754',
    },
    {
      label: 'Cash',
      primary: formatCurrency(summaryTotals.cash_amount || 0),
      secondary: `${(summaryTotals.cash_count || 0).toLocaleString('en-IN')} Payments`,
      accentColor: '#0d6efd',
    },
    {
      label: 'Bank Transfer',
      primary: formatCurrency(summaryTotals.bank_transfer_amount || 0),
      secondary: `${(summaryTotals.bank_transfer_count || 0).toLocaleString('en-IN')} Payments`,
      accentColor: '#6f42c1',
    },
    {
      label: 'UPI',
      primary: formatCurrency(summaryTotals.upi_amount || 0),
      secondary: `${(summaryTotals.upi_count || 0).toLocaleString('en-IN')} Payments`,
      accentColor: '#fd7e14',
    },
  ] : []

  const getInvoiceNumber = (invoiceId: number) => {
    const invoice = invoices.find(inv => inv.id === invoiceId)
    return invoice ? invoice.invoice_no : `Invoice #${invoiceId}`
  }

  const handleSuccess = () => {
    if (mode === 'list') {
      // If in list mode, refresh the payments list
      loadInvoicePayments()
    } else {
      // If in add/edit mode, navigate back
      if (type === 'purchase') {
        navigate('/purchases')
      } else {
        navigate('/invoices')
      }
    }
  }

  const handleCancel = () => {
    if (type === 'purchase') {
      navigate('/purchases')
    } else {
      navigate('/invoices')
    }
  }

  // List mode for invoice payments
  if (mode === 'list' && type === 'invoice') {
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
            Invoice Payments
          </h1>
          <Button variant="primary" onClick={() => navigate('/payments/invoice/add')}>
            Add Payment
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

        {/* Enhanced Filter Options */}
        <EnhancedFilterBar 
          title="Invoice Payment Filters"
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
              id: 'recentPayments',
              label: 'Recent Payments',
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
              id: 'highValuePayments',
              label: 'High Value (>10K)',
              action: () => {
                setPaymentAmountFilterWithURL('10000-')
              },
              icon: '💰',
              isActive: paymentAmountFilter === '10000-'
            }
          ]}
        >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: '500', color: '#495057' }}>Invoice Number</span>
            <FilterDropdown
              value={invoiceNumberFilter}
              onChange={(value) => setInvoiceNumberFilterWithURL(Array.isArray(value) ? value[0] || 'all' : value)}
              options={[
                { value: 'all', label: 'All Invoices' },
                ...invoices.map(invoice => ({ 
                  value: invoice.invoice_no, 
                  label: invoice.invoice_no 
                }))
              ]}
              placeholder="Select invoice"
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: '500', color: '#495057' }}>Payment Amount</span>
            <FilterDropdown
              value={paymentAmountFilter}
              onChange={(value) => setPaymentAmountFilterWithURL(Array.isArray(value) ? value[0] || 'all' : value)}
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
              onChange={(newDateFilter) => {
                setDateFilterWithURL(newDateFilter)
                setIsDateFilterActive(true)
              }}
            />
          </div>
        </EnhancedFilterBar>

        {/* Summary Totals (Backend, INR-only) */}
        <div style={{ margin: '16px 0 20px 0' }}>
          {summaryLoading && (
            <div style={{ fontSize: '14px', color: '#6c757d' }}>Loading summary…</div>
          )}
          {summaryError && (
            <div style={{ padding: '8px 12px', background: '#fff3cd', border: '1px solid #ffe69c', borderRadius: 6, color: '#664d03', fontSize: 13 }}>
              {summaryError}
            </div>
          )}
          {!summaryLoading && !summaryError && summaryItems.length > 0 && (
            <SummaryCardGrid items={summaryItems} columnsMin={220} gapPx={12} />
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div>Loading payments...</div>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            color: '#6c757d',
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            backgroundColor: '#f8f9fa'
          }}>
            <div style={{ fontSize: '18px', marginBottom: '8px', fontWeight: '500' }}>
              No invoice payments found
            </div>
                          <div style={{ fontSize: '14px' }}>
                {payments.length === 0 ? 'Add your first invoice payment to get started' : 'No payments match the selected filters'}
              </div>
          </div>
        ) : (
          <>
          <div style={{ 
            border: '1px solid #e9ecef', 
            borderRadius: '8px', 
            overflow: 'visible',
            backgroundColor: 'white'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #e9ecef' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Invoice</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Payment Date</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Amount</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Payment Method</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Reference</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map(payment => (
                  <tr key={payment.id} style={{ 
                    borderBottom: '1px solid #e9ecef',
                    backgroundColor: 'white'
                  }}>
                    <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>
                      {getInvoiceNumber(payment.invoice_id)}
                    </td>
                    <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>
                      ₹{payment.payment_amount.toFixed(2)}
                    </td>
                    <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>
                      {payment.payment_method}
                    </td>
                    <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>
                      {payment.reference_number || '-'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Button 
                          variant="secondary"
                          onClick={() => {
                            setSelectedPayment(payment)
                            setIsViewOpen(true)
                          }}
                          style={{ fontSize: '14px', padding: '6px 12px' }}
                        >
                          View
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Styled View Modal */}
          <Modal 
            isOpen={isViewOpen} 
            onClose={() => setIsViewOpen(false)} 
            title="Payment Details"
            size="small"
          >
            {selectedPayment && (
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', rowGap: '10px', columnGap: '12px', fontSize: '14px' }}>
                <div style={{ color: '#6b7280' }}>Invoice</div>
                <div style={{ fontWeight: 500 }}>{getInvoiceNumber(selectedPayment.invoice_id)}</div>

                <div style={{ color: '#6b7280' }}>Date</div>
                <div>{new Date(selectedPayment.payment_date).toLocaleDateString()}</div>

                <div style={{ color: '#6b7280' }}>Amount</div>
                <div>₹{selectedPayment.payment_amount.toFixed(2)}</div>

                <div style={{ color: '#6b7280' }}>Method</div>
                <div>{selectedPayment.payment_method}</div>

                <div style={{ color: '#6b7280' }}>Reference</div>
                <div>{selectedPayment.reference_number || 'N/A'}</div>

                <div style={{ color: '#6b7280' }}>Notes</div>
                <div>{selectedPayment.notes || 'N/A'}</div>

                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <Button variant="primary" onClick={() => setIsViewOpen(false)}>Close</Button>
                </div>
              </div>
            )}
          </Modal>
          </>
        )}
      </div>
    )
  }

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
          {mode === 'add' ? 'Add' : 'Edit'} {type === 'purchase' ? 'Purchase' : 'Invoice'} Payment
          {id && ` for ${type === 'purchase' ? 'Purchase' : 'Invoice'} #${id}`}
        </h1>
        <Button variant="secondary" onClick={handleCancel}>
          ← Back to {type === 'purchase' ? 'Purchases' : 'Invoices'}
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

      <ErrorBoundary>
        <PaymentForm 
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          type={type}
          purchaseId={type === 'purchase' && id ? parseInt(id) : undefined}
          invoiceId={type === 'invoice' && id ? parseInt(id) : undefined}
        />
      </ErrorBoundary>
    </div>
  )
}
