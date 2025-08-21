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
  gst_rate: number | null
  is_active: boolean
}

export interface ProductFilters {
  search?: string
  category?: string
  item_type?: string
  gst_rate?: number
  supplier?: string
  stock_level?: string
  price_min?: number
  price_max?: number
  status?: string
}

export interface StockHistoryFilters {
  search?: string
  product_id?: number
  productFilter?: string
  categoryFilter?: string
  supplierFilter?: string
  stockLevelFilter?: string
  entryTypeFilter?: string
  reference_number?: string
  quantity_min?: number
  quantity_max?: number
  date_from?: string
  date_to?: string
}

export interface InvoicePaymentFilters {
  search?: string
  payment_status?: string
  payment_method?: string
  customer_id?: number
  amount_min?: number
  amount_max?: number
  date_from?: string
  date_to?: string
}

export interface InvoiceFilters {
  search?: string
  customer_id?: number
  date_from?: string
  date_to?: string
  amount_min?: number
  amount_max?: number
  gst_type?: string
  payment_status?: string
}

export interface PurchaseFilters {
  search?: string
  vendor_id?: number
  amount_min?: number
  amount_max?: number
  payment_status?: string
  place_of_supply?: string
  date_from?: string
  date_to?: string
}

export interface PurchasePaymentFilters {
  search?: string
  payment_status?: string
  payment_method?: string
  vendor_id?: number
  amount_min?: number
  amount_max?: number
  date_from?: string
  date_to?: string
}

export interface CashflowTransactionFilters {
  search?: string
  type_filter?: string
  transaction_type?: string
  payment_method?: string
  account_head?: string
  amount_min?: number
  amount_max?: number
  start_date?: string
  end_date?: string
}

export interface ExpenseFilters {
  search?: string
  expense_type?: string
  category?: string
  payment_method?: string
  amount_min?: number
  amount_max?: number
  date_from?: string
  date_to?: string
}

