import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom'
import { Products } from './Products'
import { AuthProvider } from '../modules/AuthContext'
import * as api from '../lib/api'

// Mock the API functions
vi.mock('../lib/api', () => ({
  apiGetProducts: vi.fn(),
  apiCreateProduct: vi.fn(),
  apiUpdateProduct: vi.fn(),
  apiToggleProduct: vi.fn(),
  apiAdjustStock: vi.fn()
}))

const mockProducts = [
  {
    id: 1,
    name: 'Test Product 1',
    description: 'Test Description 1',
    item_type: 'tradable',
    sales_price: 100.00,
    purchase_price: 80.00,
    stock: 50,
    sku: 'TEST001',
    unit: 'Pcs',
    supplier: 'Test Supplier',
    category: 'Test Category',
    notes: 'Test Notes',
    hsn: '12345678',
    gst_rate: 18.0,
    is_active: true
  },
  {
    id: 2,
    name: 'Test Product 2',
    description: 'Test Description 2',
    item_type: 'consumable',
    sales_price: 50.00,
    purchase_price: 40.00,
    stock: 100,
    sku: 'TEST002',
    unit: 'Kg',
    supplier: 'Test Supplier 2',
    category: 'Consumables',
    notes: 'Test Notes 2',
    hsn: '87654321',
    gst_rate: 12.0,
    is_active: true
  }
]

const renderWithAuth = (component: React.ReactElement) => {
  return render(
    <AuthProvider>
      {component}
    </AuthProvider>
  )
}

