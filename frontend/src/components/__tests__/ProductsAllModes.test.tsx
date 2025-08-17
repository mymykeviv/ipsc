import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, test, expect, beforeEach } from 'vitest'
import { Products } from '../../pages/Products'
import { BrowserRouter } from 'react-router-dom'

// Mock the API functions
vi.mock('../../lib/api', () => ({
  apiGetProducts: vi.fn().mockResolvedValue([
    { 
      id: 1, 
      name: 'Test Product', 
      description: 'Test Description',
      item_type: 'tradable',
      sales_price: 100,
      purchase_price: 80,
      stock: 50,
      sku: 'TEST001',
      unit: 'Pcs',
      supplier: 'Test Supplier',
      category: 'Electronics',
      notes: 'Test Notes',
      hsn: '123456',
      gst_rate: 18,
      is_active: true
    }
  ]),
  apiListParties: vi.fn().mockResolvedValue([
    { id: 1, name: 'Vendor 1', type: 'vendor' },
    { id: 2, name: 'Vendor 2', type: 'vendor' }
  ]),
  apiCreateProduct: vi.fn().mockResolvedValue({ id: 1, name: 'Test Product' }),
  apiUpdateProduct: vi.fn().mockResolvedValue({ id: 1, name: 'Updated Product' }),
  apiAdjustStock: vi.fn().mockResolvedValue({ ok: true, new_stock: 60 }),
  apiGetStockMovementHistory: vi.fn().mockResolvedValue([
    {
      product_id: 1,
      product_name: 'Test Product',
      financial_year: '2024',
      opening_stock: 0,
      incoming_stock: 50,
      outgoing_stock: 10,
      closing_stock: 40
    }
  ])
}))

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({})
}))

// Mock AuthContext
vi.mock('../../modules/AuthContext', () => ({
  useAuth: () => ({
    forceLogout: vi.fn()
  })
}))

describe('Products All Modes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('should render manage mode correctly', async () => {
    render(
      <BrowserRouter>
        <Products mode="manage" />
      </BrowserRouter>
    )

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText('Manage Products')).toBeInTheDocument()
    })

    // Check for main elements
    expect(screen.getByText('Add Product')).toBeInTheDocument()
    expect(screen.getByText('Export CSV')).toBeInTheDocument()
    expect(screen.getByText('Product Filters')).toBeInTheDocument()
  })

  test('should render add mode correctly', async () => {
    render(
      <BrowserRouter>
        <Products mode="add" />
      </BrowserRouter>
    )

    // Wait for the form to load
    await waitFor(() => {
      expect(screen.getByText('Add New Product')).toBeInTheDocument()
    })

    // Check for form elements
    expect(screen.getByLabelText(/Product Name/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Product Code/)).toBeInTheDocument()
    expect(screen.getByText('Add Product')).toBeInTheDocument()
  })

  test('should render edit mode correctly', async () => {
    // Mock useParams to return an ID
    vi.mocked(require('react-router-dom').useParams).mockReturnValue({ id: '1' })

    render(
      <BrowserRouter>
        <Products mode="edit" />
      </BrowserRouter>
    )

    // Wait for the form to load
    await waitFor(() => {
      expect(screen.getByText('Edit Product')).toBeInTheDocument()
    })

    // Check for form elements
    expect(screen.getByLabelText(/Product Name/)).toBeInTheDocument()
    expect(screen.getByText('Update Product')).toBeInTheDocument()
  })

  test('should render stock adjustment mode correctly', async () => {
    render(
      <BrowserRouter>
        <Products mode="stock-adjustment" />
      </BrowserRouter>
    )

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText('Stock Adjustment')).toBeInTheDocument()
    })

    // Check for form elements
    expect(screen.getByText('Product Selection')).toBeInTheDocument()
    expect(screen.getByText('Adjustment Details')).toBeInTheDocument()
    expect(screen.getByText('Adjust Stock')).toBeInTheDocument()
  })

  test('should render stock history mode correctly', async () => {
    render(
      <BrowserRouter>
        <Products mode="stock-history" />
      </BrowserRouter>
    )

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText('Stock Movement History')).toBeInTheDocument()
    })

    // Check for filter elements
    expect(screen.getByText('Stock Movement History Filters')).toBeInTheDocument()
  })

  test('should handle loading state correctly', () => {
    // Mock API to return a promise that never resolves
    vi.mocked(require('../../lib/api').apiGetProducts).mockImplementation(() => new Promise(() => {}))

    render(
      <BrowserRouter>
        <Products mode="manage" />
      </BrowserRouter>
    )

    // Should show loading state
    expect(screen.getByText('Loading products...')).toBeInTheDocument()
  })

  test('should handle error state correctly', async () => {
    // Mock API to throw an error
    vi.mocked(require('../../lib/api').apiGetProducts).mockRejectedValue(new Error('API Error'))

    render(
      <BrowserRouter>
        <Products mode="manage" />
      </BrowserRouter>
    )

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText('Error Loading Products')).toBeInTheDocument()
    })

    expect(screen.getByText('Retry Loading')).toBeInTheDocument()
  })
})
