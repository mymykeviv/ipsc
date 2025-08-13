import { useState, useEffect } from 'react'
import { apiCreateInvoice, apiListParties, apiGetProducts, Party, Product, InvoiceCreate } from '../lib/api'

interface EnhancedInvoiceFormProps {
  onSuccess: () => void
  onCancel: () => void
}

interface InvoiceItem {
  product_id: number
  qty: number
  rate: number
  discount: number
  discount_type: 'Percentage' | 'Fixed'
  description?: string
  hsn_code?: string
}

// Indian States for GST Compliance
const INDIAN_STATES = {
  "Andhra Pradesh": "37",
  "Arunachal Pradesh": "12",
  "Assam": "18",
  "Bihar": "10",
  "Chhattisgarh": "22",
  "Goa": "30",
  "Gujarat": "24",
  "Haryana": "06",
  "Himachal Pradesh": "02",
  "Jharkhand": "20",
  "Karnataka": "29",
  "Kerala": "32",
  "Madhya Pradesh": "23",
  "Maharashtra": "27",
  "Manipur": "14",
  "Meghalaya": "17",
  "Mizoram": "15",
  "Nagaland": "13",
  "Odisha": "21",
  "Punjab": "03",
  "Rajasthan": "08",
  "Sikkim": "11",
  "Tamil Nadu": "33",
  "Telangana": "36",
  "Tripura": "16",
  "Uttar Pradesh": "09",
  "Uttarakhand": "05",
  "West Bengal": "19",
  "Delhi": "07",
  "Jammu and Kashmir": "01",
  "Ladakh": "38",
  "Chandigarh": "04",
  "Dadra and Nagar Haveli": "26",
  "Daman and Diu": "25",
  "Lakshadweep": "31",
  "Puducherry": "34",
  "Andaman and Nicobar Islands": "35"
}

