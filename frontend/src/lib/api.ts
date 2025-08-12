export type LoginResponse = { access_token: string; token_type: string }
export async function apiLogin(username: string, password: string): Promise<LoginResponse> {
  const r = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!r.ok) throw new Error('Invalid credentials')
  return r.json()
}

export type Product = {
  id: number
  name: string
  description: string | null
  item_type: string
  sales_price: number
  purchase_price: number | null
  stock: number
  sku: string | null
  unit: string
  supplier: string | null
  category: string | null
  notes: string | null
  hsn: string | null
  gst_rate: number
  is_active: boolean
}

export async function apiGetProducts(): Promise<Product[]> {
  const r = await fetch('/api/products', {
    headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
  })
  if (r.status === 401) throw new Error('unauthorized')
  if (!r.ok) throw new Error('failed')
  return r.json()
}

export async function apiCreateProduct(payload: Omit<Product, 'id' | 'is_active'>): Promise<Product> {
  const r = await fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
    body: JSON.stringify(payload)
  })
  
  if (!r.ok) {
    // Try to extract error details from response
    try {
      const errorData = await r.json()
      throw new Error(errorData.detail || `HTTP ${r.status}: ${r.statusText}`)
    } catch (parseError) {
      // If we can't parse the error response, throw a generic error with status
      throw new Error(`HTTP ${r.status}: ${r.statusText}`)
    }
  }
  
  return r.json()
}

export async function apiUpdateProduct(id: number, payload: Partial<Omit<Product, 'id' | 'is_active'>>): Promise<Product> {
  const r = await fetch(`/api/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
    body: JSON.stringify(payload)
  })
  if (!r.ok) throw new Error('failed')
  return r.json()
}

export async function apiToggleProduct(id: number): Promise<Product> {
  const r = await fetch(`/api/products/${id}/toggle`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
  })
  if (!r.ok) throw new Error('failed')
  return r.json()
}

export type StockAdjustmentIn = {
  quantity: number
  purchase_price: number
  sales_price: number
  date_of_receipt: string
  reference_bill_number?: string
  notes?: string
}

export async function apiAddStockToProduct(productId: number, payload: StockAdjustmentIn): Promise<Product> {
  const r = await fetch(`/api/products/${productId}/stock`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json', 
      Authorization: `Bearer ${localStorage.getItem('auth_token')}` 
    },
    body: JSON.stringify(payload)
  })
  if (!r.ok) throw new Error('failed')
  return r.json()
}

export type Party = {
  id: number
  type: 'customer' | 'vendor'
  name: string
  contact_person: string | null
  contact_number: string | null
  email: string | null
  gstin: string | null
  gst_registration_status: string
  billing_address_line1: string
  billing_address_line2: string | null
  billing_city: string
  billing_state: string
  billing_country: string
  billing_pincode: string | null
  shipping_address_line1: string | null
  shipping_address_line2: string | null
  shipping_city: string | null
  shipping_state: string | null
  shipping_country: string | null
  shipping_pincode: string | null
  notes: string | null
  is_active: boolean
}
export async function apiListParties(type?: string, search?: string, includeInactive: boolean = false): Promise<Party[]> {
  const params = new URLSearchParams()
  if (type) params.append('type', type)
  if (search) params.append('search', search)
  if (includeInactive) params.append('include_inactive', 'true')
  
  const url = `/api/parties${params.toString() ? '?' + params.toString() : ''}`
  const r = await fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` } })
  if (r.status === 401) throw new Error('unauthorized')
  if (!r.ok) throw new Error('failed')
  return r.json()
}

