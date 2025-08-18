/**
 * Tests for In-Review Features
 * - Invoice Template System
 * - Payment Management Enhancements
 * - Stock Management System
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi, describe, test, expect, beforeEach } from 'vitest'
import '@testing-library/jest-dom'

// Mock API calls
vi.mock('../../lib/api', () => ({
  apiGetInvoiceTemplates: vi.fn(),
  apiCreateInvoiceTemplate: vi.fn(),
  apiUpdateInvoiceTemplate: vi.fn(),
  apiDeleteInvoiceTemplate: vi.fn(),
  apiSetDefaultTemplate: vi.fn(),
  apiGetInvoicePDF: vi.fn(),
  apiAddPayment: vi.fn(),
  apiAddPurchasePayment: vi.fn(),
  apiGetStockHistory: vi.fn(),
  apiGetStockLedgerHistory: vi.fn(),
}))

// Mock AuthContext
vi.mock('../../modules/AuthContext', () => ({
  useAuth: () => ({
    token: 'test-token',
    isAuthenticated: true,
    logout: vi.fn(),
  }),
}))

// Import components to test
import { InvoiceTemplateManager } from '../InvoiceTemplateManager'
import { PaymentForm } from '../PaymentForm'
import { StockAdjustmentForm } from '../StockAdjustmentForm'
import { StockHistoryForm } from '../StockHistoryForm'

describe('In-Review Features', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Invoice Template System', () => {
    test('should create new invoice template', async () => {
      const { apiCreateInvoiceTemplate } = await import('../../lib/api')
      vi.mocked(apiCreateInvoiceTemplate).mockResolvedValue({
        id: 1,
        name: 'Test Template',
        description: 'Test template description',
        template_type: 'professional',
        primary_color: '#007bff',
        secondary_color: '#6c757d',
        accent_color: '#28a745',
        header_font: 'Arial',
        body_font: 'Arial',
        header_font_size: 16,
        body_font_size: 12,
        show_company_details: true,
        show_customer_details: true,
        show_item_details: true,
        show_tax_details: true,
        show_payment_terms: true,
        is_default: false,
        is_active: true
      })

      render(
        <BrowserRouter>
          <InvoiceTemplateManager />
        </BrowserRouter>
      )

      // Fill in template form
      fireEvent.change(screen.getByLabelText(/template name/i), {
        target: { value: 'Test Template' }
      })
      fireEvent.change(screen.getByLabelText(/description/i), {
        target: { value: 'Test template description' }
      })
      fireEvent.change(screen.getByLabelText(/template type/i), {
        target: { value: 'professional' }
      })

      // Submit form
      fireEvent.click(screen.getByText('Create Template'))

      await waitFor(() => {
        expect(apiCreateInvoiceTemplate).toHaveBeenCalledWith({
          name: 'Test Template',
          description: 'Test template description',
          template_type: 'professional',
          primary_color: '#007bff',
          secondary_color: '#6c757d',
          accent_color: '#28a745',
          header_font: 'Arial',
          body_font: 'Arial',
          header_font_size: 16,
          body_font_size: 12,
          show_company_details: true,
          show_customer_details: true,
          show_item_details: true,
          show_tax_details: true,
          show_payment_terms: true,
          is_default: false,
          is_active: true
        })
      })
    })

    test('should edit existing template', async () => {
      const { apiUpdateInvoiceTemplate } = await import('../../lib/api')
      vi.mocked(apiUpdateInvoiceTemplate).mockResolvedValue({
        id: 1,
        name: 'Updated Test Template',
        description: 'Updated description',
        template_type: 'professional',
        primary_color: '#007bff',
        secondary_color: '#6c757d',
        accent_color: '#28a745',
        header_font: 'Arial',
        body_font: 'Arial',
        header_font_size: 16,
        body_font_size: 12,
        show_company_details: true,
        show_customer_details: true,
        show_item_details: true,
        show_tax_details: true,
        show_payment_terms: true,
        is_default: false,
        is_active: true
      })

      render(
        <BrowserRouter>
          <InvoiceTemplateManager />
        </BrowserRouter>
      )

      // Edit template
      fireEvent.change(screen.getByLabelText(/template name/i), {
        target: { value: 'Updated Test Template' }
      })
      fireEvent.change(screen.getByLabelText(/description/i), {
        target: { value: 'Updated description' }
      })

      // Submit form
      fireEvent.click(screen.getByText('Update Template'))

      await waitFor(() => {
        expect(apiUpdateInvoiceTemplate).toHaveBeenCalledWith(1, {
          name: 'Updated Test Template',
          description: 'Updated description'
        })
      })
    })

    test('should generate PDF with template', async () => {
      const { apiGetInvoicePDF } = await import('../../lib/api')
      vi.mocked(apiGetInvoicePDF).mockResolvedValue(new Blob(['PDF content'], { type: 'application/pdf' }))

      render(
        <BrowserRouter>
          <InvoiceTemplateManager />
        </BrowserRouter>
      )

      // Select template and generate PDF
      fireEvent.change(screen.getByLabelText(/select template/i), {
        target: { value: '1' }
      })
      fireEvent.click(screen.getByText('Generate PDF'))

      await waitFor(() => {
        expect(apiGetInvoicePDF).toHaveBeenCalledWith(1, '1')
      })
    })

    test('should customize template fields', async () => {
      render(
        <BrowserRouter>
          <InvoiceTemplateManager />
        </BrowserRouter>
      )

      // Test color customization
      fireEvent.change(screen.getByLabelText(/primary color/i), {
        target: { value: '#ff6b6b' }
      })
      fireEvent.change(screen.getByLabelText(/secondary color/i), {
        target: { value: '#4ecdc4' }
      })
      fireEvent.change(screen.getByLabelText(/accent color/i), {
        target: { value: '#45b7d1' }
      })

      // Test font customization
      fireEvent.change(screen.getByLabelText(/header font/i), {
        target: { value: 'Helvetica' }
      })
      fireEvent.change(screen.getByLabelText(/body font/i), {
        target: { value: 'Times New Roman' }
      })

      // Test font size customization
      fireEvent.change(screen.getByLabelText(/header font size/i), {
        target: { value: '18' }
      })
      fireEvent.change(screen.getByLabelText(/body font size/i), {
        target: { value: '14' }
      })

      // Test field visibility customization
      fireEvent.click(screen.getByLabelText(/show payment terms/i))

      // Verify customization options are applied
      expect(screen.getByDisplayValue('#ff6b6b')).toBeInTheDocument()
      expect(screen.getByDisplayValue('#4ecdc4')).toBeInTheDocument()
      expect(screen.getByDisplayValue('#45b7d1')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Helvetica')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Times New Roman')).toBeInTheDocument()
      expect(screen.getByDisplayValue('18')).toBeInTheDocument()
      expect(screen.getByDisplayValue('14')).toBeInTheDocument()
    })
  })

  describe('Payment Management Enhancements', () => {
    test('should add payment with multiple methods', async () => {
      const { apiAddPayment } = await import('../../lib/api')
      vi.mocked(apiAddPayment).mockResolvedValue({
        id: 1,
        payment_amount: 100.00,
        payment_method: 'Bank Transfer',
        account_head: 'Bank',
        reference_number: 'REF123',
        invoice_id: 1
      })

      render(
        <BrowserRouter>
          <PaymentForm invoiceId={1} onSuccess={vi.fn()} />
        </BrowserRouter>
      )

      // Fill payment form
      fireEvent.change(screen.getByLabelText(/payment amount/i), {
        target: { value: '100.00' }
      })
      fireEvent.change(screen.getByLabelText(/payment method/i), {
        target: { value: 'Bank Transfer' }
      })
      fireEvent.change(screen.getByLabelText(/account head/i), {
        target: { value: 'Bank' }
      })
      fireEvent.change(screen.getByLabelText(/reference number/i), {
        target: { value: 'REF123' }
      })

      // Submit form
      fireEvent.click(screen.getByText('Add Payment'))

      await waitFor(() => {
        expect(apiAddPayment).toHaveBeenCalledWith({
          payment_amount: 100.00,
          payment_method: 'Bank Transfer',
          account_head: 'Bank',
          reference_number: 'REF123',
          invoice_id: 1
        })
      })
    })

    test('should validate payment amounts', async () => {
      render(
        <BrowserRouter>
          <PaymentForm invoiceId={1} onSuccess={vi.fn()} />
        </BrowserRouter>
      )

      // Test valid amounts
      const validAmounts = ['0.01', '100.00', '1000.50', '999999.99']
      
      for (const amount of validAmounts) {
        fireEvent.change(screen.getByLabelText(/payment amount/i), {
          target: { value: amount }
        })
        
        // Should not show validation error
        expect(screen.queryByText(/invalid amount/i)).not.toBeInTheDocument()
      }

      // Test invalid amounts
      const invalidAmounts = ['-100', '0', 'abc']
      
      for (const amount of invalidAmounts) {
        fireEvent.change(screen.getByLabelText(/payment amount/i), {
          target: { value: amount }
        })
        
        // Should show validation error
        expect(screen.getByText(/invalid amount/i)).toBeInTheDocument()
      }
    })

    test('should handle payment errors', async () => {
      const { apiAddPayment } = await import('../../lib/api')
      vi.mocked(apiAddPayment).mockRejectedValue(new Error('Payment failed'))

      render(
        <BrowserRouter>
          <PaymentForm invoiceId={1} onSuccess={vi.fn()} />
        </BrowserRouter>
      )

      // Fill and submit form
      fireEvent.change(screen.getByLabelText(/payment amount/i), {
        target: { value: '100.00' }
      })
      fireEvent.change(screen.getByLabelText(/payment method/i), {
        target: { value: 'Cash' }
      })
      fireEvent.change(screen.getByLabelText(/account head/i), {
        target: { value: 'Cash' }
      })

      fireEvent.click(screen.getByText('Add Payment'))

      await waitFor(() => {
        expect(screen.getByText(/payment failed/i)).toBeInTheDocument()
      })
    })

    test('should track payment history', async () => {
      const { apiGetPayments } = await import('../../lib/api')
      vi.mocked(apiGetPayments).mockResolvedValue([
        {
          id: 1,
          payment_amount: 100.00,
          payment_method: 'Cash',
          account_head: 'Cash',
          reference_number: 'REF123',
          created_at: '2024-01-15T10:00:00Z'
        }
      ])

      render(
        <BrowserRouter>
          <PaymentForm invoiceId={1} onSuccess={vi.fn()} />
        </BrowserRouter>
      )

      // Verify payment history is displayed
      await waitFor(() => {
        expect(screen.getByText('Payment History')).toBeInTheDocument()
        expect(screen.getByText('₹100.00')).toBeInTheDocument()
        expect(screen.getByText('Cash')).toBeInTheDocument()
      })
    })
  })

  describe('Stock Management System', () => {
    test('should adjust stock levels', async () => {
      const { apiAdjustStock } = await import('../../lib/api')
      vi.mocked(apiAdjustStock).mockResolvedValue({
        id: 1,
        product_id: 1,
        qty: 50.0,
        entry_type: 'in',
        ref_type: 'adjustment',
        notes: 'Test stock adjustment'
      })

      render(
        <BrowserRouter>
          <StockAdjustmentForm onSuccess={vi.fn()} />
        </BrowserRouter>
      )

      // Fill stock adjustment form
      fireEvent.change(screen.getByLabelText(/product/i), {
        target: { value: '1' }
      })
      fireEvent.change(screen.getByLabelText(/quantity/i), {
        target: { value: '50' }
      })
      fireEvent.change(screen.getByLabelText(/entry type/i), {
        target: { value: 'in' }
      })
      fireEvent.change(screen.getByLabelText(/reference type/i), {
        target: { value: 'adjustment' }
      })
      fireEvent.change(screen.getByLabelText(/notes/i), {
        target: { value: 'Test stock adjustment' }
      })

      // Submit form
      fireEvent.click(screen.getByText('Adjust Stock'))

      await waitFor(() => {
        expect(apiAdjustStock).toHaveBeenCalledWith({
          product_id: 1,
          qty: 50.0,
          entry_type: 'in',
          ref_type: 'adjustment',
          notes: 'Test stock adjustment'
        })
      })
    })

    test('should track stock history', async () => {
      const { apiGetStockHistory } = await import('../../lib/api')
      vi.mocked(apiGetStockHistory).mockResolvedValue([
        {
          id: 1,
          product_id: 1,
          qty: 50.0,
          entry_type: 'in',
          ref_type: 'purchase',
          ref_id: 1,
          created_at: '2024-01-15T10:00:00Z'
        },
        {
          id: 2,
          product_id: 1,
          qty: 20.0,
          entry_type: 'out',
          ref_type: 'invoice',
          ref_id: 1,
          created_at: '2024-01-15T11:00:00Z'
        }
      ])

      render(
        <BrowserRouter>
          <StockHistoryForm />
        </BrowserRouter>
      )

      // Verify stock history is displayed
      await waitFor(() => {
        expect(screen.getByText('Stock History')).toBeInTheDocument()
        expect(screen.getByText('+50.0')).toBeInTheDocument()
        expect(screen.getByText('-20.0')).toBeInTheDocument()
      })
    })

    test('should calculate running balance', async () => {
      const { apiGetStockLedgerHistory } = await import('../../lib/api')
      vi.mocked(apiGetStockLedgerHistory).mockResolvedValue([
        {
          id: 1,
          product_id: 1,
          qty: 100.0,
          entry_type: 'in',
          ref_type: 'opening',
          running_balance: 100.0,
          created_at: '2024-01-15T09:00:00Z'
        },
        {
          id: 2,
          product_id: 1,
          qty: 50.0,
          entry_type: 'in',
          ref_type: 'purchase',
          running_balance: 150.0,
          created_at: '2024-01-15T10:00:00Z'
        },
        {
          id: 3,
          product_id: 1,
          qty: 30.0,
          entry_type: 'out',
          ref_type: 'invoice',
          running_balance: 120.0,
          created_at: '2024-01-15T11:00:00Z'
        }
      ])

      render(
        <BrowserRouter>
          <StockHistoryForm />
        </BrowserRouter>
      )

      // Verify running balance calculation
      await waitFor(() => {
        expect(screen.getByText('Stock Ledger')).toBeInTheDocument()
        expect(screen.getByText('100.0')).toBeInTheDocument()
        expect(screen.getByText('150.0')).toBeInTheDocument()
        expect(screen.getByText('120.0')).toBeInTheDocument()
      })
    })

    test('should handle stock errors', async () => {
      const { apiAdjustStock } = await import('../../lib/api')
      vi.mocked(apiAdjustStock).mockRejectedValue(new Error('Stock adjustment failed'))

      render(
        <BrowserRouter>
          <StockAdjustmentForm onSuccess={vi.fn()} />
        </BrowserRouter>
      )

      // Fill and submit form
      fireEvent.change(screen.getByLabelText(/product/i), {
        target: { value: '1' }
      })
      fireEvent.change(screen.getByLabelText(/quantity/i), {
        target: { value: '50' }
      })
      fireEvent.change(screen.getByLabelText(/entry type/i), {
        target: { value: 'in' }
      })
      fireEvent.change(screen.getByLabelText(/reference type/i), {
        target: { value: 'adjustment' }
      })

      fireEvent.click(screen.getByText('Adjust Stock'))

      await waitFor(() => {
        expect(screen.getByText(/stock adjustment failed/i)).toBeInTheDocument()
      })
    })
  })
})
