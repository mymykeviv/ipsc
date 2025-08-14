import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../modules/AuthContext'
import { createApiErrorHandler } from '../lib/apiUtils'
import { apiListPurchases, apiListPurchasePayments, apiAddPurchasePayment, Purchase } from '../lib/api'
import { Button } from '../components/Button'

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
  const [vendorFilter, setVendorFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
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
    const matchesSearch = payment.purchase_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.reference_number?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesVendor = !vendorFilter || payment.vendor_name === vendorFilter
    const matchesDate = !dateFilter || payment.payment_date.startsWith(dateFilter)
    return matchesSearch && matchesVendor && matchesDate
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
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px',
        paddingBottom: '12px',
        borderBottom: '2px solid #e9ecef'
      }}>
        <h1 style={{ margin: '0', fontSize: '28px', fontWeight: '600', color: '#2c3e50' }}>Purchase Payments</h1>
        <Button variant="primary" onClick={() => navigate('/payments/purchase/add')}>
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
            placeholder="Search by purchase number, vendor, or reference..."
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
            value={vendorFilter}
            onChange={(e) => setVendorFilter(e.target.value)}
            style={{
              padding: '10px 16px',
              border: '1px solid #ced4da',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: 'white'
            }}
          >
            <option value="">All Vendors</option>
            {vendors.map(vendor => (
              <option key={vendor} value={vendor}>{vendor}</option>
            ))}
          </select>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{
              padding: '10px 16px',
              border: '1px solid #ced4da',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
        </div>
      </div>

      <div style={{ 
        border: '1px solid #e9ecef', 
        borderRadius: '8px', 
        overflow: 'hidden',
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
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <Button 
                      variant="secondary" 
                      onClick={() => navigate(`/purchases/edit/${payment.purchase_id}`)}
                      style={{ fontSize: '14px', padding: '6px 12px' }}
                    >
                      View Purchase
                    </Button>
                    <Button 
                      variant="secondary"
                      onClick={() => navigate(`/payments/purchase/add/${payment.purchase_id}`)}
                      style={{ fontSize: '14px', padding: '6px 12px' }}
                    >
                      Add Payment
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
