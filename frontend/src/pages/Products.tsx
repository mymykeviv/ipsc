import React, { useState, useEffect } from 'react'
import { useAuth } from '../modules/AuthContext'
import { createApiErrorHandler } from '../lib/apiUtils'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { SearchBar } from '../components/SearchBar'
import { apiGetProducts, apiCreateProduct, apiUpdateProduct, apiToggleProduct, apiAdjustStock, apiListParties, Party } from '../lib/api'

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
  gst_rate: number
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

export function Products() {
  const { forceLogout } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [vendors, setVendors] = useState<Party[]>([])
  const [loading, setLoading] = useState(true)
  
  // Create error handler that will automatically log out on 401 errors
  const handleApiError = createApiErrorHandler(forceLogout)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showStockModal, setShowStockModal] = useState(false)
  const [showStockHistoryModal, setShowStockHistoryModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
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
    product_type: 'Goods',
    category: '',
    
    // Price Details
    purchase_price: '',
    sales_price: '',
    gst_rate: '18',
    hsn_code: '',
    
    // Stock Details
    opening_stock: '0',
    
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
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      const [productsData, vendorsData] = await Promise.all([
        apiGetProducts(),
        apiListParties('vendor')
      ])
      setProducts(productsData)
      setVendors(vendorsData)
    } catch (error) {
      console.error('Failed to load data:', error)
      const errorMessage = handleApiError(error)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (field: keyof Product) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const filteredAndSortedProducts = products
    .filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.supplier && product.supplier.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]
      if (aValue === null) return 1
      if (bValue === null) return -1
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      }
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
      }
      return 0
    })

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedProducts.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const paginatedProducts = filteredAndSortedProducts.slice(startIndex, endIndex)

  const resetForm = () => {
    setFormData({
      // Product Details
      name: '',
      product_code: '',
      sku: '',
      unit: 'Pcs',
      supplier: '',
      description: '',
      product_type: 'Goods',
      category: '',
      
      // Price Details
      purchase_price: '',
      sales_price: '',
      gst_rate: '18',
      hsn_code: '',
      
      // Stock Details
      opening_stock: '0',
      
      // Other Details
      notes: ''
    })
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    
    try {
      // Validation
      if (!formData.name.trim()) {
        setError('Product name is required')
        return
      }
      if (!formData.name.match(/^[a-zA-Z0-9\s]+$/)) {
        setError('Name must be alphanumeric with spaces only')
        return
      }
      if (formData.name.length > 100) {
        setError('Name must be 100 characters or less')
        return
      }
      
      if (formData.description.length > 200) {
        setError('Description must be 200 characters or less')
        return
      }
      
      if (formData.sku && formData.sku.length > 50) {
        setError('SKU must be 50 characters or less')
        return
      }
      if (formData.sku && !formData.sku.match(/^[a-zA-Z0-9\s]+$/)) {
        setError('SKU must be alphanumeric with spaces only')
        return
      }
      
      if (formData.supplier && formData.supplier.length > 100) {
        setError('Supplier must be 100 characters or less')
        return
      }
      
      if (formData.category && formData.category.length > 100) {
        setError('Category must be 100 characters or less')
        return
      }
      
      if (formData.notes.length > 200) {
        setError('Notes must be 200 characters or less')
        return
      }
      
      if (formData.hsn_code.length > 10) {
        setError('HSN Code must be 10 characters or less')
        return
      }
      
      // Price validations
      const salesPrice = parseFloat(formData.sales_price)
      if (!formData.sales_price || salesPrice < 0 || salesPrice > 999999.99) {
        setError('Sales price must be between 0 and 999999.99')
        return
      }
      
      if (formData.purchase_price) {
        const purchasePrice = parseFloat(formData.purchase_price)
        if (purchasePrice < 0 || purchasePrice > 999999.99) {
          setError('Purchase price must be between 0 and 999999.99')
          return
        }
      }
      
      // Stock validation
      const stock = parseInt(formData.opening_stock)
      if (stock < 0 || stock > 999999) {
        setError('Opening stock must be between 0 and 999999 (integer only)')
        return
      }
      
      if (!formData.unit) {
        setError('Unit is required')
        return
      }
      
      // HSN is now optional
      
      const payload = {
        name: formData.name,
        description: formData.description,
        item_type: formData.product_type, // Map product_type to item_type
        sales_price: parseFloat(formData.sales_price),
        purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : null,
        stock: parseInt(formData.opening_stock) || 0,
        sku: formData.sku || null,
        unit: formData.unit,
        supplier: formData.supplier || null,
        category: formData.category || null,
        notes: formData.notes || null,
        hsn: formData.hsn_code || null, // Map hsn_code to hsn
        gst_rate: parseFloat(formData.gst_rate)
      }
      
      await apiCreateProduct(payload)
      setShowAddModal(false)
      resetForm()
      loadProducts()
    } catch (error: any) {
      console.error('Failed to create product:', error)
      
      // Extract detailed error information
      let errorMessage = 'Failed to create product. Please try again.'
      
      if (error.message) {
        errorMessage = error.message
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid data provided. Please check your input.'
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please login again.'
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to create products.'
      } else if (error.response?.status === 409) {
        errorMessage = 'A product with this SKU already exists.'
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.'
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProduct) return
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        item_type: formData.product_type, // Map product_type back to item_type
        sales_price: parseFloat(formData.sales_price),
        purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : null,
        stock: parseFloat(formData.opening_stock), // Map opening_stock back to stock
        sku: formData.sku,
        unit: formData.unit,
        supplier: formData.supplier,
        category: formData.category,
        notes: formData.notes,
        hsn: formData.hsn_code, // Map hsn_code back to hsn
        gst_rate: parseFloat(formData.gst_rate)
      }
      await apiUpdateProduct(editingProduct.id, payload)
      setShowEditModal(false)
      setEditingProduct(null)
      resetForm()
      loadProducts()
    } catch (error) {
      console.error('Failed to update product:', error)
    }
  }

  const handleToggleProduct = async (productId: number) => {
    try {
      await apiToggleProduct(productId)
      loadProducts()
    } catch (error) {
      console.error('Failed to toggle product:', error)
    }
  }

  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct) return
    
    try {
      const quantity = parseInt(stockFormData.quantity)
      if (isNaN(quantity) || quantity < 0 || quantity > 999999) {
        setError('Please enter a valid quantity between 0 and 999999')
        return
      }

      await apiAdjustStock(
        selectedProduct.id,
        quantity,
        stockFormData.adjustmentType,
        stockFormData.date_of_receipt,
        stockFormData.reference_bill_number || undefined,
        stockFormData.supplier || undefined,
        stockFormData.category || undefined,
        stockFormData.notes || undefined
      )
      
      setShowStockModal(false)
      setStockFormData({
        quantity: '',
        adjustmentType: 'add',
        date_of_receipt: new Date().toISOString().split('T')[0],
        reference_bill_number: '',
        supplier: '',
        category: '',
        notes: ''
      })
      loadProducts()
    } catch (error: any) {
      setError(error.message || 'Failed to adjust stock')
    }
  }

  const exportToCSV = () => {
    const headers = ['Name', 'Description', 'Sales Price', 'Purchase Price', 'Stock', 'SKU', 'Unit', 'Supplier', 'Category', 'HSN', 'GST Rate', 'Status']
    const csvData = filteredAndSortedProducts.map(product => [
      product.name,
      product.description || '',
      product.sales_price,
      product.purchase_price || '',
      product.stock,
      product.sku || '',
      product.unit,
      product.supplier || '',
      product.category || '',
      product.hsn,
      product.gst_rate,
      product.is_active ? 'Active' : 'Inactive'
    ])
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `products_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const openEditModal = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      // Product Details
      name: product.name,
      product_code: product.sku || '', // Map SKU to product_code for now
      sku: product.sku || '',
      unit: product.unit,
      supplier: product.supplier || '',
      description: product.description || '',
      product_type: product.item_type || 'Goods', // Map item_type to product_type
      category: product.category || '',
      
      // Price Details
      purchase_price: product.purchase_price?.toString() || '',
      sales_price: product.sales_price.toString(),
      gst_rate: product.gst_rate.toString(),
      hsn_code: product.hsn || '', // Map hsn to hsn_code
      
      // Stock Details
      opening_stock: product.stock.toString(), // Map stock to opening_stock
      
      // Other Details
      notes: product.notes || ''
    })
    setShowEditModal(true)
  }

  const SortableHeader = ({ field, children }: { field: keyof Product, children: React.ReactNode }) => (
    <th 
      onClick={() => handleSort(field)}
      style={{ cursor: 'pointer', userSelect: 'none' }}
    >
      {children} {sortField === field && (sortDirection === 'asc' ? '↑' : '↓')}
    </th>
  )

  if (loading) {
    return (
      <div className="content">
        <Card>
          <h1>Products</h1>
          <p>Loading...</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="content">
      {/* Debug info */}
      {showStockHistoryModal && (
        <div style={{ 
          position: 'fixed', 
          top: '10px', 
          right: '10px', 
          backgroundColor: 'red', 
          color: 'white', 
          padding: '10px', 
          zIndex: 10000,
          fontSize: '12px'
        }}>
          Modal State: {showStockHistoryModal ? 'OPEN' : 'CLOSED'}
        </div>
      )}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1>Products</h1>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button variant="secondary" onClick={exportToCSV}>
              Export CSV
            </Button>
            <Button variant="primary" onClick={() => setShowAddModal(true)}>
              Add Product
            </Button>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search products by name, SKU, category, description, or supplier..."
          />
        </div>

        <table>
          <thead>
            <tr>
              <SortableHeader field="name">Name</SortableHeader>
              <SortableHeader field="sku">SKU</SortableHeader>
              <SortableHeader field="category">Category</SortableHeader>
              <SortableHeader field="unit">Unit</SortableHeader>
              <SortableHeader field="stock">Stock</SortableHeader>
              <SortableHeader field="sales_price">Sales Price</SortableHeader>
              <SortableHeader field="gst_rate">GST Rate</SortableHeader>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
                      <tbody>
              {paginatedProducts.map(product => (
              <tr key={product.id} style={{ opacity: product.is_active ? 1 : 0.6 }}>
                <td>{product.name}</td>
                <td>{product.sku || '-'}</td>
                <td>{product.category || '-'}</td>
                <td>{product.unit}</td>
                <td>{product.stock}</td>
                <td>₹{product.sales_price.toFixed(2)}</td>
                <td>{product.gst_rate}%</td>
                <td>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    fontSize: '14px',
                    backgroundColor: product.is_active ? '#d4edda' : '#f8d7da',
                    color: product.is_active ? '#155724' : '#721c24'
                  }}>
                    {product.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button 
                      variant="secondary" 
                      onClick={() => openEditModal(product)}
                      style={{ fontSize: '14px', padding: '4px 8px' }}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="secondary"
                      onClick={() => {
                        setSelectedProduct(product)
                        setShowStockModal(true)
                      }}
                      style={{ fontSize: '14px', padding: '4px 8px' }}
                    >
                      Stock
                    </Button>
                    <Button 
                      variant="secondary"
                      onClick={() => {
                        console.log('Opening stock history for product:', product.name)
                        setSelectedProduct(product)
                        setShowStockHistoryModal(true)
                      }}
                      style={{ fontSize: '14px', padding: '4px 8px' }}
                    >
                      History
                    </Button>
                    <Button 
                      variant="secondary" 
                      onClick={() => handleToggleProduct(product.id)}
                      style={{ fontSize: '14px', padding: '4px 8px' }}
                    >
                      {product.is_active ? 'Disable' : 'Enable'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredAndSortedProducts.length === 0 && (
          <p style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}>
            {searchTerm ? 'No products found matching your search.' : 'No products available.'}
          </p>
        )}

        {/* Pagination Controls */}
        {filteredAndSortedProducts.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', padding: '16px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span>Rows per page:</span>
              <select 
                value={rowsPerPage} 
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
                style={{ padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
              <span>
                Showing {startIndex + 1} to {Math.min(endIndex, filteredAndSortedProducts.length)} of {filteredAndSortedProducts.length} products
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button 
                variant="secondary" 
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span style={{ padding: '8px 12px', display: 'flex', alignItems: 'center' }}>
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
      </Card>

      {/* Add Product Modal */}
      {showAddModal && (
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
          <Card style={{ width: '80%', height: '80%', maxWidth: '1400px', maxHeight: '80vh', overflow: 'auto', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>Add New Product</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666',
                  padding: '4px 8px',
                  borderRadius: '4px'
                }}
                onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#f0f0f0'}
                onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = 'transparent'}
              >
                ×
              </button>
            </div>
            {error && (
              <div style={{ 
                color: 'crimson', 
                padding: '8px', 
                backgroundColor: '#ffe6e6', 
                borderRadius: '4px', 
                border: '1px solid #ff9999',
                marginBottom: '16px'
              }}>
                {error}
              </div>
            )}
            <form onSubmit={handleAddProduct}>
              {/* Product Details Section */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ marginBottom: '16px', color: '#333', borderBottom: '2px solid #007bff', paddingBottom: '8px' }}>
                  Product Details
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label>Product Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                      maxLength={100}
                      placeholder="Enter product name (max 100 characters)"
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    />
                  </div>
                  <div>
                    <label>Product Code *</label>
                    <input
                      type="text"
                      value={formData.product_code}
                      onChange={(e) => setFormData({...formData, product_code: e.target.value})}
                      required
                      maxLength={20}
                      placeholder="Enter product code (max 20 characters)"
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    />
                  </div>
                  <div>
                    <label>SKU</label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({...formData, sku: e.target.value})}
                      placeholder="Enter SKU"
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    />
                  </div>
                  <div>
                    <label>Unit of Measure *</label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({...formData, unit: e.target.value})}
                      required
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    >
                      <option value="">Select Unit</option>
                      <option value="NOS">NOS</option>
                      <option value="KG">KG</option>
                      <option value="LITRE">LITRE</option>
                      <option value="METER">METER</option>
                      <option value="BUCKET">BUCKET</option>
                      <option value="PCS">PCS</option>
                      <option value="BOX">BOX</option>
                      <option value="SET">SET</option>
                    </select>
                  </div>
                  <div>
                    <label>Product Supplier</label>
                    <input
                      type="text"
                      value={formData.supplier}
                      onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                      placeholder="Search and select supplier..."
                      list="product-supplier-list"
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    />
                    <datalist id="product-supplier-list">
                      {vendors.map(vendor => (
                        <option key={vendor.id} value={vendor.name} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label>Product Type *</label>
                    <select
                      value={formData.product_type}
                      onChange={(e) => setFormData({...formData, product_type: e.target.value})}
                      required
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    >
                      <option value="Goods">Goods (default)</option>
                      <option value="Tradable">Tradable</option>
                      <option value="Consumable">Consumable</option>
                      <option value="Service">Service</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label>Product Category *</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      required
                      placeholder="Enter category"
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label>Product Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={3}
                      maxLength={200}
                      placeholder="Enter product description (max 200 characters)"
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    />
                  </div>
                </div>
              </div>

              {/* Price Details Section */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ marginBottom: '16px', color: '#333', borderBottom: '2px solid #28a745', paddingBottom: '8px' }}>
                  Price Details
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label>Purchase Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.purchase_price}
                      onChange={(e) => setFormData({...formData, purchase_price: e.target.value})}
                      placeholder="Enter purchase price"
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    />
                  </div>
                  <div>
                    <label>Selling Price *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.sales_price}
                      onChange={(e) => setFormData({...formData, sales_price: e.target.value})}
                      required
                      placeholder="Enter selling price"
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    />
                  </div>
                  <div>
                    <label>GST Rate *</label>
                    <select
                      value={formData.gst_rate}
                      onChange={(e) => setFormData({...formData, gst_rate: e.target.value})}
                      required
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    >
                      <option value="">Select GST Rate</option>
                      <option value="0">0%</option>
                      <option value="5">5%</option>
                      <option value="12">12%</option>
                      <option value="18">18% (default)</option>
                      <option value="28">28%</option>
                    </select>
                  </div>
                  <div>
                    <label>HSN Code *</label>
                    <input
                      type="text"
                      value={formData.hsn_code}
                      onChange={(e) => setFormData({...formData, hsn_code: e.target.value})}
                      required
                      maxLength={6}
                      minLength={4}
                      placeholder="Enter HSN code (4 or 6 digits)"
                      pattern="[0-9]{4}|[0-9]{6}"
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    />
                  </div>
                </div>
              </div>

              {/* Stock Details Section */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ marginBottom: '16px', color: '#333', borderBottom: '2px solid #ffc107', paddingBottom: '8px' }}>
                  Stock Details
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                  <div>
                    <label>Opening Stock</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.opening_stock}
                      onChange={(e) => setFormData({...formData, opening_stock: e.target.value})}
                      placeholder="Enter opening stock (default: 0)"
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    />
                  </div>
                </div>
              </div>

              {/* Other Details Section */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ marginBottom: '16px', color: '#333', borderBottom: '2px solid #6c757d', paddingBottom: '8px' }}>
                  Other Details
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                  <div>
                    <label>Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      rows={3}
                      maxLength={200}
                      placeholder="Enter notes (max 200 characters)"
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    />
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary" 
                  disabled={
                    loading || 
                    !formData.name.trim() || 
                    !formData.product_code.trim() ||
                    !formData.sales_price || 
                    !formData.unit ||
                    !formData.product_type ||
                    !formData.category.trim() ||
                    !formData.gst_rate ||
                    !formData.hsn_code ||
                    parseFloat(formData.sales_price || '0') <= 0 ||
                    (formData.purchase_price && parseFloat(formData.purchase_price) < 0) ||
                    (formData.opening_stock && parseInt(formData.opening_stock || '0') < 0) ||
                    (formData.hsn_code && !/^[0-9]{4}$|^[0-9]{6}$/.test(formData.hsn_code))
                  }
                >
                  {loading ? 'Adding...' : 'Add Product'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && editingProduct && (
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
          <Card style={{ width: '80%', height: '80%', maxWidth: '1400px', maxHeight: '80vh', overflow: 'auto' }}>
            <h2>Edit Product</h2>
            <form onSubmit={handleEditProduct}>
              {/* Product Details Section */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ marginBottom: '16px', color: '#333', borderBottom: '2px solid #007bff', paddingBottom: '8px' }}>
                  Product Details
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label>Product Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                      maxLength={100}
                      placeholder="Enter product name (max 100 characters)"
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    />
                  </div>
                  <div>
                    <label>Product Code *</label>
                    <input
                      type="text"
                      value={formData.product_code}
                      onChange={(e) => setFormData({...formData, product_code: e.target.value})}
                      required
                      maxLength={20}
                      placeholder="Enter product code (max 20 characters)"
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    />
                  </div>
                  <div>
                    <label>SKU</label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({...formData, sku: e.target.value})}
                      placeholder="Enter SKU"
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    />
                  </div>
                  <div>
                    <label>Unit of Measure *</label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({...formData, unit: e.target.value})}
                      required
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    >
                      <option value="">Select Unit</option>
                      <option value="NOS">NOS</option>
                      <option value="KG">KG</option>
                      <option value="LITRE">LITRE</option>
                      <option value="METER">METER</option>
                      <option value="BUCKET">BUCKET</option>
                      <option value="PCS">PCS</option>
                      <option value="BOX">BOX</option>
                      <option value="SET">SET</option>
                    </select>
                  </div>
                  <div>
                    <label>Product Supplier</label>
                    <input
                      type="text"
                      value={formData.supplier}
                      onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                      placeholder="Search and select supplier..."
                      list="edit-product-supplier-list"
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    />
                    <datalist id="edit-product-supplier-list">
                      {vendors.map(vendor => (
                        <option key={vendor.id} value={vendor.name} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label>Product Type *</label>
                    <select
                      value={formData.product_type}
                      onChange={(e) => setFormData({...formData, product_type: e.target.value})}
                      required
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    >
                      <option value="Goods">Goods (default)</option>
                      <option value="Tradable">Tradable</option>
                      <option value="Consumable">Consumable</option>
                      <option value="Service">Service</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label>Product Category *</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      required
                      placeholder="Enter category"
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label>Product Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={3}
                      maxLength={200}
                      placeholder="Enter product description (max 200 characters)"
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    />
                  </div>
                </div>
              </div>

              {/* Price Details Section */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ marginBottom: '16px', color: '#333', borderBottom: '2px solid #28a745', paddingBottom: '8px' }}>
                  Price Details
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label>Purchase Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.purchase_price}
                      onChange={(e) => setFormData({...formData, purchase_price: e.target.value})}
                      placeholder="Enter purchase price"
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    />
                  </div>
                  <div>
                    <label>Selling Price *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.sales_price}
                      onChange={(e) => setFormData({...formData, sales_price: e.target.value})}
                      required
                      placeholder="Enter selling price"
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    />
                  </div>
                  <div>
                    <label>GST Rate *</label>
                    <select
                      value={formData.gst_rate}
                      onChange={(e) => setFormData({...formData, gst_rate: e.target.value})}
                      required
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    >
                      <option value="">Select GST Rate</option>
                      <option value="0">0%</option>
                      <option value="5">5%</option>
                      <option value="12">12%</option>
                      <option value="18">18% (default)</option>
                      <option value="28">28%</option>
                    </select>
                  </div>
                  <div>
                    <label>HSN Code *</label>
                    <input
                      type="text"
                      value={formData.hsn_code}
                      onChange={(e) => setFormData({...formData, hsn_code: e.target.value})}
                      required
                      maxLength={6}
                      minLength={4}
                      placeholder="Enter HSN code (4 or 6 digits)"
                      pattern="[0-9]{4}|[0-9]{6}"
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    />
                  </div>
                </div>
              </div>

              {/* Stock Details Section */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ marginBottom: '16px', color: '#333', borderBottom: '2px solid #ffc107', paddingBottom: '8px' }}>
                  Stock Details
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                  <div>
                    <label>Opening Stock</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.opening_stock}
                      onChange={(e) => setFormData({...formData, opening_stock: e.target.value})}
                      placeholder="Enter opening stock (default: 0)"
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    />
                  </div>
                </div>
              </div>

              {/* Other Details Section */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ marginBottom: '16px', color: '#333', borderBottom: '2px solid #6c757d', paddingBottom: '8px' }}>
                  Other Details
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                  <div>
                    <label>Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      rows={3}
                      maxLength={200}
                      placeholder="Enter notes (max 200 characters)"
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    />
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <Button type="button" variant="secondary" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary"
                  disabled={
                    loading || 
                    !formData.name.trim() || 
                    !formData.product_code.trim() ||
                    !formData.sales_price || 
                    !formData.unit ||
                    !formData.product_type ||
                    !formData.category.trim() ||
                    !formData.gst_rate ||
                    !formData.hsn_code ||
                    parseFloat(formData.sales_price || '0') <= 0 ||
                    (formData.purchase_price && parseFloat(formData.purchase_price) < 0) ||
                    (formData.opening_stock && parseInt(formData.opening_stock || '0') < 0) ||
                    (formData.hsn_code && !/^[0-9]{4}$|^[0-9]{6}$/.test(formData.hsn_code))
                  }
                >
                  {loading ? 'Updating...' : 'Update Product'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Stock Adjustment Modal */}
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
          <Card style={{ width: '80%', height: '80%', maxWidth: '1200px', maxHeight: '80vh', overflow: 'auto' }}>
            <h2>Stock Adjustment - {selectedProduct.name}</h2>
            <form onSubmit={handleStockAdjustment}>
              <div style={{ display: 'grid', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label>Product</label>
                  <input
                    type="text"
                    value={selectedProduct.name}
                    disabled
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', backgroundColor: '#f5f5f5' }}
                  />
                </div>
                <div>
                  <label>Current Stock</label>
                  <input
                    type="text"
                    value={selectedProduct.stock}
                    disabled
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', backgroundColor: '#f5f5f5' }}
                  />
                </div>
                <div>
                  <label>Adjustment Type *</label>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <button
                      type="button"
                      onClick={() => setStockFormData({...stockFormData, adjustmentType: 'add'})}
                      style={{
                        padding: '8px 16px',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        backgroundColor: stockFormData.adjustmentType === 'add' ? '#007bff' : 'white',
                        color: stockFormData.adjustmentType === 'add' ? 'white' : '#333',
                        cursor: 'pointer',
                        flex: 1
                      }}
                    >
                      Incoming Stock
                    </button>
                    <button
                      type="button"
                      onClick={() => setStockFormData({...stockFormData, adjustmentType: 'reduce'})}
                      style={{
                        padding: '8px 16px',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        backgroundColor: stockFormData.adjustmentType === 'reduce' ? '#007bff' : 'white',
                        color: stockFormData.adjustmentType === 'reduce' ? 'white' : '#333',
                        cursor: 'pointer',
                        flex: 1
                      }}
                    >
                      Outgoing Stock
                    </button>
                  </div>
                </div>
                <div>
                  <label>Quantity *</label>
                  <input
                    type="number"
                    value={stockFormData.quantity}
                    onChange={(e) => setStockFormData({...stockFormData, quantity: e.target.value})}
                    required
                    min="0"
                    max="999999"
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                  />
                </div>
                {stockFormData.adjustmentType === 'add' && (
                  <div>
                    <label>Supplier *</label>
                    <input
                      type="text"
                      value={stockFormData.supplier}
                      onChange={(e) => setStockFormData({...stockFormData, supplier: e.target.value})}
                      placeholder="Search and select supplier..."
                      list="supplier-list"
                      required
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    />
                    <datalist id="supplier-list">
                      {vendors.map(vendor => (
                        <option key={vendor.id} value={vendor.name} />
                      ))}
                    </datalist>
                  </div>
                )}
                {stockFormData.adjustmentType === 'add' && (
                  <div>
                    <label>Category</label>
                    <input
                      type="text"
                      value={stockFormData.category}
                      onChange={(e) => setStockFormData({...stockFormData, category: e.target.value})}
                      placeholder="Enter category (optional)"
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    />
                  </div>
                )}
                <div>
                  <label>{stockFormData.adjustmentType === 'add' ? 'Date of Receipt' : 'Date of Issue'} *</label>
                  <input
                    type="date"
                    value={stockFormData.date_of_receipt}
                    onChange={(e) => setStockFormData({...stockFormData, date_of_receipt: e.target.value})}
                    required
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                  />
                </div>
                {stockFormData.adjustmentType === 'add' && (
                  <div>
                    <label>Reference Bill Number</label>
                    <input
                      type="text"
                      value={stockFormData.reference_bill_number}
                      onChange={(e) => setStockFormData({...stockFormData, reference_bill_number: e.target.value})}
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    />
                  </div>
                )}
                <div>
                  <label>Notes</label>
                  <textarea
                    value={stockFormData.notes}
                    onChange={(e) => setStockFormData({...stockFormData, notes: e.target.value})}
                    rows={3}
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <Button type="button" variant="secondary" onClick={() => setShowStockModal(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary"
                  disabled={
                    !stockFormData.quantity || 
                    !stockFormData.date_of_receipt ||
                    parseFloat(stockFormData.quantity || '0') <= 0 ||
                    parseFloat(stockFormData.quantity || '0') > 999999 ||
                    (stockFormData.adjustmentType === 'add' && !stockFormData.supplier) ||
                    (stockFormData.adjustmentType === 'add' && stockFormData.supplier.trim() === '')
                  }
                >
                  Apply Adjustment
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Stock History Modal */}
      {showStockHistoryModal && selectedProduct && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
          onClick={() => setShowStockHistoryModal(false)}
        >
          <div 
            style={{ 
              width: '80%', 
              height: '80%', 
              maxWidth: '1200px', 
              maxHeight: '80vh', 
              overflow: 'auto',
              backgroundColor: 'white',
              borderRadius: 'var(--radius)',
              padding: '24px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>Stock History - {selectedProduct.name}</h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button onClick={() => setShowStockHistoryModal(false)} variant="secondary">
                  ← Back to Products
                </Button>
                <Button onClick={() => setShowStockHistoryModal(false)} variant="secondary">×</Button>
              </div>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label>Current Stock</label>
                  <input
                    type="text"
                    value={selectedProduct.stock}
                    disabled
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', backgroundColor: '#f5f5f5' }}
                  />
                </div>
                <div>
                  <label>Product SKU</label>
                  <input
                    type="text"
                    value={selectedProduct.sku || 'N/A'}
                    disabled
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', backgroundColor: '#f5f5f5' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9f9f9' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Date</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Type</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid var(--border)' }}>Quantity</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid var(--border)' }}>Balance</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Reference</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '12px' }}>{new Date().toLocaleDateString()}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: 'var(--radius)',
                        fontSize: '12px',
                        backgroundColor: '#d4edda',
                        color: '#155724'
                      }}>
                        Opening Stock
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{selectedProduct.stock}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{selectedProduct.stock}</td>
                    <td style={{ padding: '12px' }}>-</td>
                    <td style={{ padding: '12px' }}>Initial stock</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '16px', textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
              Stock history will be populated as adjustments are made
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

