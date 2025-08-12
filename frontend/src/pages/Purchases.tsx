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
import { Card } from '../components/Card'

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
      resetForm()
      loadData()
      alert(`Purchase created successfully! Purchase No: ${result.purchase_no}`)
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
      alert('Purchase deleted successfully!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete purchase')
    } finally {
      setLoading(false)
    }
  }

  const addItem = () => {
    if (!currentItem.product_id || currentItem.qty <= 0 || currentItem.rate <= 0) {
      setError('Please fill all item details')
      return
    }

    const product = products.find(p => p.id === currentItem.product_id)
    if (!product) return

    const newItem = {
      ...currentItem,
      description: currentItem.description || product.name,
      hsn_code: currentItem.hsn_code || product.hsn || '',
      gst_rate: currentItem.gst_rate || product.gst_rate
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
    setError(null)
  }

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
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

  const calculateTotals = () => {
    let taxableValue = 0
    let totalCGST = 0
    let totalSGST = 0
    let totalIGST = 0

    formData.items.forEach(item => {
      const baseAmount = item.qty * item.rate
      const discountAmount = item.discount_type === 'Fixed' ? item.discount : (baseAmount * item.discount / 100)
      const taxableAmount = baseAmount - discountAmount

      if (formData.place_of_supply_state_code === '29') {
        const cgst = taxableAmount * item.gst_rate / 200
        const sgst = taxableAmount * item.gst_rate / 200
        totalCGST += cgst
        totalSGST += sgst
      } else {
        const igst = taxableAmount * item.gst_rate / 100
        totalIGST += igst
      }

      taxableValue += taxableAmount
    })

    const grandTotal = taxableValue + totalCGST + totalSGST + totalIGST - formData.total_discount

    return { taxableValue, totalCGST, totalSGST, totalIGST, grandTotal }
  }

  const totals = calculateTotals()

  // Pagination
  const totalPages = Math.ceil(purchases.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentPurchases = purchases.slice(startIndex, endIndex)

  if (loading && purchases.length === 0) {
    return (
      <Card>
        <h1>Purchases</h1>
        <div>Loading...</div>
      </Card>
    )
  }

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Purchase Management</h1>
        <button 
          onClick={() => setShowCreateForm(true)}
          className="btn btn-primary"
          style={{ padding: '10px 20px' }}
        >
          Create New Purchase
        </button>
      </div>

      {error && (
        <div style={{ 
          padding: '12px', 
          marginBottom: '16px', 
          backgroundColor: '#fee', 
          border: '1px solid #fcc', 
          borderRadius: '4px', 
          color: '#c33' 
        }}>
          {error}
        </div>
      )}

      {/* Search and Filters */}
      <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search purchases..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            padding: '12px 16px',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            fontSize: '14px'
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '12px 16px',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            fontSize: '14px'
          }}
        >
          <option value="">All Status</option>
          <option value="Draft">Draft</option>
          <option value="Received">Received</option>
          <option value="Paid">Paid</option>
          <option value="Partially Paid">Partially Paid</option>
        </select>
      </div>

      {/* Purchases Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--background-secondary)' }}>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Purchase No</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Vendor</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Date</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Due Date</th>
              <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid var(--border)' }}>Total</th>
              <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid var(--border)' }}>Paid</th>
              <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid var(--border)' }}>Balance</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentPurchases.map(purchase => (
              <tr key={purchase.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '12px' }}>{purchase.purchase_no}</td>
                <td style={{ padding: '12px' }}>{purchase.vendor_name}</td>
                <td style={{ padding: '12px' }}>{new Date(purchase.date).toLocaleDateString()}</td>
                <td style={{ padding: '12px' }}>{new Date(purchase.due_date).toLocaleDateString()}</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>₹{purchase.grand_total.toFixed(2)}</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>₹{purchase.paid_amount.toFixed(2)}</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>₹{purchase.balance_amount.toFixed(2)}</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    backgroundColor: 
                      purchase.status === 'Paid' ? '#d4edda' :
                      purchase.status === 'Partially Paid' ? '#fff3cd' :
                      purchase.status === 'Received' ? '#cce5ff' : '#f8d7da',
                    color: 
                      purchase.status === 'Paid' ? '#155724' :
                      purchase.status === 'Partially Paid' ? '#856404' :
                      purchase.status === 'Received' ? '#004085' : '#721c24'
                  }}>
                    {purchase.status}
                  </span>
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button
                      onClick={() => {
                        setSelectedPurchase(purchase)
                        setShowPaymentForm(true)
                      }}
                      className="btn btn-secondary"
                      style={{ padding: '4px 8px', fontSize: '12px' }}
                    >
                      Payment
                    </button>
                    <button
                      onClick={() => handleDeletePurchase(purchase.id)}
                      className="btn btn-danger"
                      style={{ padding: '4px 8px', fontSize: '12px' }}
                      disabled={purchase.status === 'Paid' || purchase.status === 'Partially Paid'}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="btn btn-secondary"
            style={{ padding: '8px 12px' }}
          >
            Previous
          </button>
          <span style={{ padding: '8px 12px', display: 'flex', alignItems: 'center' }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="btn btn-secondary"
            style={{ padding: '8px 12px' }}
          >
            Next
          </button>
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
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>Create New Purchase</h2>
              <button
                onClick={() => {
                  setShowCreateForm(false)
                  resetForm()
                }}
                className="btn btn-secondary"
                style={{ padding: '8px 12px' }}
              >
                Close
              </button>
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
              {/* Basic Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <label>
                  <div>Vendor *</div>
                  <select
                    value={formData.vendor_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, vendor_id: Number(e.target.value) }))}
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px' }}
                  >
                    <option value={0}>Select Vendor...</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </label>

                <label>
                  <div>Purchase Date *</div>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px' }}
                  />
                </label>

                <label>
                  <div>Due Date *</div>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px' }}
                  />
                </label>

                <label>
                  <div>Terms</div>
                  <input
                    type="text"
                    value={formData.terms}
                    onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.value }))}
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px' }}
                  />
                </label>
              </div>

              {/* GST Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <label>
                  <div>Place of Supply *</div>
                  <input
                    type="text"
                    value={formData.place_of_supply}
                    onChange={(e) => setFormData(prev => ({ ...prev, place_of_supply: e.target.value }))}
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px' }}
                  />
                </label>

                <label>
                  <div>State Code *</div>
                  <input
                    type="text"
                    value={formData.place_of_supply_state_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, place_of_supply_state_code: e.target.value }))}
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px' }}
                  />
                </label>

                <label>
                  <div>E-way Bill Number</div>
                  <input
                    type="text"
                    value={formData.eway_bill_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, eway_bill_number: e.target.value }))}
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px' }}
                  />
                </label>

                <label>
                  <div>Total Discount</div>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.total_discount}
                    onChange={(e) => setFormData(prev => ({ ...prev, total_discount: Number(e.target.value) }))}
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px' }}
                  />
                </label>
              </div>

              {/* Address Details */}
              <div style={{ display: 'grid', gap: '16px' }}>
                <label>
                  <div>Bill From Address *</div>
                  <textarea
                    value={formData.bill_from_address}
                    onChange={(e) => setFormData(prev => ({ ...prev, bill_from_address: e.target.value }))}
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px', minHeight: '60px' }}
                  />
                </label>

                <label>
                  <div>Ship From Address *</div>
                  <textarea
                    value={formData.ship_from_address}
                    onChange={(e) => setFormData(prev => ({ ...prev, ship_from_address: e.target.value }))}
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px', minHeight: '60px' }}
                  />
                </label>
              </div>

              {/* Items Section */}
              <div>
                <h3>Purchase Items</h3>
                <div style={{ display: 'grid', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr', gap: '8px', alignItems: 'end' }}>
                    <label>
                      <div>Product *</div>
                      <select
                        value={currentItem.product_id}
                        onChange={(e) => {
                          const product = products.find(p => p.id === Number(e.target.value))
                          setCurrentItem(prev => ({
                            ...prev,
                            product_id: Number(e.target.value),
                            rate: product?.purchase_price || 0,
                            gst_rate: product?.gst_rate || 0,
                            hsn_code: product?.hsn || '',
                            description: product?.name || ''
                          }))
                        }}
                        style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px' }}
                      >
                        <option value={0}>Select Product...</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>)}
                      </select>
                    </label>

                    <label>
                      <div>Qty *</div>
                      <input
                        type="number"
                        min="1"
                        value={currentItem.qty}
                        onChange={(e) => setCurrentItem(prev => ({ ...prev, qty: Number(e.target.value) }))}
                        style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px' }}
                      />
                    </label>

                    <label>
                      <div>Rate *</div>
                      <input
                        type="number"
                        step="0.01"
                        value={currentItem.rate}
                        onChange={(e) => setCurrentItem(prev => ({ ...prev, rate: Number(e.target.value) }))}
                        style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px' }}
                      />
                    </label>

                    <label>
                      <div>Discount</div>
                      <input
                        type="number"
                        step="0.01"
                        value={currentItem.discount}
                        onChange={(e) => setCurrentItem(prev => ({ ...prev, discount: Number(e.target.value) }))}
                        style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px' }}
                      />
                    </label>

                    <label>
                      <div>GST Rate %</div>
                      <input
                        type="number"
                        step="0.01"
                        value={currentItem.gst_rate}
                        onChange={(e) => setCurrentItem(prev => ({ ...prev, gst_rate: Number(e.target.value) }))}
                        style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px' }}
                      />
                    </label>

                    <button
                      onClick={addItem}
                      className="btn btn-primary"
                      style={{ padding: '8px 12px' }}
                    >
                      Add Item
                    </button>
                  </div>
                </div>

                {/* Items List */}
                {formData.items.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'var(--background-secondary)' }}>
                          <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Product</th>
                          <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid var(--border)' }}>Qty</th>
                          <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid var(--border)' }}>Rate</th>
                          <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid var(--border)' }}>Discount</th>
                          <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid var(--border)' }}>Amount</th>
                          <th style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.items.map((item, index) => {
                          const baseAmount = item.qty * item.rate
                          const discountAmount = item.discount_type === 'Fixed' ? item.discount : (baseAmount * item.discount / 100)
                          const taxableAmount = baseAmount - discountAmount
                          const gstAmount = taxableAmount * item.gst_rate / 100
                          const totalAmount = taxableAmount + gstAmount

                          return (
                            <tr key={index} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '8px' }}>{item.description}</td>
                              <td style={{ padding: '8px', textAlign: 'right' }}>{item.qty}</td>
                              <td style={{ padding: '8px', textAlign: 'right' }}>₹{item.rate.toFixed(2)}</td>
                              <td style={{ padding: '8px', textAlign: 'right' }}>₹{discountAmount.toFixed(2)}</td>
                              <td style={{ padding: '8px', textAlign: 'right' }}>₹{totalAmount.toFixed(2)}</td>
                              <td style={{ padding: '8px', textAlign: 'center' }}>
                                <button
                                  onClick={() => removeItem(index)}
                                  className="btn btn-danger"
                                  style={{ padding: '4px 8px', fontSize: '12px' }}
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Totals */}
                {formData.items.length > 0 && (
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gap: '16px', 
                    padding: '16px', 
                    backgroundColor: 'var(--background-secondary)', 
                    borderRadius: '4px' 
                  }}>
                    <div>
                      <strong>Taxable Value:</strong> ₹{totals.taxableValue.toFixed(2)}
                    </div>
                    <div>
                      <strong>CGST:</strong> ₹{totals.totalCGST.toFixed(2)}
                    </div>
                    <div>
                      <strong>SGST:</strong> ₹{totals.totalSGST.toFixed(2)}
                    </div>
                    <div>
                      <strong>IGST:</strong> ₹{totals.totalIGST.toFixed(2)}
                    </div>
                    <div>
                      <strong>Total Discount:</strong> ₹{formData.total_discount.toFixed(2)}
                    </div>
                    <div>
                      <strong>Grand Total:</strong> ₹{totals.grandTotal.toFixed(2)}
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <label>
                <div>Notes</div>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px', minHeight: '60px' }}
                />
              </label>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setShowCreateForm(false)
                    resetForm()
                  }}
                  className="btn btn-secondary"
                  style={{ padding: '12px 24px' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePurchase}
                  disabled={loading || formData.vendor_id === 0 || formData.items.length === 0}
                  className="btn btn-primary"
                  style={{ padding: '12px 24px' }}
                >
                  {loading ? 'Creating...' : 'Create Purchase'}
                </button>
              </div>
            </div>
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
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '500px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>Add Payment</h2>
              <button
                onClick={() => {
                  setShowPaymentForm(false)
                  setSelectedPurchase(null)
                }}
                className="btn btn-secondary"
                style={{ padding: '8px 12px' }}
              >
                Close
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <strong>Purchase:</strong> {selectedPurchase.purchase_no}<br />
              <strong>Vendor:</strong> {selectedPurchase.vendor_name}<br />
              <strong>Total Amount:</strong> ₹{selectedPurchase.grand_total.toFixed(2)}<br />
              <strong>Paid Amount:</strong> ₹{selectedPurchase.paid_amount.toFixed(2)}<br />
              <strong>Balance:</strong> ₹{selectedPurchase.balance_amount.toFixed(2)}
            </div>

            <div style={{ textAlign: 'center', color: '#666' }}>
              Payment functionality will be implemented in the next phase.
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

