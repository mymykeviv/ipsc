import React from 'react'
import { render, screen, fireEvent, waitFor } from '../../test-utils'
import { vi, describe, test, expect, beforeEach } from 'vitest'
import { Dashboard } from '../../pages/Dashboard'

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
    render(<Dashboard />)
    
    // Check if quick links are present
    expect(screen.getByText('📄 New Invoice')).toBeInTheDocument()
    expect(screen.getByText('📦 New Purchase')).toBeInTheDocument()
    expect(screen.getByText('🏷️ Add Product')).toBeInTheDocument()
  })

  test('should navigate to add product page when Add Product button is clicked', async () => {
    render(<Dashboard />)
    
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
    render(<Dashboard />)
    
    const newInvoiceButton = screen.getByText('📄 New Invoice')
    fireEvent.click(newInvoiceButton)
    
    expect(mockNavigate).toHaveBeenCalledWith('/invoices/add')
  })
})
