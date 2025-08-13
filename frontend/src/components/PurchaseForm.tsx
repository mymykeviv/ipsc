import { useState, useEffect } from 'react'
import { apiCreatePurchase, apiListParties, apiGetProducts, Party, Product } from '../lib/api'
import { Button } from './Button'
import { ErrorMessage } from './ErrorMessage'
import { formStyles, getSectionHeaderColor } from '../utils/formStyles'

interface PurchaseFormProps {
  onSuccess: () => void
  onCancel: () => void
}

interface PurchaseItem {
  product_id: number
  qty: number
  rate: number
  description: string
  hsn_code: string
  discount: number
  discount_type: 'Percentage' | 'Fixed'
  gst_rate: number
}

export function PurchaseForm({ onSuccess, onCancel }: PurchaseFormProps) {
  const [vendors, setVendors] = useState<Party[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    vendor_id: 0,
    date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    terms: 'Due on Receipt',
    place_of_supply: 'Karnataka',
    place_of_supply_state_code: '29',
    bill_from_address: '',
    ship_from_address: '',
    notes: '',
    items: [] as PurchaseItem[]
  })

  const [currentItem, setCurrentItem] = useState<PurchaseItem>({
    product_id: 0,
    qty: 1,
    rate: 0,
    description: '',
    hsn_code: '',
    discount: 0,
    discount_type: 'Percentage',
    gst_rate: 18
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [vendorsData, productsData] = await Promise.all([
        apiListParties(),
        apiGetProducts()
      ])
      setVendors(vendorsData.filter(p => p.type === 'vendor'))
      setProducts(productsData)
    } catch (err) {
      console.error('Failed to load data:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.vendor_id || formData.items.length === 0) {
      setError('Please select a vendor and add at least one item')
      return
    }

    try {
      setLoading(true)
      setError(null)
      await apiCreatePurchase({
        ...formData,
        vendor_id: formData.vendor_id,
        eway_bill_number: '',
        reverse_charge: false,
        export_supply: false,
        total_discount: 0
      })
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create purchase')
    } finally {
      setLoading(false)
    }
  }

  const addItem = () => {
    if (!currentItem.product_id || currentItem.qty <= 0 || currentItem.rate <= 0) {
      setError('Please fill all item fields')
      return
    }
    
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { ...currentItem }]
    }))
    
    setCurrentItem({
      product_id: 0,
      qty: 1,
      rate: 0,
      description: '',
      hsn_code: '',
      discount: 0,
      discount_type: 'Percentage',
      gst_rate: 18
    })
    setError(null)
  }

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const getSelectedProduct = () => {
    return products.find(p => p.id === currentItem.product_id)
  }

  return (
    <form onSubmit={handleSubmit}>
      <ErrorMessage message={error} />

      {/* Purchase Information Section */}
      <div style={formStyles.section}>
        <h3 style={{ ...formStyles.sectionHeader, borderBottomColor: getSectionHeaderColor('basic') }}>
          Purchase Information
        </h3>
        <div style={formStyles.grid2Col}>
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>Vendor *</label>
            <select
              value={formData.vendor_id || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, vendor_id: parseInt(e.target.value) || 0 }))}
              required
              style={formStyles.select}
            >
              <option value="">Select Vendor</option>
              {vendors.map(vendor => (
                <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
              ))}
            </select>
          </div>

          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>Purchase Date *</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              required
              style={formStyles.input}
            />
          </div>

          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>Due Date</label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
              style={formStyles.input}
            />
          </div>

          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>Terms</label>
            <input
              type="text"
              value={formData.terms}
              onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.value }))}
              placeholder="Enter payment terms"
              style={formStyles.input}
            />
          </div>
        </div>
      </div>

      {/* Items Section */}
      <div style={formStyles.section}>
        <h3 style={{ ...formStyles.sectionHeader, borderBottomColor: getSectionHeaderColor('items') }}>
          Purchase Items
        </h3>
        
        {/* Add Item Form */}
        <div style={{ display: 'grid', gap: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: '16px', alignItems: 'end' }}>
            <div>
              <label>Product</label>
              <select
                value={currentItem.product_id || ''}
                onChange={(e) => {
                  const productId = parseInt(e.target.value) || 0
                  const product = products.find(p => p.id === productId)
                  setCurrentItem(prev => ({
                    ...prev,
                    product_id: productId,
                    rate: product?.purchase_price || 0,
                    description: product?.name || '',
                    hsn_code: product?.hsn || ''
                  }))
                }}
                style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
              >
                <option value="">Select Product</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>{product.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label>Qty</label>
              <input
                type="number"
                value={currentItem.qty || ''}
                onChange={(e) => setCurrentItem(prev => ({ ...prev, qty: parseInt(e.target.value) || 0 }))}
                min="1"
                placeholder="Quantity"
                style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
              />
            </div>
            
            <div>
              <label>Rate</label>
              <input
                type="number"
                step="0.01"
                value={currentItem.rate || ''}
                onChange={(e) => setCurrentItem(prev => ({ ...prev, rate: parseFloat(e.target.value) || 0 }))}
                placeholder="Rate"
                style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
              />
            </div>
            
            <div>
              <label>GST %</label>
              <input
                type="number"
                step="0.01"
                value={currentItem.gst_rate || ''}
                onChange={(e) => setCurrentItem(prev => ({ ...prev, gst_rate: parseFloat(e.target.value) || 0 }))}
                placeholder="GST %"
                style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
              />
            </div>
            
            <button
              type="button"
              onClick={addItem}
              style={{
                padding: '6px 12px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Add
            </button>
          </div>
        </div>

        {/* Items List */}
        {formData.items.length > 0 && (
          <div style={{ borderTop: '1px solid #ced4da', paddingTop: '8px' }}>
            {formData.items.map((item, index) => {
              const product = products.find(p => p.id === item.product_id)
              const subtotal = item.qty * item.rate
              const gstAmount = subtotal * (item.gst_rate / 100)
              const total = subtotal + gstAmount
              
              return (
                <div key={index} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '4px 0',
                  borderBottom: '1px solid #f0f0f0'
                }}>
                  <span style={{ fontSize: '12px', flex: 1 }}>{product?.name}</span>
                  <span style={{ fontSize: '12px', width: '60px' }}>Qty: {item.qty}</span>
                  <span style={{ fontSize: '12px', width: '80px' }}>₹{item.rate}</span>
                  <span style={{ fontSize: '12px', width: '80px' }}>₹{total.toFixed(2)}</span>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    style={{
                      padding: '2px 6px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '2px',
                      cursor: 'pointer',
                      fontSize: '10px'
                    }}
                  >
                    ×
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Notes Section */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '16px', color: '#333', borderBottom: '2px solid #6c757d', paddingBottom: '8px' }}>
          Additional Information
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
          <div>
            <label>Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Enter additional notes (optional)"
              rows={3}
              style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? 'Creating...' : 'Create Purchase'}
        </Button>
      </div>
    </form>
  )
}
