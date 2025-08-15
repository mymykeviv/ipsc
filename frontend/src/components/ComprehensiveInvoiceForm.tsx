import { useState, useEffect } from 'react'
import { apiCreateInvoice, apiListCustomers, apiListVendors, apiGetProducts, Party, Product } from '../lib/api'
import { Button } from './Button'
import { ErrorMessage } from './ErrorMessage'
import { formStyles, getSectionHeaderColor } from '../utils/formStyles'

interface ComprehensiveInvoiceFormProps {
  onSuccess: () => void
  onCancel: () => void
  initialData?: any
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
  amount: number
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
  supplier_id: number | null
  supplier_address: string
  supplier_gstin: string
  supplier_email: string
  
  // GST Compliance
  place_of_supply: string
  place_of_supply_state_code: string
  eway_bill_number: string
  reverse_charge: boolean
  export_supply: boolean
  
  // Customer Details
  customer_id: number | null
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

const INVOICE_TYPES = ['Invoice', 'Credit Note', 'Debit Note']
const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP']
const INVOICE_TERMS = ['15 days', '30 days', '45 days', '60 days', '90 days', 'Due on Receipt', 'Immediate']
const DISCOUNT_TYPES = ['Percentage', 'Fixed']

// Helper function to convert number to words
function numberToWords(num: number): string {
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

// Generate invoice number
function generateInvoiceNumber(): string {
  const year = new Date().getFullYear()
  const randomNum = Math.floor(1000 + Math.random() * 9000)
  return `FY${year}/INV-${randomNum}`
}

export function ComprehensiveInvoiceForm({ onSuccess, onCancel }: ComprehensiveInvoiceFormProps) {
  console.log('🔄 ComprehensiveInvoiceForm rendered - Searchable inputs enabled - VERSION 2.0')
  const [customers, setCustomers] = useState<Party[]>([])
  const [suppliers, setSuppliers] = useState<Party[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  
  const [formData, setFormData] = useState<InvoiceFormData>({
    // Invoice Details
    invoice_no: generateInvoiceNumber(),
    date: new Date().toISOString().split('T')[0],
    due_date: new Date().toISOString().split('T')[0],
    status: 'Draft',
    invoice_type: 'Invoice',
    currency: 'INR',
    terms: 'Immediate',
    
    // Supplier Details
    supplier_id: null,
    supplier_address: '',
    supplier_gstin: '',
    supplier_email: '',
    
    // GST Compliance
    place_of_supply: 'Uttar Pradesh',
    place_of_supply_state_code: '09',
    eway_bill_number: '',
    reverse_charge: false,
    export_supply: false,
    
    // Customer Details
    customer_id: null,
    bill_to_address: '',
    ship_to_address: '',
    customer_gstin: '',
    customer_email: '',
    
    // Items and Notes
    items: [{
      product_id: 0,
      qty: 0,
      rate: 0,
      discount: 0,
      discount_type: 'Percentage',
      gst_rate: 0,
      gst_amount: 0,
      hsn_code: '',
      description: '',
      amount: 0
    }],
    notes: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    console.log('Suppliers state updated:', suppliers)
    console.log('Suppliers count:', suppliers.length)
  }, [suppliers])

  const loadData = async () => {
    try {
      console.log('Starting to load data...')
      const [customersData, suppliersData, productsData] = await Promise.all([
        apiListCustomers('', true), // Include inactive customers
        apiListVendors('', true),   // Include inactive vendors
        apiGetProducts()
      ])
      console.log('Loaded customers:', customersData)
      console.log('Loaded suppliers:', suppliersData)
      console.log('Loaded products:', productsData)
      console.log('Suppliers length:', suppliersData?.length || 0)
      setCustomers(customersData)
      setSuppliers(suppliersData)
      setProducts(productsData)
    } catch (err: any) {
      console.error('Error loading data:', err)
      setError(err.message || 'Failed to load data')
    }
  }

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...formData.items]
    newItems[index] = { ...newItems[index], [field]: value }
    
    // Auto-fill product details when product is selected
    if (field === 'product_id' && value > 0) {
      const product = products.find(p => p.id === value)
      if (product) {
        newItems[index].rate = product.sales_price
        newItems[index].gst_rate = product.gst_rate || 18
        newItems[index].hsn_code = product.hsn || ''
        newItems[index].description = product.name
      }
    }
    
    // Recalculate amounts
    const item = newItems[index]
    const discountAmount = item.discount_type === 'Percentage' 
      ? (item.rate * item.qty * item.discount / 100)
      : item.discount
    item.amount = (item.rate * item.qty) - discountAmount
    item.gst_amount = item.amount * (item.gst_rate / 100)
    
    setFormData({ ...formData, items: newItems })
  }

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, {
        product_id: 0,
        qty: 0,
        rate: 0,
        discount: 0,
        discount_type: 'Percentage',
        gst_rate: 0,
        gst_amount: 0,
        hsn_code: '',
        description: '',
        amount: 0
      }]
    })
  }

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index)
      setFormData({ ...formData, items: newItems })
    }
  }

  const updateDueDate = (terms: string) => {
    let dueDate = new Date()
    switch (terms) {
      case '15 days':
        dueDate.setDate(dueDate.getDate() + 15)
        break
      case '30 days':
        dueDate.setDate(dueDate.getDate() + 30)
        break
      case '45 days':
        dueDate.setDate(dueDate.getDate() + 45)
        break
      case '60 days':
        dueDate.setDate(dueDate.getDate() + 60)
        break
      case '90 days':
        dueDate.setDate(dueDate.getDate() + 90)
        break
      default:
        dueDate = new Date()
    }
    setFormData({
      ...formData,
      terms,
      due_date: dueDate.toISOString().split('T')[0]
    })
  }



  const updateSupplierDetails = (supplierId: number) => {
    if (supplierId === 0) {
      // Clear supplier details when no supplier is selected
      setFormData({
        ...formData,
        supplier_id: null,
        supplier_address: '',
        supplier_gstin: '',
        supplier_email: ''
      })
      return
    }
    
    const supplier = suppliers.find(s => s.id === supplierId)
    if (supplier) {
      const address = `${supplier.billing_address_line1}${supplier.billing_address_line2 ? ', ' + supplier.billing_address_line2 : ''}, ${supplier.billing_city}, ${supplier.billing_state} - ${supplier.billing_pincode}`
      setFormData({
        ...formData,
        supplier_id: supplierId,
        supplier_address: address,
        supplier_gstin: supplier.gstin || '',
        supplier_email: supplier.email || ''
      })
    }
  }

  const updateCustomerDetails = (customerId: number) => {
    if (customerId === 0) {
      // Clear customer details when no customer is selected
      setFormData({
        ...formData,
        customer_id: null,
        bill_to_address: '',
        ship_to_address: '',
        customer_gstin: '',
        customer_email: ''
      })
      return
    }
    
    const customer = customers.find(c => c.id === customerId)
    if (customer) {
      const address = `${customer.billing_address_line1}${customer.billing_address_line2 ? ', ' + customer.billing_address_line2 : ''}, ${customer.billing_city}, ${customer.billing_state} - ${customer.billing_pincode}`
      setFormData({
        ...formData,
        customer_id: customerId,
        bill_to_address: address,
        ship_to_address: address,
        customer_gstin: customer.gstin || '',
        customer_email: customer.email || ''
      })
    }
  }

  // Calculate totals with GST breakup
  const totals = {
    subtotal: formData.items.reduce((sum, item) => sum + item.amount, 0),
    discount: formData.items.reduce((sum, item) => {
      const discountAmount = item.discount_type === 'Percentage' 
        ? (item.rate * item.qty * item.discount / 100)
        : item.discount
      return sum + discountAmount
    }, 0),
    gst: formData.items.reduce((sum, item) => sum + item.gst_amount, 0),
    total: 0,
    totalInWords: '',
    // GST Breakup calculation
    cgst: 0,
    sgst: 0,
    igst: 0,
    utgst: 0,
    cess: 0
  }
  
  // Calculate GST breakup based on place of supply
  const supplierState = suppliers.find(s => s.id === formData.supplier_id)?.billing_state || ''
  const customerState = customers.find(c => c.id === formData.customer_id)?.billing_state || ''
  const placeOfSupplyState = formData.place_of_supply
  
  // If supplier and customer are in same state, apply CGST + SGST
  // If different states, apply IGST
  if (supplierState && customerState && supplierState === customerState && supplierState === placeOfSupplyState) {
    totals.cgst = totals.gst / 2
    totals.sgst = totals.gst / 2
  } else {
    totals.igst = totals.gst
  }
  
  totals.total = totals.subtotal + totals.gst
  totals.totalInWords = numberToWords(Math.round(totals.total)) + ' Rupees Only'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await apiCreateInvoice({
        customer_id: formData.customer_id!,
        supplier_id: formData.supplier_id!,
        invoice_no: formData.invoice_no,
        date: formData.date,
        terms: formData.terms,
        place_of_supply: formData.place_of_supply,
        place_of_supply_state_code: formData.place_of_supply_state_code,
        eway_bill_number: formData.eway_bill_number,
        reverse_charge: formData.reverse_charge,
        export_supply: formData.export_supply,
        bill_to_address: formData.bill_to_address,
        ship_to_address: formData.ship_to_address,
        items: formData.items.map(item => ({
          product_id: item.product_id,
          qty: item.qty,
          rate: item.rate,
          discount: item.discount,
          discount_type: item.discount_type,
          description: item.description,
          hsn_code: item.hsn_code
        })),
        notes: formData.notes
      })
      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Failed to create invoice')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', maxWidth: '100%' }}>
      <ErrorMessage message={error} />

      {/* Row 1: Invoice Details | GST Compliance */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        
        {/* Invoice Details Section */}
        <div>
          <h3 style={{ marginBottom: '4px', color: '#333', borderBottom: '2px solid #007bff', paddingBottom: '2px', fontSize: '1.5rem' }}>
            📄 Invoice Details
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* Row 1: Invoice Number * | Invoice Date * */}
            <div style={formStyles.formGroup}>
              <label style={formStyles.label}>Invoice Number *</label>
              <input
                type="text"
                value={formData.invoice_no}
                onChange={(e) => setFormData({...formData, invoice_no: e.target.value})}
                maxLength={16}
                required
                style={formStyles.input}
              />
            </div>
            <div style={formStyles.formGroup}>
              <label style={formStyles.label}>Invoice Date *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                required
                style={formStyles.input}
              />
            </div>
            
            {/* Row 2: Invoice Terms * | Invoice Due Date * */}
            <div style={formStyles.formGroup}>
              <label style={formStyles.label}>Invoice Terms *</label>
              <select
                value={formData.terms}
                onChange={(e) => updateDueDate(e.target.value)}
                required
                style={formStyles.select}
              >
                {INVOICE_TERMS.map(term => (
                  <option key={term} value={term}>{term}</option>
                ))}
              </select>
            </div>
            <div style={formStyles.formGroup}>
              <label style={formStyles.label}>Invoice Due Date *</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                required
                style={formStyles.input}
              />
            </div>
            
            {/* Row 3: Invoice Status (read-only) | Invoice Type (read-only) | Invoice Currency (read-only) */}
            <div style={formStyles.formGroup}>
              <label style={formStyles.label}>Invoice Status</label>
              <input
                type="text"
                value={formData.status}
                readOnly
                style={{ ...formStyles.input, backgroundColor: '#f9f9f9' }}
              />
            </div>
            <div style={formStyles.formGroup}>
              <label style={formStyles.label}>Invoice Type</label>
              <input
                type="text"
                value={formData.invoice_type}
                readOnly
                style={{ ...formStyles.input, backgroundColor: '#f9f9f9' }}
              />
            </div>
            <div style={formStyles.formGroup}>
              <label style={formStyles.label}>Invoice Currency</label>
              <input
                type="text"
                value={formData.currency}
                readOnly
                style={{ ...formStyles.input, backgroundColor: '#f9f9f9' }}
              />
            </div>
          </div>
        </div>

        {/* GST Compliance Section */}
        <div>
          <h3 style={{ marginBottom: '4px', color: '#333', borderBottom: '2px solid #ffc107', paddingBottom: '2px', fontSize: '1.5rem' }}>
            🏛️ GST Compliance
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* First Row */}
            <div style={formStyles.formGroup}>
              <label style={formStyles.label}>Place of Supply *</label>
              <select
                value={formData.place_of_supply}
                onChange={(e) => {
                  const state = e.target.value
                  const stateCode = INDIAN_STATES[state as keyof typeof INDIAN_STATES] || ''
                  setFormData({
                    ...formData, 
                    place_of_supply: state,
                    place_of_supply_state_code: stateCode
                  })
                }}
                required
                style={formStyles.select}
              >
                {Object.keys(INDIAN_STATES).map(state => (
                  <option key={state} value={state}>
                    {state} ({INDIAN_STATES[state as keyof typeof INDIAN_STATES]})
                  </option>
                ))}
              </select>
            </div>
            <div style={{ ...formStyles.formGroup, gridColumn: 'span 2' }}>
              <label style={formStyles.label}>E-way Bill Number</label>
              <input
                type="text"
                value={formData.eway_bill_number}
                onChange={(e) => setFormData({...formData, eway_bill_number: e.target.value})}
                maxLength={15}
                style={formStyles.input}
              />
            </div>
            
            {/* Second Row: Export Supply | Reverse Charge */}
            <div style={formStyles.formGroup}>
              <label style={formStyles.label}>Export Supply</label>
              <select
                value={formData.export_supply ? 'Yes' : 'No'}
                onChange={(e) => setFormData({...formData, export_supply: e.target.value === 'Yes'})}
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
                onChange={(e) => setFormData({...formData, reverse_charge: e.target.value === 'Yes'})}
                style={formStyles.select}
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Supplier Details | Customer Details */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        
        {/* Supplier Details Section */}
        <div>
          <h3 style={{ marginBottom: '4px', color: '#333', borderBottom: '2px solid #28a745', paddingBottom: '2px', fontSize: '1.5rem' }}>
            🔍 Supplier Details (Searchable)
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* Row 1: Supplier Name * | Supplier GSTIN (optional) */}
            <div style={formStyles.formGroup}>
              <label style={formStyles.label}>Supplier Name *</label>
              <select
                value={formData.supplier_id || ''}
                onChange={(e) => updateSupplierDetails(Number(e.target.value) || 0)}
                required
                style={formStyles.select}
              >
                <option value="">🔍 Search Suppliers... ({suppliers.length} available)</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name} {supplier.gstin ? `(${supplier.gstin})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div style={formStyles.formGroup}>
              <label style={formStyles.label}>Supplier GSTIN (optional)</label>
              <input
                type="text"
                value={formData.supplier_gstin}
                onChange={(e) => setFormData({...formData, supplier_gstin: e.target.value})}
                maxLength={15}
                style={formStyles.input}
              />
            </div>
            
            {/* Row 2: Supplier Email */}
            <div style={formStyles.formGroup}>
              <label style={formStyles.label}>Supplier Email</label>
              <input
                type="email"
                value={formData.supplier_email}
                onChange={(e) => setFormData({...formData, supplier_email: e.target.value})}
                maxLength={100}
                style={formStyles.input}
              />
            </div>
            
            {/* Row 3: Supplier Address * */}
            <div style={{ ...formStyles.formGroup, gridColumn: 'span 2' }}>
              <label style={formStyles.label}>Supplier Address *</label>
              <input
                type="text"
                value={formData.supplier_address}
                onChange={(e) => setFormData({...formData, supplier_address: e.target.value})}
                maxLength={200}
                required
                style={formStyles.input}
              />
            </div>
          </div>
        </div>

        {/* Customer Details Section */}
        <div>
          <h3 style={{ marginBottom: '4px', color: '#333', borderBottom: '2px solid #6c757d', paddingBottom: '2px', fontSize: '1.5rem' }}>
            👤 Customer Details (Searchable)
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* Row 1: Customer Name * | Customer GSTIN (optional) */}
            <div style={formStyles.formGroup}>
              <label style={formStyles.label}>Customer Name *</label>
              <select
                value={formData.customer_id || ''}
                onChange={(e) => updateCustomerDetails(Number(e.target.value))}
                required
                style={formStyles.select}
              >
                <option value="">👤 Search Customers... ({customers.length} available)</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} {customer.gstin ? `(${customer.gstin})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div style={formStyles.formGroup}>
              <label style={formStyles.label}>Customer GSTIN (optional)</label>
              <input
                type="text"
                value={formData.customer_gstin}
                onChange={(e) => setFormData({...formData, customer_gstin: e.target.value})}
                maxLength={15}
                style={formStyles.input}
              />
            </div>
            
            {/* Row 2: Customer Email */}
            <div style={formStyles.formGroup}>
              <label style={formStyles.label}>Customer Email</label>
              <input
                type="email"
                value={formData.customer_email}
                onChange={(e) => setFormData({...formData, customer_email: e.target.value})}
                maxLength={100}
                style={formStyles.input}
              />
            </div>
            
            {/* Row 3: Customer Bill To Address * */}
            <div style={{ ...formStyles.formGroup, gridColumn: 'span 2' }}>
              <label style={formStyles.label}>Customer Bill To Address *</label>
              <input
                type="text"
                value={formData.bill_to_address}
                onChange={(e) => setFormData({...formData, bill_to_address: e.target.value})}
                maxLength={200}
                required
                style={formStyles.input}
              />
            </div>
            
            {/* Row 4: Customer Ship To Address * */}
            <div style={{ ...formStyles.formGroup, gridColumn: 'span 2' }}>
              <label style={formStyles.label}>Customer Ship To Address *</label>
              <input
                type="text"
                value={formData.ship_to_address}
                onChange={(e) => setFormData({...formData, ship_to_address: e.target.value})}
                maxLength={200}
                required
                style={formStyles.input}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Items Section */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ marginBottom: '16px', color: '#333', borderBottom: '2px solid #007bff', paddingBottom: '8px' }}>
          Invoice Items
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
                <th style={{ padding: '8px', textAlign: 'left', border: '1px solid var(--border)' }}>Discount Type</th>
                <th style={{ padding: '8px', textAlign: 'left', border: '1px solid var(--border)' }}>Discount</th>
                <th style={{ padding: '8px', textAlign: 'left', border: '1px solid var(--border)' }}>GST Rate</th>
                <th style={{ padding: '8px', textAlign: 'left', border: '1px solid var(--border)' }}>GST Amount</th>
                <th style={{ padding: '8px', textAlign: 'left', border: '1px solid var(--border)' }}>HSN Code</th>
                <th style={{ padding: '8px', textAlign: 'left', border: '1px solid var(--border)' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {formData.items.map((item, index) => {
                const product = products.find(p => p.id === item.product_id)
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
                      <select
                        value={item.discount_type}
                        onChange={(e) => updateItem(index, 'discount_type', e.target.value as 'Percentage' | 'Fixed')}
                        style={{ width: '80px', padding: '4px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                      >
                        {DISCOUNT_TYPES.map(type => (
                          <option key={type} value={type}>{type === 'Percentage' ? '%' : '₹'}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '8px', border: '1px solid var(--border)' }}>
                      <input
                        type="number"
                        value={item.discount}
                        onChange={(e) => updateItem(index, 'discount', Number(e.target.value))}
                        min={0}
                        step={0.01}
                        style={{ width: '60px', padding: '4px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
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
                        type="number"
                        value={item.gst_amount.toFixed(2)}
                        readOnly
                        style={{ width: '80px', padding: '4px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', backgroundColor: '#f9f9f9' }}
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
                        value={item.amount.toFixed(2)}
                        readOnly
                        style={{ width: '80px', padding: '4px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', backgroundColor: '#f9f9f9' }}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Totals Section */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '16px', color: '#333', borderBottom: '2px solid #28a745', paddingBottom: '8px' }}>
          Invoice Totals
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <label>Subtotal</label>
            <input
              type="text"
              value={`₹${totals.subtotal.toFixed(2)}`}
              readOnly
              style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', backgroundColor: '#f9f9f9' }}
            />
          </div>
          <div>
            <label>Total Discount</label>
            <input
              type="text"
              value={`₹${totals.discount.toFixed(2)}`}
              readOnly
              style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', backgroundColor: '#f9f9f9' }}
            />
          </div>
          <div>
            <label>Total GST Amount</label>
            <input
              type="text"
              value={`₹${totals.gst.toFixed(2)}`}
              readOnly
              style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', backgroundColor: '#f9f9f9' }}
            />
          </div>
          {totals.cgst > 0 && (
            <div>
              <label>CGST (9%)</label>
              <input
                type="text"
                value={`₹${totals.cgst.toFixed(2)}`}
                readOnly
                style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', backgroundColor: '#f9f9f9' }}
              />
            </div>
          )}
          {totals.sgst > 0 && (
            <div>
              <label>SGST (9%)</label>
              <input
                type="text"
                value={`₹${totals.sgst.toFixed(2)}`}
                readOnly
                style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', backgroundColor: '#f9f9f9' }}
              />
            </div>
          )}
          {totals.igst > 0 && (
            <div>
              <label>IGST (18%)</label>
              <input
                type="text"
                value={`₹${totals.igst.toFixed(2)}`}
                readOnly
                style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', backgroundColor: '#f9f9f9' }}
              />
            </div>
          )}
          <div>
            <label>Grand Total</label>
            <input
              type="text"
              value={`₹${totals.total.toFixed(2)}`}
              readOnly
              style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', backgroundColor: '#f9f9f9', fontWeight: 'bold' }}
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label>Total in Words</label>
            <input
              type="text"
              value={totals.totalInWords}
              readOnly
              style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', backgroundColor: '#f9f9f9', fontStyle: 'italic' }}
            />
          </div>
        </div>
      </div>

      {/* Other Details Section */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '16px', color: '#333', borderBottom: '2px solid #6c757d', paddingBottom: '8px' }}>
          Other Details
        </h3>
        <div>
          <label>Invoice Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            maxLength={200}
            rows={3}
            placeholder="Optional notes..."
            style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
          />
        </div>
      </div>

      {/* Form Actions */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <Button type="button" onClick={onCancel} variant="secondary">
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? 'Creating...' : 'Create Invoice'}
        </Button>
      </div>
    </form>
  )
}
