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
  gst_rate: number
  gst_amount: number
  hsn_code: string
  description: string
}

interface InvoiceFormData {
  // Invoice Details
  invoice_no: string
  date: string
  due_date: string
  status: string
  invoice_type: string
  currency: string
  terms: string
  
  // Supplier Details
  supplier_id: number
  supplier_address: string
  supplier_gstin: string
  supplier_email: string
  
  // GST Compliance
  place_of_supply: string
  eway_bill_number: string
  reverse_charge: boolean
  export_supply: boolean
  
  // Customer Details
  customer_id: number
  bill_to_address: string
  ship_to_address: string
  customer_gstin: string
  customer_email: string
  
  // Items and Notes
  items: InvoiceItem[]
  notes: string
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

export function InvoiceForm({ onSuccess, onCancel }: InvoiceFormProps) {
  const [customers, setCustomers] = useState<Party[]>([])
  const [suppliers, setSuppliers] = useState<Party[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<InvoiceFormData>({
    // Invoice Details
    invoice_no: '',
    date: new Date().toISOString().split('T')[0],
    due_date: new Date().toISOString().split('T')[0],
    status: 'Draft',
    invoice_type: 'Invoice',
    currency: 'INR',
    terms: 'Due on Receipt',
    
    // Supplier Details
    supplier_id: 0,
    supplier_address: '',
    supplier_gstin: '',
    supplier_email: '',
    
    // GST Compliance
    place_of_supply: 'Uttar Pradesh',
    eway_bill_number: '',
    reverse_charge: false,
    export_supply: false,
    
    // Customer Details
    customer_id: 0,
    bill_to_address: '',
    ship_to_address: '',
    customer_gstin: '',
    customer_email: '',
    
    // Items and Notes
    items: [],
    notes: ''
  })

  const [currentItem, setCurrentItem] = useState<InvoiceItem>({
    product_id: 0,
    qty: 1,
    rate: 0,
    discount: 0,
    discount_type: 'Percentage',
    gst_rate: 0,
    gst_amount: 0,
    hsn_code: '',
    description: ''
  })

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
      setError('Please select a customer, supplier and add at least one item')
      return
    }

    try {
      setLoading(true)
      setError(null)
      await apiCreateInvoice({
        customer_id: formData.customer_id,
        supplier_id: formData.supplier_id,
        invoice_no: formData.invoice_no || undefined,
        date: formData.date,
        due_date: formData.due_date,
        invoice_type: formData.invoice_type,
        currency: formData.currency,
        terms: formData.terms,
        place_of_supply: formData.place_of_supply,
        place_of_supply_state_code: INDIAN_STATES[formData.place_of_supply as keyof typeof INDIAN_STATES] || '09',
        eway_bill_number: formData.eway_bill_number || undefined,
        reverse_charge: formData.reverse_charge,
        export_supply: formData.export_supply,
        bill_to_address: formData.bill_to_address,
        ship_to_address: formData.ship_to_address,
        notes: formData.notes || undefined,
        items: formData.items.map(item => ({
          product_id: item.product_id,
          qty: item.qty,
          rate: item.rate,
          discount: item.discount,
          discount_type: item.discount_type,
          description: item.description,
          hsn_code: item.hsn_code
        }))
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
      setError('Please fill all mandatory item fields')
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
      discount_type: 'Percentage',
      gst_rate: 0,
      gst_amount: 0,
      hsn_code: '',
      description: ''
    })
    setError(null)
  }

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const handleSupplierChange = (supplierId: number) => {
    const supplier = suppliers.find(s => s.id === supplierId)
    setFormData(prev => ({
      ...prev,
      supplier_id: supplierId,
      supplier_address: supplier ? `${supplier.billing_address_line1}${supplier.billing_address_line2 ? ', ' + supplier.billing_address_line2 : ''}, ${supplier.billing_city}, ${supplier.billing_state} - ${supplier.billing_pincode}` : '',
      supplier_gstin: supplier?.gstin || '',
      supplier_email: supplier?.email || ''
    }))
  }

  const handleCustomerChange = (customerId: number) => {
    const customer = customers.find(c => c.id === customerId)
    setFormData(prev => ({
      ...prev,
      customer_id: customerId,
      bill_to_address: customer ? `${customer.billing_address_line1}${customer.billing_address_line2 ? ', ' + customer.billing_address_line2 : ''}, ${customer.billing_city}, ${customer.billing_state} - ${customer.billing_pincode}` : '',
      ship_to_address: customer && customer.shipping_address_line1 ? `${customer.shipping_address_line1}${customer.shipping_address_line2 ? ', ' + customer.shipping_address_line2 : ''}, ${customer.shipping_city}, ${customer.shipping_state} - ${customer.shipping_pincode}` : '',
      customer_gstin: customer?.gstin || '',
      customer_email: customer?.email || ''
    }))
  }

  const handleProductChange = (productId: number) => {
    const product = products.find(p => p.id === productId)
    setCurrentItem(prev => ({
      ...prev,
      product_id: productId,
      rate: product?.sales_price || 0,
      gst_rate: product?.gst_rate || 0,
      hsn_code: product?.hsn || '',
      description: product?.description || ''
    }))
  }

  const handleTermsChange = (terms: string) => {
    const today = new Date()
    let dueDate = new Date()
    
    if (terms === '15 days') {
      dueDate.setDate(today.getDate() + 15)
    } else if (terms === '30 days') {
      dueDate.setDate(today.getDate() + 30)
    } else if (terms === '45 days') {
      dueDate.setDate(today.getDate() + 45)
    } else if (terms === '60 days') {
      dueDate.setDate(today.getDate() + 60)
    } else if (terms === '90 days') {
      dueDate.setDate(today.getDate() + 90)
    } else if (terms === 'Due on Receipt') {
      dueDate = today
    } else if (terms === 'Immediate') {
      dueDate = today
    }
    
    setFormData(prev => ({
      ...prev,
      terms,
      due_date: dueDate.toISOString().split('T')[0]
    }))
  }

  const calculateItemAmount = (item: InvoiceItem): number => {
    const subtotal = item.qty * item.rate
    const discount = item.discount_type === 'Percentage' 
      ? (subtotal * item.discount / 100) 
      : item.discount
    return subtotal - discount
  }

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + calculateItemAmount(item), 0)
    const totalDiscount = formData.items.reduce((sum, item) => {
      const discount = item.discount_type === 'Percentage' 
        ? (item.qty * item.rate * item.discount / 100) 
        : item.discount
      return sum + discount
    }, 0)
    const totalGST = formData.items.reduce((sum, item) => sum + item.gst_amount, 0)
    const grandTotal = subtotal + totalGST
    const roundOff = Math.round(grandTotal) - grandTotal
    const finalTotal = grandTotal + roundOff