export async function apiListCustomers(search?: string): Promise<Party[]> {
  const params = new URLSearchParams()
  if (search) params.append('search', search)
  
  const url = `/api/parties/customers${params.toString() ? '?' + params.toString() : ''}`
  const r = await fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` } })
  if (r.status === 401) throw new Error('unauthorized')
  if (!r.ok) throw new Error('failed')
  return r.json()
}

export async function apiListVendors(search?: string): Promise<Party[]> {
  const params = new URLSearchParams()
  if (search) params.append('search', search)
  
  const url = `/api/parties/vendors${params.toString() ? '?' + params.toString() : ''}`
  const r = await fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` } })
  if (r.status === 401) throw new Error('unauthorized')
  if (!r.ok) throw new Error('failed')
  return r.json()
}

export async function apiCreateParty(payload: Omit<Party, 'id' | 'is_active'>): Promise<Party> {
  const r = await fetch('/api/parties', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
    body: JSON.stringify(payload)
  })
  
  if (!r.ok) {
    try {
      const errorData = await r.json()
      throw new Error(errorData.detail || `HTTP ${r.status}: ${r.statusText}`)
    } catch (parseError) {
      throw new Error(`HTTP ${r.status}: ${r.statusText}`)
    }
  }
  
  return r.json()
}

export async function apiUpdateParty(id: number, payload: Partial<Omit<Party, 'id' | 'is_active'>>): Promise<Party> {
  const r = await fetch(`/api/parties/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
    body: JSON.stringify(payload)
  })
  
  if (!r.ok) {
    try {
      const errorData = await r.json()
      throw new Error(errorData.detail || `HTTP ${r.status}: ${r.statusText}`)
    } catch (parseError) {
      throw new Error(`HTTP ${r.status}: ${r.statusText}`)
    }
  }
  
  return r.json()
}

export async function apiToggleParty(id: number): Promise<Party> {
  const r = await fetch(`/api/parties/${id}/toggle`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
  })
  
  if (!r.ok) {
    try {
      const errorData = await r.json()
      throw new Error(errorData.detail || `HTTP ${r.status}: ${r.statusText}`)
    } catch (parseError) {
      throw new Error(`HTTP ${r.status}: ${r.statusText}`)
    }
  }
  
  return r.json()
}

export type InvoiceCreate = { 
  customer_id: number
  invoice_no?: string
  date: string
  terms: string
  
  // GST Compliance Fields
  place_of_supply: string
  place_of_supply_state_code: string
  eway_bill_number?: string
  reverse_charge: boolean
  export_supply: boolean
  
  // Address Details
  bill_to_address: string
  ship_to_address: string
  
  // Items and Notes
  items: { 
    product_id: number
    qty: number
    rate: number
    discount: number
    discount_type: string
  }[]
  notes?: string
}

export type Invoice = { 
  id: number
  invoice_no: string
  customer_name: string
  date: string
  due_date: string
  grand_total: number
  status: string
  
  // GST Compliance Fields
  place_of_supply: string
  place_of_supply_state_code: string
  eway_bill_number: string | null
  reverse_charge: boolean
  export_supply: boolean
}

export async function apiCreateInvoice(payload: InvoiceCreate): Promise<Invoice> {
  const r = await fetch('/api/invoices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
    body: JSON.stringify(payload)
  })
  
  if (!r.ok) {
    try {
      const errorData = await r.json()
      throw new Error(errorData.detail || `HTTP ${r.status}: ${r.statusText}`)
    } catch (parseError) {
      throw new Error(`HTTP ${r.status}: ${r.statusText}`)
    }
  }
  
  return r.json()
}

export async function apiGetInvoices(search?: string, status?: string): Promise<Invoice[]> {
  const params = new URLSearchParams()
  if (search) params.append('search', search)
  if (status) params.append('status', status)
  
  const url = `/api/invoices${params.toString() ? '?' + params.toString() : ''}`
  const r = await fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` } })
  
  if (!r.ok) {
    try {
      const errorData = await r.json()
      throw new Error(errorData.detail || `HTTP ${r.status}: ${r.statusText}`)
    } catch (parseError) {
      throw new Error(`HTTP ${r.status}: ${r.statusText}`)
    }
  }
  
  return r.json()
}

