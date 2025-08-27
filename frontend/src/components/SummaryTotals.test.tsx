import { render, screen } from '@testing-library/react'
import React from 'react'
import { SummaryTotals } from './SummaryTotals'
import type { InvoiceSummaryTotals } from '../lib/api'

const totals: InvoiceSummaryTotals = {
  count: 2,
  subtotal: 300,
  discount: 15,
  tax: 47,
  total: 341,
  amount_paid: 150,
  outstanding: 191,
  currency: 'INR',
}

describe('SummaryTotals', () => {
  it('renders labels and formatted values', () => {
    render(<SummaryTotals totals={totals} />)

    expect(screen.getByText('Invoices')).toBeInTheDocument()
    expect(screen.getByText('Subtotal')).toBeInTheDocument()
    expect(screen.getByText('Discount')).toBeInTheDocument()
    expect(screen.getByText('Tax')).toBeInTheDocument()
    expect(screen.getByText('Total')).toBeInTheDocument()
    expect(screen.getByText('Amount Paid')).toBeInTheDocument()
    expect(screen.getByText('Outstanding')).toBeInTheDocument()

    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('₹300.00')).toBeInTheDocument()
    expect(screen.getByText('₹15.00')).toBeInTheDocument()
    expect(screen.getByText('₹47.00')).toBeInTheDocument()
    expect(screen.getByText('₹341.00')).toBeInTheDocument()
    expect(screen.getByText('₹150.00')).toBeInTheDocument()
    expect(screen.getByText('₹191.00')).toBeInTheDocument()
  })
})
