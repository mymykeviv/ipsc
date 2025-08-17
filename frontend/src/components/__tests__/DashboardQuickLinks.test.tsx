import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, test, expect, beforeEach } from 'vitest'
import { Dashboard } from '../../pages/Dashboard'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../../modules/AuthContext'

// Mock the API functions
vi.mock('../../lib/api', () => ({
  apiGetCashflowSummary: vi.fn(() => Promise.resolve({
    period: {
      start_date: '2025-01-01',
      end_date: '2025-01-31'
    },
    income: {
      total_invoice_amount: 10000,
      total_payments_received: 8000
    },
    expenses: {
      total_expenses: 5000,
      total_purchase_payments: 3000,
      total_outflow: 8000
    },
    cashflow: {
      net_cashflow: 0,
      cash_inflow: 8000,
      cash_outflow: 8000
    }
  }))
}))

// Mock the AuthContext
vi.mock('../../modules/AuthContext', () => ({
  useAuth: () => ({
    token: 'mock-token',
    forceLogout: vi.fn()
  })
}))

// Mock the apiUtils
vi.mock('../../lib/apiUtils', () => ({
  createApiErrorHandler: vi.fn(() => vi.fn())
}))

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useNavigate: () => mockNavigate
}))

describe('Dashboard Quick Links', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('should render Dashboard with quick links', () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    )
    
    // Check if quick links are present
    expect(screen.getByText('📄 New Invoice')).toBeInTheDocument()
    expect(screen.getByText('📦 New Purchase')).toBeInTheDocument()
    expect(screen.getByText('🏷️ Add Product')).toBeInTheDocument()
  })

  test('should navigate to add product page when Add Product button is clicked', async () => {
    render(
      <AuthProvider>
        <Dashboard />
      </AuthProvider>
    )
    
    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText('🏷️ Add Product')).toBeInTheDocument()
    })
    
    // Click the Add Product button
    const addProductButton = screen.getByText('🏷️ Add Product')
    fireEvent.click(addProductButton)
    
    // Verify navigation was called with correct path
    expect(mockNavigate).toHaveBeenCalledWith('/products/add')
  })

  test('should navigate to add invoice when New Invoice button is clicked', () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    )
    
    const newInvoiceButton = screen.getByText('📄 New Invoice')
    fireEvent.click(newInvoiceButton)
    
    expect(mockNavigate).toHaveBeenCalledWith('/invoices/add')
  })

  test('should navigate to add purchase when New Purchase button is clicked', () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    )
    
    const newPurchaseButton = screen.getByText('📦 New Purchase')
    fireEvent.click(newPurchaseButton)
    
    expect(mockNavigate).toHaveBeenCalledWith('/purchases/add')
  })

  test('should handle API errors gracefully', async () => {
    const mockApiGetCashflowSummary = vi.fn().mockRejectedValue(new Error('API Error'))
    vi.mocked(require('../../lib/api').apiGetCashflowSummary).mockImplementation(mockApiGetCashflowSummary)
    
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    )
    
    // Should still render quick links even if API fails
    expect(screen.getByText('🏷️ Add Product')).toBeInTheDocument()
  })
})
