import { useState, useEffect } from 'react'
import { apiCreatePurchase, apiListParties, apiGetProducts, Party, Product } from '../lib/api'
import { Button } from './Button'
import { ErrorMessage } from './ErrorMessage'
import { formStyles, getSectionHeaderColor } from '../utils/formStyles'

// Invoice Terms for dropdown
const INVOICE_TERMS = ['15 days', '30 days', '45 days', '60 days', '90 days', 'Due on Receipt', 'Immediate']

interface PurchaseFormProps {
  onSuccess: () => void
  onCancel: () => void
  purchaseId?: number
  initialData?: any
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

export function PurchaseForm({ onSuccess, onCancel, purchaseId, initialData }: PurchaseFormProps) {
  const [vendors, setVendors] = useState<Party[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    vendor_id: 0,
    date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    terms: 'Due on Receipt',
    reference_bill_number: '',
    place_of_supply: 'Karnataka',
    place_of_supply_state_code: '29',
    bill_from_address: '',
    ship_from_address: '',
    notes: '',
    reverse_charge: false,
    export_supply: false,
    items: [] as PurchaseItem[]
  })



  useEffect(() => {
    loadData()
    if (purchaseId && initialData) {
      // Load existing purchase data for editing
      setFormData({
        vendor_id: initialData.vendor_id || 0,
        date: initialData.date?.split('T')[0] || new Date().toISOString().split('T')[0],
        due_date: initialData.due_date?.split('T')[0] || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        terms: initialData.terms || 'Due on Receipt',
        reference_bill_number: initialData.reference_bill_number || '',
        place_of_supply: initialData.place_of_supply || 'Karnataka',
        place_of_supply_state_code: initialData.place_of_supply_state_code || '29',
        bill_from_address: initialData.bill_from_address || '',
        ship_from_address: initialData.ship_from_address || '',
        notes: initialData.notes || '',
        reverse_charge: initialData.reverse_charge || false,
        export_supply: initialData.export_supply || false,
        items: initialData.items || []
      })
    }
  }, [purchaseId, initialData])

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
        reverse_charge: formData.reverse_charge,
        export_supply: formData.export_supply,
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
    // Add a new empty item to the table
    const newItem: PurchaseItem = {
      product_id: 0,
      qty: 1,
      rate: 0,
      description: '',
      hsn_code: '',
      discount: 0,
      discount_type: 'Percentage',
      gst_rate: 18
    }
    
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }))
    setError(null)
  }

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const updateItem = (index: number, field: keyof PurchaseItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }



  return (
    <form onSubmit={handleSubmit}>
      <ErrorMessage message={error} />

      {/* Row 1: Purchase Information | Additional Information */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        
        {/* Purchase Information Section */}
        <div>
          <h3 style={{ marginBottom: '4px', color: '#333', borderBottom: '2px solid #007bff', paddingBottom: '2px', fontSize: '1.5rem' }}>
            📋 Purchase Information
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* Row 1: Vendor * | Purchase Date * */}
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
            
            {/* Row 2: Terms (optional) | Due Date (optional) | Reference Bill Number (optional) */}
            <div style={formStyles.formGroup}>
              <label style={formStyles.label}>Terms (optional)</label>
              <select
                value={formData.terms}
                onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.value }))}
                style={formStyles.select}
              >
                {INVOICE_TERMS.map(term => (
                  <option key={term} value={term}>{term}</option>
                ))}
              </select>
            </div>
            <div style={formStyles.formGroup}>
              <label style={formStyles.label}>Due Date (optional)</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                style={formStyles.input}
              />
            </div>
            <div style={{ ...formStyles.formGroup, gridColumn: 'span 2' }}>
              <label style={formStyles.label}>Reference Bill Number (optional)</label>
              <input
                type="text"
                value={formData.reference_bill_number}
                onChange={(e) => setFormData(prev => ({ ...prev, reference_bill_number: e.target.value }))}
                placeholder="Enter reference bill number"
                style={formStyles.input}
              />
            </div>
          </div>
        </div>

        {/* Additional Information Section */}
        <div>
          <h3 style={{ marginBottom: '4px', color: '#333', borderBottom: '2px solid #28a745', paddingBottom: '2px', fontSize: '1.5rem' }}>
            📝 Additional Information
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={formStyles.formGroup}>
              <label style={formStyles.label}>Export Supply</label>
              <select
                value={formData.export_supply ? 'Yes' : 'No'}
                onChange={(e) => setFormData(prev => ({ ...prev, export_supply: e.target.value === 'Yes' }))}
                style={formStyles.select}
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
            <div style={formStyles.formGroup}>
              <label style={formStyles.label}>Reverse Charge</label>
              <select
                value={formData.reverse_charge ? 'Yes' : 'No'}
                onChange={(e) => setFormData(prev => ({ ...prev, reverse_charge: e.target.value === 'Yes' }))}
                style={formStyles.select}
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
            <div style={{ ...formStyles.formGroup, gridColumn: 'span 2' }}>
              <label style={formStyles.label}>Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Enter additional notes (optional)"
                rows={3}
                style={formStyles.textarea}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Items Section */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ marginBottom: '16px', color: '#333', borderBottom: '2px solid #007bff', paddingBottom: '8px' }}>
            📦 Purchase Items
          </h3>
          <Button type="button" onClick={addItem} variant="secondary">
            Add Item
          </Button>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9f9f9' }}>
                <th style={{ padding: '8px', textAlign: 'left', border: '1px solid var(--border)' }}>Product</th>
                <th style={{ padding: '8px', textAlign: 'left', border: '1px solid var(--border)' }}>Qty</th>
                <th style={{ padding: '8px', textAlign: 'left', border: '1px solid var(--border)' }}>Rate</th>
                <th style={{ padding: '8px', textAlign: 'left', border: '1px solid var(--border)' }}>GST Rate</th>
                <th style={{ padding: '8px', textAlign: 'left', border: '1px solid var(--border)' }}>HSN Code</th>
                <th style={{ padding: '8px', textAlign: 'left', border: '1px solid var(--border)' }}>Amount</th>
                <th style={{ padding: '8px', textAlign: 'left', border: '1px solid var(--border)' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {formData.items.map((item, index) => {
                const product = products.find(p => p.id === item.product_id)
                const subtotal = item.qty * item.rate
                const gstAmount = subtotal * (item.gst_rate / 100)
                const total = subtotal + gstAmount
                
                return (
                  <tr key={index}>
                    <td style={{ padding: '8px', border: '1px solid var(--border)' }}>
                      <select
                        value={item.product_id}
                        onChange={(e) => updateItem(index, 'product_id', Number(e.target.value))}
                        required
                        style={{ width: '100%', padding: '4px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                      >
                        <option value={0}>Select Product...</option>
                        {products.map(product => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                      {product?.description && (
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                          {product.description}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '8px', border: '1px solid var(--border)' }}>
                      <input
                        type="number"
                        value={item.qty}
                        onChange={(e) => updateItem(index, 'qty', Number(e.target.value))}
                        min={1}
                        required
                        style={{ width: '60px', padding: '4px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                      />
                    </td>
                    <td style={{ padding: '8px', border: '1px solid var(--border)' }}>
                      <input
                        type="number"
                        value={item.rate}
                        onChange={(e) => updateItem(index, 'rate', Number(e.target.value))}
                        min={0}
                        step={0.01}
                        required
                        style={{ width: '80px', padding: '4px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                      />
                    </td>
                    <td style={{ padding: '8px', border: '1px solid var(--border)' }}>
                      <input
                        type="number"
                        value={item.gst_rate}
                        onChange={(e) => updateItem(index, 'gst_rate', Number(e.target.value))}
                        min={0}
                        step={0.01}
                        required
                        style={{ width: '60px', padding: '4px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                      />
                    </td>
                    <td style={{ padding: '8px', border: '1px solid var(--border)' }}>
                      <input
                        type="text"
                        value={item.hsn_code}
                        onChange={(e) => updateItem(index, 'hsn_code', e.target.value)}
                        maxLength={10}
                        required
                        style={{ width: '80px', padding: '4px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                      />
                    </td>
                    <td style={{ padding: '8px', border: '1px solid var(--border)' }}>
                      <input
                        type="number"
                        value={total.toFixed(2)}
                        readOnly
                        style={{ width: '80px', padding: '4px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', backgroundColor: '#f9f9f9' }}
                      />
                    </td>
                    <td style={{ padding: '8px', border: '1px solid var(--border)' }}>
                      {formData.items.length > 1 && (
                        <Button 
                          type="button" 
                          onClick={() => removeItem(index)} 
                          variant="secondary"
                        >
                          Remove
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
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
