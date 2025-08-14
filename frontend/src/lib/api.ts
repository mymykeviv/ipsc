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

export async function apiListCustomers(search?: string, includeInactive: boolean = false): Promise<Party[]> {
  const params = new URLSearchParams()
  if (search) params.append('search', search)
  if (includeInactive) params.append('include_inactive', 'true')
  
  const url = `/api/parties/customers${params.toString() ? '?' + params.toString() : ''}`
  const r = await fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` } })
  if (r.status === 401) throw new Error('unauthorized')
  if (!r.ok) throw new Error('failed')
  return r.json()
}

export async function apiListVendors(search?: string, includeInactive: boolean = false): Promise<Party[]> {
  const params = new URLSearchParams()
  if (search) params.append('search', search)
  if (includeInactive) params.append('include_inactive', 'true')
  
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
  supplier_id: number
  invoice_no?: string
  date: string
  due_date?: string
  terms: string
  
  // Invoice Details
  invoice_type?: string
  currency?: string
  
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
    description?: string
    hsn_code?: string
  }[]
  notes?: string
}

export type Invoice = { 
  id: number
  invoice_no: string
  customer_name: string
  supplier_name?: string
  date: string
  due_date: string
  grand_total: number
  status: string
  
  // Invoice Details
  invoice_type: string
  currency: string
  
  // GST Compliance Fields
  place_of_supply: string
  place_of_supply_state_code: string
  eway_bill_number: string | null
  reverse_charge: boolean
  export_supply: boolean
  
  // Amount Details
  taxable_value: number
  total_discount: number
  cgst: number
  sgst: number
  igst: number
  utgst: number
  cess: number
  round_off: number
  
  // Payment Fields
  paid_amount: number
  balance_amount: number
}

export type Payment = {
  id: number
  invoice_id: number
  payment_date: string
  payment_amount: number
  payment_method: string
  reference_number: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type PaymentCreate = {
  amount: number
  method: string
  account_head: string
  reference_number?: string
  notes?: string
}

export type PurchaseCreate = {
  vendor_id: number
  date: string
  due_date: string
  terms: string
  place_of_supply: string
  place_of_supply_state_code: string
  eway_bill_number?: string
  reverse_charge: boolean
  export_supply: boolean
  bill_from_address: string
  ship_from_address: string
  total_discount: number
  notes?: string
  items: {
    product_id: number
    qty: number
    rate: number
    description?: string
    hsn_code?: string
    discount: number
    discount_type: string
    gst_rate: number
  }[]
}

export type Purchase = {
  id: number
  purchase_no: string
  vendor_id: number
  vendor_name: string
  date: string
  due_date: string
  terms: string
  place_of_supply: string
  place_of_supply_state_code: string
  eway_bill_number: string | null
  reverse_charge: boolean
  export_supply: boolean
  bill_from_address: string
  ship_from_address: string
  taxable_value: number
  total_discount: number
  cgst: number
  sgst: number
  igst: number
  grand_total: number
  paid_amount: number
  balance_amount: number
  notes: string | null
  status: string
  created_at: string
  updated_at: string
}

export type PurchasePaymentCreate = {
  amount: number
  method: string
  account_head: string
  reference_number?: string
  notes?: string
}

export type ExpenseCreate = {
  expense_date: string
  expense_type: string
  category: string
  subcategory?: string
  description: string
  amount: number
  payment_method: string
  account_head: string
  reference_number?: string
  vendor_id?: number
  gst_rate: number
  notes?: string
}

export type Expense = {
  id: number
  expense_date: string
  expense_type: string
  category: string
  subcategory: string | null
  description: string
  amount: number
  payment_method: string
  account_head: string
  reference_number: string | null
  vendor_id: number | null
  vendor_name: string | null
  gst_amount: number
  gst_rate: number
  total_amount: number
  notes: string | null
  created_at: string
  updated_at: string
}

export type CashflowSummary = {
  period: {
    start_date: string
    end_date: string
  }
  income: {
    total_invoice_amount: number
    total_payments_received: number
  }
  expenses: {
    total_expenses: number
    total_purchase_payments: number
    total_outflow: number
  }
  cashflow: {
    net_cashflow: number
    cash_inflow: number
    cash_outflow: number
  }
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

// Purchase Management APIs
export async function apiCreatePurchase(payload: PurchaseCreate): Promise<{id: number, purchase_no: string}> {
  const r = await fetch('/api/purchases', {
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

export async function apiListPurchases(search?: string, status?: string): Promise<Purchase[]> {
  const params = new URLSearchParams()
  if (search) params.append('search', search)
  if (status) params.append('status', status)
  
  const url = `/api/purchases${params.toString() ? '?' + params.toString() : ''}`
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

export async function apiGetPurchase(id: number): Promise<Purchase> {
  const r = await fetch(`/api/purchases/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` } })
  
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

export async function apiDeletePurchase(id: number): Promise<{message: string}> {
  const r = await fetch(`/api/purchases/${id}`, {
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
  
  return r.json()
}

// Purchase Payment APIs
export async function apiAddPurchasePayment(purchaseId: number, payload: PurchasePaymentCreate): Promise<{id: number}> {
  const r = await fetch(`/api/purchases/${purchaseId}/payments`, {
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

export async function apiListPurchasePayments(purchaseId: number): Promise<{
  payments: Array<{
    id: number
    payment_date: string
    amount: number
    method: string
    account_head: string
    reference_number: string | null
    notes: string | null
  }>
  total_paid: number
  outstanding: number
}> {
  const r = await fetch(`/api/purchases/${purchaseId}/payments`, { headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` } })
  
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

