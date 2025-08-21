import { render, screen, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom'
import { Products } from './Products'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../modules/AuthContext'
import * as api from '../lib/api'
import type { Product } from '../lib/api'

// Mock the API functions
vi.mock('../lib/api', () => ({
  apiGetProducts: vi.fn(),
  apiCreateProduct: vi.fn(),
  apiUpdateProduct: vi.fn(),
  apiToggleProduct: vi.fn(),
  apiAdjustStock: vi.fn(),
  apiListParties: vi.fn()
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

const mockVendors = [
  {
    id: 1,
    name: 'Test Vendor 1',
    type: 'vendor' as const,
    contact_person: 'John Doe',
    contact_number: '1234567890',
    email: 'john@testvendor.com',
    gstin: '22AAAAA0000A1Z5',
    gst_registration_status: 'GST registered',
    billing_address_line1: '123 Test Street',
    billing_address_line2: null,
    billing_city: 'Test City',
    billing_state: 'Test State',
    billing_country: 'India',
    billing_pincode: '123456',
    shipping_address_line1: null,
    shipping_address_line2: null,
    shipping_city: null,
    shipping_state: null,
    shipping_country: null,
    shipping_pincode: null,
    notes: null,
    gst_enabled: true,
    is_active: true
  },
  {
    id: 2,
    name: 'Test Vendor 2',
    type: 'vendor' as const,
    contact_person: 'Jane Smith',
    contact_number: '0987654321',
    email: 'jane@testvendor.com',
    gstin: '33BBBBB0000B2Z6',
    gst_registration_status: 'GST registered',
    billing_address_line1: '456 Test Avenue',
    billing_address_line2: null,
    billing_city: 'Test City 2',
    billing_state: 'Test State 2',
    billing_country: 'India',
    billing_pincode: '654321',
    shipping_address_line1: null,
    shipping_address_line2: null,
    shipping_city: null,
    shipping_state: null,
    shipping_country: null,
    shipping_pincode: null,
    notes: null,
    gst_enabled: true,
    is_active: true
  }
]

const renderWithProviders = (component: React.ReactElement, route = '/products') => {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        {component}
      </AuthProvider>
    </MemoryRouter>
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

  describe('Manage Mode', () => {
    it('should display products table with correct data', async () => {
      vi.mocked(api.apiGetProducts).mockResolvedValue(mockProducts)
      vi.mocked(api.apiListParties).mockResolvedValue(mockVendors)

      renderWithProviders(<Products mode="manage" />)

      await waitFor(() => {
        expect(screen.getByText('Test Product 1')).toBeInTheDocument()
        expect(screen.getByText('Test Product 2')).toBeInTheDocument()
        expect(screen.getByText('TEST001')).toBeInTheDocument()
        expect(screen.getByText('TEST002')).toBeInTheDocument()
      })
    })

    it('should show loading state initially', async () => {
      vi.mocked(api.apiGetProducts).mockImplementation(() => new Promise<Product[]>(() => {}))
      vi.mocked(api.apiListParties).mockResolvedValue(mockVendors)

      renderWithProviders(<Products mode="manage" />)

      expect(screen.getByText('Loading products...')).toBeInTheDocument()
    })

    it('should handle API errors gracefully', async () => {
      vi.mocked(api.apiGetProducts).mockRejectedValue(new Error('API Error'))
      vi.mocked(api.apiListParties).mockResolvedValue(mockVendors)

      renderWithProviders(<Products mode="manage" />)

      await waitFor(() => {
        expect(screen.getByText('Error Loading Products')).toBeInTheDocument()
      })
    })
  })

  describe('Add Mode', () => {
    it('should render add product form', async () => {
      vi.mocked(api.apiListParties).mockResolvedValue(mockVendors)

      renderWithProviders(<Products mode="add" />, '/products/add')

      await waitFor(() => {
        expect(screen.getByText('Add New Product')).toBeInTheDocument()
        expect(screen.getByText('Product Name *')).toBeInTheDocument()
        expect(screen.getByText('Product Code *')).toBeInTheDocument()
        expect(screen.getByText('SKU')).toBeInTheDocument()
      })
    })
  })

  describe('Edit Mode', () => {
    it('should render edit product form', async () => {
      vi.mocked(api.apiGetProducts).mockResolvedValue(mockProducts)
      vi.mocked(api.apiListParties).mockResolvedValue(mockVendors)

      renderWithProviders(<Products mode="edit" />, '/products/edit/1')

      await waitFor(() => {
        expect(screen.getByText('Edit Product')).toBeInTheDocument()
      })
    })
  })

  describe('Stock Adjustment Mode', () => {
    it('should render stock adjustment form', async () => {
      vi.mocked(api.apiGetProducts).mockResolvedValue(mockProducts)
      vi.mocked(api.apiListParties).mockResolvedValue(mockVendors)

      renderWithProviders(<Products mode="stock-adjustment" />, '/products/stock-adjustment')

      await waitFor(() => {
        expect(screen.getByText('Stock Adjustment')).toBeInTheDocument()
        expect(screen.getByText('Product Selection')).toBeInTheDocument()
      })
    })
  })

  describe('Stock History Mode', () => {
    it('should render stock history view', async () => {
      vi.mocked(api.apiGetProducts).mockResolvedValue(mockProducts)

      renderWithProviders(<Products mode="stock-history" />, '/products/stock-history')

      await waitFor(() => {
        expect(screen.getByText('Stock Movement History')).toBeInTheDocument()
      })
    })
  })
})


