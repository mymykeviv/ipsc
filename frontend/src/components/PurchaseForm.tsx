import { useState, useEffect } from 'react'
import { apiCreatePurchase, apiListParties, apiGetProducts, apiGetPurchaseItems, apiGetCompanySettings, Party, Product, CompanySettings } from '../lib/api'
import { Button } from './Button'
import { ErrorMessage } from './ErrorMessage'
import { formStyles, getSectionHeaderColor } from '../utils/formStyles'

// Invoice Terms for dropdown
const INVOICE_TERMS = ['Immediate', 'Due on Receipt', '15 days', '30 days', '45 days', '60 days', '90 days']

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
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null)
  
  const [formData, setFormData] = useState({
    vendor_id: 0,
    date: new Date().toISOString().split('T')[0],
    due_date: new Date().toISOString().split('T')[0],
    terms: 'Immediate',
    reference_bill_number: '',
    place_of_supply: 'Uttar Pradesh',
    place_of_supply_state_code: '09',
    eway_bill_number: '',
    bill_from_address: '',
    ship_from_address: '',
    notes: '',
    reverse_charge: false,
    export_supply: false,
    items: [] as PurchaseItem[]
  })

  // Calculate due date based on purchase date and terms
  const calculateDueDate = (purchaseDate: string, terms: string): string => {
  const date = new Date(purchaseDate)
  
  switch (terms) {
    case 'Immediate':
    case 'Due on Receipt':
      return purchaseDate // Same as purchase date
    case '15 days':
      date.setDate(date.getDate() + 15)
      break
    case '30 days':
      date.setDate(date.getDate() + 30)
      break
    case '45 days':
      date.setDate(date.getDate() + 45)
      break
    case '60 days':
      date.setDate(date.getDate() + 60)
      break
    case '90 days':
      date.setDate(date.getDate() + 90)
      break
    default:
      return purchaseDate
  }
  
  return date.toISOString().split('T')[0]
}


  // Add the missing updateVendorDetails function
  const updateVendorDetails = (vendorId: number) => {
  setFormData(prev => ({ ...prev, vendor_id: vendorId }))
  
  if (vendorId === 0) {
    // Reset to default state when no vendor is selected
    setFormData(prev => ({
      ...prev,
      vendor_id: 0,
      place_of_supply: 'Uttar Pradesh', // Your company's default state
      place_of_supply_state_code: '09',
      bill_from_address: '',
    }))
    return
  }
  
  const vendor = vendors.find(v => v.id === vendorId)
  if (vendor) {
    // Use vendor's address (billing or shipping based on your preference)
    const address = `${vendor.shipping_address_line1 || vendor.billing_address_line1}${
      vendor.shipping_address_line2 || vendor.billing_address_line2 ? ', ' + (vendor.shipping_address_line2 || vendor.billing_address_line2) : ''
    }, ${vendor.shipping_city || vendor.billing_city}, ${vendor.shipping_state || vendor.billing_state} - ${vendor.shipping_pincode || vendor.billing_pincode}`
    
    // Set place of supply to vendor's state
    const vendorState = vendor.shipping_state || vendor.billing_state || 'Uttar Pradesh'
    const stateCode = INDIAN_STATES[vendorState as keyof typeof INDIAN_STATES] || '09'
    
    setFormData(prev => ({
      ...prev,
      vendor_id: vendorId,
      place_of_supply: vendorState, // Auto-update place of supply
      place_of_supply_state_code: stateCode, // Auto-update state code
      bill_from_address: address,
    }))
  }
}


  useEffect(() => {
    loadData()
    if (purchaseId) {
      // If we have initialData, prefill the form fields
      if (initialData) {
        setFormData({
          vendor_id: initialData.vendor_id || 0,
          date: initialData.date?.split('T')[0] || new Date().toISOString().split('T')[0],
          due_date: initialData.due_date?.split('T')[0] || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          terms: initialData.terms || 'Due on Receipt',
          reference_bill_number: initialData.reference_bill_number || '',
          place_of_supply: initialData.place_of_supply || 'Karnataka',
          place_of_supply_state_code: initialData.place_of_supply_state_code || '29',
          eway_bill_number: initialData.eway_bill_number || '',
          bill_from_address: initialData.bill_from_address || '',
          ship_from_address: initialData.ship_from_address || '',
          notes: initialData.notes || '',
          reverse_charge: initialData.reverse_charge || false,
          export_supply: initialData.export_supply || false,
          items: initialData.items || []
        })
      }

      // Always fetch purchase items separately in edit mode
      loadPurchaseItems()
    }
  }, [purchaseId, initialData])

  useEffect(() => {
  // Auto-calculate due date when terms or purchase date changes
  const newDueDate = calculateDueDate(formData.date, formData.terms)
  if (newDueDate !== formData.due_date) {
    setFormData(prev => ({
      ...prev,
      due_date: newDueDate
    }))
  }
}, [formData.date, formData.terms]) // Watch for changes in date and terms

  const loadPurchaseItems = async () => {
    if (!purchaseId) return
    
    try {
      const items = await apiGetPurchaseItems(purchaseId)
      const formattedItems = items.map(item => ({
        product_id: item.product_id,
        qty: item.qty,
        rate: item.expected_rate,
        description: item.description,
        hsn_code: item.hsn_code || '',
        discount: item.discount,
        discount_type: (item.discount_type?.toLowerCase() === 'fixed' ? 'Fixed' : 'Percentage'),
        gst_rate: item.gst_rate
      }))
      
      setFormData(prev => ({
        ...prev,
        items: formattedItems
      }))
    } catch (err) {
      console.error('Failed to load purchase items:', err)
    }
  }

  const loadData = async () => {
    try {
      const [vendorsData, productsData, companySettingsData] = await Promise.all([
        apiListParties(),
        apiGetProducts(),
        apiGetCompanySettings()
      ])
      setVendors(vendorsData.filter(p => p.type === 'vendor'))
      setProducts(productsData)
      setCompanySettings(companySettingsData)
      const companyAddress = [
        companySettingsData.name || '',
        companySettingsData.state ? `State: ${companySettingsData.state}` : '',
        companySettingsData.state_code ? `(${companySettingsData.state_code})` : '',
        companySettingsData.gstin ? `GSTIN: ${companySettingsData.gstin}` : ''
      ].filter(Boolean).join(', ')
      setFormData(prev => ({
        ...prev,
        ship_from_address: prev.ship_from_address || companyAddress.trim()
      }))
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
        eway_bill_number: formData.eway_bill_number,
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
    setFormData(prev => {
      const updatedItems = prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value }
          
          // Auto-fill product details when product is selected
          if (field === 'product_id' && value > 0) {
            const selectedProduct = products.find(p => p.id === value)
            if (selectedProduct) {
              updatedItem.rate = selectedProduct.purchase_price || 0
              updatedItem.gst_rate = selectedProduct.gst_rate || 18
              updatedItem.hsn_code = selectedProduct.hsn || ''
              updatedItem.description = selectedProduct.name
            }
          }
          
          return updatedItem
        }
        return item
      })
      
      return {
        ...prev,
        items: updatedItems
      }
    })
  }



  return (
    <form onSubmit={handleSubmit}>
      <ErrorMessage message={error} />

      {/* Row 1: Purchase Information | Additional Information */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '2px' }}>
        
        {/* Purchase Information Section */}
        <div>
          <h3 style={{ marginBottom: '4px', color: '#333', borderBottom: '2px solid #007bff', paddingBottom: '2px', fontSize: '1.2rem' }}>
            📋 Purchase Information
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* Row 1: Vendor * | Purchase Date * */}
            <div style={formStyles.formGroup}>
              <label style={formStyles.label}>Vendor *</label>
              <select
                value={formData.vendor_id || ''}
                onChange={(e) => updateVendorDetails(parseInt(e.target.value) || 0)}
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
              <label style={formStyles.label}>Terms (optional)</label>
              <select
                value={formData.terms}
                onChange={(e) => {
                  const newTerms = e.target.value
                  const newDueDate = calculateDueDate(formData.date, newTerms)
                  setFormData(prev => ({
                    ...prev,
                    terms: newTerms,
                    due_date: newDueDate
                  }))
                }}
                style={formStyles.select}
              >
                {INVOICE_TERMS.map(term => (
                  <option key={term} value={term}>{term}</option>
                ))}
              </select>

            </div>
            <div style={formStyles.formGroup}>
              <label style={formStyles.label}>Purchase Date *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => {
                  const newDate = e.target.value
                  const newDueDate = calculateDueDate(newDate, formData.terms)
                  setFormData(prev => ({
                    ...prev,
                    date: newDate,
                    due_date: newDueDate
                  }))
                }}
                required
                style={formStyles.input}
              />

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
            <div style={formStyles.formGroup}>
              <label style={formStyles.label}>Reference Bill Number </label>
              <input
                type="text"
                value={formData.reference_bill_number}
                onChange={(e) => setFormData(prev => ({ ...prev, reference_bill_number: e.target.value }))}
                placeholder="Enter reference bill number"
                style={formStyles.input}
              />
            </div>
            <div style={formStyles.formGroup}>
              <label style={formStyles.label}>E-way Bill Number (optional)</label>
              <input
                type="text"
                value={formData.eway_bill_number}
                onChange={(e) => setFormData(prev => ({ ...prev, eway_bill_number: e.target.value }))}
                placeholder="Enter E-way bill number"
                style={formStyles.input}
              />
            </div>
            <div style={formStyles.formGroup}>
              <label style={formStyles.label}>Place of Supply</label>
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
                style={formStyles.select}
              >
                {Object.keys(INDIAN_STATES).map(state => (
                  <option key={state} value={state}>{state + ' (' + INDIAN_STATES[state as keyof typeof INDIAN_STATES] +")"}</option>
                ))}
              </select>
            </div>
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
          </div>
        </div>

        {/* Address Information Section */}
        <div>
          <h3 style={{ marginBottom: '4px', color: '#333', borderBottom: '2px solid #28a745', paddingBottom: '2px', fontSize: '1.2rem' }}>
            📝 Address Information
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            
            
            <div style={{ ...formStyles.formGroup, gridColumn: 'span 2' }}>
              <label style={formStyles.label}>Bill From Address</label>
              <textarea
                value={formData.bill_from_address}
                onChange={(e) => setFormData(prev => ({ ...prev, bill_from_address: e.target.value }))}
                placeholder="Enter billing address"
                rows={2}
                style={formStyles.textarea}
              />
            </div>
            <div style={{ ...formStyles.formGroup, gridColumn: 'span 2' }}>
              <label style={formStyles.label}>Ship To Address</label>
              <textarea
                value={formData.ship_from_address}
                readOnly
                placeholder="Auto-populated from company settings"
                rows={2}
                style={{
                  ...formStyles.textarea,
                  backgroundColor: '#f8f9fa',
                  color: '#6c757d',
                  cursor: 'not-allowed',
                  border: '1px solid #e9ecef'
                }}
              />
            </div>

            <div style={{ ...formStyles.formGroup, gridColumn: 'span 2' }}>
              <label style={formStyles.label}>Notes (optional)</label>
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
          <h3 style={{ marginBottom: '16px', color: '#333', borderBottom: '2px solid #007bff', paddingBottom: '8px', fontSize: '1.2rem'  }}>
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
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Purchase Summary */}
        {formData.items.length > 0 && (
          <div style={{ 
            marginTop: '16px', 
            padding: '16px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '8px', 
            border: '1px solid #e9ecef' 
          }}>
            <h4 style={{ marginBottom: '12px', color: '#495057', fontSize: '16px' }}>📊 Purchase Summary</h4>
            
            {(() => {
              // Calculate totals with GST breakdown
              const subtotal = formData.items.reduce((sum, item) => sum + (item.qty * item.rate), 0)
              const totalGst = formData.items.reduce((sum, item) => sum + (item.qty * item.rate * item.gst_rate / 100), 0)
              const grandTotal = subtotal + totalGst
              
              // GST breakup calculation
              const vendorState = vendors.find(v => v.id === formData.vendor_id)?.billing_state || ''
              const placeOfSupplyState = formData.place_of_supply
              
              // If same state, apply CGST + SGST; if different states, apply IGST
              const isSameState = vendorState === placeOfSupplyState
              const cgst = isSameState ? totalGst / 2 : 0
              const sgst = isSameState ? totalGst / 2 : 0
              const igst = isSameState ? 0 : totalGst
              
              return (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ color: '#6c757d' }}>Taxable Value:</span>
                      <span style={{ fontWeight: '500' }}>₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ color: '#6c757d' }}>Total Discount:</span>
                      <span style={{ fontWeight: '500' }}>₹0.00</span>
                    </div>
                    {cgst > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ color: '#6c757d' }}>CGST:</span>
                        <span style={{ fontWeight: '500' }}>₹{cgst.toFixed(2)}</span>
                      </div>
                    )}
                    {sgst > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ color: '#6c757d' }}>SGST:</span>
                        <span style={{ fontWeight: '500' }}>₹{sgst.toFixed(2)}</span>
                      </div>
                    )}
                    {igst > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ color: '#6c757d' }}>IGST:</span>
                        <span style={{ fontWeight: '500' }}>₹{igst.toFixed(2)}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ color: '#6c757d' }}>UTGST:</span>
                      <span style={{ fontWeight: '500' }}>₹0.00</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ color: '#6c757d' }}>CESS:</span>
                      <span style={{ fontWeight: '500' }}>₹0.00</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ color: '#6c757d' }}>Round Off:</span>
                      <span style={{ fontWeight: '500' }}>₹0.00</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #dee2e6', paddingTop: '8px' }}>
                      <span style={{ color: '#495057', fontWeight: '600' }}>Grand Total:</span>
                      <span style={{ color: '#007bff', fontWeight: '600', fontSize: '18px' }}>
                        ₹{grandTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ color: '#6c757d' }}>Total Items:</span>
                      <span style={{ fontWeight: '500' }}>{formData.items.length}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ color: '#6c757d' }}>Total Quantity:</span>
                      <span style={{ fontWeight: '500' }}>{formData.items.reduce((sum, item) => sum + item.qty, 0)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ color: '#6c757d' }}>GST Status:</span>
                      <span style={{ fontWeight: '500' }}>{isSameState ? 'Intra-State' : 'Inter-State'}</span>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        )}


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