export async function apiGetProducts(filters?: ProductFilters): Promise<Product[]> {
  const params = new URLSearchParams()
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString())
      }
    })
  }
  
  const url = `/api/products${params.toString() ? `?${params.toString()}` : ''}`
  const r = await fetch(url, {
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
  gst_enabled: boolean
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
  template_id?: number | null // Add template selection support
  
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
  payment_amount: number
  payment_method: string
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
  payment_amount: number
  payment_method: string
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
  
  const data = await r.json()
  return data.invoices || []
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



export async function apiGetPurchasePDF(id: number): Promise<Blob> {
  const r = await fetch(`/api/purchases/${id}/pdf`, {
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
  
  return r.blob()
}

export async function apiEmailPurchase(id: number, email: string): Promise<void> {
  const r = await fetch(`/api/purchases/${id}/email`, {
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
  adjustmentType: 'add' | 'reduce' | 'adjust',
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

export type StockTransaction = {
  id: number
  product_id: number
  product_name: string
  transaction_date: string
  entry_type: string
  quantity: number
  unit_price: number | null
  total_value: number | null
  ref_type: string | null
  ref_id: number | null
  reference_number: string | null
  notes: string | null
  financial_year: string
  running_balance: number
}

export type StockMovement = {
  product_id: number
  product_name: string
  financial_year: string
  opening_stock: number
  opening_value: number
  total_incoming: number
  total_incoming_value: number
  total_outgoing: number
  total_outgoing_value: number
  closing_stock: number
  closing_value: number
  transactions: StockTransaction[]
}

export async function apiGetStockMovementHistory(financialYear?: string, productId?: number): Promise<StockMovement[]> {
  const params = new URLSearchParams()
  if (financialYear) params.append('financial_year', financialYear)
  if (productId) params.append('product_id', productId.toString())
  
  const queryString = params.toString()
  const url = `/api/stock/movement-history${queryString ? `?${queryString}` : ''}`
  
  const r = await fetch(url, {
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

export async function apiGetProductStockMovementHistory(
  productId: number, 
  fromYear?: number, 
  toYear?: number
): Promise<StockMovement[]> {
  const params = new URLSearchParams()
  if (fromYear) params.append('from_year', fromYear.toString())
  if (toYear) params.append('toYear', toYear.toString())
  
  const queryString = params.toString()
  const url = `/api/stock/movement-history/${productId}${queryString ? `?${queryString}` : ''}`
  
  const r = await fetch(url, {
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

export async function apiDownloadStockMovementHistoryPDF(
  financialYear?: string, 
  productId?: number,
  filters?: {
    productFilter?: string
    categoryFilter?: string
    supplierFilter?: string
    stockLevelFilter?: string
    entryTypeFilter?: string
  }
): Promise<void> {
  const params = new URLSearchParams()
  if (financialYear) params.append('financial_year', financialYear)
  if (productId) params.append('product_id', productId.toString())
  if (filters?.productFilter && filters.productFilter !== 'all') params.append('product_filter', filters.productFilter)
  if (filters?.categoryFilter && filters.categoryFilter !== 'all') params.append('category_filter', filters.categoryFilter)
  if (filters?.supplierFilter && filters.supplierFilter !== 'all') params.append('supplier_filter', filters.supplierFilter)
  if (filters?.stockLevelFilter && filters.stockLevelFilter !== 'all') params.append('stock_level_filter', filters.stockLevelFilter)
  if (filters?.entryTypeFilter && filters.entryTypeFilter !== 'all') params.append('entry_type_filter', filters.entryTypeFilter)
  
  const queryString = params.toString()
  const url = `/api/stock/movement-history/pdf${queryString ? `?${queryString}` : ''}`
  
  const r = await fetch(url, {
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
  
  // Get filename from response headers
  const contentDisposition = r.headers.get('Content-Disposition')
  let filename = 'stock_movement_history.pdf'
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="(.+)"/)
    if (filenameMatch) {
      filename = filenameMatch[1]
    }
  }
  
  // Create blob and download
  const blob = await r.blob()
  const url2 = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url2
  a.download = filename
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url2)
  document.body.removeChild(a)
}

export async function apiGetStockMovementHistoryPDFPreview(
  financialYear?: string, 
  productId?: number,
  filters?: {
    productFilter?: string
    categoryFilter?: string
    supplierFilter?: string
    stockLevelFilter?: string
    entryTypeFilter?: string
  }
): Promise<string> {
  const params = new URLSearchParams()
  if (financialYear) params.append('financial_year', financialYear)
  if (productId) params.append('product_id', productId.toString())
  if (filters?.productFilter && filters.productFilter !== 'all') params.append('product_filter', filters.productFilter)
  if (filters?.categoryFilter && filters.categoryFilter !== 'all') params.append('category_filter', filters.categoryFilter)
  if (filters?.supplierFilter && filters.supplierFilter !== 'all') params.append('supplier_filter', filters.supplierFilter)
  if (filters?.stockLevelFilter && filters.stockLevelFilter !== 'all') params.append('stock_level_filter', filters.stockLevelFilter)
  if (filters?.entryTypeFilter && filters.entryTypeFilter !== 'all') params.append('entry_type_filter', filters.entryTypeFilter)
  
  const queryString = params.toString()
  const url = `/api/stock/movement-history/pdf-preview${queryString ? `?${queryString}` : ''}`
  
  const r = await fetch(url, {
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
  
  // Return the PDF as a blob URL for preview
  const blob = await r.blob()
  return window.URL.createObjectURL(blob)
}

// Inventory Reports API Types
export interface InventorySummaryItem {
  product_id: number
  product_name: string
  sku: string | null
  category: string | null
  unit: string | null
  current_stock: number
  purchase_price: number | null
  sales_price: number | null
  stock_value: number
  last_movement_date: string | null
  minimum_stock: number | null
}

export interface InventorySummaryReport {
  total_products: number
  total_stock_value: number
  low_stock_items: number
  out_of_stock_items: number
  items: InventorySummaryItem[]
  generated_at: string
  filters_applied: Record<string, any> | null
}

// Stock Ledger Report Types
export interface StockLedgerItem {
  transaction_id: number
  transaction_date: string
  product_id: number
  product_name: string
  sku: string | null
  entry_type: string
  quantity: number
  unit_price: number | null
  total_value: number | null
  running_balance: number
  reference_type: string | null
  reference_id: number | null
  reference_number: string | null
  notes: string | null
}

export interface StockLedgerReport {
  total_transactions: number
  total_incoming: number
  total_outgoing: number
  total_adjustments: number
  opening_balance: number
  closing_balance: number
  transactions: StockLedgerItem[]
  generated_at: string
  filters_applied: Record<string, any> | null
}

// Inventory Valuation Report Types
export interface InventoryValuationItem {
  product_id: number
  product_name: string
  sku: string | null
  category: string | null
  current_stock: number
  unit_cost: number | null
  total_cost_value: number
  unit_market_price: number | null
  total_market_value: number
  valuation_difference: number
  last_updated: string | null
}

export interface InventoryValuationReport {
  total_products: number
  total_cost_value: number
  total_market_value: number
  total_valuation_difference: number
  items: InventoryValuationItem[]
  generated_at: string
  filters_applied: Record<string, any> | null
}

// Inventory Dashboard Types
export interface InventoryDashboardMetrics {
  total_products: number
  total_stock_value: number
  low_stock_items: number
  out_of_stock_items: number
  recent_movements: number
  average_stock_level: number
  top_moving_products: Array<{
    product_id: number
    product_name: string
    movement_count: number
    current_stock: number
    category: string | null
  }>
  low_stock_alerts: Array<{
    product_id: number
    product_name: string
    current_stock: number
    minimum_stock: number
    category: string | null
  }>
  generated_at: string
}

export async function apiGetInventorySummary(
  category?: string,
  lowStockOnly?: boolean,
  outOfStockOnly?: boolean
): Promise<InventorySummaryReport> {
  const params = new URLSearchParams()
  if (category) params.append('category', category)
  if (lowStockOnly) params.append('low_stock_only', 'true')
  if (outOfStockOnly) params.append('out_of_stock_only', 'true')
  
  const queryString = params.toString()
  const url = `/api/reports/inventory-summary${queryString ? `?${queryString}` : ''}`
  
  const r = await fetch(url, {
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

export async function apiGetStockLedger(
  productId?: number,
  fromDate?: string,
  toDate?: string,
  entryType?: string
): Promise<StockLedgerReport> {
  const params = new URLSearchParams()
  if (productId) params.append('product_id', productId.toString())
  if (fromDate) params.append('from_date', fromDate)
  if (toDate) params.append('to_date', toDate)
  if (entryType) params.append('entry_type', entryType)
  
  const queryString = params.toString()
  const url = `/api/reports/stock-ledger${queryString ? `?${queryString}` : ''}`
  
  const r = await fetch(url, {
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

export async function apiGetInventoryValuation(
  category?: string,
  includeZeroStock?: boolean
): Promise<InventoryValuationReport> {
  const params = new URLSearchParams()
  if (category) params.append('category', category)
  if (includeZeroStock !== undefined) params.append('include_zero_stock', includeZeroStock.toString())
  
  const queryString = params.toString()
  const url = `/api/reports/inventory-valuation${queryString ? `?${queryString}` : ''}`
  
  const r = await fetch(url, {
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

export async function apiGetInventoryDashboard(): Promise<InventoryDashboardMetrics> {
  const url = '/api/reports/inventory-dashboard'
  
  const r = await fetch(url, {
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

export async function apiGetAllInvoicePayments(): Promise<Payment[]> {
  // First get all invoices, then get payments for each
  const invoicesResponse = await fetch('/api/invoices', {
    headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
  })
  
  if (!invoicesResponse.ok) {
    throw new Error(`HTTP ${invoicesResponse.status}: ${invoicesResponse.statusText}`)
  }
  
  const invoicesData = await invoicesResponse.json()
  const allPayments: Payment[] = []
  
  // Get payments for each invoice
  for (const invoice of invoicesData.invoices) {
    try {
      const payments = await apiGetInvoicePayments(invoice.id)
      allPayments.push(...payments)
    } catch (error) {
      // Skip invoices with no payments or errors
      console.warn(`Failed to get payments for invoice ${invoice.id}:`, error)
    }
  }
  
  return allPayments
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
  id: string
  transaction_date: string
  type: 'inflow' | 'outflow'
  description: string
  reference_number?: string
  payment_method: string
  amount: number
  account_head: string
  source_type: string
  source_id: number
  reference_document: string
  party_name: string
  created_at: string
}

export type CashflowTransactionsResponse = {
  transactions: CashflowTransaction[]
  total_count: number
  page: number
  limit: number
  total_pages: number
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
  
  const response: CashflowTransactionsResponse = await r.json()
  return response.transactions
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

export type CompanySettings = {
  id: number
  name: string
  gstin: string
  state: string
  state_code: string
  invoice_series: string
}

export async function apiGetCompanySettings(): Promise<CompanySettings> {
  const r = await fetch('/api/company/settings', {
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

export async function apiUpdateCompanySettings(settings: Partial<CompanySettings>): Promise<CompanySettings> {
  const r = await fetch('/api/company/settings', {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('auth_token')}` 
    },
    body: JSON.stringify(settings)
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


// Invoice Template Types and API Functions

export type InvoiceTemplate = {
  id: number
  name: string
  description: string | null
  template_type: string
  primary_color: string
  secondary_color: string
  accent_color: string
  header_font: string
  body_font: string
  header_font_size: number
  body_font_size: number
  show_logo: boolean
  logo_position: string
  show_company_details: boolean
  show_customer_details: boolean
  show_supplier_details: boolean
  show_terms: boolean
  show_notes: boolean
  show_footer: boolean
  header_text: string
  footer_text: string
  terms_text: string
  is_active: boolean
  is_default: boolean
  created_at: string
  updated_at: string
}

export type InvoiceTemplateCreate = {
  name: string
  description?: string
  template_type?: string
  primary_color?: string
  secondary_color?: string
  accent_color?: string
  header_font?: string
  body_font?: string
  header_font_size?: number
  body_font_size?: number
  show_logo?: boolean
  logo_position?: string
  show_company_details?: boolean
  show_customer_details?: boolean
  show_supplier_details?: boolean
  show_terms?: boolean
  show_notes?: boolean
  show_footer?: boolean
  header_text?: string
  footer_text?: string
  terms_text?: string
}

export type InvoiceTemplateUpdate = Partial<InvoiceTemplateCreate>

export async function apiGetInvoiceTemplates(): Promise<InvoiceTemplate[]> {
  const r = await fetch('/api/invoice-templates', {
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

export async function apiGetInvoiceTemplate(templateId: number): Promise<InvoiceTemplate> {
  const r = await fetch(`/api/invoice-templates/${templateId}`, {
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

export async function apiGetDefaultInvoiceTemplate(): Promise<InvoiceTemplate> {
  const r = await fetch('/api/invoice-templates/default', {
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

export async function apiCreateInvoiceTemplate(template: InvoiceTemplateCreate): Promise<InvoiceTemplate> {
  const r = await fetch('/api/invoice-templates', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('auth_token')}` 
    },
    body: JSON.stringify(template)
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

export async function apiUpdateInvoiceTemplate(templateId: number, template: InvoiceTemplateUpdate): Promise<InvoiceTemplate> {
  const r = await fetch(`/api/invoice-templates/${templateId}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('auth_token')}` 
    },
    body: JSON.stringify(template)
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

export async function apiDeleteInvoiceTemplate(templateId: number): Promise<void> {
  const r = await fetch(`/api/invoice-templates/${templateId}`, {
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

export async function apiSetDefaultInvoiceTemplate(templateId: number): Promise<void> {
  const r = await fetch(`/api/invoice-templates/${templateId}/set-default`, {
    method: 'POST',
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

export async function apiUploadLogo(file: File): Promise<{success: boolean, logo_url: string, filename: string, size: number}> {
  const formData = new FormData()
  formData.append('file', file)
  
  const r = await fetch('/api/upload-logo', {
    method: 'POST',
    headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
    body: formData
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

export async function apiImportInvoiceTemplate(file: File): Promise<{success: boolean, message: string, template_id: number}> {
  const formData = new FormData()
  formData.append('file', file)
  
  const r = await fetch('/api/invoice-templates/import', {
    method: 'POST',
    headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
    body: formData
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

export async function apiExportInvoiceTemplate(templateId: number): Promise<Blob> {
  const r = await fetch(`/api/invoice-templates/${templateId}/export`, {
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
  
  return r.blob()
}

export async function apiGetPresetThemes(): Promise<Record<string, any>> {
  const r = await fetch('/api/invoice-templates/presets', {
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

export async function apiUpdateInvoiceStatus(invoiceId: number, status: string): Promise<Invoice> {
  const params = new URLSearchParams()
  params.append('status', status)
  
  const url = `/api/invoices/${invoiceId}/status?${params.toString()}`
  const r = await fetch(url, {
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

export async function apiGetInvoicePDF(invoiceId: number, templateId?: number): Promise<Blob> {
  const params = new URLSearchParams()
  if (templateId) {
    params.append('template_id', templateId.toString())
  }
  
  const url = `/api/invoices/${invoiceId}/pdf${params.toString() ? `?${params.toString()}` : ''}`
  const r = await fetch(url, {
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
  return r.blob()
}

export type Payment = {
  id: number
  invoice_id: number
  payment_date: string
  payment_amount: number
  payment_method: string
  account_head: string
  reference_number: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export async function apiGetAllInvoicePayments(): Promise<Payment[]> {
  const r = await fetch('/api/invoice-payments', {
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