    return {
      subtotal,
      totalDiscount,
      totalGST,
      roundOff,
      grandTotal: finalTotal
    }
  }

  const numberToWords = (num: number): string => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
    
    if (num === 0) return 'Zero'
    if (num < 10) return ones[num]
    if (num < 20) return teens[num - 10]
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '')
    if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' and ' + numberToWords(num % 100) : '')
    if (num < 100000) return numberToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + numberToWords(num % 1000) : '')
    if (num < 10000000) return numberToWords(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 ? ' ' + numberToWords(num % 100000) : '')
    return numberToWords(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 ? ' ' + numberToWords(num % 10000000) : '')
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
      <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '16px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#333' }}>Invoice Details</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Invoice Number *
            </label>
            <input
              type="text"
              value={formData.invoice_no}
              onChange={(e) => setFormData(prev => ({ ...prev, invoice_no: e.target.value }))}
              placeholder="Auto-generated if empty"
              maxLength={16}
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
            <input
              type="text"
              value={formData.status}
              readOnly
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
              <option value="Invoice">Invoice</option>
              <option value="Credit Note">Credit Note</option>
              <option value="Debit Note">Debit Note</option>
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
              <option value="INR">INR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Terms *
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
              <option value="15 days">15 days</option>
              <option value="30 days">30 days</option>
              <option value="45 days">45 days</option>
              <option value="60 days">60 days</option>
              <option value="90 days">90 days</option>
              <option value="Due on Receipt">Due on Receipt</option>
              <option value="Immediate">Immediate</option>
            </select>
          </div>
        </div>
      </div>

      {/* Supplier Details Section */}
      <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '16px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#333' }}>Supplier Details</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
              Supplier GSTIN *
            </label>
            <input
              type="text"
              value={formData.supplier_gstin}
              onChange={(e) => setFormData(prev => ({ ...prev, supplier_gstin: e.target.value }))}
              maxLength={15}
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
          
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Supplier Address *
            </label>
            <textarea
              value={formData.supplier_address}
              onChange={(e) => setFormData(prev => ({ ...prev, supplier_address: e.target.value }))}
              maxLength={200}
              required
              rows={2}
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
              Supplier Email
            </label>
            <input
              type="email"
              value={formData.supplier_email}
              onChange={(e) => setFormData(prev => ({ ...prev, supplier_email: e.target.value }))}
              maxLength={100}
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
      </div>

      {/* GST Compliance Section */}
      <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '16px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#333' }}>GST Compliance</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Place of Supply *
            </label>
            <select
              value={formData.place_of_supply}
              onChange={(e) => setFormData(prev => ({ ...prev, place_of_supply: e.target.value }))}
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
              placeholder="Optional - Enter e-way bill number"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={formData.reverse_charge}
                onChange={(e) => setFormData(prev => ({ ...prev, reverse_charge: e.target.checked }))}
                style={{ margin: 0, cursor: 'pointer' }}
              />
              Reverse Charge
            </label>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={formData.export_supply}
                onChange={(e) => setFormData(prev => ({ ...prev, export_supply: e.target.checked }))}
                style={{ margin: 0, cursor: 'pointer' }}
              />
              Export Supply
            </label>
          </div>
        </div>
      </div>

      {/* Customer Details Section */}
      <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '16px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#333' }}>Customer Details</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
              Customer GSTIN *
            </label>
            <input
              type="text"
              value={formData.customer_gstin}
              onChange={(e) => setFormData(prev => ({ ...prev, customer_gstin: e.target.value }))}
              maxLength={15}
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
              Bill To Address *
            </label>
            <textarea
              value={formData.bill_to_address}
              onChange={(e) => setFormData(prev => ({ ...prev, bill_to_address: e.target.value }))}
              maxLength={200}
              required
              rows={2}
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
              maxLength={200}
              required
              rows={2}
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
              Customer Email
            </label>
            <input
              type="email"
              value={formData.customer_email}
              onChange={(e) => setFormData(prev => ({ ...prev, customer_email: e.target.value }))}
              maxLength={100}
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
      </div>

      {/* Invoice Items Section */}
      <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '16px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#333' }}>Invoice Items</h3>
        
        {/* Add Item Form */}
        <div style={{ border: '1px solid #eee', borderRadius: '4px', padding: '12px', marginBottom: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr', gap: '8px', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500' }}>Product *</label>
              <select
                value={currentItem.product_id || ''}
                onChange={(e) => handleProductChange(parseInt(e.target.value) || 0)}
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
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500' }}>Qty *</label>
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
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500' }}>Rate *</label>
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
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500' }}>Discount</label>
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
            
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500' }}>Discount Type</label>
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
                <option value="Percentage">Percentage</option>
                <option value="Fixed">Fixed Amount</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500' }}>GST Rate *</label>
              <input
                type="number"
                step="0.01"
                value={currentItem.gst_rate || ''}
                onChange={(e) => setCurrentItem(prev => ({ ...prev, gst_rate: parseFloat(e.target.value) || 0 }))}
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
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500' }}>HSN Code *</label>
              <input
                type="text"
                value={currentItem.hsn_code}
                onChange={(e) => setCurrentItem(prev => ({ ...prev, hsn_code: e.target.value }))}
                maxLength={10}
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
          <div style={{ border: '1px solid #eee', borderRadius: '4px', overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8f9fa' }}>
                          <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Product</th>
                          <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>Qty</th>
                          <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>Rate</th>
                          <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>Discount</th>
                          <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>HSN</th>
                          <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>GST</th>
                          <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>Amount</th>
                          <th style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>Action</th>
                        </tr>
                      </thead>
              <tbody>
                {formData.items.map((item, index) => {
                  const product = products.find(p => p.id === item.product_id)
                  const amount = calculateItemAmount(item)
                  
                  return (
                                                <tr key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                              <td style={{ padding: '8px' }}>
                                <div>
                                  <div style={{ fontWeight: '500' }}>{product?.name}</div>
                                  {item.description && (
                                    <div style={{ fontSize: '11px', color: '#666' }}>{item.description}</div>
                                  )}
                                </div>
                              </td>
                              <td style={{ padding: '8px', textAlign: 'right' }}>{item.qty}</td>
                              <td style={{ padding: '8px', textAlign: 'right' }}>₹{item.rate.toFixed(2)}</td>
                              <td style={{ padding: '8px', textAlign: 'right' }}>
                                {item.discount_type === 'Percentage' ? `${item.discount}%` : `₹${item.discount.toFixed(2)}`}
                              </td>
                              <td style={{ padding: '8px', textAlign: 'right' }}>{item.hsn_code}</td>
                              <td style={{ padding: '8px', textAlign: 'right' }}>₹{item.gst_amount.toFixed(2)}</td>
                              <td style={{ padding: '8px', textAlign: 'right', fontWeight: '500' }}>₹{amount.toFixed(2)}</td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
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
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Totals Section */}
      <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '16px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#333' }}>Invoice Totals</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ display: 'grid', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px' }}>Subtotal:</span>
              <span style={{ fontSize: '14px', fontWeight: '500' }}>₹{totals.subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px' }}>Total Discount:</span>
              <span style={{ fontSize: '14px', fontWeight: '500' }}>₹{totals.totalDiscount.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px' }}>Total GST:</span>
              <span style={{ fontSize: '14px', fontWeight: '500' }}>₹{totals.totalGST.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px' }}>Round Off:</span>
              <span style={{ fontSize: '14px', fontWeight: '500' }}>₹{totals.roundOff.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #ddd', paddingTop: '8px' }}>
              <span style={{ fontSize: '16px', fontWeight: '600' }}>Grand Total:</span>
              <span style={{ fontSize: '16px', fontWeight: '600', color: '#007bff' }}>₹{totals.grandTotal.toFixed(2)}</span>
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Total in Words
            </label>
            <div style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '14px',
              backgroundColor: '#f8f9fa',
              fontStyle: 'italic',
              minHeight: '20px'
            }}>
              {`${numberToWords(Math.floor(totals.grandTotal))} Rupees Only`}
            </div>
          </div>
        </div>
      </div>

      {/* Other Details Section */}
      <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '16px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#333' }}>Other Details</h3>
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
            Invoice Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Additional notes..."
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
      </div>

      {/* Form Actions */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '10px 20px',
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
            padding: '10px 20px',
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
