import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../modules/AuthContext'
import { createApiErrorHandler } from '../lib/apiUtils'
import { 
  apiCreatePurchase, 
  apiListPurchases, 
  apiGetPurchase, 
  apiDeletePurchase,
  apiListParties, 
  apiGetProducts,
  Purchase,
  Party, 
  Product,
  PurchaseCreate
} from '../lib/api'
import { Button } from '../components/Button'
import { PurchaseForm } from '../components/PurchaseForm'
import { formStyles, getSectionHeaderColor } from '../utils/formStyles'

interface PurchasesProps {
  mode?: 'manage' | 'add' | 'edit' | 'payments' | 'add-payment'
}

export function Purchases({ mode = 'manage' }: PurchasesProps) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { token, forceLogout } = useAuth()
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [vendors, setVendors] = useState<Party[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [currentPurchase, setCurrentPurchase] = useState<Purchase | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Create error handler that will automatically log out on 401 errors
  const handleApiError = createApiErrorHandler(forceLogout)

  // Form state for payment
  const [paymentForm, setPaymentForm] = useState({
    payment_amount: 0,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'Cash',
    payment_notes: ''
  })

  useEffect(() => {
    if (mode === 'manage') {
      loadPurchases()
    } else if (mode === 'edit' && id) {
      loadPurchase(parseInt(id))
    } else if (mode === 'add-payment' && id) {
      loadPurchase(parseInt(id))
    } else if (mode === 'add') {
      loadVendorsAndProducts()
      setLoading(false)
    }
  }, [mode, id])

  const loadPurchases = async () => {
    try {
      setLoading(true)
      setError(null)
      const purchasesData = await apiListPurchases(searchTerm, statusFilter)
      setPurchases(purchasesData)
    } catch (err: any) {
      handleApiError(err)
      setError('Failed to load purchases')
    } finally {
      setLoading(false)
    }
  }

  const loadPurchase = async (purchaseId: number) => {
    try {
      setLoading(true)
      const data = await apiListPurchases('', '') // Get all purchases to find the specific one
      const purchase = data.find(p => p.id === purchaseId)
      if (purchase) {
        setCurrentPurchase(purchase)
        if (mode === 'add-payment') {
          setPaymentForm({
            payment_amount: purchase.grand_total,
            payment_date: new Date().toISOString().split('T')[0],
            payment_method: 'Cash',
            payment_notes: ''
          })
        }
      } else {
        setError('Purchase not found')
      }
    } catch (err: any) {
      handleApiError(err)
      setError('Failed to load purchase')
    } finally {
      setLoading(false)
    }
  }

  const loadVendorsAndProducts = async () => {
    try {
      const [vendorsData, productsData] = await Promise.all([
        apiListParties(),
        apiGetProducts()
      ])
      setVendors(vendorsData.filter(p => p.type === 'vendor'))
      setProducts(productsData)
    } catch (err: any) {
      handleApiError(err)
    }
  }

  const handleDeletePurchase = async (id: number) => {
    if (!confirm('Are you sure you want to delete this purchase?')) return

    try {
      setLoading(true)
      setError(null)
      await apiDeletePurchase(id)
      loadPurchases()
    } catch (err: any) {
      handleApiError(err)
      setError('Failed to delete purchase')
    } finally {
      setLoading(false)
    }
  }

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPurchase || paymentForm.payment_amount <= 0) return
    
    try {
      setLoading(true)
      // TODO: Implement purchase payment API
      alert('Purchase payment functionality will be implemented here.')
      navigate('/purchases')
    } catch (err: any) {
      handleApiError(err)
      setError('Failed to add payment')
    } finally {
      setLoading(false)
    }
  }

  // Render different content based on mode
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
            {mode === 'add' ? 'Add New Purchase' : 'Edit Purchase'}
          </h1>
          <Button variant="secondary" onClick={() => navigate('/purchases')}>
            ← Back to Purchases
          </Button>
        </div>
        
        <PurchaseForm 
          onSuccess={() => navigate('/purchases')}
          onCancel={() => navigate('/purchases')}
          purchaseId={mode === 'edit' ? parseInt(id!) : undefined}
          initialData={mode === 'edit' ? currentPurchase : undefined}
        />
      </div>
    )
  }

  if (mode === 'payments') {
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
            Purchase Payments
          </h1>
          <Button variant="secondary" onClick={() => navigate('/purchases')}>
            ← Back to Purchases
          </Button>
        </div>
        
        <div style={{ 
          padding: '20px', 
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          backgroundColor: '#f8f9fa'
        }}>
          <p style={{ margin: '0', color: '#6c757d' }}>
            Purchase payment management functionality will be implemented here.
          </p>
        </div>
      </div>
    )
  }

  if (mode === 'add-payment') {
    if (loading) {
      return (
        <div style={{ padding: '20px' }}>
          <div>Loading...</div>
        </div>
      )
    }

    if (!currentPurchase) {
      return (
        <div style={{ padding: '20px' }}>
          <div>Purchase not found</div>
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
            Add Payment for Purchase {currentPurchase.purchase_no}
          </h1>
          <Button variant="secondary" onClick={() => navigate('/purchases')}>
            ← Back to Purchases
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

        <form onSubmit={handleAddPayment} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Purchase Details Section */}
          <div style={formStyles.section}>
            <h2 style={{ ...formStyles.sectionHeader, backgroundColor: getSectionHeaderColor('basic') }}>
              📦 Purchase Details
            </h2>
            <div style={formStyles.grid}>
              <div style={formStyles.grid2Col}>
                <div style={formStyles.formGroup}>
                  <label style={formStyles.label}>Purchase Number</label>
                  <input
                    type="text"
                    value={currentPurchase.purchase_no}
                    disabled
                    style={{ ...formStyles.input, backgroundColor: '#f8f9fa' }}
                  />
                </div>
                <div style={formStyles.formGroup}>
                  <label style={formStyles.label}>Vendor</label>
                  <input
                    type="text"
                    value={currentPurchase.vendor_name}
                    disabled
                    style={{ ...formStyles.input, backgroundColor: '#f8f9fa' }}
                  />
                </div>
              </div>
              <div style={formStyles.grid2Col}>
                <div style={formStyles.formGroup}>
                  <label style={formStyles.label}>Purchase Amount</label>
                  <input
                    type="text"
                    value={`₹${currentPurchase.grand_total.toFixed(2)}`}
                    disabled
                    style={{ ...formStyles.input, backgroundColor: '#f8f9fa' }}
                  />
                </div>
                <div style={formStyles.formGroup}>
                  <label style={formStyles.label}>Due Date</label>
                  <input
                    type="text"
                    value={new Date(currentPurchase.due_date).toLocaleDateString()}
                    disabled
                    style={{ ...formStyles.input, backgroundColor: '#f8f9fa' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Details Section */}
          <div style={formStyles.section}>
            <h2 style={{ ...formStyles.sectionHeader, backgroundColor: getSectionHeaderColor('payment') }}>
              💰 Payment Details
            </h2>
            <div style={formStyles.grid}>
              <div style={formStyles.grid2Col}>
                <div style={formStyles.formGroup}>
                  <label style={formStyles.label}>Payment Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={currentPurchase.grand_total}
                    value={paymentForm.payment_amount}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_amount: Number(e.target.value) }))}
                    style={formStyles.input}
                    required
                  />
                </div>
                <div style={formStyles.formGroup}>
                  <label style={formStyles.label}>Payment Date *</label>
                  <input
                    type="date"
                    value={paymentForm.payment_date}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_date: e.target.value }))}
                    style={formStyles.input}
                    required
                  />
                </div>
              </div>
              
              <div style={formStyles.formGroup}>
                <label style={formStyles.label}>Payment Method *</label>
                <select
                  value={paymentForm.payment_method}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_method: e.target.value }))}
                  style={formStyles.select}
                  required
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                  <option value="UPI">UPI</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                </select>
              </div>

              <div style={formStyles.formGroup}>
                <label style={formStyles.label}>Payment Notes (Optional)</label>
                <textarea
                  value={paymentForm.payment_notes}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_notes: e.target.value }))}
                  maxLength={200}
                  rows={3}
                  style={formStyles.textarea}
                  placeholder="Enter payment notes (max 200 characters)"
                />
                <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                  {paymentForm.payment_notes.length}/200 characters
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <Button type="button" variant="secondary" onClick={() => navigate('/purchases')}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              disabled={loading || paymentForm.payment_amount <= 0 || paymentForm.payment_amount > currentPurchase.grand_total}
            >
              {loading ? 'Adding Payment...' : 'Add Payment'}
            </Button>
          </div>
        </form>
      </div>
    )
  }

  // Manage Purchases Mode
  if (loading) {
    return (
      <div style={{ padding: '20px' }}>
        <div>Loading...</div>
      </div>
    )
  }

  // Filter purchases
  const filteredPurchases = purchases.filter(purchase => {
    const matchesSearch = purchase.purchase_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         purchase.vendor_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !statusFilter || purchase.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Pagination
  const totalPages = Math.ceil(filteredPurchases.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedPurchases = filteredPurchases.slice(startIndex, endIndex)

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
        <h1 style={{ margin: '0', fontSize: '28px', fontWeight: '600', color: '#2c3e50' }}>Manage Purchases</h1>
        <Button variant="primary" onClick={() => navigate('/purchases/add')}>
          Create Purchase
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
            placeholder="Search purchases by number or vendor..."
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
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
              padding: '10px 16px',
              border: '1px solid #ced4da',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: 'white'
          }}
        >
          <option value="">All Status</option>
          <option value="Draft">Draft</option>
            <option value="Pending">Pending</option>
          <option value="Paid">Paid</option>
            <option value="Overdue">Overdue</option>
        </select>
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
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Date</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Due Date</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Amount</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedPurchases.map(purchase => (
              <tr key={purchase.id} style={{ 
                borderBottom: '1px solid #e9ecef',
                backgroundColor: 'white'
              }}>
                <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>{purchase.purchase_no}</td>
                <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>{purchase.vendor_name}</td>
                <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>{new Date(purchase.date).toLocaleDateString()}</td>
                <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>{new Date(purchase.due_date).toLocaleDateString()}</td>
                <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>₹{purchase.grand_total.toFixed(2)}</td>
                <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>
                  <span style={{
                    padding: '6px 12px', 
                    borderRadius: '6px', 
                    fontSize: '14px',
                    fontWeight: '500',
                    backgroundColor: purchase.status === 'paid' ? '#d4edda' : '#fff3cd',
                    color: purchase.status === 'paid' ? '#155724' : '#856404'
                  }}>
                    {purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1)}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <Button 
                      variant="secondary" 
                      onClick={() => navigate(`/purchases/edit/${purchase.id}`)}
                      style={{ fontSize: '14px', padding: '6px 12px' }}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="secondary"
                      onClick={() => navigate(`/purchases/add-payment/${purchase.id}`)}
                      style={{ fontSize: '14px', padding: '6px 12px' }}
                    >
                      Add Payment
                    </Button>
                    <Button 
                      variant="secondary" 
                      onClick={() => handleDeletePurchase(purchase.id)}
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
            Showing {startIndex + 1} to {Math.min(endIndex, filteredPurchases.length)} of {filteredPurchases.length} purchases
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

      {paginatedPurchases.length === 0 && !loading && (
        <div style={{
          textAlign: 'center', 
          padding: '40px', 
          color: '#6c757d',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          backgroundColor: '#f8f9fa'
        }}>
          <div style={{ fontSize: '18px', marginBottom: '8px', fontWeight: '500' }}>
            No purchases available
            </div>
          <div style={{ fontSize: '14px' }}>
            Create your first purchase to get started
          </div>
        </div>
      )}
    </div>
  )
}

