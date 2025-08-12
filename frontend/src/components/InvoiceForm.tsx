import { useState, useEffect } from 'react'
import { apiCreateInvoice, apiListParties, apiGetProducts, Party, Product } from '../lib/api'

interface InvoiceFormProps {
  onSuccess: () => void
  onCancel: () => void
}

interface InvoiceItem {
  product_id: number
  qty: number
  rate: number
  discount: number
  discount_type: 'Percentage' | 'Fixed'
}

export function InvoiceForm({ onSuccess, onCancel }: InvoiceFormProps) {
  const [customers, setCustomers] = useState<Party[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    customer_id: 0,
    date: new Date().toISOString().split('T')[0],
    terms: 'Due on Receipt',
    place_of_supply: 'Karnataka',
    place_of_supply_state_code: '29',
    bill_to_address: '',
    ship_to_address: '',
    notes: '',
    items: [] as InvoiceItem[]
  })

  const [currentItem, setCurrentItem] = useState<InvoiceItem>({
    product_id: 0,
    qty: 1,
    rate: 0,
    discount: 0,
    discount_type: 'Percentage'
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [customersData, productsData] = await Promise.all([
        apiListParties(),
        apiGetProducts()
      ])
      setCustomers(customersData.filter(p => p.type === 'customer'))
      setProducts(productsData)
    } catch (err) {
      console.error('Failed to load data:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.customer_id || formData.items.length === 0) {
      setError('Please select a customer and add at least one item')
      return
    }

    try {
      setLoading(true)
      setError(null)
      await apiCreateInvoice({
        ...formData,
        customer_id: formData.customer_id,
        invoice_no: '', // Will be auto-generated
        due_date: formData.date,
        eway_bill_number: '',
        reverse_charge: false,
        export_supply: false,
        total_discount: 0
      })
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invoice')
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
      discount: 0,
      discount_type: 'Percentage'
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
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '12px' }}>
      {error && (
        <div style={{ 
          padding: '8px 12px', 
          backgroundColor: '#fee', 
          border: '1px solid #fcc', 
          borderRadius: '4px', 
          color: '#c33',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
            Customer *
          </label>
          <select
            value={formData.customer_id || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, customer_id: parseInt(e.target.value) || 0 }))}
            required
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '14px',
              backgroundColor: 'white'
            }}
          >
            <option value="">Select Customer</option>
            {customers.map(customer => (
              <option key={customer.id} value={customer.id}>{customer.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
            Date *
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            required
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
            Place of Supply
          </label>
          <input
            type="text"
            value={formData.place_of_supply}
            onChange={(e) => setFormData(prev => ({ ...prev, place_of_supply: e.target.value }))}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
            Terms
          </label>
          <input
            type="text"
            value={formData.terms}
            onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.value }))}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>
      </div>

      {/* Items Section */}
      <div style={{ border: '1px solid #ced4da', borderRadius: '4px', padding: '12px' }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>Invoice Items</h4>
        
        {/* Add Item Form */}
        <div style={{ display: 'grid', gap: '8px', marginBottom: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: '8px', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Product</label>
              <select
                value={currentItem.product_id || ''}
                onChange={(e) => {
                  const productId = parseInt(e.target.value) || 0
                  const product = products.find(p => p.id === productId)
                  setCurrentItem(prev => ({
                    ...prev,
                    product_id: productId,
                    rate: product?.sales_price || 0
                  }))
                }}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '12px',
                  backgroundColor: 'white'
                }}
              >
                <option value="">Select Product</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>{product.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Qty</label>
              <input
                type="number"
                value={currentItem.qty || ''}
                onChange={(e) => setCurrentItem(prev => ({ ...prev, qty: parseInt(e.target.value) || 0 }))}
                min="1"
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Rate</label>
              <input
                type="number"
                step="0.01"
                value={currentItem.rate || ''}
                onChange={(e) => setCurrentItem(prev => ({ ...prev, rate: parseFloat(e.target.value) || 0 }))}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Discount</label>
              <input
                type="number"
                step="0.01"
                value={currentItem.discount || ''}
                onChange={(e) => setCurrentItem(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
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
              const total = item.qty * item.rate - (item.discount_type === 'Percentage' ? (item.qty * item.rate * item.discount / 100) : item.discount)
              
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

      <div>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
          Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Additional notes"
          rows={3}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #ced4da',
            borderRadius: '4px',
            fontSize: '14px',
            resize: 'vertical'
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '8px 16px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'Creating...' : 'Create Invoice'}
        </button>
      </div>
    </form>
  )
}
