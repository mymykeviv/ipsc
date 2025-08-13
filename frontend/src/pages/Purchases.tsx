import { useEffect, useState } from 'react'
import { useAuth } from '../modules/AuthContext'
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

export function Purchases() {
  const { token } = useAuth()
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [vendors, setVendors] = useState<Party[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Form state
  const [formData, setFormData] = useState<PurchaseCreate>({
    vendor_id: 0,
    date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    terms: 'Due on Receipt',
    place_of_supply: 'Karnataka',
    place_of_supply_state_code: '29',
    eway_bill_number: '',
    reverse_charge: false,
    export_supply: false,
    bill_from_address: '',
    ship_from_address: '',
    total_discount: 0,
    notes: '',
    items: []
  })

  const [currentItem, setCurrentItem] = useState({
    product_id: 0,
    qty: 1,
    rate: 0,
    description: '',
    hsn_code: '',
    discount: 0,
    discount_type: 'Percentage',
    gst_rate: 0
  })

  useEffect(() => {
    if (!token) return
    loadData()
  }, [token])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [purchasesData, vendorsData, productsData] = await Promise.all([
        apiListPurchases(searchTerm, statusFilter),
        apiListParties(),
        apiGetProducts()
      ])
      setPurchases(purchasesData)
      setVendors(vendorsData.filter(p => p.type === 'vendor'))
      setProducts(productsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    setCurrentPage(1)
  }, [searchTerm, statusFilter])

  const handleCreatePurchase = async () => {
    if (!formData.vendor_id || formData.items.length === 0) {
      setError('Please select a vendor and add at least one item')
      return
    }

    try {
      setLoading(true)
      setError(null)
      const result = await apiCreatePurchase(formData)
      setShowCreateForm(false)
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create purchase')
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePurchase = async (id: number) => {
    if (!confirm('Are you sure you want to delete this purchase?')) return

    try {
      setLoading(true)
      setError(null)
      await apiDeletePurchase(id)
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete purchase')
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = (purchase: Purchase) => {
    setSelectedPurchase(purchase)
    setShowPaymentForm(true)
  }

  const resetForm = () => {
    setFormData({
      vendor_id: 0,
      date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      terms: 'Due on Receipt',
      place_of_supply: 'Karnataka',
      place_of_supply_state_code: '29',
      eway_bill_number: '',
      reverse_charge: false,
      export_supply: false,
      bill_from_address: '',
      ship_from_address: '',
      total_discount: 0,
      notes: '',
      items: []
    })
    setCurrentItem({
      product_id: 0,
      qty: 1,
      rate: 0,
      description: '',
      hsn_code: '',
      discount: 0,
      discount_type: 'Percentage',
      gst_rate: 0
    })
  }

  const addItem = () => {
    if (!currentItem.product_id || currentItem.qty <= 0 || currentItem.rate <= 0) {
      setError('Please fill all required fields for the item')
      return
    }

    const product = products.find(p => p.id === currentItem.product_id)
    if (!product) {
      setError('Selected product not found')
      return
    }

    const newItem = {
      ...currentItem,
      description: product.name,
      hsn_code: product.hsn || '',
      gst_rate: product.gst_rate || 0
    }

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }))

    setCurrentItem({
      product_id: 0,
      qty: 1,
      rate: 0,
      description: '',
      hsn_code: '',
      discount: 0,
      discount_type: 'Percentage',
      gst_rate: 0
    })
  }

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const updateItem = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => {
      const itemTotal = item.qty * item.rate
      const discount = item.discount_type === 'Percentage' 
        ? (itemTotal * item.discount / 100) 
        : item.discount
      return sum + (itemTotal - discount)
    }, 0)

    const totalDiscount = formData.total_discount
    const taxableAmount = subtotal - totalDiscount
    const cgst = taxableAmount * 0.09 // Assuming 18% GST split equally
    const sgst = taxableAmount * 0.09
    const total = taxableAmount + cgst + sgst

    return { subtotal, totalDiscount, taxableAmount, cgst, sgst, total }
  }

  const filteredPurchases = purchases.filter(purchase => {
    const matchesSearch = purchase.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         purchase.purchase_no.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !statusFilter || purchase.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalPages = Math.ceil(filteredPurchases.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedPurchases = filteredPurchases.slice(startIndex, endIndex)

  if (loading && purchases.length === 0) {
    return (
      <div style={{ padding: '20px' }}>
        <div>Loading...</div>
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
        <h1 style={{ margin: '0', fontSize: '28px', fontWeight: '600', color: '#2c3e50' }}>Purchases</h1>
        <Button variant="primary" onClick={() => setShowCreateForm(true)}>
          Create Purchase
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
            placeholder="Search purchases by vendor or purchase number..."
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
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
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

      {/* Purchases Table */}
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
                    backgroundColor: purchase.status === 'paid' ? '#d4edda' : purchase.status === 'overdue' ? '#f8d7da' : '#fff3cd',
                    color: purchase.status === 'paid' ? '#155724' : purchase.status === 'overdue' ? '#721c24' : '#856404'
                  }}>
                    {purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1)}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button 
                      variant="secondary"
                      onClick={() => handlePayment(purchase)}
                      style={{ fontSize: '14px', padding: '6px 12px' }}
                    >
                      Payment
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

      {filteredPurchases.length === 0 && !loading && (
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

      {/* Create Purchase Modal */}
      {showCreateForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{ width: '80%', height: '80%', maxWidth: '1400px', maxHeight: '80vh', overflow: 'auto' }}>
            <PurchaseForm onClose={() => setShowCreateForm(false)} />
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentForm && selectedPurchase && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{ 
            width: '80%', 
            height: '80%', 
            maxWidth: '1400px', 
            maxHeight: '80vh', 
            overflow: 'auto',
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px'
          }}>
            <h2>Add Payment for Purchase {selectedPurchase.purchase_no}</h2>
            {/* Payment form would go here */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <Button variant="secondary" onClick={() => setShowPaymentForm(false)}>
                Cancel
              </Button>
              <Button variant="primary">
                Add Payment
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

