import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, test, expect, beforeEach } from 'vitest'
import { Products } from '../../pages/Products'
import { BrowserRouter } from 'react-router-dom'

// Mock the API functions
vi.mock('../../lib/api', () => ({
  apiListParties: vi.fn().mockResolvedValue([
    { id: 1, name: 'Vendor 1', type: 'vendor' },
    { id: 2, name: 'Vendor 2', type: 'vendor' }
  ]),
  apiCreateProduct: vi.fn().mockResolvedValue({ id: 1, name: 'Test Product' })
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

describe('Products Add Mode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('should render add product form correctly', async () => {
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
    expect(screen.getByLabelText(/SKU/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Unit of Measure/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Sales Price/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Purchase Price/)).toBeInTheDocument()
    expect(screen.getByLabelText(/GST Rate/)).toBeInTheDocument()
    expect(screen.getByLabelText(/HSN Code/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Opening Stock/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Description/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Notes/)).toBeInTheDocument()

    // Check for submit button
    expect(screen.getByText('Add Product')).toBeInTheDocument()
    expect(screen.getByText('← Back to Products')).toBeInTheDocument()
  })

  test('should handle form submission correctly', async () => {
    render(
      <BrowserRouter>
        <Products mode="add" />
      </BrowserRouter>
    )

    // Wait for the form to load
    await waitFor(() => {
      expect(screen.getByText('Add New Product')).toBeInTheDocument()
    })

    // Fill in required fields
    fireEvent.change(screen.getByLabelText(/Product Name/), {
      target: { value: 'Test Product' }
    })
    fireEvent.change(screen.getByLabelText(/Product Code/), {
      target: { value: 'TEST001' }
    })
    fireEvent.change(screen.getByLabelText(/Sales Price/), {
      target: { value: '100.00' }
    })
    fireEvent.change(screen.getByLabelText(/Opening Stock/), {
      target: { value: '10' }
    })

    // Submit the form
    const submitButton = screen.getByText('Add Product')
    fireEvent.click(submitButton)

    // Wait for navigation
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/products')
    })
  })

  test('should show loading state initially', () => {
    render(
      <BrowserRouter>
        <Products mode="add" />
      </BrowserRouter>
    )

    // Should show loading initially
    expect(screen.getByText('Loading form...')).toBeInTheDocument()
  })

  test('should handle back navigation', async () => {
    render(
      <BrowserRouter>
        <Products mode="add" />
      </BrowserRouter>
    )

    // Wait for the form to load
    await waitFor(() => {
      expect(screen.getByText('Add New Product')).toBeInTheDocument()
    })

    // Click back button
    const backButton = screen.getByText('← Back to Products')
    fireEvent.click(backButton)

    // Verify navigation
    expect(mockNavigate).toHaveBeenCalledWith('/products')
  })
})
