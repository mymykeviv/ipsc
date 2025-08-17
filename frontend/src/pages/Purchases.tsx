import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../modules/AuthContext'
import { createApiErrorHandler } from '../lib/apiUtils'
import { 
  apiCreatePurchase, 
  apiListPurchases, 
  apiGetPurchase, 
  apiDeletePurchase,
  apiUpdatePurchaseStatus,
  apiListParties, 
  apiGetProducts,
  Purchase,
  Party, 
  Product,
  PurchaseCreate
} from '../lib/api'
import { Button } from '../components/Button'
import { StatusBadge } from '../components/StatusBadge'
import { PurchaseForm } from '../components/PurchaseForm'
import { formStyles, getSectionHeaderColor } from '../utils/formStyles'
import { EnhancedFilterBar } from '../components/EnhancedFilterBar'
import { FilterDropdown } from '../components/FilterDropdown'
import { DateFilter } from '../components/DateFilter'
import { ActionButtons, ActionButtonSets } from '../components/ActionButtons'
import { EnhancedHeader, HeaderPatterns } from '../components/EnhancedHeader'

interface PurchasesProps {
  mode?: 'manage' | 'add' | 'edit' | 'payments'
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
  const [statusFilter, setStatusFilter] = useState('all')
  const [vendorFilter, setVendorFilter] = useState('all')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all')
  const [amountRangeFilter, setAmountRangeFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Create error handler that will automatically log out on 401 errors
  const handleApiError = createApiErrorHandler(forceLogout)



  useEffect(() => {
    if (mode === 'manage') {
      loadPurchases()
    } else if (mode === 'edit' && id) {
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

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this purchase?')) return
    
    try {
      await apiDeletePurchase(id)
      loadPurchases()
    } catch (err: any) {
      handleApiError(err)
      setError('Failed to delete purchase')
    }
  }

  const handleCancelPurchase = async (id: number) => {
    if (!confirm('Are you sure you want to cancel this purchase?')) return
    
    try {
      await apiUpdatePurchaseStatus(id, 'Cancelled')
      loadPurchases()
    } catch (err: any) {
      handleApiError(err)
      setError('Failed to cancel purchase')
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
    const matchesSearch = !searchTerm || 
      purchase.purchase_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.vendor_name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || purchase.status === statusFilter
    
    const matchesVendor = vendorFilter === 'all' || purchase.vendor_name === vendorFilter
    
    const matchesPaymentStatus = paymentStatusFilter === 'all' || 
      (paymentStatusFilter === 'paid' && purchase.balance_amount === 0) ||
      (paymentStatusFilter === 'partially_paid' && purchase.balance_amount > 0 && purchase.balance_amount < purchase.grand_total) ||
      (paymentStatusFilter === 'unpaid' && purchase.balance_amount === purchase.grand_total)
    
    const matchesAmountRange = amountRangeFilter === 'all' || (() => {
      const [min, max] = amountRangeFilter.split('-').map(Number)
      if (max) {
        return purchase.grand_total >= min && purchase.grand_total <= max
      } else {
        return purchase.grand_total >= min
      }
    })()
    
    return matchesSearch && matchesStatus && matchesVendor && matchesPaymentStatus && matchesAmountRange
  })

  // Pagination
  const totalPages = Math.ceil(filteredPurchases.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedPurchases = filteredPurchases.slice(startIndex, endIndex)

  return (
    <div style={{ padding: '20px', maxWidth: '100%' }}>
      <EnhancedHeader
        {...HeaderPatterns.purchases(purchases.length)}
        primaryAction={{
          label: 'Create Purchase',
          onClick: () => navigate('/purchases/add'),
          icon: '📦'
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
        title="Purchase Filters"
        activeFiltersCount={
          (searchTerm ? 1 : 0) +
          (statusFilter !== 'all' ? 1 : 0) +
          (vendorFilter !== 'all' ? 1 : 0) +
          (paymentStatusFilter !== 'all' ? 1 : 0) +
          (amountRangeFilter !== 'all' ? 1 : 0) +
          (dateFilter !== 'all' ? 1 : 0)
        }
        onClearAll={() => {
          setSearchTerm('')
          setStatusFilter('all')
          setVendorFilter('all')
          setPaymentStatusFilter('all')
          setAmountRangeFilter('all')
          setDateFilter('all')
        }}
        showQuickActions={true}
        quickActions={[
          {
            label: 'Current FY',
            action: () => {
              const currentYear = new Date().getFullYear()
              setDateFilter(`custom:${currentYear}-04-01:${currentYear + 1}-03-31`)
            },
            icon: '📅'
          },
          {
            label: 'Due Payment',
            action: () => {
              setPaymentStatusFilter('unpaid')
            },
            icon: '💰'
          }
        ]}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '12px', fontWeight: '500', color: '#495057' }}>Search</span>
          <input
            type="text"
            placeholder="Search purchases by number or vendor..."
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
          <span style={{ fontSize: '12px', fontWeight: '500', color: '#495057' }}>Status</span>
          <FilterDropdown
            value={statusFilter}
            onChange={(value) => setStatusFilter(Array.isArray(value) ? value[0] || 'all' : value)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'Draft', label: 'Draft' },
              { value: 'Partially Paid', label: 'Partially Paid' },
              { value: 'Paid', label: 'Paid' },
              { value: 'Cancelled', label: 'Cancelled' }
            ]}
            placeholder="Select status"
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
                value: vendor.name, 
                label: vendor.name 
              }))
            ]}
            placeholder="Select vendor"
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '12px', fontWeight: '500', color: '#495057' }}>Payment Status</span>
          <FilterDropdown
            value={paymentStatusFilter}
            onChange={(value) => setPaymentStatusFilter(Array.isArray(value) ? value[0] || 'all' : value)}
            options={[
              { value: 'all', label: 'All Payment Status' },
              { value: 'paid', label: 'Paid' },
              { value: 'partially_paid', label: 'Partially Paid' },
              { value: 'unpaid', label: 'Unpaid' }
            ]}
            placeholder="Select payment status"
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
            placeholder="Select date range"
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
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Date</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Due Date</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Amount</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Amount Due</th>
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
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    fontSize: '12px',
                    fontWeight: '500',
                    backgroundColor: purchase.grand_total > 0 ? '#fff3cd' : '#d4edda',
                    color: purchase.grand_total > 0 ? '#856404' : '#155724'
                  }}>
                    ₹{purchase.grand_total.toFixed(2)}
                  </span>
                </td>
                <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>
                  <StatusBadge status={purchase.status} />
                </td>
                <td style={{ padding: '12px' }}>
                  <ActionButtons
                    {...ActionButtonSets.purchases(purchase, {
                      onEdit: () => navigate(`/purchases/edit/${purchase.id}`),
                      onPayment: () => navigate(`/payments/purchase/add/${purchase.id}`),
                      onCancel: () => handleCancelPurchase(purchase.id),
                      onDelete: () => handleDelete(purchase.id)
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

