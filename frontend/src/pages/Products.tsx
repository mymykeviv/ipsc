import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../modules/AuthContext'
import { createApiErrorHandler } from '../lib/apiUtils'
import { Button } from '../components/Button'
import { SearchBar } from '../components/SearchBar'
import { ErrorMessage } from '../components/ErrorMessage'
import { apiGetProducts, apiCreateProduct, apiUpdateProduct, apiToggleProduct, apiAdjustStock, apiListParties, Party } from '../lib/api'
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
    if (mode === 'manage') {
    loadProducts()
      loadVendors()
    } else if (mode === 'edit' && id) {
      loadProduct(parseInt(id))
      loadVendors()
    } else if (mode === 'add') {
      loadVendors()
      setLoading(false)
    }
  }, [mode, id])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const data = await apiGetProducts()
      setProducts(data)
    } catch (error: any) {
      handleApiError(error)
      setError('Failed to load products')
    } finally {
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
          gst_rate: product.gst_rate.toString(),
          hsn_code: product.hsn || '',
          opening_stock: product.stock.toString(),
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
      const data = await apiListParties()
      const vendorData = data.filter(party => party.type === 'vendor')
      setVendors(vendorData)
    } catch (error: any) {
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
      product_type: 'Goods',
      category: '',
      purchase_price: '',
      sales_price: '',
      gst_rate: '18',
      hsn_code: '',
      opening_stock: '',
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
        gst_rate: parseFloat(formData.gst_rate)
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
        gst_rate: parseFloat(formData.gst_rate)
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
                {/* First Row */}
                <div style={{ ...formStyles.formGroup, gridColumn: 'span 2' }}>
                  <label style={formStyles.label}>Purchase Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.purchase_price}
                    onChange={(e) => setFormData(prev => ({ ...prev, purchase_price: e.target.value }))}
                    style={formStyles.input}
                  />
                </div>
                <div style={{ ...formStyles.formGroup, gridColumn: 'span 2' }}>
                  <label style={formStyles.label}>Selling Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.sales_price}
                    onChange={(e) => setFormData(prev => ({ ...prev, sales_price: e.target.value }))}
                    style={formStyles.input}
                    required
                  />
                </div>
                
                {/* Second Row */}
                <div style={{ ...formStyles.formGroup, gridColumn: 'span 2' }}>
                  <label style={formStyles.label}>HSN Code *</label>
                  <input
                    type="text"
                    value={formData.hsn_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, hsn_code: e.target.value }))}
                    style={formStyles.input}
                    required
                  />
                </div>
                <div style={{ ...formStyles.formGroup, gridColumn: 'span 2' }}>
                  <label style={formStyles.label}>GST Rate *</label>
                  <select
                    value={formData.gst_rate}
                    onChange={(e) => setFormData(prev => ({ ...prev, gst_rate: e.target.value }))}
                    style={formStyles.select}
                    required
                  >
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
      </div>
    )
  }

  // Stock Adjustment Mode
  if (mode === 'stock-adjustment') {
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
          parseFloat(stockFormData.quantity),
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
        }
      } catch (err) {
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
            onClick={() => navigate('/products')}
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
              onClick={() => navigate('/products')}
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

  // Stock History Mode
  if (mode === 'stock-history') {
    const [selectedProductId, setSelectedProductId] = useState<string>('')
    const [stockHistory, setStockHistory] = useState<any[]>([])
    const [historyLoading, setHistoryLoading] = useState(false)

    const loadStockHistory = async () => {
      if (!selectedProductId) return
      
      try {
        setHistoryLoading(true)
        setError(null)
        // TODO: Implement stock history API call
        // For now, show a placeholder message
        setStockHistory([])
      } catch (err) {
        console.error('Failed to load stock history:', err)
        const errorMessage = handleApiError(err)
        setError(errorMessage)
      } finally {
        setHistoryLoading(false)
      }
    }

    useEffect(() => {
      if (selectedProductId) {
        loadStockHistory()
      }
    }, [selectedProductId])

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
            Stock History
          </h1>
          <Button 
            onClick={() => navigate('/products')}
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

        {/* Product Selection */}
        <div style={{ marginBottom: '24px' }}>
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>Select Product</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              style={formStyles.select}
            >
              <option value="">Choose a product to view stock history...</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} (Current Stock: {product.stock})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stock History Display */}
        {selectedProductId && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ marginBottom: '16px', color: '#333', borderBottom: '2px solid #007bff', paddingBottom: '8px' }}>
              Stock History
            </h3>
            
            {historyLoading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div>Loading stock history...</div>
              </div>
            ) : stockHistory.length > 0 ? (
              <div style={{ 
                backgroundColor: '#fff',
                border: '1px solid #e9ecef',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef', fontSize: '14px', fontWeight: '600' }}>
                        Date
    </th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef', fontSize: '14px', fontWeight: '600' }}>
                        Type
                      </th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef', fontSize: '14px', fontWeight: '600' }}>
                        Quantity
                      </th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef', fontSize: '14px', fontWeight: '600' }}>
                        Reference
                      </th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef', fontSize: '14px', fontWeight: '600' }}>
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockHistory.map((entry, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #f8f9fa' }}>
                        <td style={{ padding: '12px', fontSize: '14px' }}>
                          {entry.date}
                        </td>
                        <td style={{ padding: '12px', fontSize: '14px' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500',
                            backgroundColor: entry.type === 'add' ? '#d4edda' : '#f8d7da',
                            color: entry.type === 'add' ? '#155724' : '#721c24'
                          }}>
                            {entry.type === 'add' ? 'Incoming' : 'Outgoing'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', fontSize: '14px' }}>
                          {entry.quantity}
                        </td>
                        <td style={{ padding: '12px', fontSize: '14px' }}>
                          {entry.reference || '-'}
                        </td>
                        <td style={{ padding: '12px', fontSize: '14px' }}>
                          {entry.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                <p style={{ color: '#6c757d', fontSize: '16px', textAlign: 'center' }}>
                  No stock history available for this product.
                </p>
                <p style={{ color: '#6c757d', fontSize: '14px', textAlign: 'center', marginTop: '8px' }}>
                  Stock history will be displayed here once stock adjustments are made.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // Manage Products Mode
  if (loading) {
    return (
      <div style={{ padding: '20px' }}>
        <div>Loading...</div>
      </div>
    )
  }

  // Filter and sort products
  const filteredProducts = products.filter(product => {
    const searchLower = searchTerm.toLowerCase()
  return (
      product.name.toLowerCase().includes(searchLower) ||
      (product.sku && product.sku.toLowerCase().includes(searchLower)) ||
      (product.category && product.category.toLowerCase().includes(searchLower)) ||
      (product.description && product.description.toLowerCase().includes(searchLower)) ||
      (product.supplier && product.supplier.toLowerCase().includes(searchLower))
    )
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

      <div style={{ marginBottom: '24px' }}>
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search products by name, SKU, category, description, or supplier..."
          />
        </div>

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