export function EnhancedInvoiceForm({ onSuccess, onCancel }: EnhancedInvoiceFormProps) {
  const [customers, setCustomers] = useState<Party[]>([])
  const [suppliers, setSuppliers] = useState<Party[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<InvoiceCreate>({
    customer_id: 0,
    supplier_id: 0,
    date: new Date().toISOString().split('T')[0],
    due_date: new Date().toISOString().split('T')[0],
    terms: 'Due on Receipt',
    invoice_type: 'Invoice',
    currency: 'INR',
    place_of_supply: 'Uttar Pradesh',
    place_of_supply_state_code: '09',
    eway_bill_number: '',
    reverse_charge: false,
    export_supply: false,
    bill_to_address: '',
    ship_to_address: '',
    items: [],
    notes: ''
  })

  const [currentItem, setCurrentItem] = useState<InvoiceItem>({
    product_id: 0,
    qty: 1,
    rate: 0,
    discount: 0,
    discount_type: 'Percentage'
  })

  const [selectedCustomer, setSelectedCustomer] = useState<Party | null>(null)
  const [selectedSupplier, setSelectedSupplier] = useState<Party | null>(null)

  const invoiceTypes = ['Invoice', 'Credit Note', 'Debit Note']
  const currencies = ['INR', 'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY']
  const invoiceTerms = ['15 days', '30 days', '45 days', '60 days', '90 days', 'Due on Receipt', 'Immediate']
  const discountTypes = ['Percentage', 'Fixed']

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [customersData, suppliersData, productsData] = await Promise.all([
        apiListParties(),
        apiListParties(),
        apiGetProducts()
      ])
      setCustomers(customersData.filter(p => p.type === 'customer'))
      setSuppliers(suppliersData.filter(p => p.type === 'vendor'))
      setProducts(productsData)
    } catch (err) {
      console.error('Failed to load data:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.customer_id || !formData.supplier_id || formData.items.length === 0) {
      setError('Please select customer, supplier and add at least one item')
      return
    }

    try {
      setLoading(true)
      setError(null)
      await apiCreateInvoice(formData)
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

  const handleCustomerChange = (customerId: number) => {
    const customer = customers.find(c => c.id === customerId)
    setSelectedCustomer(customer || null)
    setFormData(prev => ({
      ...prev,
      customer_id: customerId,
      bill_to_address: customer ? `${customer.billing_address_line1}, ${customer.billing_city}, ${customer.billing_state}` : '',
      ship_to_address: customer ? `${customer.shipping_address_line1 || customer.billing_address_line1}, ${customer.shipping_city || customer.billing_city}, ${customer.shipping_state || customer.billing_state}` : ''
    }))
  }

  const handleSupplierChange = (supplierId: number) => {
    const supplier = suppliers.find(s => s.id === supplierId)
    setSelectedSupplier(supplier || null)
  }

  const handleTermsChange = (terms: string) => {
    setFormData(prev => ({ ...prev, terms }))
    
    // Auto-calculate due date based on terms
    const today = new Date()
    let dueDate = new Date(today)
    
    switch (terms) {
      case '15 days':
        dueDate.setDate(today.getDate() + 15)
        break
      case '30 days':
        dueDate.setDate(today.getDate() + 30)
        break
      case '45 days':
        dueDate.setDate(today.getDate() + 45)
        break
      case '60 days':
        dueDate.setDate(today.getDate() + 60)
        break
      case '90 days':
        dueDate.setDate(today.getDate() + 90)
        break
      case 'Immediate':
        dueDate = today
        break
      default: // Due on Receipt
        dueDate = today
    }
    
    setFormData(prev => ({
      ...prev,
      due_date: dueDate.toISOString().split('T')[0]
    }))
  }

  const calculateItemTotal = (item: InvoiceItem) => {
    const subtotal = item.qty * item.rate
    const discount = item.discount_type === 'Percentage' ? (subtotal * item.discount / 100) : item.discount
    return subtotal - discount
  }

  const calculateTotals = () => {
    let subtotal = 0
    let totalDiscount = 0
    
    formData.items.forEach(item => {
      const itemSubtotal = item.qty * item.rate
      const itemDiscount = item.discount_type === 'Percentage' ? (itemSubtotal * item.discount / 100) : item.discount
      subtotal += itemSubtotal
      totalDiscount += itemDiscount
    })
    
    const taxableValue = subtotal - totalDiscount
    const gstRate = 18 // Default GST rate - in real app, this would come from product
    const gstAmount = taxableValue * (gstRate / 100)
    const total = taxableValue + gstAmount
    const roundOff = Math.round(total) - total
    
    return {
      subtotal,
      totalDiscount,
      taxableValue,
      gstAmount,
      total: total + roundOff,
      roundOff
    }
  }

  const totals = calculateTotals()

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
      {error && (
        <div style={{ 
          padding: '12px', 
          backgroundColor: '#fee', 
          border: '1px solid #fcc', 
          borderRadius: '4px', 
          color: '#c33',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}

      {/* Invoice Details Section */}
      <div style={{ border: '1px solid #dee2e6', borderRadius: '8px', padding: '20px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#495057' }}>
          📄 Invoice Details
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Invoice Number *
            </label>
            <input
              type="text"
              value={formData.invoice_no || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, invoice_no: e.target.value }))}
              placeholder="Auto-generated"
              maxLength={16}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: '#f8f9fa'
              }}
              readOnly
            />
            <small style={{ fontSize: '12px', color: '#6c757d' }}>
              Format: FY{new Date().getFullYear()}/INV-XXXX
            </small>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Invoice Date *
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

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Due Date *
            </label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
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

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Invoice Status
            </label>
            <div style={{
              padding: '8px 12px',
              backgroundColor: '#d4edda',
              border: '1px solid #c3e6cb',
              borderRadius: '4px',
              color: '#155724',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              Draft
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Invoice Type *
            </label>
            <select
              value={formData.invoice_type}
              onChange={(e) => setFormData(prev => ({ ...prev, invoice_type: e.target.value }))}
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
              {invoiceTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Currency
            </label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: 'white'
              }}
            >
              {currencies.map(currency => (
                <option key={currency} value={currency}>{currency}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Invoice Terms *
            </label>
            <select
              value={formData.terms}
              onChange={(e) => handleTermsChange(e.target.value)}
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
              {invoiceTerms.map(term => (
                <option key={term} value={term}>{term}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Supplier Details Section */}
      <div style={{ border: '1px solid #dee2e6', borderRadius: '8px', padding: '20px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#495057' }}>
          🏢 Supplier Details
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Supplier Name *
            </label>
            <select
              value={formData.supplier_id || ''}
              onChange={(e) => handleSupplierChange(parseInt(e.target.value) || 0)}
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
              <option value="">Select Supplier</option>
              {suppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Supplier Address *
            </label>
            <textarea
              value={selectedSupplier ? `${selectedSupplier.billing_address_line1}, ${selectedSupplier.billing_city}, ${selectedSupplier.billing_state}` : ''}
              readOnly
              maxLength={200}
              rows={3}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: '#f8f9fa',
                resize: 'vertical'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Supplier GSTIN *
            </label>
            <input
              type="text"
              value={selectedSupplier?.gstin || ''}
              readOnly
              maxLength={15}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: '#f8f9fa'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Supplier Email
            </label>
            <input
              type="email"
              value={selectedSupplier?.email || ''}
              readOnly
              maxLength={100}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: '#f8f9fa'
              }}
            />
          </div>
        </div>
      </div>

      {/* GST Compliance Section */}
      <div style={{ border: '1px solid #dee2e6', borderRadius: '8px', padding: '20px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#495057' }}>
          🏛️ GST Compliance
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Place of Supply *
            </label>
            <select
              value={formData.place_of_supply}
              onChange={(e) => {
                const state = e.target.value
                const stateCode = INDIAN_STATES[state as keyof typeof INDIAN_STATES] || '09'
                setFormData(prev => ({
                  ...prev,
                  place_of_supply: state,
                  place_of_supply_state_code: stateCode
                }))
              }}
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
              {Object.keys(INDIAN_STATES).map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              E-way Bill Number
            </label>
            <input
              type="text"
              value={formData.eway_bill_number}
              onChange={(e) => setFormData(prev => ({ ...prev, eway_bill_number: e.target.value }))}
              maxLength={15}
              placeholder="Enter e-way bill number"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="reverse_charge"
              checked={formData.reverse_charge}
              onChange={(e) => setFormData(prev => ({ ...prev, reverse_charge: e.target.checked }))}
              style={{ width: '16px', height: '16px' }}
            />
            <label htmlFor="reverse_charge" style={{ fontSize: '14px', fontWeight: '500' }}>
              Reverse Charge
            </label>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="export_supply"
              checked={formData.export_supply}
              onChange={(e) => setFormData(prev => ({ ...prev, export_supply: e.target.checked }))}
              style={{ width: '16px', height: '16px' }}
            />
            <label htmlFor="export_supply" style={{ fontSize: '14px', fontWeight: '500' }}>
              Export Supply
            </label>
          </div>
        </div>
      </div>

      {/* Customer Details Section */}
      <div style={{ border: '1px solid #dee2e6', borderRadius: '8px', padding: '20px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#495057' }}>
          👤 Customer Details
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Customer Name *
            </label>
            <select
              value={formData.customer_id || ''}
              onChange={(e) => handleCustomerChange(parseInt(e.target.value) || 0)}
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
              Bill To Address *
            </label>
            <textarea
              value={formData.bill_to_address}
              onChange={(e) => setFormData(prev => ({ ...prev, bill_to_address: e.target.value }))}
              required
              maxLength={200}
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

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Ship To Address *
            </label>
            <textarea
              value={formData.ship_to_address}
              onChange={(e) => setFormData(prev => ({ ...prev, ship_to_address: e.target.value }))}
              required
              maxLength={200}
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

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Customer GSTIN *
            </label>
            <input
              type="text"
              value={selectedCustomer?.gstin || ''}
              readOnly
              maxLength={15}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: '#f8f9fa'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Customer Email
            </label>
            <input
              type="email"
              value={selectedCustomer?.email || ''}
              readOnly
              maxLength={100}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: '#f8f9fa'
              }}
            />
          </div>
        </div>
      </div>

      {/* Invoice Items Section */}
      <div style={{ border: '1px solid #dee2e6', borderRadius: '8px', padding: '20px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#495057' }}>
          📦 Invoice Items
        </h3>
        
        {/* Add Item Form */}
        <div style={{ border: '1px solid #e9ecef', borderRadius: '6px', padding: '16px', marginBottom: '16px' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '500' }}>Add New Item</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Product *</label>
              <select
                value={currentItem.product_id || ''}
                onChange={(e) => {
                  const productId = parseInt(e.target.value) || 0
                  const product = products.find(p => p.id === productId)
                  setCurrentItem(prev => ({
                    ...prev,
                    product_id: productId,
                    rate: product?.sales_price || 0,
                    description: product?.name || '',
                    hsn_code: product?.hsn || ''
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
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Quantity *</label>
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
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Rate *</label>
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
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Discount Type</label>
              <select
                value={currentItem.discount_type}
                onChange={(e) => setCurrentItem(prev => ({ ...prev, discount_type: e.target.value as 'Percentage' | 'Fixed' }))}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '12px',
                  backgroundColor: 'white'
                }}
              >
                {discountTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Discount Value</label>
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
                padding: '8px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500'
              }}
            >
              Add Item
            </button>
          </div>
        </div>

        {/* Items List */}
        {formData.items.length > 0 && (
          <div style={{ border: '1px solid #e9ecef', borderRadius: '6px', padding: '16px' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '500' }}>Invoice Items</h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Product</th>
                    <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>Qty</th>
                    <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>Rate</th>
                    <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>Discount</th>
                    <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>GST Rate</th>
                    <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>Amount</th>
                    <th style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, index) => {
                    const product = products.find(p => p.id === item.product_id)
                    const total = calculateItemTotal(item)
                    
                    return (
                      <tr key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '8px' }}>
                          <div>{product?.name}</div>
                          {product?.description && (
                            <small style={{ color: '#6c757d', fontSize: '11px' }}>{product.description}</small>
                          )}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>{item.qty}</td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>₹{item.rate.toFixed(2)}</td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>
                          {item.discount_type === 'Percentage' ? `${item.discount}%` : `₹${item.discount.toFixed(2)}`}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>{product?.gst_rate || 18}%</td>
                        <td style={{ padding: '8px', textAlign: 'right', fontWeight: '500' }}>₹{total.toFixed(2)}</td>
                        <td style={{ padding: '8px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '2px',
                              cursor: 'pointer',
                              fontSize: '10px'
                            }}
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
          </div>
        )}
      </div>

      {/* Invoice Totals Section */}
      <div style={{ border: '1px solid #dee2e6', borderRadius: '8px', padding: '20px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#495057' }}>
          💰 Invoice Totals
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Subtotal
            </label>
            <div style={{
              padding: '8px 12px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: '600'
            }}>
              ₹{totals.subtotal.toFixed(2)}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Total Discount
            </label>
            <div style={{
              padding: '8px 12px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: '600',
              color: '#dc3545'
            }}>
              ₹{totals.totalDiscount.toFixed(2)}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Taxable Value
            </label>
            <div style={{
              padding: '8px 12px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: '600'
            }}>
              ₹{totals.taxableValue.toFixed(2)}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              GST Amount (18%)
            </label>
            <div style={{
              padding: '8px 12px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: '600',
              color: '#28a745'
            }}>
              ₹{totals.gstAmount.toFixed(2)}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Round Off
            </label>
            <div style={{
              padding: '8px 12px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: '600'
            }}>
              ₹{totals.roundOff.toFixed(2)}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Grand Total
            </label>
            <div style={{
              padding: '8px 12px',
              backgroundColor: '#d4edda',
              border: '1px solid #c3e6cb',
              borderRadius: '4px',
              fontSize: '18px',
              fontWeight: '700',
              color: '#155724'
            }}>
              ₹{totals.total.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Other Details Section */}
      <div style={{ border: '1px solid #dee2e6', borderRadius: '8px', padding: '20px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#495057' }}>
          📝 Other Details
        </h3>
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
            Invoice Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Enter any additional notes..."
            maxLength={200}
            rows={4}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '14px',
              resize: 'vertical'
            }}
          />
          <small style={{ fontSize: '12px', color: '#6c757d' }}>
            {formData.notes.length}/200 characters
          </small>
        </div>
      </div>

      {/* Form Actions */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '12px 24px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '12px 24px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'Creating Invoice...' : 'Create Invoice'}
        </button>
      </div>
    </form>
  )
}