export async function apiGetInvoice(id: number): Promise<Invoice> {
  const r = await fetch(`/api/invoices/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` } })
  
  if (!r.ok) {
    try {
      const errorData = await r.json()
      throw new Error(errorData.detail || `HTTP ${r.status}: ${r.statusText}`)
    } catch (parseError) {
      throw new Error(`HTTP ${r.status}: ${r.statusText}`)
    }
  }
  
  return r.json()
}

export async function apiUpdateInvoice(id: number, payload: InvoiceCreate): Promise<Invoice> {
  const r = await fetch(`/api/invoices/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
    body: JSON.stringify(payload)
  })
  
  if (!r.ok) {
    try {
      const errorData = await r.json()
      throw new Error(errorData.detail || `HTTP ${r.status}: ${r.statusText}`)
    } catch (parseError) {
      throw new Error(`HTTP ${r.status}: ${r.statusText}`)
    }
  }
  
  return r.json()
}

export async function apiDeleteInvoice(id: number): Promise<void> {
  const r = await fetch(`/api/invoices/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
  })
  
  if (!r.ok) {
    try {
      const errorData = await r.json()
      throw new Error(errorData.detail || `HTTP ${r.status}: ${r.statusText}`)
    } catch (parseError) {
      throw new Error(`HTTP ${r.status}: ${r.statusText}`)
    }
  }
}

export async function apiUpdateInvoiceStatus(id: number, status: string): Promise<Invoice> {
  const r = await fetch(`/api/invoices/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
    body: JSON.stringify({ status })
  })
  
  if (!r.ok) {
    try {
      const errorData = await r.json()
      throw new Error(errorData.detail || `HTTP ${r.status}: ${r.statusText}`)
    } catch (parseError) {
      throw new Error(`HTTP ${r.status}: ${r.statusText}`)
    }
  }
  
  return r.json()
}

export async function apiEmailInvoice(id: number, email: string): Promise<void> {
  const r = await fetch(`/api/invoices/${id}/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
    body: JSON.stringify({ to: email })
  })
  
  if (!r.ok) {
    try {
      const errorData = await r.json()
      throw new Error(errorData.detail || `HTTP ${r.status}: ${r.statusText}`)
    } catch (parseError) {
      throw new Error(`HTTP ${r.status}: ${r.statusText}`)
    }
  }
}

export type StockRow = { 
  product_id: number; 
  sku: string; 
  name: string; 
  onhand: number;
  item_type?: string;
  unit?: string;
}
export async function apiGetStockSummary(): Promise<StockRow[]> {
  const r = await fetch('/api/stock/summary', { headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` } })
  if (!r.ok) throw new Error('failed')
  return r.json()
}

export async function apiAdjustStock(
  product_id: number, 
  quantity: number, 
  adjustmentType: 'add' | 'reduce',
  dateOfAdjustment: string,
  referenceBillNumber?: string,
  supplier?: string,
  category?: string,
  notes?: string
): Promise<{ ok: boolean; new_stock: number }> {
  const r = await fetch('/api/stock/adjust', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
    body: JSON.stringify({ 
      product_id, 
      quantity: quantity,
      adjustment_type: adjustmentType,
      date_of_adjustment: dateOfAdjustment,
      reference_bill_number: referenceBillNumber,
      supplier: supplier,
      category: category,
      notes: notes
    })
  })
  if (!r.ok) {
    try {
      const errorData = await r.json()
      throw new Error(errorData.detail || `HTTP ${r.status}: ${r.statusText}`)
    } catch (parseError) {
      throw new Error(`HTTP ${r.status}: ${r.statusText}`)
    }
  }
  return r.json()
}

export type PurchaseCreate = { vendor_id: number; items: { product_id: number; qty: number; rate: number }[] }
export async function apiCreatePurchase(payload: PurchaseCreate): Promise<{ id: number }> {
  const r = await fetch('/api/purchases', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
    body: JSON.stringify(payload)
  })
  if (!r.ok) throw new Error('failed')
  return r.json()
}

