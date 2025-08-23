import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../modules/AuthContext'
import { createApiErrorHandler } from '../lib/apiUtils'
import { Button } from '../components/Button'
import { SearchBar } from '../components/SearchBar'
import { ErrorMessage } from '../components/ErrorMessage'
import { DateFilter, DateRange } from '../components/DateFilter'
import { FilterDropdown } from '../components/FilterDropdown'
import { EnhancedFilterBar } from '../components/EnhancedFilterBar'
import { EnhancedFilterDropdown } from '../components/EnhancedFilterDropdown'
import { ActionButtons, ActionButtonSets } from '../components/ActionButtons'
import { EnhancedHeader, HeaderPatterns } from '../components/EnhancedHeader'
import { apiGetProducts, apiCreateProduct, apiUpdateProduct, apiToggleProduct, apiAdjustStock, apiListParties, Party, apiGetStockMovementHistory, StockMovement, ProductFilters } from '../lib/api'
import { StockHistoryForm } from '../components/StockHistoryForm'
import { formStyles, getSectionHeaderColor } from '../utils/formStyles'
import { useFilterNavigation } from '../utils/filterNavigation'
import { useFilterReset } from '../hooks/useFilterReset'
import { getDefaultFilterState } from '../config/defaultFilterStates'

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
  adjustmentType: 'add' | 'reduce' | 'adjust'
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
  const { token, forceLogout } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [vendors, setVendors] = useState<Party[]>([])
  const [loading, setLoading] = useState(true)
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null)
  
  // Create error handler that will automatically log out on 401 errors
  const handleApiError = createApiErrorHandler({ onUnauthorized: forceLogout })
  const [showStockModal, setShowStockModal] = useState(false)
  const [showStockHistoryModal, setShowStockHistoryModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Enhanced Filter System - Unified State Management
  const defaultState = getDefaultFilterState('products') as {
    searchTerm: string
    statusFilter: string
    categoryFilter: string
    itemTypeFilter: string
    gstRateFilter: string
    stockLevelFilter: string
    supplierFilter: string
    priceRangeFilter: string
    dateFilter: DateRange
  }
  const { getFiltersFromURL, updateURLWithFilters, clearURLFilters } = useFilterNavigation(defaultState)
  const { resetAllFilters, getActiveFilterCount } = useFilterReset({
    pageName: 'products',
    onReset: (newState) => {
      // Update all filter states
      setSearchTerm(newState.searchTerm)
      setStatusFilter(newState.statusFilter)
      setCategoryFilter(newState.categoryFilter)
      setItemTypeFilter(newState.itemTypeFilter)
      setGstRateFilter(newState.gstRateFilter)
      setStockLevelFilter(newState.stockLevelFilter)
      setSupplierFilter(newState.supplierFilter)
      setPriceRangeFilter(newState.priceRangeFilter)
      setDateFilter(newState.dateFilter)
    }
  })

  // Filter state with URL integration
  const [searchTerm, setSearchTerm] = useState<string>(defaultState.searchTerm)
  const [statusFilter, setStatusFilter] = useState<string>(defaultState.statusFilter)
  const [categoryFilter, setCategoryFilter] = useState<string>(defaultState.categoryFilter)
  const [itemTypeFilter, setItemTypeFilter] = useState<string>(defaultState.itemTypeFilter)
  const [gstRateFilter, setGstRateFilter] = useState<string>(defaultState.gstRateFilter)
  const [stockLevelFilter, setStockLevelFilter] = useState<string>(defaultState.stockLevelFilter)
  const [supplierFilter, setSupplierFilter] = useState<string>(defaultState.supplierFilter)
  const [priceRangeFilter, setPriceRangeFilter] = useState<string>(defaultState.priceRangeFilter)
  const [dateFilter, setDateFilter] = useState<DateRange>(defaultState.dateFilter)
  const [sortField, setSortField] = useState<keyof Product>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(25)

  // URL Parameter Integration - Apply filters from URL on component mount
  useEffect(() => {
    if (mode === 'manage') {
      const urlFilters = getFiltersFromURL()
      
      // Apply URL filters to state
      if (urlFilters.searchTerm) setSearchTerm(urlFilters.searchTerm)
      if (urlFilters.statusFilter) setStatusFilter(urlFilters.statusFilter)
      if (urlFilters.categoryFilter) setCategoryFilter(urlFilters.categoryFilter)
      if (urlFilters.itemTypeFilter) setItemTypeFilter(urlFilters.itemTypeFilter)
      if (urlFilters.gstRateFilter) setGstRateFilter(urlFilters.gstRateFilter)
      if (urlFilters.stockLevelFilter) setStockLevelFilter(urlFilters.stockLevelFilter)
      if (urlFilters.supplierFilter) setSupplierFilter(urlFilters.supplierFilter)
      if (urlFilters.priceRangeFilter) setPriceRangeFilter(urlFilters.priceRangeFilter)
      if (urlFilters.dateFilter) setDateFilter(urlFilters.dateFilter)
    }
  }, [mode, getFiltersFromURL])

  // Update URL when filters change
  const updateFiltersAndURL = useCallback((newFilters: Partial<typeof defaultState>) => {
    const currentFilters = {
      searchTerm,
      statusFilter,
      categoryFilter,
      itemTypeFilter,
      gstRateFilter,
      stockLevelFilter,
      supplierFilter,
      priceRangeFilter,
      dateFilter
    }
    
    const updatedFilters = { ...currentFilters, ...newFilters }
    updateURLWithFilters(updatedFilters)
  }, [searchTerm, statusFilter, categoryFilter, itemTypeFilter, gstRateFilter, 
      stockLevelFilter, supplierFilter, priceRangeFilter, dateFilter, updateURLWithFilters])

  // Enhanced filter setters with URL integration
  const setSearchTermWithURL = useCallback((value: string) => {
    setSearchTerm(value)
    updateFiltersAndURL({ searchTerm: value })
  }, [updateFiltersAndURL])

  const setStatusFilterWithURL = useCallback((value: string) => {
    setStatusFilter(value)
    updateFiltersAndURL({ statusFilter: value })
  }, [updateFiltersAndURL])

  const setCategoryFilterWithURL = useCallback((value: string) => {
    setCategoryFilter(value)
    updateFiltersAndURL({ categoryFilter: value })
  }, [updateFiltersAndURL])

  const setItemTypeFilterWithURL = useCallback((value: string) => {
    setItemTypeFilter(value)
    updateFiltersAndURL({ itemTypeFilter: value })
  }, [updateFiltersAndURL])

  const setGstRateFilterWithURL = useCallback((value: string) => {
    setGstRateFilter(value)
    updateFiltersAndURL({ gstRateFilter: value })
  }, [updateFiltersAndURL])

  const setStockLevelFilterWithURL = useCallback((value: string) => {
    setStockLevelFilter(value)
    updateFiltersAndURL({ stockLevelFilter: value })
  }, [updateFiltersAndURL])

  const setSupplierFilterWithURL = useCallback((value: string) => {
    setSupplierFilter(value)
    updateFiltersAndURL({ supplierFilter: value })
  }, [updateFiltersAndURL])

  const setPriceRangeFilterWithURL = useCallback((value: string) => {
    setPriceRangeFilter(value)
    updateFiltersAndURL({ priceRangeFilter: value })
  }, [updateFiltersAndURL])

  const setDateFilterWithURL = useCallback((value: DateRange) => {
    setDateFilter(value)
    updateFiltersAndURL({ dateFilter: value })
  }, [updateFiltersAndURL])

  // Clear all filters handler
  const handleClearAllFilters = useCallback(() => {
    const currentState = {
      searchTerm,
      statusFilter,
      categoryFilter,
      itemTypeFilter,
      gstRateFilter,
      stockLevelFilter,
      supplierFilter,
      priceRangeFilter,
      dateFilter
    }
    
    const newState = resetAllFilters(currentState)
    
    // Update all filter states
    setSearchTerm(newState.searchTerm)
    setStatusFilter(newState.statusFilter)
    setCategoryFilter(newState.categoryFilter)
    setItemTypeFilter(newState.itemTypeFilter)
    setGstRateFilter(newState.gstRateFilter)
    setStockLevelFilter(newState.stockLevelFilter)
    setSupplierFilter(newState.supplierFilter)
    setPriceRangeFilter(newState.priceRangeFilter)
    setDateFilter(newState.dateFilter)
  }, [searchTerm, statusFilter, categoryFilter, itemTypeFilter, gstRateFilter, 
      stockLevelFilter, supplierFilter, priceRangeFilter, dateFilter, resetAllFilters])

  // Get active filter count
  const activeFilterCount = getActiveFilterCount({
    searchTerm,
    statusFilter,
    categoryFilter,
    itemTypeFilter,
    gstRateFilter,
    stockLevelFilter,
    supplierFilter,
    priceRangeFilter,
    dateFilter
  })
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

  // Enhanced Product Mapping Features
  const [productCategories, setProductCategories] = useState<string[]>([])
  const [productTags, setProductTags] = useState<string[]>([])
  const [intelligentSuggestions, setIntelligentSuggestions] = useState<{
    category: string
    hsnCode: string
    gstRate: number
    unit: string
  } | null>(null)

  // Intelligent product mapping based on name analysis
  const analyzeProductName = (productName: string) => {
    const name = productName.toLowerCase()
    
    // Category mapping based on keywords
    let suggestedCategory = ''
    let suggestedHsnCode = ''
    let suggestedGstRate = 18
    let suggestedUnit = 'Pcs'

    if (name.includes('motor') || name.includes('engine') || name.includes('pump')) {
      suggestedCategory = 'Machinery & Equipment'
      suggestedHsnCode = '8501'
      suggestedGstRate = 18
      suggestedUnit = 'Nos'
    } else if (name.includes('bearing') || name.includes('valve') || name.includes('pipe')) {
      suggestedCategory = 'Mechanical Parts'
      suggestedHsnCode = '8482'
      suggestedGstRate = 18
      suggestedUnit = 'Pcs'
    } else if (name.includes('steel') || name.includes('iron') || name.includes('metal')) {
      suggestedCategory = 'Raw Materials'
      suggestedHsnCode = '7208'
      suggestedGstRate = 18
      suggestedUnit = 'Kg'
    } else if (name.includes('oil') || name.includes('lubricant') || name.includes('grease')) {
      suggestedCategory = 'Consumables'
      suggestedHsnCode = '2710'
      suggestedGstRate = 18
      suggestedUnit = 'Ltr'
    } else if (name.includes('tool') || name.includes('cutter') || name.includes('drill')) {
      suggestedCategory = 'Tools & Equipment'
      suggestedHsnCode = '8207'
      suggestedGstRate = 18
      suggestedUnit = 'Pcs'
    } else if (name.includes('wire') || name.includes('cable') || name.includes('connector')) {
      suggestedCategory = 'Electrical Components'
      suggestedHsnCode = '8544'
      suggestedGstRate = 18
      suggestedUnit = 'Mtr'
    }

    return {
      category: suggestedCategory,
      hsnCode: suggestedHsnCode,
      gstRate: suggestedGstRate,
      unit: suggestedUnit
    }
  }

  // Apply intelligent suggestions
  const applyIntelligentSuggestions = () => {
    if (intelligentSuggestions) {
      setFormData(prev => ({
        ...prev,
        category: intelligentSuggestions.category,
        hsn_code: intelligentSuggestions.hsnCode,
        gst_rate: intelligentSuggestions.gstRate.toString(),
        unit: intelligentSuggestions.unit
      }))
      setIntelligentSuggestions(null)
    }
  }

  // Enhanced form data change handler with intelligent suggestions
  const handleFormDataChange = (field: keyof ProductFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Trigger intelligent analysis when product name changes
    if (field === 'name' && value.length > 3) {
      const suggestions = analyzeProductName(value)
      if (suggestions.category) {
        setIntelligentSuggestions(suggestions)
      }
    }
  }

  useEffect(() => {
    if (!token) {
      // If no token, redirect to login
      navigate('/login')
      return
    }
    
    console.log('Products useEffect triggered:', { mode, id, loading, token })
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
  }, [mode, id, token, navigate])

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
    setError(null)
    
    try {
      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error('Product name is required')
      }
      if (formData.name.length > 100) {
        throw new Error('Product name must be 100 characters or less')
      }
      if (!/^[a-zA-Z0-9\s]+$/.test(formData.name)) {
        throw new Error('Product name must be alphanumeric with spaces only')
      }
      if (!formData.product_type) {
        throw new Error('Product type is required')
      }
      if (!formData.sales_price || parseFloat(formData.sales_price) <= 0) {
        throw new Error('Sales price must be greater than 0')
      }
      if (parseFloat(formData.sales_price) > 999999.99) {
        throw new Error('Sales price must be less than 999,999.99')
      }
      if (!formData.opening_stock || parseFloat(formData.opening_stock) < 0) {
        throw new Error('Opening stock must be 0 or greater')
      }
      if (parseFloat(formData.opening_stock) > 999999) {
        throw new Error('Opening stock must be less than 999,999')
      }
      if (!formData.unit.trim()) {
        throw new Error('Unit is required')
      }
      if (formData.sku && formData.sku.length > 50) {
        throw new Error('SKU must be 50 characters or less')
      }
      if (formData.sku && !/^[a-zA-Z0-9\s]+$/.test(formData.sku)) {
        throw new Error('SKU must be alphanumeric with spaces only')
      }
      if (formData.description && formData.description.length > 200) {
        throw new Error('Description must be 200 characters or less')
      }
      if (formData.supplier && formData.supplier.length > 100) {
        throw new Error('Supplier must be 100 characters or less')
      }
      if (formData.category && formData.category.length > 100) {
        throw new Error('Category must be 100 characters or less')
      }
      if (formData.purchase_price && parseFloat(formData.purchase_price) > 999999.99) {
        throw new Error('Purchase price must be less than 999,999.99')
      }

      // Map product_type to item_type for backend compatibility
      const itemTypeMap: { [key: string]: string } = {
        'Goods': 'tradable',
        'Services': 'consumable'
      }
      
      const itemType = itemTypeMap[formData.product_type] || 'tradable'

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        item_type: itemType,
        sales_price: parseFloat(formData.sales_price),
        purchase_price: formData.purchase_price && formData.purchase_price.trim() ? parseFloat(formData.purchase_price) : null,
        stock: parseFloat(formData.opening_stock),
        sku: formData.sku.trim() || null,
        unit: formData.unit.trim(),
        supplier: formData.supplier.trim() || null,
        category: formData.category.trim() || null,
        notes: formData.notes.trim() || null,
        hsn: formData.hsn_code.trim() || null,
        gst_rate: formData.gst_rate && formData.gst_rate.trim() !== '' ? parseFloat(formData.gst_rate) : null
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
      // Map product_type to item_type for backend compatibility
      const itemTypeMap: { [key: string]: string } = {
        'Goods': 'tradable',
        'Services': 'consumable'
      }
      
      const itemType = itemTypeMap[formData.product_type] || 'tradable'

      const payload = {
        name: formData.name,
        description: formData.description,
        item_type: itemType,
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
              
              {/* Intelligent Suggestions */}
              {intelligentSuggestions && (
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: '#e7f3ff',
                  border: '1px solid #17a2b8',
                  borderRadius: '6px',
                  marginBottom: '16px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h4 style={{ margin: '0', fontSize: '14px', color: '#0056b3', fontWeight: '600' }}>
                      🤖 Intelligent Suggestions
                    </h4>
                    <Button
                      onClick={applyIntelligentSuggestions}
                      variant="primary"
                      style={{ fontSize: '11px', padding: '4px 8px' }}
                    >
                      Apply All
                    </Button>
                  </div>
                  <div style={{ fontSize: '12px', color: '#0056b3' }}>
                    <div>Category: {intelligentSuggestions.category}</div>
                    <div>HSN Code: {intelligentSuggestions.hsnCode}</div>
                    <div>GST Rate: {intelligentSuggestions.gstRate}%</div>
                    <div>Unit: {intelligentSuggestions.unit}</div>
                  </div>
                </div>
              )}
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                {/* First Row */}
                <div style={formStyles.formGroup}>
                  <label style={formStyles.label}>Product Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleFormDataChange('name', e.target.value)}
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
        <EnhancedHeader
          {...HeaderPatterns.products(products.length)}
          primaryAction={{
            label: 'Add Product',
            onClick: () => navigate('/products/add'),
            icon: '➕'
          }}
        />
        
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
        activeFiltersCount={activeFilterCount}
        onClearAll={handleClearAllFilters}
        showQuickActions={true}
        showQuickFiltersWhenCollapsed={true}
        quickActions={[
          {
            id: 'lowStock',
            label: 'Low Stock (<10)',
            action: () => {
              setStockLevelFilterWithURL('low_stock')
            },
            icon: '⚠️',
            isActive: stockLevelFilter === 'low_stock'
          },
          {
            id: 'activeOnly',
            label: 'Active Only',
            action: () => {
              setStatusFilterWithURL('active')
            },
            icon: '✅',
            isActive: statusFilter === 'active'
          },
          {
            id: 'highValue',
            label: 'High Value Items',
            action: () => {
              setPriceRangeFilterWithURL('50000+')
            },
            icon: '💰',
            isActive: priceRangeFilter === '50000+'
          },
          {
            id: 'recentAdditions',
            label: 'Recent Additions',
            action: () => {
              const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
              setDateFilterWithURL({
                startDate: thirtyDaysAgo,
                endDate: new Date().toISOString().slice(0, 10)
              })
            },
            icon: '🆕',
            isActive: false
          }
        ]}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '12px', fontWeight: '500', color: '#495057' }}>Search</span>
          <SearchBar
            value={searchTerm}
            onChange={setSearchTermWithURL}
            placeholder="Search products..."
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '12px', fontWeight: '500', color: '#495057' }}>Status</span>
          <FilterDropdown
            value={statusFilter}
            onChange={(value) => setStatusFilterWithURL(Array.isArray(value) ? value[0] || 'all' : value)}
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
            onChange={(value) => setCategoryFilterWithURL(Array.isArray(value) ? value[0] || 'all' : value)}
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
            onChange={(value) => setItemTypeFilterWithURL(Array.isArray(value) ? value[0] || 'all' : value)}
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
            onChange={(value) => setGstRateFilterWithURL(Array.isArray(value) ? value[0] || 'all' : value)}
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
            onChange={(value) => setStockLevelFilterWithURL(Array.isArray(value) ? value[0] || 'all' : value)}
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
            onChange={(value) => setPriceRangeFilterWithURL(Array.isArray(value) ? value[0] || 'all' : value)}
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
            onChange={setDateFilterWithURL}
          />
        </div>
      </EnhancedFilterBar>

      <div style={{ 
        border: '1px solid #e9ecef', 
        borderRadius: '8px', 
        overflow: 'visible',
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
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Stock Value</th>
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
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '500',
                    backgroundColor: product.stock < 10 ? '#fff3cd' : '#d4edda',
                    color: product.stock < 10 ? '#856404' : '#155724'
                  }}>
                    ₹{((product.purchase_price || product.sales_price) * product.stock).toFixed(2)}
                  </span>
                </td>
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
                  <ActionButtons
                    {...ActionButtonSets.products(product, {
                      onEdit: () => navigate(`/products/edit/${product.id}`),
                      onStock: () => navigate(`/products/stock-adjustment?product=${product.id}`),
                      onHistory: () => navigate(`/products/stock-history?product=${product.id}`),
                      onToggle: () => handleToggleProduct(product.id)
                    })}
                    maxVisible={1}
                  />
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
  const [searchParams] = useSearchParams()
  const preSelectedProductId = searchParams.get('product')
  
  const { forceLogout } = useAuth()
  const handleApiError = createApiErrorHandler({ onUnauthorized: forceLogout })
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
  const [selectedProductId, setSelectedProductId] = useState<string>(preSelectedProductId || '')
  const [stockLoading, setStockLoading] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

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
      
      // If product is pre-selected, set the selected product
      if (preSelectedProductId) {
        const product = productsData.find(p => p.id === parseInt(preSelectedProductId))
        if (product) {
          setSelectedProduct(product)
        }
      }
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

      <form onSubmit={handleStockSubmit} style={{ maxWidth: '1200px' }}>
        {/* Product Selection Section */}
        <div style={formStyles.section}>
          <h3 style={{ ...formStyles.sectionHeader, color: getSectionHeaderColor('product') }}>
            Product Selection
          </h3>
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>Select Product *</label>
            <select
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value)
                const product = products.find(p => p.id === parseInt(e.target.value))
                setSelectedProduct(product || null)
              }}
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
          
          {/* Product Information Display */}
          {selectedProduct && (
            <div style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '16px', 
              borderRadius: '8px', 
              marginTop: '12px',
              border: '1px solid #e9ecef'
            }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#495057' }}>Product Information</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div>
                  <strong>Name:</strong> {selectedProduct.name}
                </div>
                <div>
                  <strong>Current Stock:</strong> {selectedProduct.stock} {selectedProduct.unit}
                </div>
                <div>
                  <strong>Purchase Price:</strong> ₹{selectedProduct.purchase_price || 'N/A'}
                </div>
                <div>
                  <strong>Sales Price:</strong> ₹{selectedProduct.sales_price}
                </div>
                <div>
                  <strong>Category:</strong> {selectedProduct.category || 'N/A'}
                </div>
                <div>
                  <strong>Supplier:</strong> {selectedProduct.supplier || 'N/A'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Two Column Layout for Form Sections */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Left Column */}
          <div>
            {/* Adjustment Details Section */}
            <div style={formStyles.section}>
              <h3 style={{ ...formStyles.sectionHeader, color: getSectionHeaderColor('adjustment') }}>
                Adjustment Details
              </h3>
              <div style={formStyles.formGroup}>
                <label style={formStyles.label}>Adjustment Type *</label>
                <select
                  value={stockFormData.adjustmentType}
                  onChange={(e) => handleStockInputChange('adjustmentType', e.target.value as 'add' | 'reduce' | 'adjust')}
                  style={formStyles.select}
                  required
                >
                  <option value="add">Add Stock (Incoming) - Purchases, Returns</option>
                  <option value="reduce">Reduce Stock (Outgoing) - Sales, Consumption</option>
                  <option value="adjust">Stock Adjustment - Corrections, Damage</option>
                </select>
                <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                  <strong>When to use:</strong><br/>
                  • <strong>Add Stock:</strong> Purchase receipts, sales returns, production<br/>
                  • <strong>Reduce Stock:</strong> Sales, purchase returns, consumption<br/>
                  • <strong>Adjustment:</strong> Physical count corrections, damage, write-offs
                </div>
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
              <div style={formStyles.formGroup}>
                <label style={formStyles.label}>
                  {stockFormData.adjustmentType === 'add' ? 'Date of Receipt' : 
                   stockFormData.adjustmentType === 'reduce' ? 'Date of Issue' : 
                   'Date of Adjustment'} *
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
          </div>

          {/* Right Column */}
          <div>
            {/* Reference Information Section (for incoming stock and adjustments) */}
            {(stockFormData.adjustmentType === 'add' || stockFormData.adjustmentType === 'adjust') && (
              <div style={formStyles.section}>
                <h3 style={{ ...formStyles.sectionHeader, color: getSectionHeaderColor('reference') }}>
                  Reference Information
                </h3>
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
                  rows={4}
                  placeholder="Additional notes about this stock adjustment..."
                />
              </div>
            </div>
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




