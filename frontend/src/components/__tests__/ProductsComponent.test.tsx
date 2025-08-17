import React from 'react'
import { render, screen } from '@testing-library/react'
import { vi, describe, test, expect } from 'vitest'
import { Products } from '../../pages/Products'
import { BrowserRouter } from 'react-router-dom'

// Mock the API functions
vi.mock('../../lib/api', () => ({
  apiGetProducts: vi.fn(() => Promise.resolve([])),
  apiCreateProduct: vi.fn(),
  apiUpdateProduct: vi.fn(),
  apiToggleProduct: vi.fn(),
  apiAdjustStock: vi.fn(),
  apiListParties: vi.fn(() => Promise.resolve([])),
  apiGetStockMovementHistory: vi.fn(() => Promise.resolve([]))
}))

// Mock the AuthContext
vi.mock('../../modules/AuthContext', () => ({
  useAuth: () => ({
    forceLogout: vi.fn()
  })
}))

// Mock the apiUtils
vi.mock('../../lib/apiUtils', () => ({
  createApiErrorHandler: vi.fn(() => vi.fn())
}))

describe('Products Component', () => {
  test('should render manage mode by default', () => {
    render(
      <BrowserRouter>
        <Products />
      </BrowserRouter>
    )
    
    // Should show loading initially
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  test('should render add mode', () => {
    render(
      <BrowserRouter>
        <Products mode="add" />
      </BrowserRouter>
    )
    
    // Should show the add product form
    expect(screen.getByText('Add Product')).toBeInTheDocument()
  })

  test('should render edit mode', () => {
    render(
      <BrowserRouter>
        <Products mode="edit" />
      </BrowserRouter>
    )
    
    // Should show loading initially
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })
})
