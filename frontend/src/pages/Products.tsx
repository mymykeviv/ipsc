import React, { useState, useEffect, useCallback, useMemo } from 'react'
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
import { StockMovementHistoryTable } from '../components/StockMovementHistoryTable'
import { ActionButtons, ActionButtonSets } from '../components/ActionButtons'
import { EnhancedHeader, HeaderPatterns } from '../components/EnhancedHeader'
import { SummaryCardGrid, SummaryCardItem } from '../components/common/SummaryCardGrid'
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
  const [lowStockCount, setLowStockCount] = useState<number>(0)
  
  // Create error handler that will automatically log out on 401 errors (memoized)
  const handleApiError = useMemo(() => createApiErrorHandler(() => forceLogout()), [forceLogout])
  const [showStockModal, setShowStockModal] = useState(false)
  const [showStockHistoryModal, setShowStockHistoryModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [movementLoading, setMovementLoading] = useState(false)
  const [movements, setMovements] = useState<StockMovement[]>([])

  // Add/Edit form state
  const [formLoading, setFormLoading] = useState<boolean>(mode === 'add' || mode === 'edit')
  const [formError, setFormError] = useState<string | null>(null)
  const [productFormData, setProductFormData] = useState<ProductFormData>({
    name: '',
    sku: '',
    unit: '',
    supplier: '',
    description: '',
    product_type: 'tradable',
    category: '',
    purchase_price: '',
    sales_price: '',
    gst_rate: '',
    hsn_code: '',
    opening_stock: '',
    closing_stock: '',
    notes: ''
  })

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
  const { getFiltersFromURL, updateURLWithFilters, clearURLFilters, searchParams } = useFilterNavigation(defaultState)
  const { resetAllFilters, getActiveFilterCount } = useFilterReset({
    pageName: 'products',
    onReset: (newState: Record<string, any>) => {
      const ds = newState as typeof defaultState
      // Update all filter states
      setSearchTerm(ds.searchTerm)
      setStatusFilter(ds.statusFilter)
      setCategoryFilter(ds.categoryFilter)
      setItemTypeFilter(ds.itemTypeFilter)
      setGstRateFilter(ds.gstRateFilter)
      setStockLevelFilter(ds.stockLevelFilter)
      setSupplierFilter(ds.supplierFilter)
      setPriceRangeFilter(ds.priceRangeFilter)
      setDateFilter(ds.dateFilter)
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

  // URL Parameter Integration - Apply filters from URL on component mount (only for manage mode)
  useEffect(() => {
    if (mode === 'manage') {
      const urlFilters = getFiltersFromURL()
      
      // Apply URL filters to state
      if (urlFilters.searchTerm && urlFilters.searchTerm !== searchTerm) setSearchTerm(urlFilters.searchTerm)
      if (urlFilters.statusFilter && urlFilters.statusFilter !== statusFilter) setStatusFilter(urlFilters.statusFilter)
      if (urlFilters.categoryFilter && urlFilters.categoryFilter !== categoryFilter) setCategoryFilter(urlFilters.categoryFilter)
      if (urlFilters.itemTypeFilter && urlFilters.itemTypeFilter !== itemTypeFilter) setItemTypeFilter(urlFilters.itemTypeFilter)
      if (urlFilters.gstRateFilter && urlFilters.gstRateFilter !== gstRateFilter) setGstRateFilter(urlFilters.gstRateFilter)
      if (urlFilters.stockLevelFilter && urlFilters.stockLevelFilter !== stockLevelFilter) setStockLevelFilter(urlFilters.stockLevelFilter)
      if (urlFilters.supplierFilter && urlFilters.supplierFilter !== supplierFilter) setSupplierFilter(urlFilters.supplierFilter)
      if (urlFilters.priceRangeFilter && urlFilters.priceRangeFilter !== priceRangeFilter) setPriceRangeFilter(urlFilters.priceRangeFilter)
      if (
        urlFilters.dateFilter &&
        (urlFilters.dateFilter.startDate !== dateFilter.startDate || urlFilters.dateFilter.endDate !== dateFilter.endDate)
      ) {
        setDateFilter(urlFilters.dateFilter)
      }
    }
  }, [mode]) // Removed searchParams dependency to prevent refresh in edit mode

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
      dateFilter,
    }
    const updatedFilters = { ...currentFilters, ...newFilters }
    updateURLWithFilters(updatedFilters)
  }, [searchTerm, statusFilter, categoryFilter, itemTypeFilter, gstRateFilter, stockLevelFilter, supplierFilter, priceRangeFilter, dateFilter, updateURLWithFilters])

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

  // Helpers
  const activeFilterCount = useMemo(() => getActiveFilterCount({
    searchTerm,
    statusFilter,
    categoryFilter,
    itemTypeFilter,
    gstRateFilter,
    stockLevelFilter,
    supplierFilter,
    priceRangeFilter,
    dateFilter,
  }), [getActiveFilterCount, searchTerm, statusFilter, categoryFilter, itemTypeFilter, gstRateFilter, stockLevelFilter, supplierFilter, priceRangeFilter, dateFilter])

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
      dateFilter,
    }
    const newState = resetAllFilters(currentState) as typeof defaultState
    setSearchTerm(newState.searchTerm)
    setStatusFilter(newState.statusFilter)
    setCategoryFilter(newState.categoryFilter)
    setItemTypeFilter(newState.itemTypeFilter)
    setGstRateFilter(newState.gstRateFilter)
    setStockLevelFilter(newState.stockLevelFilter)
    setSupplierFilter(newState.supplierFilter)
    setPriceRangeFilter(newState.priceRangeFilter)
    setDateFilter(newState.dateFilter)
    clearURLFilters()
  }, [resetAllFilters, clearURLFilters, searchTerm, statusFilter, categoryFilter, itemTypeFilter, gstRateFilter, stockLevelFilter, supplierFilter, priceRangeFilter, dateFilter])

  // Load products
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Map UI filters to API filters
      const apiFilters: ProductFilters = {}
      if (searchTerm) apiFilters.search = searchTerm
      if (categoryFilter && categoryFilter !== 'all') apiFilters.category = categoryFilter
      if (itemTypeFilter && itemTypeFilter !== 'all') apiFilters.item_type = itemTypeFilter
      if (gstRateFilter && gstRateFilter !== 'all') apiFilters.gst_rate = parseInt(gstRateFilter)
      if (supplierFilter && supplierFilter !== 'all') apiFilters.supplier = supplierFilter
      if (stockLevelFilter && stockLevelFilter !== 'all') apiFilters.stock_level = stockLevelFilter
      if (priceRangeFilter && priceRangeFilter !== 'all') {
        const [minStr, maxStr] = priceRangeFilter.split('-')
        const min = minStr ? parseInt(minStr) : undefined
        const max = maxStr === '' ? undefined : (maxStr ? parseInt(maxStr) : undefined)
        if (min !== undefined) apiFilters.price_min = min
        if (max !== undefined) apiFilters.price_max = max
      }

      const data = await apiGetProducts(apiFilters)
      setProducts(data)
    } catch (err: any) {
      const errorMessage = handleApiError(err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [searchTerm, categoryFilter, itemTypeFilter, gstRateFilter, supplierFilter, stockLevelFilter, priceRangeFilter, handleApiError])

  useEffect(() => {
    if (mode === 'manage') {
      loadProducts()
    }
  }, [mode, loadProducts])

  // Toggle active/inactive for a product and refresh list + KPIs
  const handleToggleProduct = useCallback(async (id: number) => {
    try {
      setLoading(true)
      await apiToggleProduct(id)
      
      // Reload products with current filters
      const apiFilters: ProductFilters = {}
      if (searchTerm) apiFilters.search = searchTerm
      if (categoryFilter && categoryFilter !== 'all') apiFilters.category = categoryFilter
      if (itemTypeFilter && itemTypeFilter !== 'all') apiFilters.item_type = itemTypeFilter
      if (gstRateFilter && gstRateFilter !== 'all') apiFilters.gst_rate = parseInt(gstRateFilter)
      if (supplierFilter && supplierFilter !== 'all') apiFilters.supplier = supplierFilter
      if (stockLevelFilter && stockLevelFilter !== 'all') apiFilters.stock_level = stockLevelFilter
      if (priceRangeFilter && priceRangeFilter !== 'all') {
        const [minStr, maxStr] = priceRangeFilter.split('-')
        const min = minStr ? parseInt(minStr) : undefined
        const max = maxStr === '' ? undefined : (maxStr ? parseInt(maxStr) : undefined)
        if (min !== undefined) apiFilters.price_min = min
        if (max !== undefined) apiFilters.price_max = max
      }
      const data = await apiGetProducts(apiFilters)
      setProducts(data)
    } catch (err: any) {
      const errorMessage = handleApiError(err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [searchTerm, categoryFilter, itemTypeFilter, gstRateFilter, supplierFilter, stockLevelFilter, priceRangeFilter, handleApiError])

  // Note: Do not early-return here. Mode-specific renders are handled below.

  // Load data for Add/Edit modes
  useEffect(() => {
    const loadForForm = async () => {
      if (!(mode === 'add' || mode === 'edit')) return
      try {
        setFormLoading(true)
        setFormError(null)
        
        // Only fetch vendors if we haven't loaded them yet
        if (vendors.length === 0) {
          const parties = await apiListParties()
          setVendors(parties.filter(p => p.type === 'vendor'))
        }

        // Initialize form data when first entering add mode
        if (mode === 'add') {
          // Only initialize if the form is empty (first load)
          if (!productFormData.name && !productFormData.sku) {
            setProductFormData({
              name: '',
              sku: '',
              unit: '',
              supplier: '',
              description: '',
              product_type: 'tradable',
              category: '',
              purchase_price: '',
              sales_price: '',
              gst_rate: '',
              hsn_code: '',
              opening_stock: '',
              closing_stock: '',
              notes: ''
            })
          }
        }

        if (mode === 'edit' && id) {
          // Only fetch product data if we don't already have it or if the ID changed
          if (!currentProduct || currentProduct.id !== parseInt(id)) {
            const list = await apiGetProducts()
            const found = list.find(p => p.id === parseInt(id)) || null
            setCurrentProduct(found)
            if (found) {
              setProductFormData({
                name: found.name || '',
                sku: found.sku || '',
                unit: found.unit || '',
                supplier: found.supplier || '',
                description: found.description || '',
                product_type: found.item_type || 'tradable',
                category: found.category || '',
                purchase_price: found.purchase_price != null ? String(found.purchase_price) : '',
                sales_price: found.sales_price != null ? String(found.sales_price) : '',
                gst_rate: found.gst_rate != null ? String(found.gst_rate) : '',
                hsn_code: found.hsn || '',
                opening_stock: String(found.stock ?? ''),
                closing_stock: '',
                notes: found.notes || ''
              })
            }
          }
        }
      } catch (err: any) {
        const msg = handleApiError(err)
        setFormError(msg)
      } finally {
        setFormLoading(false)
      }
    }
    loadForForm()
  }, [mode, id, currentProduct, vendors.length, handleApiError]) // Added dependencies to prevent unnecessary API calls

  const handleFormInput = useCallback((field: keyof ProductFormData, value: string) => {
    setProductFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  const submitCreate = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    try {
      setFormError(null)
      setFormLoading(true)
      const payload = {
        name: productFormData.name.trim(),
        description: productFormData.description.trim() || null,
        item_type: (productFormData.product_type || 'tradable') as Product['item_type'],
        sales_price: productFormData.sales_price ? parseFloat(productFormData.sales_price) : 0,
        purchase_price: productFormData.purchase_price ? parseFloat(productFormData.purchase_price) : null,
        stock: productFormData.opening_stock ? parseFloat(productFormData.opening_stock) : 0,
        sku: productFormData.sku.trim() || null,
        unit: productFormData.unit.trim() || 'Pcs',
        supplier: productFormData.supplier.trim() || null,
        category: productFormData.category.trim() || null,
        notes: productFormData.notes.trim() || null,
        hsn: productFormData.hsn_code.trim() || null,
        gst_rate: productFormData.gst_rate ? parseFloat(productFormData.gst_rate) : null,
      }
      // Basic validation
      if (!payload.name) {
        throw new Error('Product name is required')
      }

      // Ensure name is not empty after trimming
      if (!payload.name || payload.name.length === 0) {
        throw new Error('Product name is required')
      }

      try {
        // Make the API call and wait for it to complete successfully
        await apiCreateProduct(payload as Omit<Product, 'id' | 'is_active'>)
        
        // Only reset form data after successful creation (API call succeeded)
        setProductFormData({
          name: '',
          sku: '',
          unit: '',
          supplier: '',
          description: '',
          product_type: 'tradable',
          category: '',
          purchase_price: '',
          sales_price: '',
          gst_rate: '',
          hsn_code: '',
          opening_stock: '',
          closing_stock: '',
          notes: ''
        })
        
        // Navigate away only after successful creation
        navigate('/products')
      } catch (apiError: any) {
        // Handle specific API errors
        if (apiError.message && apiError.message.includes('already exists')) {
          throw new Error('A product with this name already exists. Please use a different name.')
        }
        throw apiError // Re-throw for the outer catch block to handle
      }
    } catch (err: any) {
      // On error, don't reset the form - just show the error
      const msg = handleApiError(err)
      setFormError(msg)
    } finally {
      setFormLoading(false)
    }
  }, [productFormData, navigate, handleApiError])

  const submitUpdate = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!currentProduct) return
    try {
      setFormError(null)
      setFormLoading(true)
      const payload = {
        name: productFormData.name.trim() || currentProduct.name,
        description: productFormData.description.trim() || null,
        item_type: (productFormData.product_type || currentProduct.item_type) as Product['item_type'],
        sales_price: productFormData.sales_price ? parseFloat(productFormData.sales_price) : currentProduct.sales_price,
        purchase_price: productFormData.purchase_price ? parseFloat(productFormData.purchase_price) : currentProduct.purchase_price,
        stock: productFormData.opening_stock ? parseFloat(productFormData.opening_stock) : currentProduct.stock,
        sku: productFormData.sku.trim() || currentProduct.sku,
        unit: productFormData.unit.trim() || currentProduct.unit,
        supplier: productFormData.supplier.trim() || currentProduct.supplier,
        category: productFormData.category.trim() || currentProduct.category,
        notes: productFormData.notes.trim() || currentProduct.notes,
        hsn: productFormData.hsn_code.trim() || currentProduct.hsn,
        gst_rate: productFormData.gst_rate ? parseFloat(productFormData.gst_rate) : currentProduct.gst_rate,
      }
      // Basic validation
      if (!payload.name) {
        throw new Error('Product name is required')
      }

      await apiUpdateProduct(currentProduct.id, payload as Partial<Omit<Product, 'id' | 'is_active'>>)
      navigate('/products')
    } catch (err: any) {
      const msg = handleApiError(err)
      setFormError(msg)
    } finally {
      setFormLoading(false)
    }
  }, [currentProduct, productFormData, navigate, handleApiError])

  // Filter and sort products (filtering portion used by summary and table)
  const filteredProducts = products.filter((product: Product) => {
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

  // Summary totals computed from filtered products (ensures reactivity to all filters)
  const productSummaryItems: SummaryCardItem[] = useMemo(() => {
    const total = filteredProducts.length
    const inStock = filteredProducts.filter(p => p.stock > 0).length
    const outOfStock = filteredProducts.filter(p => p.stock === 0).length
    const totalStockValueNumber = filteredProducts.reduce((acc, p) => acc + (p.purchase_price ?? p.sales_price) * p.stock, 0)
    const totalStockValue = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalStockValueNumber)

    return [
      {
        label: 'Total Stock Value (Snapshot)',
        primary: totalStockValue,
        secondary: `${total.toLocaleString('en-IN')} products | ${inStock.toLocaleString('en-IN')} in stock | ${outOfStock.toLocaleString('en-IN')} out of stock • Snapshot = stock × (purchase price or, if missing, sales price). Valuation reports may differ.`,
        accentColor: '#0d6efd',
      }
    ]
  }, [filteredProducts])

  // Stock Adjustment Mode
  if (mode === 'stock-adjustment') {
    return <StockAdjustmentForm onSuccess={() => navigate('/products')} onCancel={() => navigate('/products')} />
  }

  // Stock History Mode
  if (mode === 'stock-history') {
    return <StockHistoryForm onSuccess={() => navigate('/products')} onCancel={() => navigate('/products')} />
  }

  // Edit Product Mode
  if (mode === 'edit') {
    if (formLoading) {
      return (
        <div style={{ padding: '20px' }}>
          <div>Loading form...</div>
        </div>
      )
    }
    if (!currentProduct) {
      return (
        <div style={{ padding: '20px' }}>
          <div style={{ marginBottom: 12 }}>Product not found.</div>
          <Button variant="secondary" onClick={() => navigate('/products')}>Back to Products</Button>
        </div>
      )
    }
    return (
      <div style={{ padding: '20px', maxWidth: '100%' }}>
        <form onSubmit={submitUpdate}>
          {formError && <ErrorMessage message={formError} />}
          <div style={formStyles.grid2Col as React.CSSProperties}>
            <div style={formStyles.section}>
              <h3 style={{ ...formStyles.sectionHeader, color: getSectionHeaderColor('product') }}>Product Details</h3>
              <div style={formStyles.grid2Col as React.CSSProperties}>
                <div style={formStyles.formGroup}>
                  <label style={formStyles.label}>Product Name *</label>
                  <input style={formStyles.input} value={productFormData.name} onChange={e => handleFormInput('name', e.target.value)} required />
                </div>
                <div style={formStyles.formGroup}>
                  <label style={formStyles.label}>SKU</label>
                  <input style={formStyles.input} value={productFormData.sku} onChange={e => handleFormInput('sku', e.target.value)} />
                </div>
                <div style={formStyles.formGroup}>
                  <label style={formStyles.label}>Unit of Measure</label>
                  <select
                    style={formStyles.select}
                    value={productFormData.unit || 'Pcs'}
                    onChange={e => handleFormInput('unit', e.target.value)}
                  >
                    <option value="Pcs">Pcs</option>
                    <option value="Kg">Kg</option>
                    <option value="Gms">Gms</option>
                    <option value="Ml">Ml</option>
                    <option value="Ltr">Ltr</option>
                  </select>
                </div>
                <div style={formStyles.formGroup}>
                  <label style={formStyles.label}>Description</label>
                  <textarea style={formStyles.textarea} value={productFormData.description} onChange={e => handleFormInput('description', e.target.value)} />
                </div>
              </div>
            </div>
            <div style={formStyles.section}>
              <h3 style={{ ...formStyles.sectionHeader, color: getSectionHeaderColor('price') }}>Price Details</h3>
              <div style={formStyles.grid2Col as React.CSSProperties}>
                <div style={formStyles.formGroup}>
                  <label style={formStyles.label}>Sales Price</label>
                  <input type="number" step="0.01" style={formStyles.input} value={productFormData.sales_price} onChange={e => handleFormInput('sales_price', e.target.value)} />
                </div>
                <div style={formStyles.formGroup}>
                  <label style={formStyles.label}>Purchase Price</label>
                  <input type="number" step="0.01" style={formStyles.input} value={productFormData.purchase_price} onChange={e => handleFormInput('purchase_price', e.target.value)} />
                </div>
                <div style={formStyles.formGroup}>
                  <label style={formStyles.label}>GST Rate</label>
                  <input type="number" step="0.01" style={formStyles.input} value={productFormData.gst_rate} onChange={e => handleFormInput('gst_rate', e.target.value)} />
                </div>
                <div style={formStyles.formGroup}>
                  <label style={formStyles.label}>HSN Code</label>
                  <input style={formStyles.input} value={productFormData.hsn_code} onChange={e => handleFormInput('hsn_code', e.target.value)} />
                </div>
              </div>
            </div>
          </div>
          <div style={formStyles.grid2Col as React.CSSProperties}>
            <div style={formStyles.section}>
              <h3 style={{ ...formStyles.sectionHeader, color: getSectionHeaderColor('stock') }}>Stock Details</h3>
              <div style={formStyles.grid2Col as React.CSSProperties}>
                <div style={formStyles.formGroup}>
                  <label style={formStyles.label}>Opening Stock</label>
                  <input type="number" step="0.01" style={formStyles.input} value={productFormData.opening_stock} onChange={e => handleFormInput('opening_stock', e.target.value)} />
                </div>
              </div>
            </div>
            <div style={formStyles.section}>
              <h3 style={{ ...formStyles.sectionHeader, color: getSectionHeaderColor('notes') }}>Additional Details</h3>
              <div style={formStyles.grid2Col as React.CSSProperties}>
                <div style={formStyles.formGroup}>
                  <label style={formStyles.label}>Notes</label>
                  <textarea style={formStyles.textarea} value={productFormData.notes} onChange={e => handleFormInput('notes', e.target.value)} />
                </div>
                <div />
              </div>
            </div>
          </div>
          <Button type="button" variant="secondary" onClick={() => navigate('/products')}>Cancel</Button>
          <Button type="button" variant="primary" onClick={() => submitUpdate()} disabled={formLoading}>
            {formLoading ? 'Updating...' : 'Update Product'}
          </Button>
        </form>
      </div>
    )
  }

  // Add Product Mode
  if (mode === 'add') {
    if (formLoading) {
      return (
        <div style={{ padding: '20px' }}>
          <div>Loading form...</div>
        </div>
      )
    }
    return (
      <div style={{ padding: '20px', maxWidth: '100%' }}>
        <form onSubmit={submitCreate}>
          {formError && <ErrorMessage message={formError} />}
        <div style={formStyles.grid2Col as React.CSSProperties}>
          <div style={formStyles.section}>
            <h3 style={{ ...formStyles.sectionHeader, color: getSectionHeaderColor('product') }}>Product Details</h3>
            <div style={formStyles.grid2Col as React.CSSProperties}>
              <div style={formStyles.formGroup}>
                <label style={formStyles.label}>Product Name *</label>
                <input style={formStyles.input} value={productFormData.name} onChange={e => handleFormInput('name', e.target.value)} required />
              </div>
              <div style={formStyles.formGroup}>
                <label style={formStyles.label}>SKU</label>
                <input style={formStyles.input} value={productFormData.sku} onChange={e => handleFormInput('sku', e.target.value)} />
              </div>
              <div style={formStyles.formGroup}>
                <label style={formStyles.label}>Unit of Measure</label>
                <select
                  style={formStyles.select}
                  value={productFormData.unit || 'Pcs'}
                  onChange={e => handleFormInput('unit', e.target.value)}
                >
                  <option value="Pcs">Pcs</option>
                  <option value="Kg">Kg</option>
                  <option value="Gms">Gms</option>
                  <option value="Ml">Ml</option>
                  <option value="Ltr">Ltr</option>
                </select>
              </div>
              <div />
            </div>
          </div>
          <div style={formStyles.section}>
            <h3 style={{ ...formStyles.sectionHeader, color: getSectionHeaderColor('price') }}>Price Details</h3>
            <div style={formStyles.grid2Col as React.CSSProperties}>
              <div style={formStyles.formGroup}>
                <label style={formStyles.label}>Sales Price</label>
                <input type="number" step="0.01" style={formStyles.input} value={productFormData.sales_price} onChange={e => handleFormInput('sales_price', e.target.value)} />
              </div>
              <div style={formStyles.formGroup}>
                <label style={formStyles.label}>Purchase Price</label>
                <input type="number" step="0.01" style={formStyles.input} value={productFormData.purchase_price} onChange={e => handleFormInput('purchase_price', e.target.value)} />
              </div>
              <div style={formStyles.formGroup}>
                <label style={formStyles.label}>GST Rate</label>
                <input type="number" step="0.01" style={formStyles.input} value={productFormData.gst_rate} onChange={e => handleFormInput('gst_rate', e.target.value)} />
              </div>
              <div style={formStyles.formGroup}>
                <label style={formStyles.label}>HSN Code</label>
                <input style={formStyles.input} value={productFormData.hsn_code} onChange={e => handleFormInput('hsn_code', e.target.value)} />
              </div>
            </div>
          </div>
          </div>
          <div style={formStyles.grid2Col as React.CSSProperties}>
            <div style={formStyles.section}>
              <h3 style={{ ...formStyles.sectionHeader, color: getSectionHeaderColor('stock') }}>Stock Details</h3>
              <div style={formStyles.grid2Col as React.CSSProperties}>
                <div style={formStyles.formGroup}>
                  <label style={formStyles.label}>Opening Stock</label>
                  <input type="number" step="0.01" style={formStyles.input} value={productFormData.opening_stock} onChange={e => handleFormInput('opening_stock', e.target.value)} />
                </div>
              </div>
            </div>
            <div style={formStyles.section}>
              <h3 style={{ ...formStyles.sectionHeader, color: getSectionHeaderColor('notes') }}>Additional Details</h3>
              <div style={formStyles.grid2Col as React.CSSProperties}>
                <div style={formStyles.formGroup}>
                  <label style={formStyles.label}>Description</label>
                  <textarea style={formStyles.textarea} value={productFormData.description} onChange={e => handleFormInput('description', e.target.value)} />
                </div>
                <div style={formStyles.formGroup}>
                  <label style={formStyles.label}>Notes</label>
                  <textarea style={formStyles.textarea} value={productFormData.notes} onChange={e => handleFormInput('notes', e.target.value)} />
                </div>
              </div>
            </div>
          </div>
          <Button type="button" variant="secondary" onClick={() => navigate('/products')}>Cancel</Button>
          <Button type="button" variant="primary" onClick={() => submitCreate()} disabled={formLoading}>
            {formLoading ? 'Creating...' : 'Create Product'}
          </Button>
        </form>
      </div>
    )
  }

  // Manage Products Mode
  if (loading) {
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

  // (removed duplicate filteredProducts and productSummaryItems defined earlier to maintain consistent hook order)

  const sortedProducts = [...filteredProducts].sort((a: Product, b: Product) => {
    const field = sortField as keyof Product
    const aValue = a[field]
    const bValue = b[field]
    
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
      ...paginatedProducts.map((product: Product) => [
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

      {/* Summary Totals below filter section as per spec: width/colors consistent */}

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
            onChange={(value: string | string[]) => setStatusFilterWithURL(Array.isArray(value) ? value[0] || 'all' : value)}
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
            onChange={(value: string | string[]) => setCategoryFilterWithURL(Array.isArray(value) ? value[0] || 'all' : value)}
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
            onChange={(value: string | string[]) => setItemTypeFilterWithURL(Array.isArray(value) ? value[0] || 'all' : value)}
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
            onChange={(value: string | string[]) => setGstRateFilterWithURL(Array.isArray(value) ? value[0] || 'all' : value)}
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
            onChange={(value: string | string[]) => setStockLevelFilterWithURL(Array.isArray(value) ? value[0] || 'all' : value)}
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
            onChange={(value: string | string[]) => setPriceRangeFilterWithURL(Array.isArray(value) ? value[0] || 'all' : value)}
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

      <div style={{ margin: '16px 0 20px 0' }}>
        <SummaryCardGrid items={productSummaryItems} columnsMin={220} gapPx={12} />
      </div>

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
              {paginatedProducts.map((product: Product) => (
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

      {/* Stock History Modal */}
      {showStockHistoryModal && selectedProduct && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ width: '90%', maxWidth: '1400px', maxHeight: '85vh', overflow: 'hidden', backgroundColor: 'white', borderRadius: '8px', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ margin: 0 }}>Stock History for {selectedProduct.name}</h2>
              <Button variant="secondary" onClick={() => setShowStockHistoryModal(false)}>Close</Button>
            </div>

            {movementLoading ? (
              <div style={{ padding: 16, color: '#6c757d' }}>Loading movements…</div>
            ) : (
              <StockMovementHistoryTable
                rows={movements.map((m: any) => ({
                  id: m.id,
                  timestamp: m.timestamp || m.date || m.created_at,
                  type: m.type || m.movement_type || '—',
                  quantity_change: typeof m.quantity_change === 'number' ? m.quantity_change : (m.delta ?? m.quantity ?? 0),
                  source: m.source || m.from_location || null,
                  destination: m.destination || m.to_location || null,
                  reference: m.reference || m.document_no || m.invoice_no || null,
                  user: m.user || m.performed_by || m.authorized_by || null,
                  unit_price: m.unit_price ?? m.price_per_unit ?? null,
                  value: m.value ?? (typeof m.unit_price === 'number' && typeof m.quantity_change === 'number' ? m.unit_price * m.quantity_change : null),
                  remarks: m.remarks || m.notes || null
                }))}
              />
            )}
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
  const handleApiError = useMemo(() => createApiErrorHandler(() => forceLogout()), [forceLogout])
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

  // Use a ref to track if data has been loaded to prevent duplicate API calls
  const dataLoaded = React.useRef(false)
  
  useEffect(() => {
    if (!dataLoaded.current) {
      loadData()
      dataLoaded.current = true
    }
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
      
              // Backend expects non-negative quantity and derives delta from type.
              // We want 'reduce' and 'adjust' in UI to reduce stock.
              // Until backend supports negative quantity for 'adjust', map 'adjust' -> 'reduce'.
              const rawQty = parseFloat(stockFormData.quantity)
              const qtyToSend = Math.abs(rawQty)
              const typeToSend = stockFormData.adjustmentType === 'add' ? 'add' : 'reduce'

              const result = await apiAdjustStock(
          parseInt(selectedProductId),
          qtyToSend,
          typeToSend,
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
    setStockFormData((prev: StockFormData) => ({ ...prev, [field]: value }))
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
                  step="0.01"
                  required
                />
                <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                  {stockFormData.adjustmentType === 'add' ? (
                    <>
                      Enter a positive quantity to add to stock.
                    </>
                  ) : stockFormData.adjustmentType === 'reduce' ? (
                    <>
                      Enter quantity to reduce from stock. Negative values are allowed; if positive, it will be treated as a reduction.
                    </>
                  ) : (
                    <>
                      Adjustment for damage/corrections reduces stock. Negative values are allowed; if positive, it will be treated as a reduction.
                    </>
                  )}
                </div>
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




