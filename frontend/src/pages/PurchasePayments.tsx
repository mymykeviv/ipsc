import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../modules/AuthContext'
import { createApiErrorHandler } from '../lib/apiUtils'
import { apiListPurchases, apiListPurchasePayments, apiAddPurchasePayment, Purchase } from '../lib/api'
import { Button } from '../components/Button'
import { EnhancedFilterBar } from '../components/EnhancedFilterBar'
import { FilterDropdown } from '../components/FilterDropdown'
import { DateFilter, DateRange } from '../components/DateFilter'
import { ActionButtons, ActionButtonSets } from '../components/ActionButtons'
import { EnhancedHeader, HeaderPatterns } from '../components/EnhancedHeader'

interface PurchasePayment {
  id: number
  purchase_id: number
  purchase_no: string
  vendor_name: string
  payment_date: string
  amount: number
  method: string
  reference_number: string | null
  notes: string | null
  total_paid: number
  outstanding: number
}

interface PurchasePaymentsProps {
  mode?: 'list'
}

export function PurchasePayments({ mode = 'list' }: PurchasePaymentsProps) {
  const navigate = useNavigate()
  const { token, forceLogout } = useAuth()
  const [purchasePayments, setPurchasePayments] = useState<PurchasePayment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [vendorFilter, setVendorFilter] = useState('all')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all')
  const [amountRangeFilter, setAmountRangeFilter] = useState('all')
  const [financialYearFilter, setFinancialYearFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState<DateRange>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10)
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Create error handler that will automatically log out on 401 errors
  const handleApiError = createApiErrorHandler(forceLogout)

  useEffect(() => {
    if (mode === 'list') {
      loadPurchasePayments()
    }
  }, [mode])

  const loadPurchasePayments = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get all purchases
      const purchases = await apiListPurchases()
      const payments: PurchasePayment[] = []
      
      // Get payments for each purchase
      for (const purchase of purchases) {
        try {
          const paymentData = await apiListPurchasePayments(purchase.id)
          
          // Create payment records from the payment data
          paymentData.payments.forEach(payment => {
            payments.push({
              id: payment.id,
              purchase_id: purchase.id,
              purchase_no: purchase.purchase_no,
              vendor_name: purchase.vendor_name,
              payment_date: payment.payment_date,
              amount: payment.amount,
              method: payment.method,
              reference_number: payment.reference_number,
              notes: payment.notes,
              total_paid: paymentData.total_paid,
              outstanding: paymentData.outstanding
            })
          })
          
          // If no payments exist but purchase has outstanding amount, show as unpaid
          if (paymentData.payments.length === 0 && purchase.grand_total > 0) {
            payments.push({
              id: purchase.id * -1, // Negative ID to indicate no payment record
              purchase_id: purchase.id,
              purchase_no: purchase.purchase_no,
              vendor_name: purchase.vendor_name,
              payment_date: purchase.date,
              amount: 0,
              method: 'Not Paid',
              reference_number: null,
              notes: 'No payments recorded',
              total_paid: 0,
              outstanding: purchase.grand_total
            })
          }
        } catch (err: any) {
          console.error(`Failed to load payments for purchase ${purchase.id}:`, err)
          // Continue with other purchases even if one fails
        }
      }
      
      setPurchasePayments(payments)
    } catch (err: any) {
      handleApiError(err)
      setError('Failed to load purchase payments')
    } finally {
      setLoading(false)
    }
  }

  // Filter payments
  const filteredPayments = purchasePayments.filter(payment => {
    const matchesSearch = !searchTerm || 
      payment.purchase_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.reference_number?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesVendor = vendorFilter === 'all' || payment.vendor_name === vendorFilter
    
    const matchesPaymentMethod = paymentMethodFilter === 'all' || 
      payment.method.toLowerCase() === paymentMethodFilter.toLowerCase()
    
    const matchesAmountRange = amountRangeFilter === 'all' || (() => {
      const [min, max] = amountRangeFilter.split('-').map(Number)
      if (max) {
        return payment.amount >= min && payment.amount <= max
      } else {
        return payment.amount >= min
      }
    })()
    
    const matchesFinancialYear = financialYearFilter === 'all' || (() => {
      const paymentYear = new Date(payment.payment_date).getFullYear()
      const [startYear] = financialYearFilter.split('-').map(Number)
      return paymentYear === startYear
    })()
    
    // Date filtering is handled by the DateFilter component
    const paymentDate = new Date(payment.payment_date)
    const startDate = new Date(dateFilter.startDate)
    const endDate = new Date(dateFilter.endDate)
    const matchesDate = paymentDate >= startDate && paymentDate <= endDate
    
    return matchesSearch && matchesVendor && matchesPaymentMethod && matchesAmountRange && matchesFinancialYear && matchesDate
  })

  // Sort by payment date (latest first)
  const sortedPayments = filteredPayments.sort((a, b) => 
    new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
  )

  // Pagination
  const totalPages = Math.ceil(sortedPayments.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedPayments = sortedPayments.slice(startIndex, endIndex)

  // Get unique vendors for filter
  const vendors = [...new Set(purchasePayments.map(p => p.vendor_name))]

  return (
    <div style={{ padding: '20px', maxWidth: '100%' }}>
      <EnhancedHeader
        {...HeaderPatterns.purchasePayments(purchasePayments.length)}
        primaryAction={{
          label: 'Add Payment',
          onClick: () => navigate('/payments/purchase/add'),
          icon: '💰'
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
        title="Purchase Payment Filters"
        activeFiltersCount={
          (searchTerm ? 1 : 0) +
          (vendorFilter !== 'all' ? 1 : 0) +
          (paymentMethodFilter !== 'all' ? 1 : 0) +
          (amountRangeFilter !== 'all' ? 1 : 0) +
          (financialYearFilter !== 'all' ? 1 : 0) +
          0 // DateFilter is always active now
        }
        onClearAll={() => {
          setSearchTerm('')
          setVendorFilter('all')
          setPaymentMethodFilter('all')
          setAmountRangeFilter('all')
          setFinancialYearFilter('all')
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
            placeholder="Search by purchase number, vendor, or reference..."
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
          <span style={{ fontSize: '12px', fontWeight: '500', color: '#495057' }}>Vendor</span>
          <FilterDropdown
            value={vendorFilter}
            onChange={(value) => setVendorFilter(Array.isArray(value) ? value[0] || 'all' : value)}
            options={[
              { value: 'all', label: 'All Vendors' },
              ...vendors.map(vendor => ({ 
                value: vendor, 
                label: vendor 
              }))
            ]}
            placeholder="Select vendor"
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
            />
        </div>
      </EnhancedFilterBar>

      <div style={{ 
        border: '1px solid #e9ecef', 
        borderRadius: '8px', 
        overflow: 'visible',
        backgroundColor: 'white'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #e9ecef' }}>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Purchase No</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Vendor</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Payment Date</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Amount</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Method</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Reference</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Total Paid</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Outstanding</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedPayments.map(payment => (
              <tr key={payment.id} style={{ 
                borderBottom: '1px solid #e9ecef',
                backgroundColor: 'white'
              }}>
                <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>{payment.purchase_no}</td>
                <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>{payment.vendor_name}</td>
                <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>{new Date(payment.payment_date).toLocaleDateString()}</td>
                <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>₹{payment.amount.toFixed(2)}</td>
                <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>{payment.method}</td>
                <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>{payment.reference_number || '-'}</td>
                <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>₹{payment.total_paid.toFixed(2)}</td>
                <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>
                  <span style={{
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    fontSize: '12px',
                    fontWeight: '500',
                    backgroundColor: payment.outstanding > 0 ? '#fff3cd' : '#d4edda',
                    color: payment.outstanding > 0 ? '#856404' : '#155724'
                  }}>
                    ₹{payment.outstanding.toFixed(2)}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  <ActionButtons
                    {...ActionButtonSets.purchasePayments(payment, {
                      onViewPurchase: () => navigate(`/purchases/edit/${payment.purchase_id}`),
                      onAddPayment: () => navigate(`/payments/purchase/add/${payment.purchase_id}`)
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
            Showing {startIndex + 1} to {Math.min(endIndex, sortedPayments.length)} of {sortedPayments.length} payments
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

      {paginatedPayments.length === 0 && !loading && (
        <div style={{
          textAlign: 'center', 
          padding: '40px', 
          color: '#6c757d',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          backgroundColor: '#f8f9fa'
        }}>
          <div style={{ fontSize: '18px', marginBottom: '8px', fontWeight: '500' }}>
            No purchase payments available
          </div>
          <div style={{ fontSize: '14px' }}>
            Add payments to purchases to see them here
          </div>
        </div>
      )}
    </div>
  )
}
