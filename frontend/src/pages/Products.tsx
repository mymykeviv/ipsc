import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../modules/AuthContext'
import { createApiErrorHandler } from '../lib/apiUtils'
import { Button } from '../components/Button'
import { SearchBar } from '../components/SearchBar'
import { ErrorMessage } from '../components/ErrorMessage'
import { DateFilter } from '../components/DateFilter'
import { FilterDropdown } from '../components/FilterDropdown'
import { FilterBar } from '../components/FilterBar'
import { EnhancedFilterBar } from '../components/EnhancedFilterBar'
import { EnhancedFilterDropdown } from '../components/EnhancedFilterDropdown'
import { apiGetProducts, apiCreateProduct, apiUpdateProduct, apiToggleProduct, apiAdjustStock, apiListParties, Party, apiGetStockMovementHistory, StockMovement, ProductFilters } from '../lib/api'
import { formStyles, getSectionHeaderColor } from '../utils/formStyles'

interface Product {
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

interface ProductFormData {
  // Product Details
  name: string
  product_code: string
  sku: string
  unit: string
  supplier: string
  description: string
  product_type: string
  category: string
  
  // Price Details
  purchase_price: string
  sales_price: string
  gst_rate: string
  hsn_code: string
  
  // Stock Details
  opening_stock: string
  closing_stock: string
  