describe('Products Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock successful login
    localStorage.setItem('auth_token', 'mock-token')
    localStorage.setItem('auth_exp', String(Date.now() + 30 * 60 * 1000))
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('Product Listing', () => {
    it('should display products table with correct data', async () => {
      vi.mocked(api.apiGetProducts).mockResolvedValue(mockProducts)

      renderWithAuth(<Products />)

      await waitFor(() => {
        expect(screen.getByText('Test Product 1')).toBeInTheDocument()
        expect(screen.getByText('Test Product 2')).toBeInTheDocument()
        expect(screen.getByText('TEST001')).toBeInTheDocument()
        expect(screen.getByText('TEST002')).toBeInTheDocument()
        expect(screen.getByText('50')).toBeInTheDocument()
        expect(screen.getByText('100')).toBeInTheDocument()
        expect(screen.getByText('₹100.00')).toBeInTheDocument()
        expect(screen.getByText('₹50.00')).toBeInTheDocument()
        expect(screen.getByText('18%')).toBeInTheDocument()
        expect(screen.getByText('12%')).toBeInTheDocument()
      })
    })

    it('should display item types correctly', async () => {
      vi.mocked(api.apiGetProducts).mockResolvedValue(mockProducts)

      renderWithAuth(<Products />)

      await waitFor(() => {
        expect(screen.getByText('tradable')).toBeInTheDocument()
        expect(screen.getByText('consumable')).toBeInTheDocument()
      })
    })

    it('should show loading state initially', () => {
      vi.mocked(api.apiGetProducts).mockImplementation(() => new Promise(() => {}))

      renderWithAuth(<Products />)

      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('should handle API errors gracefully', async () => {
      vi.mocked(api.apiGetProducts).mockRejectedValue(new Error('API Error'))

      renderWithAuth(<Products />)

      await waitFor(() => {
        expect(screen.getByText('Products')).toBeInTheDocument()
      })
    })
  })

  describe('Product Search and Sorting', () => {
    it('should filter products by search term', async () => {
      vi.mocked(api.apiGetProducts).mockResolvedValue(mockProducts)

      renderWithAuth(<Products />)

      await waitFor(() => {
        expect(screen.getByText('Test Product 1')).toBeInTheDocument()
        expect(screen.getByText('Test Product 2')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search products...')
      fireEvent.change(searchInput, { target: { value: 'Product 1' } })

      await waitFor(() => {
        expect(screen.getByText('Test Product 1')).toBeInTheDocument()
        expect(screen.queryByText('Test Product 2')).not.toBeInTheDocument()
      })
    })

    it('should sort products by different fields', async () => {
      vi.mocked(api.apiGetProducts).mockResolvedValue(mockProducts)

      renderWithAuth(<Products />)

      await waitFor(() => {
        expect(screen.getByText('Name')).toBeInTheDocument()
      })

      // Test sorting by name
      const nameHeader = screen.getByText('Name')
      fireEvent.click(nameHeader)

      // Test sorting by SKU
      const skuHeader = screen.getByText('SKU')
      fireEvent.click(skuHeader)

      // Test sorting by stock
      const stockHeader = screen.getByText('Stock')
      fireEvent.click(stockHeader)
    })
  })

  describe('Add Product Modal', () => {
    it('should open add product modal when button is clicked', async () => {
      vi.mocked(api.apiGetProducts).mockResolvedValue(mockProducts)

      renderWithAuth(<Products />)

      await waitFor(() => {
        expect(screen.getByText('Add Product')).toBeInTheDocument()
      })

      const addButton = screen.getByText('Add Product')
      fireEvent.click(addButton)

      expect(screen.getByText('Add New Product')).toBeInTheDocument()
      expect(screen.getByLabelText('Name *')).toBeInTheDocument()
      expect(screen.getByLabelText('Sales Price *')).toBeInTheDocument()
      expect(screen.getByLabelText('GST Rate *')).toBeInTheDocument()
    })

    it('should validate required fields', async () => {
      vi.mocked(api.apiGetProducts).mockResolvedValue(mockProducts)

      renderWithAuth(<Products />)

      await waitFor(() => {
        expect(screen.getByText('Add Product')).toBeInTheDocument()
      })

      const addButton = screen.getByText('Add Product')
      fireEvent.click(addButton)

      const submitButton = screen.getByText('Add Product')
      fireEvent.click(submitButton)

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument()
        expect(screen.getByText('Sales price is required')).toBeInTheDocument()
        expect(screen.getByText('GST rate is required')).toBeInTheDocument()
      })
    })

    it('should validate field lengths', async () => {
      vi.mocked(api.apiGetProducts).mockResolvedValue(mockProducts)

      renderWithAuth(<Products />)

      await waitFor(() => {
        expect(screen.getByText('Add Product')).toBeInTheDocument()
      })

      const addButton = screen.getByText('Add Product')
      fireEvent.click(addButton)

      const nameInput = screen.getByLabelText('Name *')
      fireEvent.change(nameInput, { target: { value: 'A'.repeat(101) } })

      const submitButton = screen.getByText('Add Product')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Name must be 100 characters or less')).toBeInTheDocument()
      })
    })

    it('should validate numeric fields', async () => {
      vi.mocked(api.apiGetProducts).mockResolvedValue(mockProducts)

      renderWithAuth(<Products />)

      await waitFor(() => {
        expect(screen.getByText('Add Product')).toBeInTheDocument()
      })

      const addButton = screen.getByText('Add Product')
      fireEvent.click(addButton)

      const salesPriceInput = screen.getByLabelText('Sales Price *')
      fireEvent.change(salesPriceInput, { target: { value: '-10' } })

      const submitButton = screen.getByText('Add Product')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Sales price must be between 0 and 999999.99')).toBeInTheDocument()
      })
    })

    it('should successfully create a product', async () => {
      vi.mocked(api.apiGetProducts).mockResolvedValue(mockProducts)
      vi.mocked(api.apiCreateProduct).mockResolvedValue(mockProducts[0])

      renderWithAuth(<Products />)

      await waitFor(() => {
        expect(screen.getByText('Add Product')).toBeInTheDocument()
      })

      const addButton = screen.getByText('Add Product')
      fireEvent.click(addButton)

      // Fill required fields
      const nameInput = screen.getByLabelText('Name *')
      const salesPriceInput = screen.getByLabelText('Sales Price *')
      const gstRateInput = screen.getByLabelText('GST Rate *')

      fireEvent.change(nameInput, { target: { value: 'New Product' } })
      fireEvent.change(salesPriceInput, { target: { value: '150.00' } })
      fireEvent.change(gstRateInput, { target: { value: '18' } })

      const submitButton = screen.getByText('Add Product')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(api.apiCreateProduct).toHaveBeenCalledWith({
          name: 'New Product',
          description: '',
          item_type: 'tradable',
          sales_price: '150.00',
          purchase_price: '',
          stock: '',
          sku: '',
          unit: 'Pcs',
          supplier: '',
          category: '',
          notes: '',
          hsn: '',
          gst_rate: '18'
        })
      })
    })
  })

  describe('Stock Adjustment Modal', () => {
    it('should open stock adjustment modal when Stock button is clicked', async () => {
      vi.mocked(api.apiGetProducts).mockResolvedValue(mockProducts)

      renderWithAuth(<Products />)

      await waitFor(() => {
        expect(screen.getByText('Stock')).toBeInTheDocument()
      })

      const stockButtons = screen.getAllByText('Stock')
      fireEvent.click(stockButtons[0])

      expect(screen.getByText('Stock Adjustment - Test Product 1')).toBeInTheDocument()
      expect(screen.getByLabelText('Adjustment Type *')).toBeInTheDocument()
      expect(screen.getByLabelText('Quantity *')).toBeInTheDocument()
    })

    it('should show current stock in read-only field', async () => {
      vi.mocked(api.apiGetProducts).mockResolvedValue(mockProducts)

      renderWithAuth(<Products />)

      await waitFor(() => {
        expect(screen.getByText('Stock')).toBeInTheDocument()
      })

      const stockButtons = screen.getAllByText('Stock')
      fireEvent.click(stockButtons[0])

      const currentStockInput = screen.getByDisplayValue('50')
      expect(currentStockInput).toBeInTheDocument()
      expect(currentStockInput).toBeDisabled()
    })

    it('should validate stock adjustment form', async () => {
      vi.mocked(api.apiGetProducts).mockResolvedValue(mockProducts)

      renderWithAuth(<Products />)

      await waitFor(() => {
        expect(screen.getByText('Stock')).toBeInTheDocument()
      })

      const stockButtons = screen.getAllByText('Stock')
      fireEvent.click(stockButtons[0])

      const submitButton = screen.getByText('Apply Adjustment')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Quantity is required')).toBeInTheDocument()
      })
    })

    it('should validate quantity range', async () => {
      vi.mocked(api.apiGetProducts).mockResolvedValue(mockProducts)

      renderWithAuth(<Products />)

      await waitFor(() => {
        expect(screen.getByText('Stock')).toBeInTheDocument()
      })

      const stockButtons = screen.getAllByText('Stock')
      fireEvent.click(stockButtons[0])

      const quantityInput = screen.getByLabelText('Quantity *')
      fireEvent.change(quantityInput, { target: { value: '1000000' } })

      const submitButton = screen.getByText('Apply Adjustment')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Quantity must be between 0 and 999999')).toBeInTheDocument()
      })
    })

    it('should successfully adjust stock', async () => {
      vi.mocked(api.apiGetProducts).mockResolvedValue(mockProducts)
      vi.mocked(api.apiAdjustStock).mockResolvedValue({ ok: true, new_stock: 60 })

      renderWithAuth(<Products />)

      await waitFor(() => {
        expect(screen.getByText('Stock')).toBeInTheDocument()
      })

      const stockButtons = screen.getAllByText('Stock')
      fireEvent.click(stockButtons[0])

      // Fill form
      const quantityInput = screen.getByLabelText('Quantity *')
      const adjustmentTypeSelect = screen.getByLabelText('Adjustment Type *')

      fireEvent.change(quantityInput, { target: { value: '10' } })
      fireEvent.change(adjustmentTypeSelect, { target: { value: 'add' } })

      const submitButton = screen.getByText('Apply Adjustment')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(api.apiAdjustStock).toHaveBeenCalledWith(
          1, // product ID
          10, // quantity
          'add', // adjustment type
          expect.any(String), // date
          undefined, // reference bill number
          undefined, // supplier
          undefined, // category
          undefined  // notes
        )
      })
    })
  })

  describe('Edit Product Modal', () => {
    it('should open edit modal when Edit button is clicked', async () => {
      vi.mocked(api.apiGetProducts).mockResolvedValue(mockProducts)

      renderWithAuth(<Products />)

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument()
      })

      const editButtons = screen.getAllByText('Edit')
      fireEvent.click(editButtons[0])

      expect(screen.getByText('Edit Product')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test Product 1')).toBeInTheDocument()
      expect(screen.getByDisplayValue('100')).toBeInTheDocument()
    })

    it('should populate form with existing product data', async () => {
      vi.mocked(api.apiGetProducts).mockResolvedValue(mockProducts)

      renderWithAuth(<Products />)

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument()
      })

      const editButtons = screen.getAllByText('Edit')
      fireEvent.click(editButtons[0])

      expect(screen.getByDisplayValue('Test Product 1')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test Description 1')).toBeInTheDocument()
      expect(screen.getByDisplayValue('TEST001')).toBeInTheDocument()
      expect(screen.getByDisplayValue('100')).toBeInTheDocument()
      expect(screen.getByDisplayValue('80')).toBeInTheDocument()
      expect(screen.getByDisplayValue('50')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test Supplier')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test Category')).toBeInTheDocument()
      expect(screen.getByDisplayValue('18')).toBeInTheDocument()
    })
  })

  describe('Product Status Toggle', () => {
    it('should toggle product status when Enable/Disable button is clicked', async () => {
      vi.mocked(api.apiGetProducts).mockResolvedValue(mockProducts)
      vi.mocked(api.apiToggleProduct).mockResolvedValue({ ...mockProducts[0], is_active: false })

      renderWithAuth(<Products />)

      await waitFor(() => {
        expect(screen.getByText('Disable')).toBeInTheDocument()
      })

      const disableButtons = screen.getAllByText('Disable')
      fireEvent.click(disableButtons[0])

      await waitFor(() => {
        expect(api.apiToggleProduct).toHaveBeenCalledWith(1)
      })
    })
  })

  describe('Export Functionality', () => {
    it('should export products to CSV', async () => {
      vi.mocked(api.apiGetProducts).mockResolvedValue(mockProducts)
      
      // Mock URL.createObjectURL and document.createElement
      const mockCreateElement = vi.fn().mockReturnValue({
        setAttribute: vi.fn(),
        click: vi.fn(),
        style: {}
      })
      const mockCreateObjectURL = vi.fn().mockReturnValue('mock-url')
      
      Object.defineProperty(document, 'createElement', {
        value: mockCreateElement,
        writable: true
      })
      Object.defineProperty(URL, 'createObjectURL', {
        value: mockCreateObjectURL,
        writable: true
      })

      renderWithAuth(<Products />)

      await waitFor(() => {
        expect(screen.getByText('Export CSV')).toBeInTheDocument()
      })

      const exportButton = screen.getByText('Export CSV')
      fireEvent.click(exportButton)

      expect(mockCreateElement).toHaveBeenCalledWith('a')
    })
  })
})


