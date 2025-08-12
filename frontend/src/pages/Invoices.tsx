import { useEffect, useState } from 'react'
import { apiListParties, apiGetProducts, apiCreateInvoice, Party, Product } from '../lib/api'
import { useAuth } from '../modules/AuthContext'
import { Card } from '../components/Card'
import { Button } from '../components/Button'

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

interface InvoiceItem {
  product_id: number
  qty: number
  rate: number
  discount: number
  discount_type: 'Percentage' | 'Fixed'
}

interface InvoiceFormData {
  customer_id: number | null
  invoice_no: string
  date: string
  terms: string
  
  // GST Compliance Fields
  place_of_supply: string
  place_of_supply_state_code: string
  eway_bill_number: string
  reverse_charge: boolean
  export_supply: boolean
  
  // Address Details
  bill_to_address: string
  ship_to_address: string
  
  // Items and Notes
  items: InvoiceItem[]
  notes: string
}

interface Invoice {
  id: number
  invoice_no: string
  customer_name: string
  date: string
  due_date: string
  grand_total: number
  status: string
}

export function Invoices() {
  const { token } = useAuth()
  const [customers, setCustomers] = useState<Party[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [emailAddress, setEmailAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [selectedCustomer, setSelectedCustomer] = useState<Party | null>(null)

  const [formData, setFormData] = useState<InvoiceFormData>({
    customer_id: null,
    invoice_no: '',
    date: new Date().toISOString().split('T')[0],
    terms: 'Due on Receipt',
    
    // GST Compliance Fields
    place_of_supply: '',
    place_of_supply_state_code: '',
    eway_bill_number: '',
    reverse_charge: false,
    export_supply: false,
    
    // Address Details
    bill_to_address: '',
    ship_to_address: '',
    
    // Items and Notes
    items: [{ product_id: 0, qty: 1, rate: 0, discount: 0, discount_type: 'Percentage' }],
    notes: ''
  })

  useEffect(() => {
    if (!token) return
    loadData()
  }, [token, searchTerm, statusFilter])

  const loadData = async () => {
    try {
      setLoading(true)
      const [customersData, productsData, invoicesData] = await Promise.all([
        apiListParties('customer', '', true), // Include inactive
        apiGetProducts(),
        apiGetInvoices(searchTerm, statusFilter)
      ])
      setCustomers(customersData)
      setProducts(productsData)
      setInvoices(invoicesData)
    } catch (err) {
      console.error('Failed to load data:', err)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleCustomerChange = (customerId: number) => {
    const customer = customers.find(c => c.id === customerId)
    setSelectedCustomer(customer || null)
    setFormData(prev => ({
      ...prev,
      customer_id: customerId,
      place_of_supply: customer ? customer.state : '',
      bill_to_address: customer ? formatAddress(customer, 'billing') : '',
      ship_to_address: customer ? formatAddress(customer, 'shipping') : ''
    }))
  }

  const formatAddress = (customer: Party, type: 'billing' | 'shipping'): string => {
    if (type === 'billing') {
      return `${customer.billing_address_line1}${customer.billing_address_line2 ? ', ' + customer.billing_address_line2 : ''}, ${customer.billing_city}, ${customer.billing_state} - ${customer.billing_pincode}`
    } else {
      if (!customer.shipping_address_line1) return ''
      return `${customer.shipping_address_line1}${customer.shipping_address_line2 ? ', ' + customer.shipping_address_line2 : ''}, ${customer.shipping_city}, ${customer.shipping_state} - ${customer.shipping_pincode}`
    }
  }

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { product_id: 0, qty: 1, rate: 0, discount: 0, discount_type: 'Percentage' }]
    }))
  }

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value }
          // Auto-fill rate when product is selected
          if (field === 'product_id' && value) {
            const product = products.find(p => p.id === value)
            if (product) {
              updatedItem.rate = product.sales_price
            }
          }
          return updatedItem
        }
        return item
      })
    }))
  }

  const calculateLineTotal = (item: InvoiceItem): number => {
    const subtotal = item.qty * item.rate
    const discount = item.discount_type === 'Percentage' 
      ? (subtotal * item.discount / 100) 
      : item.discount
    return subtotal - discount
  }

  const calculateTotals = () => {
    const totals = formData.items.reduce((acc, item) => {
      const lineTotal = calculateLineTotal(item)
      const product = products.find(p => p.id === item.product_id)
      const gstRate = product?.gst_rate || 0
      const gstAmount = lineTotal * (gstRate / 100)
      
      return {
        taxable: acc.taxable + lineTotal,
        gst: acc.gst + gstAmount,
        total: acc.total + lineTotal + gstAmount
      }
    }, { taxable: 0, gst: 0, total: 0 })

    return totals
  }

  const validateForm = (): string[] => {
    const errors: string[] = []
    
    if (!formData.customer_id) errors.push('Customer is required')
    if (formData.invoice_no && formData.invoice_no.length > 16) errors.push('Invoice number must be 16 characters or less as per GST law')
    if (formData.invoice_no && !/^[a-zA-Z0-9\s-]+$/.test(formData.invoice_no)) errors.push('Invoice number must be alphanumeric with spaces and hyphens only')
    if (!formData.place_of_supply) errors.push('Place of supply is mandatory as per GST law')
    if (!formData.place_of_supply_state_code) errors.push('Place of supply state code is mandatory as per GST law')
    if (!formData.bill_to_address) errors.push('Bill to address is required')
    if (formData.bill_to_address.length > 200) errors.push('Bill to address must be 200 characters or less')
    if (!formData.ship_to_address) errors.push('Ship to address is required')
    if (formData.ship_to_address.length > 200) errors.push('Ship to address must be 200 characters or less')
    if (formData.notes.length > 200) errors.push('Notes must be 200 characters or less')
    if (formData.eway_bill_number && !/^[0-9]+$/.test(formData.eway_bill_number)) errors.push('E-way bill number must contain only numbers')
    if (formData.eway_bill_number && formData.eway_bill_number.length > 50) errors.push('E-way bill number must be 50 characters or less')
    
    formData.items.forEach((item, index) => {
      if (!item.product_id) errors.push(`Product is required for item ${index + 1}`)
      if (item.qty < 1) errors.push(`Quantity must be at least 1 for item ${index + 1}`)
      if (item.rate < 0) errors.push(`Rate must be positive for item ${index + 1}`)
      if (item.discount < 0) errors.push(`Discount must be positive for item ${index + 1}`)
      if (item.discount_type === 'Percentage' && item.discount > 100) errors.push(`Discount percentage cannot exceed 100% for item ${index + 1}`)
    })
    
    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const errors = validateForm()
    if (errors.length > 0) {
      setError(errors.join(', '))
      return
    }

    try {
      setLoading(true)
      setError('')
      
      const payload = {
        customer_id: formData.customer_id!,
        invoice_no: formData.invoice_no || undefined,
        date: formData.date,
        terms: formData.terms,
        
        // GST Compliance Fields
        place_of_supply: formData.place_of_supply,
        place_of_supply_state_code: formData.place_of_supply_state_code,
        eway_bill_number: formData.eway_bill_number || undefined,
        reverse_charge: formData.reverse_charge,
        export_supply: formData.export_supply,
        
        // Address Details
        bill_to_address: formData.bill_to_address,
        ship_to_address: formData.ship_to_address,
        
        // Items and Notes
        items: formData.items.map(item => ({
          product_id: item.product_id,
          qty: item.qty,
          rate: item.rate,
          discount: item.discount,
          discount_type: item.discount_type
        })),
        notes: formData.notes || undefined
      }

      await apiCreateInvoice(payload)
      setShowModal(false)
      resetForm()
      // TODO: Refresh invoices list
    } catch (err: any) {
      setError(err.message || 'Failed to create invoice')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      customer_id: null,
      invoice_no: '',
      date: new Date().toISOString().split('T')[0],
      terms: 'Due on Receipt',
      
      // GST Compliance Fields
      place_of_supply: '',
      place_of_supply_state_code: '',
      eway_bill_number: '',
      reverse_charge: false,
      export_supply: false,
      
      // Address Details
      bill_to_address: '',
      ship_to_address: '',
      
      // Items and Notes
      items: [{ product_id: 0, qty: 1, rate: 0, discount: 0, discount_type: 'Percentage' }],
      notes: ''
    })
    setSelectedCustomer(null)
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const totals = calculateTotals()

  if (loading && invoices.length === 0) {
    return (
      <Card>
        <div>Loading...</div>
      </Card>
    )
  }

  return (
    <div>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1>Invoices</h1>
          <Button onClick={() => setShowModal(true)} variant="primary">
            Add Invoice
          </Button>
        </div>

        {/* Search and Filter */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1, padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
          >
            <option value="">All Status</option>
            <option value="Draft">Draft</option>
            <option value="Sent">Sent</option>
            <option value="Paid">Paid</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>

        {/* Invoices Table */}
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort('invoice_no')} style={{ cursor: 'pointer' }}>
                  Invoice Number {sortField === 'invoice_no' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('customer_name')} style={{ cursor: 'pointer' }}>
                  Customer Name {sortField === 'customer_name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('date')} style={{ cursor: 'pointer' }}>
                  Invoice Date {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('due_date')} style={{ cursor: 'pointer' }}>
                  Due Date {sortField === 'due_date' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('grand_total')} style={{ cursor: 'pointer' }}>
                  Invoice Amount {sortField === 'grand_total' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>
                  Invoice Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                    No invoices found
                  </td>
                </tr>
              ) : (
                invoices.map(invoice => (
                  <tr key={invoice.id}>
                    <td>{invoice.invoice_no}</td>
                    <td>{invoice.customer_name}</td>
                    <td>{new Date(invoice.date).toLocaleDateString()}</td>
                    <td>{new Date(invoice.due_date).toLocaleDateString()}</td>
                    <td>₹{invoice.grand_total.toFixed(2)}</td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '14px',
                        backgroundColor: 
                          invoice.status === 'Paid' ? '#dcfce7' :
                          invoice.status === 'Sent' ? '#dbeafe' :
                          invoice.status === 'Overdue' ? '#fecaca' : '#fef3c7',
                        color: 
                          invoice.status === 'Paid' ? '#166534' :
                          invoice.status === 'Sent' ? '#1e40af' :
                          invoice.status === 'Overdue' ? '#dc2626' : '#92400e'
                      }}>
                        {invoice.status}
                      </span>
                    </td>
                                         <td>
                       <div style={{ display: 'flex', gap: '4px' }}>
                         <Button variant="secondary" size="small">Edit</Button>
                         <Button 
                           variant="secondary" 
                           size="small"
                           onClick={() => window.open(`/api/invoices/${invoice.id}/pdf`, '_blank')}
                         >
                           Print
                         </Button>
                         <Button 
                           variant="secondary" 
                           size="small"
                           onClick={() => {
                             setSelectedInvoice(invoice)
                             setEmailAddress('')
                             setShowEmailModal(true)
                           }}
                         >
                           Email
                         </Button>
                         <Button variant="secondary" size="small">Payment</Button>
                         <Button 
                           variant="secondary" 
                           size="small"
                           onClick={async () => {
                             if (window.confirm(`Are you sure you want to delete invoice ${invoice.invoice_no}?`)) {
                               try {
                                 await apiDeleteInvoice(invoice.id)
                                 loadData() // Refresh the list
                               } catch (err: any) {
                                 setError(err.message || 'Failed to delete invoice')
                               }
                             }
                           }}
                         >
                           Delete
                         </Button>
                       </div>
                     </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add/Edit Invoice Modal */}
      {showModal && (
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
            backgroundColor: 'white',
            borderRadius: 'var(--radius)',
            padding: '24px',
            width: '80%',
            maxWidth: '1200px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>Create New Invoice</h2>
              <Button onClick={() => setShowModal(false)} variant="secondary">×</Button>
            </div>

            {error && (
              <div style={{ 
                padding: '12px', 
                backgroundColor: '#fecaca', 
                color: '#dc2626', 
                borderRadius: 'var(--radius)', 
                marginBottom: '16px' 
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Invoice Details */}
              <div style={{ marginBottom: '24px' }}>
                <h3>Invoice Details</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label>Invoice Number</label>
                    <input
                      type="text"
                      value={formData.invoice_no}
                      onChange={(e) => setFormData({...formData, invoice_no: e.target.value})}
                      placeholder="Auto-generated if empty"
                      maxLength={16}
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    />
                  </div>
                  <div>
                    <label>Invoice Date</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      required
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    />
                  </div>
                  <div>
                    <label>Terms</label>
                    <select
                      value={formData.terms}
                      onChange={(e) => setFormData({...formData, terms: e.target.value})}
                      required
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    >
                      <option value="Due on Receipt">Due on Receipt</option>
                      <option value="15 days">15 days</option>
                      <option value="30 days">30 days</option>
                      <option value="45 days">45 days</option>
                      <option value="60 days">60 days</option>
                      <option value="90 days">90 days</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* GST Compliance Details */}
              <div style={{ marginBottom: '24px' }}>
                <h3>GST Compliance Details</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label>Place of Supply *</label>
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
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    >
                      <option value="">Select State...</option>
                      {Object.keys(INDIAN_STATES).map(state => (
                        <option key={state} value={state}>
                          {state} ({INDIAN_STATES[state as keyof typeof INDIAN_STATES]})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label>E-way Bill Number</label>
                    <input
                      type="text"
                      value={formData.eway_bill_number}
                      onChange={(e) => setFormData({...formData, eway_bill_number: e.target.value})}
                      placeholder="Optional - Enter e-way bill number"
                      maxLength={50}
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    />
                  </div>
                  <div>
                    <label>
                      <input
                        type="checkbox"
                        checked={formData.reverse_charge}
                        onChange={(e) => setFormData({...formData, reverse_charge: e.target.checked})}
                        style={{ marginRight: '8px' }}
                      />
                      Reverse Charge
                    </label>
                  </div>
                  <div>
                    <label>
                      <input
                        type="checkbox"
                        checked={formData.export_supply}
                        onChange={(e) => setFormData({...formData, export_supply: e.target.checked})}
                        style={{ marginRight: '8px' }}
                      />
                      Export Supply
                    </label>
                  </div>
                </div>
              </div>

              {/* Customer Details */}
              <div style={{ marginBottom: '24px' }}>
                <h3>Customer Details</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label>Customer Name *</label>
                    <select
                      value={formData.customer_id || ''}
                      onChange={(e) => handleCustomerChange(Number(e.target.value))}
                      required
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    >
                      <option value="">Select Customer...</option>
                      {customers.map(customer => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label>Bill To Address *</label>
                    <textarea
                      value={formData.bill_to_address}
                      onChange={(e) => setFormData({...formData, bill_to_address: e.target.value})}
                      required
                      maxLength={200}
                      rows={3}
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    />
                  </div>
                  <div>
                    <label>Ship To Address *</label>
                    <textarea
                      value={formData.ship_to_address}
                      onChange={(e) => setFormData({...formData, ship_to_address: e.target.value})}
                      required
                      maxLength={200}
                      rows={3}
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    />
                  </div>
                </div>
              </div>

              {/* Items/Products */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3>Items/Products</h3>
                  <Button type="button" onClick={addItem} variant="secondary">Add Item</Button>
                </div>
                
                <div style={{ overflowX: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Product Name *</th>
                        <th>Description</th>
                        <th>HSN Code</th>
                        <th>Quantity *</th>
                        <th>Price *</th>
                        <th>Discount</th>
                        <th>Discount Type</th>
                        <th>GST Rate</th>
                        <th>GST Amount</th>
                        <th>Amount</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items.map((item, index) => {
                        const product = products.find(p => p.id === item.product_id)
                        const lineTotal = calculateLineTotal(item)
                        const gstAmount = lineTotal * ((product?.gst_rate || 0) / 100)
                        const totalAmount = lineTotal + gstAmount
                        
                        return (
                          <tr key={index}>
                            <td>
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
                            </td>
                            <td>{product?.description || '-'}</td>
                            <td>{product?.hsn || '-'}</td>
                            <td>
                              <input
                                type="number"
                                value={item.qty}
                                onChange={(e) => updateItem(index, 'qty', Number(e.target.value))}
                                min={1}
                                required
                                style={{ width: '60px', padding: '4px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                              />
                            </td>
                            <td>
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
                            <td>
                              <input
                                type="number"
                                value={item.discount}
                                onChange={(e) => updateItem(index, 'discount', Number(e.target.value))}
                                min={0}
                                step={0.01}
                                style={{ width: '60px', padding: '4px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                              />
                            </td>
                            <td>
                              <select
                                value={item.discount_type}
                                onChange={(e) => updateItem(index, 'discount_type', e.target.value as 'Percentage' | 'Fixed')}
                                style={{ width: '80px', padding: '4px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                              >
                                <option value="Percentage">%</option>
                                <option value="Fixed">₹</option>
                              </select>
                            </td>
                            <td>{product?.gst_rate || 0}%</td>
                            <td>₹{gstAmount.toFixed(2)}</td>
                            <td>₹{totalAmount.toFixed(2)}</td>
                            <td>
                              {formData.items.length > 1 && (
                                <Button 
                                  type="button" 
                                  onClick={() => removeItem(index)} 
                                  variant="secondary"
                                  size="small"
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

              {/* Total Summary */}
              <div style={{ marginBottom: '24px' }}>
                <h3>Total Summary</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label>Total Discount</label>
                    <input
                      type="text"
                      value={totals.taxable > 0 ? `₹${(totals.taxable * 0.1).toFixed(2)}` : '₹0.00'}
                      readOnly
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', backgroundColor: '#f9f9f9' }}
                    />
                  </div>
                  <div>
                    <label>Total Taxable Amount</label>
                    <input
                      type="text"
                      value={`₹${totals.taxable.toFixed(2)}`}
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
                  <div>
                    <label>Total Amount (incl. GST)</label>
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
                      value={`${totals.total.toFixed(2)} Rupees Only`}
                      readOnly
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', backgroundColor: '#f9f9f9' }}
                    />
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              <div style={{ marginBottom: '24px' }}>
                <h3>Additional Details</h3>
                <div>
                  <label>Notes</label>
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
                <Button type="button" onClick={() => setShowModal(false)} variant="secondary">
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Invoice'}
                </Button>
              </div>
            </form>
                     </div>
         </div>
       )}

       {/* Email Modal */}
       {showEmailModal && selectedInvoice && (
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
             backgroundColor: 'white',
             borderRadius: 'var(--radius)',
             padding: '24px',
             width: '400px',
             maxWidth: '90vw'
           }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
               <h3>Send Invoice via Email</h3>
               <Button onClick={() => setShowEmailModal(false)} variant="secondary">×</Button>
             </div>

             <div style={{ marginBottom: '16px' }}>
               <label>Invoice: {selectedInvoice.invoice_no}</label>
             </div>

             <div style={{ marginBottom: '16px' }}>
               <label>Email Address *</label>
               <input
                 type="email"
                 value={emailAddress}
                 onChange={(e) => setEmailAddress(e.target.value)}
                 required
                 placeholder="Enter recipient email address"
                 style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
               />
             </div>

             <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
               <Button type="button" onClick={() => setShowEmailModal(false)} variant="secondary">
                 Cancel
               </Button>
               <Button 
                 type="button" 
                 variant="primary" 
                 disabled={!emailAddress || loading}
                 onClick={async () => {
                   try {
                     setLoading(true)
                     await apiEmailInvoice(selectedInvoice.id, emailAddress)
                     setShowEmailModal(false)
                     setError('')
                   } catch (err: any) {
                     setError(err.message || 'Failed to send email')
                   } finally {
                     setLoading(false)
                   }
                 }}
               >
                 {loading ? 'Sending...' : 'Send Email'}
               </Button>
             </div>
           </div>
         </div>
       )}
     </div>
   )
 }