// Expense Management APIs
export async function apiCreateExpense(payload: ExpenseCreate): Promise<{id: number}> {
  const r = await fetch('/api/expenses', {
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

export async function apiListExpenses(search?: string, category?: string, expense_type?: string, start_date?: string, end_date?: string): Promise<Expense[]> {
  const params = new URLSearchParams()
  if (search) params.append('search', search)
  if (category) params.append('category', category)
  if (expense_type) params.append('expense_type', expense_type)
  if (start_date) params.append('start_date', start_date)
  if (end_date) params.append('end_date', end_date)
  
  const url = `/api/expenses${params.toString() ? '?' + params.toString() : ''}`
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

export async function apiGetExpense(id: number): Promise<Expense> {
  const r = await fetch(`/api/expenses/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` } })
  
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

export async function apiUpdateExpense(id: number, payload: ExpenseCreate): Promise<{message: string}> {
  const r = await fetch(`/api/expenses/${id}`, {
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

export async function apiDeleteExpense(id: number): Promise<{message: string}> {
  const r = await fetch(`/api/expenses/${id}`, {
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
  
  return r.json()
}

// Cashflow APIs
export async function apiGetCashflowSummary(start_date?: string, end_date?: string): Promise<CashflowSummary> {
  const params = new URLSearchParams()
  if (start_date) params.append('start_date', start_date)
  if (end_date) params.append('end_date', end_date)
  
  const url = `/api/cashflow/summary${params.toString() ? '?' + params.toString() : ''}`
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

export type PaginationInfo = {
  page: number
  limit: number
  total_count: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

export type InvoiceListResponse = {
  invoices: Invoice[]
  pagination: PaginationInfo
}

export async function apiGetInvoices(
  search?: string, 
  status?: string, 
  page: number = 1, 
  limit: number = 10,
  sort_field: string = 'date',
  sort_direction: string = 'desc'
): Promise<InvoiceListResponse> {
  const params = new URLSearchParams()
  if (search) params.append('search', search)
  if (status) params.append('status', status)
  params.append('page', page.toString())
  params.append('limit', limit.toString())
  params.append('sort_field', sort_field)
  params.append('sort_direction', sort_direction)
  
  const url = `/api/invoices?${params.toString()}`
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

export async function apiListInvoices(search?: string, status?: string): Promise<Invoice[]> {
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

export async function apiUpdatePurchaseStatus(id: number, status: string): Promise<Purchase> {
  const r = await fetch(`/api/purchases/${id}/status`, {
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



// Payment Management API Functions
export async function apiAddPayment(invoiceId: number, payload: PaymentCreate): Promise<Payment> {
  const r = await fetch(`/api/invoices/${invoiceId}/payments`, {
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

export async function apiGetInvoicePayments(invoiceId: number): Promise<Payment[]> {
  const r = await fetch(`/api/invoices/${invoiceId}/payments`, {
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

export async function apiDeletePayment(paymentId: number): Promise<void> {
  const r = await fetch(`/api/payments/${paymentId}`, {
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

export type GstFilingReport = {
  period: string
  report_type: string
  generated_on: string
  sections: {
    b2b: any[]
    b2c: any[]
    nil_rated: any[]
    exempted: any[]
    rate_wise_summary: any[]
    outward_supplies?: any
    inward_supplies?: any
    summary?: any
  }
}

export type CashflowTransaction = {
  id: number
  transaction_date: string
  type: 'inflow' | 'outflow'
  description: string
  reference_number?: string
  payment_method: string
  amount: number
  account_head: string
  created_at: string
  updated_at: string
}

export async function apiGetCashflowTransactions(): Promise<CashflowTransaction[]> {
  const r = await fetch('/api/cashflow/transactions', {
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

export async function apiGetGstFilingReport(
  periodType: 'month' | 'quarter' | 'year',
  periodValue: string,
  reportType: 'gstr1' | 'gstr2' | 'gstr3b',
  format: 'json' | 'csv' | 'excel' = 'json'
): Promise<GstFilingReport> {
  const response = await fetch(
    `/api/reports/gst-filing?period_type=${periodType}&period_value=${periodValue}&report_type=${reportType}&format=${format}`,
    {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json',
      },
    }
  )
  
  if (!response.ok) {
    throw new Error(`Failed to get GST filing report: ${response.statusText}`)
  }
  
  if (format === 'json') {
    return response.json()
  } else {
    // For CSV and Excel, return the blob for download
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gst_${reportType}_${periodValue}.${format === 'csv' ? 'csv' : 'xlsx'}`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    return {} as GstFilingReport // Return empty object for download
  }
}