  // Other Details
  notes: string
}

interface StockFormData {
  quantity: string
  adjustmentType: 'add' | 'reduce'
  date_of_receipt: string
  reference_bill_number: string
  supplier: string
  category: string
  notes: string
}

interface ProductsProps {
  mode?: 'manage' | 'add' | 'edit' | 'stock-adjustment' | 'stock-history'
}

export function Products({ mode = 'manage' }: ProductsProps) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { forceLogout } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [vendors, setVendors] = useState<Party[]>([])
  const [loading, setLoading] = useState(true)
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null)
  
  // Create error handler that will automatically log out on 401 errors
  const handleApiError = createApiErrorHandler(forceLogout)
  const [showStockModal, setShowStockModal] = useState(false)
  const [showStockHistoryModal, setShowStockHistoryModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [itemTypeFilter, setItemTypeFilter] = useState<string>('all')
  const [gstRateFilter, setGstRateFilter] = useState<string>('all')
  const [stockLevelFilter, setStockLevelFilter] = useState<string>('all')
  const [supplierFilter, setSupplierFilter] = useState<string>('all')
  const [priceRangeFilter, setPriceRangeFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<keyof Product>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const [formData, setFormData] = useState<ProductFormData>({
    // Product Details
    name: '',
    product_code: '',
    sku: '',
    unit: 'Pcs',
    supplier: '',
    description: '',
    product_type: 'tradable',
    category: '',
    
    // Price Details
    purchase_price: '',
    sales_price: '',
    gst_rate: '18',
    hsn_code: '',
    
    // Stock Details
    opening_stock: '',
    closing_stock: '',
    
    // Other Details
    notes: ''
  })

  const [stockFormData, setStockFormData] = useState<StockFormData>({
    quantity: '',
    adjustmentType: 'add',
    date_of_receipt: new Date().toISOString().split('T')[0],
    reference_bill_number: '',
    supplier: '',
    category: '',
    notes: ''
  })

  useEffect(() => {
    console.log('Products useEffect triggered:', { mode, id, loading, token: localStorage.getItem('auth_token') })
    if (mode === 'manage') {
      console.log('Loading products for manage mode')
      loadProducts()
      loadVendors()
    } else if (mode === 'edit' && id) {
      console.log('Loading product for edit mode:', id)
      loadProduct(parseInt(id))
      loadVendors()
    } else if (mode === 'add') {
      console.log('Setting up add mode')
      setLoading(true)
      loadVendors().finally(() => {
        setLoading(false)
      })
    } else if (mode === 'stock-adjustment') {
      console.log('Setting up stock adjustment mode')
      setLoading(true)
      loadProducts()
      loadVendors()
      setLoading(false)
    } else if (mode === 'stock-history') {
      console.log('Setting up stock history mode')
      setLoading(true)
      loadProducts()
      loadVendors()
      setLoading(false)
    }
  }, [mode, id])

  // Reload products when filters change
  useEffect(() => {
    console.log('Filter change useEffect triggered:', { mode, searchTerm, categoryFilter })
    if (mode === 'manage') {
      loadProducts()
    }
  }, [searchTerm, categoryFilter, itemTypeFilter, gstRateFilter, stockLevelFilter, supplierFilter, priceRangeFilter, statusFilter])

  const loadProducts = async () => {
    try {
      console.log('loadProducts called')
      setLoading(true)
      setError(null)
      
      // Check if user is authenticated
      const token = localStorage.getItem('auth_token')
      if (!token) {
        console.error('No authentication token found')
        setError('Authentication required. Please log in.')
        setLoading(false)
        return
      }
      
      // Build filters object
      const filters: ProductFilters = {}
      
      if (searchTerm) filters.search = searchTerm
      if (categoryFilter !== 'all') filters.category = categoryFilter
      if (itemTypeFilter !== 'all') filters.item_type = itemTypeFilter
      if (gstRateFilter !== 'all') filters.gst_rate = parseFloat(gstRateFilter)
      if (supplierFilter !== 'all') filters.supplier = supplierFilter
      if (stockLevelFilter !== 'all') filters.stock_level = stockLevelFilter
      if (statusFilter !== 'all') filters.status = statusFilter
      
      // Handle price range filter
      if (priceRangeFilter !== 'all') {
        const [min, max] = priceRangeFilter.split('-')
        if (min) filters.price_min = parseFloat(min)
        if (max) filters.price_max = parseFloat(max)
      }
      
      console.log('Calling apiGetProducts with filters:', filters)
      const data = await apiGetProducts(filters)
      console.log('Products loaded:', data)
      setProducts(data)
    } catch (error: any) {
      console.error('Error loading products:', error)
      const errorMessage = handleApiError(error)
      setError(errorMessage)
    } finally {
      console.log('Setting loading to false')
      setLoading(false)
    }
  }

  const loadProduct = async (productId: number) => {
    try {
      setLoading(true)
      const data = await apiGetProducts()
      const product = data.find(p => p.id === productId)
      if (product) {
        setCurrentProduct(product)
        // Populate form data
        setFormData({
          name: product.name,
          product_code: product.sku || '',
          sku: product.sku || '',
          unit: product.unit,
          supplier: product.supplier || '',
          description: product.description || '',
          product_type: product.item_type,
          category: product.category || '',
          purchase_price: product.purchase_price?.toString() || '',
          sales_price: product.sales_price.toString(),
          gst_rate: product.gst_rate?.toString() || '18',
          hsn_code: product.hsn || '',
          opening_stock: product.stock.toString(),
          closing_stock: product.stock.toString(),
          notes: product.notes || ''
        })
    } else {
        setError('Product not found')
      }
    } catch (error: any) {
      handleApiError(error)
      setError('Failed to load product')
    } finally {
      setLoading(false)
    }
  }

  const loadVendors = async () => {
    try {
      console.log('loadVendors called')
      const token = localStorage.getItem('auth_token')
      if (!token) {
        console.error('No authentication token found for vendors')
        return
      }
      const data = await apiListParties()
      const vendorData = data.filter(party => party.type === 'vendor')
      setVendors(vendorData)
      console.log('Vendors loaded:', vendorData)
    } catch (error: any) {
      console.error('Error loading vendors:', error)
      handleApiError(error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      product_code: '',
      sku: '',
      unit: 'Pcs',
      supplier: '',
      description: '',
      product_type: 'tradable',
      category: '',
      purchase_price: '',
      sales_price: '',
      gst_rate: '18',
      hsn_code: '',
      opening_stock: '',
      closing_stock: '',
      notes: ''
    })
    setError(null)
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        item_type: formData.product_type,
        sales_price: parseFloat(formData.sales_price),
        purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : null,
        stock: parseFloat(formData.opening_stock),
        sku: formData.sku,
        unit: formData.unit,
        supplier: formData.supplier,
        category: formData.category,
        notes: formData.notes,
        hsn: formData.hsn_code,
        gst_rate: formData.gst_rate && formData.gst_rate !== '' ? parseFloat(formData.gst_rate) : null
      }
      
      await apiCreateProduct(payload)
      navigate('/products')
    } catch (error: any) {
      handleApiError(error)
      let errorMessage = 'Failed to create product. Please try again.'
      if (error.message) {
        errorMessage = error.message
      }
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentProduct) return
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        item_type: formData.product_type,
        sales_price: parseFloat(formData.sales_price),
        purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : null,
        stock: parseFloat(formData.opening_stock),
        sku: formData.sku,
        unit: formData.unit,
        supplier: formData.supplier,
        category: formData.category,
        notes: formData.notes,
        hsn: formData.hsn_code,
        gst_rate: formData.gst_rate && formData.gst_rate !== '' ? parseFloat(formData.gst_rate) : null
      }
      await apiUpdateProduct(currentProduct.id, payload)
      navigate('/products')
    } catch (error: any) {
      handleApiError(error)
      setError('Failed to update product')
    }
  }

  const handleToggleProduct = async (productId: number) => {
    try {
      await apiToggleProduct(productId)
      loadProducts()
    } catch (error: any) {
      handleApiError(error)
    }
  }

  // Render different content based on mode
  if (mode === 'add' || mode === 'edit') {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '24px',
          paddingBottom: '12px',
          borderBottom: '2px solid #e9ecef'
        }}>
          <h1 style={{ margin: '0', fontSize: '28px', fontWeight: '600', color: '#2c3e50' }}>
            {mode === 'add' ? 'Add New Product' : 'Edit Product'}
          </h1>
          <Button variant="secondary" onClick={() => navigate('/products')}>
            ← Back to Products
          </Button>
        </div>

        {error && <ErrorMessage message={error} />}

        {loading && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '100px',
            fontSize: '16px',
            color: '#6c757d'
          }}>
            {mode === 'add' ? 'Loading form...' : 'Loading product data...'}
          </div>
        )}

        {!loading && (
          <form onSubmit={mode === 'add' ? handleAddProduct : handleEditProduct} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          
          {/* Row 1: Product Details | Price Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            
            {/* Product Details Section */}
            <div>
              <h3 style={{ marginBottom: '4px', color: '#333', borderBottom: '2px solid #007bff', paddingBottom: '2px' }}>
                Product Details
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                {/* First Row */}
                <div style={formStyles.formGroup}>
                  <label style={formStyles.label}>Product Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    style={formStyles.input}
                    required
                  />
                </div>
                <div style={formStyles.formGroup}>
                  <label style={formStyles.label}>Product Code *</label>
                  <input
                    type="text"
                    value={formData.product_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, product_code: e.target.value }))}
                    style={formStyles.input}
                    required
                  />
                </div>
                <div style={formStyles.formGroup}>
                  <label style={formStyles.label}>SKU</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                    style={formStyles.input}
                  />
                </div>
                
                {/* Second Row */}
                <div style={formStyles.formGroup}>
                  <label style={formStyles.label}>Unit of Measure *</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                    style={formStyles.select}
                    required
                  >
                    <option value="Pcs">Pieces</option>
                    <option value="Kg">Kilograms</option>
                    <option value="Ltr">Liters</option>
                    <option value="Mtr">Meters</option>
                    <option value="Box">Box</option>
                    <option value="Set">Set</option>
                  </select>
                </div>
                <div style={formStyles.formGroup}>
                  <label style={formStyles.label}>Product Supplier</label>
                  <select
                    value={formData.supplier}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                    style={formStyles.select}
                  >
                    <option value="">Select Supplier</option>
                    {vendors.map(vendor => (
                      <option key={vendor.id} value={vendor.name}>{vendor.name}</option>
                    ))}
                  </select>
                </div>
                <div style={formStyles.formGroup}>
                  <label style={formStyles.label}>Product Type *</label>
                  <select
                    value={formData.product_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, product_type: e.target.value }))}
                    style={formStyles.select}
                    required
                  >
                    <option value="Goods">Goods</option>
                    <option value="Services">Services</option>
                  </select>
                </div>
                
                {/* Third Row */}
                <div style={formStyles.formGroup}>
                  <label style={formStyles.label}>Product Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    style={formStyles.input}
                  />
                </div>
                <div style={{ ...formStyles.formGroup, gridColumn: 'span 2' }}>
                  <label style={formStyles.label}>Product Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    style={formStyles.textarea}
                    placeholder="Enter detailed product description..."
                  />
                </div>
              </div>
            </div>

            {/* Price Details Section */}
            <div>
              <h3 style={{ marginBottom: '4px', color: '#333', borderBottom: '2px solid #28a745', paddingBottom: '2px' }}>
                Price Details
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {/* First Row: Purchase Price (optional) | Selling Price * */}
                <div style={formStyles.formGroup}>
                  <label style={formStyles.label}>Purchase Price (optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.purchase_price}
                    onChange={(e) => setFormData(prev => ({ ...prev, purchase_price: e.target.value }))}
                    style={formStyles.input}
                    placeholder="Enter purchase price"
                  />
                </div>
                <div style={formStyles.formGroup}>
                  <label style={formStyles.label}>Selling Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.sales_price}
                    onChange={(e) => setFormData(prev => ({ ...prev, sales_price: e.target.value }))}
                    style={formStyles.input}
                    required
                    placeholder="Enter selling price"
                  />
                </div>
                
                {/* Second Row: HSN Code (optional) | GST Rate (optional) */}
                <div style={formStyles.formGroup}>
                  <label style={formStyles.label}>HSN Code (optional)</label>
                  <input
                    type="text"
                    value={formData.hsn_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, hsn_code: e.target.value }))}
                    style={formStyles.input}
                    placeholder="Enter HSN code"
                  />
                </div>
                <div style={formStyles.formGroup}>
                  <label style={formStyles.label}>GST Rate (optional)</label>
                  <select
                    value={formData.gst_rate}
                    onChange={(e) => setFormData(prev => ({ ...prev, gst_rate: e.target.value }))}
                    style={formStyles.select}
                  >
                    <option value="">Select GST Rate</option>
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                    <option value="28">28%</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Stock Details | Others */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            
            {/* Stock Details Section */}
            <div>
              <h3 style={{ marginBottom: '4px', color: '#333', borderBottom: '2px solid #6c757d', paddingBottom: '2px' }}>
                Stock Details
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={formStyles.formGroup}>
                  <label style={formStyles.label}>Opening Stock</label>
                  <input
                    type="number"
                    step="1"
                    value={formData.opening_stock}
                    onChange={(e) => setFormData(prev => ({ ...prev, opening_stock: e.target.value }))}
                    style={formStyles.input}
                    placeholder="Enter opening stock quantity"
                  />
                </div>
                <div style={formStyles.formGroup}>
                  <label style={formStyles.label}>Closing Stock</label>
                  <input
                    type="number"
                    step="1"
                    value={formData.closing_stock || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, closing_stock: e.target.value }))}
                    style={formStyles.input}
                    placeholder="Enter closing stock quantity"
                    readOnly
                  />
                </div>
              </div>
            </div>

            {/* Others Section */}
            <div>
              <h3 style={{ marginBottom: '4px', color: '#333', borderBottom: '2px solid #ffc107', paddingBottom: '2px' }}>
                Others
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ ...formStyles.formGroup, gridColumn: 'span 2' }}>
                  <label style={formStyles.label}>Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    style={formStyles.textarea}
                    placeholder="Enter any additional notes..."
                  />
                </div>
              </div>
            </div>
          </div>



          {/* Form Actions */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <Button type="button" variant="secondary" onClick={() => navigate('/products')}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Saving...' : (mode === 'add' ? 'Add Product' : 'Update Product')}
            </Button>
          </div>
        </form>
      )}
      </div>
    )
  }

  // Stock Adjustment Mode
  if (mode === 'stock-adjustment') {
    return <StockAdjustmentForm onSuccess={() => navigate('/products')} onCancel={() => navigate('/products')} />
  }

  // Stock History Mode
  if (mode === 'stock-history') {
    return <StockHistoryForm onSuccess={() => navigate('/products')} onCancel={() => navigate('/products')} />
  }

  // Manage Products Mode
  if (loading) {
    console.log('Rendering loading state')
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '200px',
          fontSize: '16px',
          color: '#6c757d'
        }}>
          Loading products...
        </div>
      </div>
    )
  }

  console.log('Rendering manage mode:', { products: products.length, error })

  // Show error state if there's an error
  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '24px',
          paddingBottom: '12px',
          borderBottom: '2px solid #e9ecef'
        }}>
          <h1 style={{ margin: '0', fontSize: '28px', fontWeight: '600', color: '#2c3e50' }}>Manage Products</h1>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button variant="primary" onClick={() => navigate('/products/add')}>
              Add Product
            </Button>
          </div>
        </div>
        
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#f8d7da', 
          border: '1px solid #f5c6cb', 
          borderRadius: '8px',
          color: '#721c24',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 12px 0' }}>Error Loading Products</h3>
          <p style={{ margin: '0 0 16px 0' }}>{error}</p>
          <Button variant="primary" onClick={loadProducts}>
            Retry Loading
          </Button>
        </div>
      </div>
    )
  }

  // Filter and sort products
  const filteredProducts = products.filter(product => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = (
      product.name.toLowerCase().includes(searchLower) ||
      (product.sku && product.sku.toLowerCase().includes(searchLower)) ||
      (product.category && product.category.toLowerCase().includes(searchLower)) ||
      (product.description && product.description.toLowerCase().includes(searchLower)) ||
      (product.supplier && product.supplier.toLowerCase().includes(searchLower))
    )
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && product.is_active) ||
      (statusFilter === 'inactive' && !product.is_active)
    
    return matchesSearch && matchesStatus
  })

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const aValue = a[sortField]
    const bValue = b[sortField]
    
    // Handle null values
    if (aValue === null && bValue === null) return 0
    if (aValue === null) return sortDirection === 'asc' ? 1 : -1
    if (bValue === null) return sortDirection === 'asc' ? -1 : 1
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  const totalPages = Math.ceil(sortedProducts.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const paginatedProducts = sortedProducts.slice(startIndex, endIndex)

  const exportToCSV = () => {
    const headers = ['Name', 'SKU', 'Category', 'Unit', 'Stock', 'Sales Price', 'GST Rate', 'Status']
    const csvContent = [
      headers.join(','),
      ...paginatedProducts.map(product => [
        product.name,
        product.sku || '',
        product.category || '',
        product.unit,
        product.stock,
        product.sales_price,
        product.gst_rate,
        product.is_active ? 'Active' : 'Inactive'
      ].join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'products.csv'
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const SortableHeader = ({ children, field }: { children: React.ReactNode; field: keyof Product }) => (
    <th
      onClick={() => {
        if (sortField === field) {
          setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
          setSortField(field)
          setSortDirection('asc')
        }
      }}
      style={{ 
        padding: '12px', 
        textAlign: 'left', 
        fontWeight: '600', 
        color: '#495057',
        cursor: 'pointer',
        userSelect: 'none'
      }}
    >
      {children} {sortField === field && (sortDirection === 'asc' ? '↑' : '↓')}
    </th>
  )

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px',
        paddingBottom: '12px',
        borderBottom: '2px solid #e9ecef'
      }}>
        <h1 style={{ margin: '0', fontSize: '28px', fontWeight: '600', color: '#2c3e50' }}>Manage Products</h1>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button variant="secondary" onClick={exportToCSV}>
              Export CSV
            </Button>
          <Button variant="primary" onClick={() => navigate('/products/add')}>
              Add Product
            </Button>
          </div>
        </div>

      {/* Enhanced Filter Options */}
      <EnhancedFilterBar 
        title="Product Filters"
        activeFiltersCount={
          (searchTerm ? 1 : 0) +
          (statusFilter !== 'all' ? 1 : 0) +
          (categoryFilter !== 'all' ? 1 : 0) +
          (itemTypeFilter !== 'all' ? 1 : 0) +
          (gstRateFilter !== 'all' ? 1 : 0) +
          (stockLevelFilter !== 'all' ? 1 : 0) +
          (supplierFilter !== 'all' ? 1 : 0) +
          (priceRangeFilter !== 'all' ? 1 : 0) +
          (dateFilter !== 'all' ? 1 : 0)
        }
        onClearAll={() => {
          setSearchTerm('')
          setStatusFilter('all')
          setCategoryFilter('all')
          setItemTypeFilter('all')
          setGstRateFilter('all')
          setStockLevelFilter('all')
          setSupplierFilter('all')
          setPriceRangeFilter('all')
          setDateFilter('all')
        }}
        showQuickActions={true}
        quickActions={[
          {
            label: 'Low Stock (<10)',
            action: () => {
              setStockLevelFilter('low_stock')
            },
            icon: '⚠️'
          },
          {
            label: 'Active Only',
            action: () => {
              setStatusFilter('active')
            },
            icon: '✅'
          }
          // Removed Electronics and High GST quick filters as requested
        ]}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '12px', fontWeight: '500', color: '#495057' }}>Search</span>
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search products..."
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '12px', fontWeight: '500', color: '#495057' }}>Status</span>
          <FilterDropdown
            value={statusFilter}
            onChange={(value) => setStatusFilter(Array.isArray(value) ? value[0] || 'all' : value)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' }
            ]}
            placeholder="Select status"
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '12px', fontWeight: '500', color: '#495057' }}>Category</span>
          <FilterDropdown
            value={categoryFilter}
            onChange={(value) => setCategoryFilter(Array.isArray(value) ? value[0] || 'all' : value)}
            options={[
              { value: 'all', label: 'All Categories' },
              { value: 'Electronics', label: 'Electronics' },
              { value: 'Office Supplies', label: 'Office Supplies' },
              { value: 'Raw Materials', label: 'Raw Materials' },
              { value: 'Finished Goods', label: 'Finished Goods' },
              { value: 'Consumables', label: 'Consumables' }
            ]}
            placeholder="Select category"
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '12px', fontWeight: '500', color: '#495057' }}>Item Type</span>
          <FilterDropdown
            value={itemTypeFilter}
            onChange={(value) => setItemTypeFilter(Array.isArray(value) ? value[0] || 'all' : value)}
            options={[
              { value: 'all', label: 'All Types' },
              { value: 'tradable', label: 'Tradable' },
              { value: 'consumable', label: 'Consumable' },
              { value: 'manufactured', label: 'Manufactured' }
            ]}
            placeholder="Select type"
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '12px', fontWeight: '500', color: '#495057' }}>GST Rate</span>
          <FilterDropdown
            value={gstRateFilter}
            onChange={(value) => setGstRateFilter(Array.isArray(value) ? value[0] || 'all' : value)}
            options={[
              { value: 'all', label: 'All Rates' },
              { value: '0', label: '0%' },
              { value: '5', label: '5%' },
              { value: '12', label: '12%' },
              { value: '18', label: '18%' },
              { value: '28', label: '28%' }
            ]}
            placeholder="Select GST rate"
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '12px', fontWeight: '500', color: '#495057' }}>Stock Level</span>
          <FilterDropdown
            value={stockLevelFilter}
            onChange={(value) => setStockLevelFilter(Array.isArray(value) ? value[0] || 'all' : value)}
            options={[
              { value: 'all', label: 'All Levels' },
              { value: 'low_stock', label: 'Low Stock (< 10)' },
              { value: 'out_of_stock', label: 'Out of Stock' },
              { value: 'in_stock', label: 'In Stock' }
            ]}
            placeholder="Select stock level"
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '12px', fontWeight: '500', color: '#495057' }}>Price Range</span>
          <FilterDropdown
            value={priceRangeFilter}
            onChange={(value) => setPriceRangeFilter(Array.isArray(value) ? value[0] || 'all' : value)}
            options={[
              { value: 'all', label: 'All Prices' },
              { value: '0-100', label: '₹0 - ₹100' },
              { value: '100-500', label: '₹100 - ₹500' },
              { value: '500-1000', label: '₹500 - ₹1,000' },
              { value: '1000-5000', label: '₹1,000 - ₹5,000' },
              { value: '5000-', label: '₹5,000+' }
            ]}
            placeholder="Select price range"
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '12px', fontWeight: '500', color: '#495057' }}>Date</span>
          <DateFilter
            value={dateFilter}
            onChange={setDateFilter}
            placeholder="Select date range"
          />
        </div>
      </EnhancedFilterBar>

      <div style={{ 
        border: '1px solid #e9ecef', 
        borderRadius: '8px', 
        overflow: 'hidden',
        backgroundColor: 'white'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #e9ecef' }}>
              <SortableHeader field="name">Name</SortableHeader>
              <SortableHeader field="sku">SKU</SortableHeader>
              <SortableHeader field="category">Category</SortableHeader>
              <SortableHeader field="unit">Unit</SortableHeader>
              <SortableHeader field="stock">Stock</SortableHeader>
              <SortableHeader field="sales_price">Sales Price</SortableHeader>
              <SortableHeader field="gst_rate">GST Rate</SortableHeader>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Actions</th>
            </tr>
          </thead>
                      <tbody>
              {paginatedProducts.map(product => (
              <tr key={product.id} style={{ 
                opacity: product.is_active ? 1 : 0.6,
                borderBottom: '1px solid #e9ecef',
                backgroundColor: 'white'
              }}>
                <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>{product.name}</td>
                <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>{product.sku || '-'}</td>
                <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>{product.category || '-'}</td>
                <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>{product.unit}</td>
                <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>{product.stock}</td>
                <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>₹{product.sales_price.toFixed(2)}</td>
                <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>{product.gst_rate}%</td>
                <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>
                  <span style={{ 
                    padding: '6px 12px', 
                    borderRadius: '6px', 
                    fontSize: '14px',
                    fontWeight: '500',
                    backgroundColor: product.is_active ? '#d4edda' : '#f8d7da',
                    color: product.is_active ? '#155724' : '#721c24'
                  }}>
                    {product.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button 
                      variant="secondary" 
                      onClick={() => navigate(`/products/edit/${product.id}`)}
                      style={{ fontSize: '14px', padding: '6px 12px' }}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="secondary"
                      onClick={() => navigate(`/products/stock-adjustment?product=${product.id}`)}
                      style={{ fontSize: '14px', padding: '6px 12px' }}
                    >
                      Stock
                    </Button>
                    <Button 
                      variant="secondary"
                      onClick={() => navigate(`/products/stock-history?product=${product.id}`)}
                      style={{ fontSize: '14px', padding: '6px 12px' }}
                    >
                      History
                    </Button>
                    <Button 
                      variant="secondary" 
                      onClick={() => handleToggleProduct(product.id)}
                      style={{ fontSize: '14px', padding: '6px 12px' }}
                    >
                      {product.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginTop: '24px', 
          padding: '16px',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          backgroundColor: '#f8f9fa'
        }}>
          <div style={{ fontSize: '14px', color: '#495057' }}>
            Showing {startIndex + 1} to {Math.min(endIndex, sortedProducts.length)} of {sortedProducts.length} products
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button 
                variant="secondary" 
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
            <span style={{ 
              padding: '8px 12px', 
              display: 'flex', 
              alignItems: 'center',
              fontSize: '14px',
              color: '#495057',
              fontWeight: '500'
            }}>
                Page {currentPage} of {totalPages}
              </span>
              <Button 
                variant="secondary" 
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}

      {paginatedProducts.length === 0 && !loading && (
        <div style={{
          textAlign: 'center', 
          padding: '40px', 
          color: '#6c757d',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          backgroundColor: '#f8f9fa'
        }}>
          <div style={{ fontSize: '18px', marginBottom: '8px', fontWeight: '500' }}>
            No products found
            </div>
          <div style={{ fontSize: '14px' }}>
            {searchTerm ? 'Try adjusting your search criteria' : 'Create your first product to get started'}
              </div>
        </div>
      )}

      {/* Stock Adjustment Modal - Keep this for now */}
      {showStockModal && selectedProduct && (
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
            width: '80%', 
            height: '80%', 
            maxWidth: '1400px', 
            maxHeight: '80vh', 
            overflow: 'auto',
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px'
          }}>
            <h2>Stock Adjustment for {selectedProduct.name}</h2>
            {/* Stock adjustment form content */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <Button variant="secondary" onClick={() => setShowStockModal(false)}>
                  Cancel
                </Button>
              <Button variant="primary">
                Apply Adjustment
                </Button>
              </div>
          </div>
        </div>
      )}

      {/* Stock History Modal - Keep this for now */}
      {showStockHistoryModal && selectedProduct && (
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
            width: '80%', 
            height: '80%', 
            maxWidth: '1400px', 
            maxHeight: '80vh', 
            overflow: 'auto',
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px'
          }}>
            <h2>Stock History for {selectedProduct.name}</h2>
            {/* Stock history content */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <Button variant="secondary" onClick={() => setShowStockHistoryModal(false)}>
                ← Back to Products
                </Button>
              </div>
          </div>
        </div>
      )}
    </div>
  )
}


// Stock Adjustment Form Component
interface StockAdjustmentFormProps {
  onSuccess: () => void
  onCancel: () => void
}

function StockAdjustmentForm({ onSuccess, onCancel }: StockAdjustmentFormProps) {
  const { forceLogout } = useAuth()
  const handleApiError = createApiErrorHandler(forceLogout)
  const [products, setProducts] = useState<Product[]>([])
  const [vendors, setVendors] = useState<Party[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stockFormData, setStockFormData] = useState<StockFormData>({
    quantity: '',
    adjustmentType: 'add',
    date_of_receipt: new Date().toISOString().split('T')[0],
    reference_bill_number: '',
    supplier: '',
    category: '',
    notes: ''
  })
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [stockLoading, setStockLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [productsData, vendorsData] = await Promise.all([
        apiGetProducts(),
        apiListParties()
      ])
      setProducts(productsData)
      setVendors(vendorsData.filter(party => party.type === 'vendor'))
    } catch (err: any) {
      const errorMessage = handleApiError(err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProductId) {
      setError('Please select a product')
      return
    }

    try {
      setStockLoading(true)
      setError(null)
      
              const result = await apiAdjustStock(
          parseInt(selectedProductId),
          parseInt(stockFormData.quantity),
          stockFormData.adjustmentType,
          stockFormData.date_of_receipt,
          stockFormData.reference_bill_number || undefined,
          stockFormData.supplier || undefined,
          stockFormData.category || undefined,
          stockFormData.notes || undefined
        )
      
      if (result.ok) {
        // Reset form and show success
        setStockFormData({
          quantity: '',
          adjustmentType: 'add',
          date_of_receipt: new Date().toISOString().split('T')[0],
          reference_bill_number: '',
          supplier: '',
          category: '',
          notes: ''
        })
        setSelectedProductId('')
        alert(`Stock adjusted successfully. New stock: ${result.new_stock}`)
        onSuccess()
      }
    } catch (err: any) {
      console.error('Failed to adjust stock:', err)
      const errorMessage = handleApiError(err)
      setError(errorMessage)
    } finally {
      setStockLoading(false)
    }
  }

  const handleStockInputChange = (field: keyof StockFormData, value: string) => {
    setStockFormData(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div style={{ padding: '20px' }}>
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: '100%' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px',
        paddingBottom: '12px',
        borderBottom: '2px solid #e9ecef'
      }}>
        <h1 style={{ 
          margin: '0',
          fontSize: '28px',
          fontWeight: '600',
          color: '#2c3e50'
        }}>
          Stock Adjustment
        </h1>
        <Button 
          onClick={onCancel}
          variant="secondary"
          style={{ 
            padding: '10px 16px', 
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          ← Back to Products
        </Button>
      </div>

      {error && <ErrorMessage message={error} />}

      <form onSubmit={handleStockSubmit} style={{ maxWidth: '800px' }}>
        {/* Product Selection Section */}
        <div style={formStyles.section}>
          <h3 style={{ ...formStyles.sectionHeader, color: getSectionHeaderColor('product') }}>
            Product Selection
          </h3>
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>Select Product *</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              style={formStyles.select}
              required
            >
              <option value="">Choose a product...</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} (Current Stock: {product.stock})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Adjustment Details Section */}
        <div style={formStyles.section}>
          <h3 style={{ ...formStyles.sectionHeader, color: getSectionHeaderColor('adjustment') }}>
            Adjustment Details
          </h3>
          <div style={formStyles.grid2Col}>
            <div style={formStyles.formGroup}>
              <label style={formStyles.label}>Adjustment Type *</label>
              <select
                value={stockFormData.adjustmentType}
                onChange={(e) => handleStockInputChange('adjustmentType', e.target.value as 'add' | 'reduce')}
                style={formStyles.select}
                required
              >
                <option value="add">Add Stock (Incoming)</option>
                <option value="reduce">Reduce Stock (Outgoing)</option>
              </select>
            </div>
            <div style={formStyles.formGroup}>
              <label style={formStyles.label}>Quantity *</label>
              <input
                type="number"
                value={stockFormData.quantity}
                onChange={(e) => handleStockInputChange('quantity', e.target.value)}
                style={formStyles.input}
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>
              {stockFormData.adjustmentType === 'add' ? 'Date of Receipt' : 'Date of Issue'} *
            </label>
            <input
              type="date"
              value={stockFormData.date_of_receipt}
              onChange={(e) => handleStockInputChange('date_of_receipt', e.target.value)}
              style={formStyles.input}
              required
            />
          </div>
        </div>

        {/* Reference Information Section (only for incoming stock) */}
        {stockFormData.adjustmentType === 'add' && (
          <div style={formStyles.section}>
            <h3 style={{ ...formStyles.sectionHeader, color: getSectionHeaderColor('reference') }}>
              Reference Information
            </h3>
            <div style={formStyles.grid2Col}>
              <div style={formStyles.formGroup}>
                <label style={formStyles.label}>Reference Bill Number</label>
                <input
                  type="text"
                  value={stockFormData.reference_bill_number}
                  onChange={(e) => handleStockInputChange('reference_bill_number', e.target.value)}
                  style={formStyles.input}
                  placeholder="Enter bill/invoice number"
                />
              </div>
              <div style={formStyles.formGroup}>
                <label style={formStyles.label}>Supplier</label>
                <select
                  value={stockFormData.supplier}
                  onChange={(e) => handleStockInputChange('supplier', e.target.value)}
                  style={formStyles.select}
                >
                  <option value="">Select supplier...</option>
                  {vendors.map(vendor => (
                    <option key={vendor.id} value={vendor.name}>
                      {vendor.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div style={formStyles.formGroup}>
              <label style={formStyles.label}>Category</label>
              <input
                type="text"
                value={stockFormData.category}
                onChange={(e) => handleStockInputChange('category', e.target.value)}
                style={formStyles.input}
                placeholder="Enter category"
              />
            </div>
          </div>
        )}

        {/* Notes Section */}
        <div style={formStyles.section}>
          <h3 style={{ ...formStyles.sectionHeader, color: getSectionHeaderColor('notes') }}>
            Additional Information
          </h3>
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>Notes</label>
            <textarea
              value={stockFormData.notes}
              onChange={(e) => handleStockInputChange('notes', e.target.value)}
              style={formStyles.textarea}
              rows={3}
              placeholder="Additional notes about this stock adjustment..."
            />
          </div>
        </div>

        {/* Form Actions */}
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', marginTop: '24px' }}>
          <Button 
            type="button" 
            variant="secondary" 
            onClick={onCancel}
            disabled={stockLoading}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="primary"
            disabled={stockLoading}
          >
            {stockLoading ? 'Adjusting Stock...' : 'Adjust Stock'}
          </Button>
        </div>
      </form>
    </div>
  )
}


// Stock History Form Component
interface StockHistoryFormProps {
  onSuccess: () => void
  onCancel: () => void
}

function StockHistoryForm({ onSuccess, onCancel }: StockHistoryFormProps) {
  const [stockHistory, setStockHistory] = useState<StockMovement[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [error, setError] = useState<string | null>(null)
  const [historySearchTerm, setHistorySearchTerm] = useState('')
  const [historyCurrentPage, setHistoryCurrentPage] = useState(1)
  const [historyItemsPerPage] = useState(10)
  
  // New filter states for Stock Movement History
  const [productFilter, setProductFilter] = useState('all')
  const [financialYearFilter, setFinancialYearFilter] = useState('all')
  const [entryTypeFilter, setEntryTypeFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  
  const { forceLogout } = useAuth()
  const handleApiError = createApiErrorHandler(forceLogout)

  const loadProducts = async () => {
    try {
      const productsData = await apiGetProducts()
      setProducts(productsData)
    } catch (err) {
      const errorMessage = handleApiError(err)
      setError(errorMessage)
    }
  }

  const loadStockHistory = async () => {
    try {
      setHistoryLoading(true)
      setError(null)
      const history = await apiGetStockMovementHistory()
      setStockHistory(history)
    } catch (err) {
      console.error('Failed to load stock history:', err)
      const errorMessage = handleApiError(err)
      setError(errorMessage)
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
    loadStockHistory()
  }, [])

  // Filter and paginate stock history with enhanced filters
  const filteredStockHistory = stockHistory.filter(movement => {
    const matchesSearch = movement.product_name.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
                         movement.financial_year.toString().includes(historySearchTerm)
    
    const matchesProduct = productFilter === 'all' || 
                          movement.product_name === productFilter
    
    const matchesFinancialYear = financialYearFilter === 'all' || 
                                 movement.financial_year.toString() === financialYearFilter
    
    const matchesEntryType = entryTypeFilter === 'all' || 
                            (entryTypeFilter === 'incoming' && movement.incoming_stock > 0) ||
                            (entryTypeFilter === 'outgoing' && movement.outgoing_stock > 0)
    
    return matchesSearch && matchesProduct && matchesFinancialYear && matchesEntryType
  })

  const historyTotalPages = Math.ceil(filteredStockHistory.length / historyItemsPerPage)
  const historyStartIndex = (historyCurrentPage - 1) * historyItemsPerPage
  const historyEndIndex = historyStartIndex + historyItemsPerPage
  const paginatedStockHistory = filteredStockHistory.slice(historyStartIndex, historyEndIndex)

  // Get unique financial years for filter
  const financialYears = [...new Set(stockHistory.map(m => m.financial_year.toString()))].sort((a, b) => b.localeCompare(a))
  
  // Get unique product names for filter
  const productNames = [...new Set(stockHistory.map(m => m.product_name))].sort()

  return (
    <div style={{ padding: '20px', maxWidth: '100%' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px',
        paddingBottom: '12px',
        borderBottom: '2px solid #e9ecef'
      }}>
        <h1 style={{ 
          margin: '0',
          fontSize: '28px',
          fontWeight: '600',
          color: '#2c3e50'
        }}>
          Stock Movement History
        </h1>
        <Button 
          onClick={onCancel}
          variant="secondary"
          style={{ 
            padding: '10px 16px', 
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          ← Back to Products
        </Button>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Enhanced Filter Bar for Stock Movement History */}
      <EnhancedFilterBar 
        title="Stock Movement Filters"
        activeFiltersCount={
          (historySearchTerm ? 1 : 0) +
          (productFilter !== 'all' ? 1 : 0) +
          (financialYearFilter !== 'all' ? 1 : 0) +
          (entryTypeFilter !== 'all' ? 1 : 0) +
          (dateFilter !== 'all' ? 1 : 0)
        }
        onClearAll={() => {
          setHistorySearchTerm('')
          setProductFilter('all')
          setFinancialYearFilter('all')
          setEntryTypeFilter('all')
          setDateFilter('all')
        }}
        showQuickActions={true}
        quickActions={[
          {
            label: 'Current FY',
            action: () => {
              const currentYear = new Date().getFullYear()
              setFinancialYearFilter(`${currentYear}-${currentYear + 1}`)
            },
            icon: '📅'
          },
          {
            label: 'Incoming Only',
            action: () => setEntryTypeFilter('incoming'),
            icon: '📥'
          },
          {
            label: 'Outgoing Only',
            action: () => setEntryTypeFilter('outgoing'),
            icon: '📤'
          }
        ]}
      >
        {/* Search Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '12px', fontWeight: '500', color: '#495057' }}>Search</span>
          <input
            type="text"
            value={historySearchTerm}
            onChange={(e) => setHistorySearchTerm(e.target.value)}
            placeholder="Search by product name or financial year..."
            style={{
              width: '100%',
              padding: '6px 10px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '12px',
              outline: 'none',
              minHeight: '32px' // Match other filter components height
            }}
          />
        </div>

        {/* Product Filter */}
        <FilterDropdown
          value={productFilter}
          onChange={(value) => setProductFilter(Array.isArray(value) ? value[0] || 'all' : value)}
          options={[
            { value: 'all', label: 'All Products' },
            ...productNames.map(name => ({ value: name, label: name }))
          ]}
          placeholder="Select Product"
        />

        {/* Financial Year Filter */}
        <FilterDropdown
          value={financialYearFilter}
          onChange={(value) => setFinancialYearFilter(Array.isArray(value) ? value[0] || 'all' : value)}
          options={[
            { value: 'all', label: 'All Financial Years' },
            ...financialYears.map(year => ({ value: year, label: year }))
          ]}
          placeholder="Select Financial Year"
        />

        {/* Entry Type Filter */}
        <FilterDropdown
          value={entryTypeFilter}
          onChange={(value) => setEntryTypeFilter(Array.isArray(value) ? value[0] || 'all' : value)}
          options={[
            { value: 'all', label: 'All Entries' },
            { value: 'incoming', label: 'Incoming Stock' },
            { value: 'outgoing', label: 'Outgoing Stock' }
          ]}
          placeholder="Select Entry Type"
        />

        {/* Date Filter */}
        <DateFilter
          value={dateFilter}
          onChange={setDateFilter}
          placeholder="Select date range"
        />
      </EnhancedFilterBar>

      {/* Stock Movement Table */}
      <div style={{ 
        border: '1px solid #e9ecef', 
        borderRadius: '8px', 
        overflow: 'hidden',
        backgroundColor: 'white'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #e9ecef' }}>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Product</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Financial Year</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Opening Stock</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Incoming</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Outgoing</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Closing Stock</th>
            </tr>
          </thead>
          <tbody>
            {historyLoading ? (
              <tr>
                <td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>
                  Loading stock movement history...
                </td>
              </tr>
            ) : paginatedStockHistory.length > 0 ? (
              paginatedStockHistory.map((movement, index) => (
                <tr key={index} style={{ 
                  borderBottom: '1px solid #e9ecef',
                  backgroundColor: 'white'
                }}>
                  <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>{movement.product_name}</td>
                  <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>
                    {movement.financial_year}
                  </td>
                  <td style={{ padding: '12px', borderRight: '1px solid #e9ecef' }}>
                    {movement.opening_stock.toFixed(2)}
                  </td>
                  <td style={{ padding: '12px', borderRight: '1px solid #e9ecef', color: '#28a745' }}>
                    {movement.incoming_stock.toFixed(2)}
                  </td>
                  <td style={{ padding: '12px', borderRight: '1px solid #e9ecef', color: '#dc3545' }}>
                    {movement.outgoing_stock.toFixed(2)}
                  </td>
                  <td style={{ padding: '12px', borderRight: '1px solid #e9ecef', fontWeight: '600' }}>
                    {movement.closing_stock.toFixed(2)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>
                  No stock movement data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {historyTotalPages > 1 && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginTop: '24px', 
          padding: '16px',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          backgroundColor: '#f8f9fa'
        }}>
          <div style={{ fontSize: '14px', color: '#495057' }}>
            Showing {historyStartIndex + 1} to {Math.min(historyEndIndex, filteredStockHistory.length)} of {filteredStockHistory.length} movements
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button 
              variant="secondary" 
              onClick={() => setHistoryCurrentPage(Math.max(1, historyCurrentPage - 1))}
              disabled={historyCurrentPage === 1}
            >
              Previous
            </Button>
            <span style={{ 
              padding: '8px 12px', 
              display: 'flex', 
              alignItems: 'center',
              fontSize: '14px',
              color: '#495057',
              fontWeight: '500'
            }}>
              Page {historyCurrentPage} of {historyTotalPages}
            </span>
            <Button 
              variant="secondary" 
              onClick={() => setHistoryCurrentPage(Math.min(historyTotalPages, historyCurrentPage + 1))}
              disabled={historyCurrentPage === historyTotalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <div style={{ 
        marginTop: '20px', 
        padding: '16px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '8px',
        border: '1px solid #e9ecef'
      }}>
        <p style={{ color: '#6c757d', fontSize: '14px', margin: '0', textAlign: 'center' }}>
          <strong>Note:</strong> Stock movement history shows the movement of stock for each financial year (April 1st to March 31st).
          Opening stock, incoming, and outgoing calculations are based on stock adjustment records.
        </p>
      </div>
    </div>
  )
}

