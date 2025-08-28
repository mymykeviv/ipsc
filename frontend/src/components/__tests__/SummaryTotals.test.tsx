import React from 'react';
import { render, screen } from '@testing-library/react';
import { SummaryTotals } from '../SummaryTotals';
import type { InvoiceSummaryTotals } from '../../lib/api';

describe('SummaryTotals', () => {
  const mockTotals: InvoiceSummaryTotals = {
    count: 10,
    subtotal: 50000,
    discount: 5000,
    tax: 9000,
    total: 54000,
    amount_paid: 30000,
    outstanding: 24000,
    paid_count: 6,
    outstanding_count: 4,
    overdue_count: 2,
    overdue_avg_days: 15,
    currency: 'INR'
  };

  it('renders all summary cards with correct values', () => {
    render(<SummaryTotals totals={mockTotals} />);
    
    // Total Amount
    expect(screen.getByText('Total Amount')).toBeInTheDocument();
    expect(screen.getByText('₹54,000.00')).toBeInTheDocument();
    expect(screen.getByText('10 Invoices')).toBeInTheDocument();
    
    // Amount Paid
    expect(screen.getByText('Amount Paid')).toBeInTheDocument();
    expect(screen.getByText('₹30,000.00')).toBeInTheDocument();
    expect(screen.getByText('6 Invoices Paid (incl. partial payments)')).toBeInTheDocument();
    
    // Outstanding Amount
    expect(screen.getByText('Outstanding Amount')).toBeInTheDocument();
    expect(screen.getByText('₹24,000.00')).toBeInTheDocument();
    expect(screen.getByText('4 Invoices Outstanding (incl. partial payments)')).toBeInTheDocument();
    
    // Overdue Invoices
    expect(screen.getByText('Overdue Invoices')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Avg. 15 days')).toBeInTheDocument();
  });

  it('handles missing optional fields gracefully', () => {
    const partialTotals = {
      ...mockTotals,
      paid_count: undefined,
      outstanding_count: undefined,
      overdue_count: undefined,
      overdue_avg_days: undefined,
    };
    
    render(<SummaryTotals totals={partialTotals as any} />);
    
    // Should still render with 0 values
    expect(screen.getByText('0 Invoices Paid')).toBeInTheDocument();
    expect(screen.getByText('0 Invoices Outstanding')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument(); // Overdue count
    expect(screen.getByText('Avg. 0 days')).toBeInTheDocument();
  });
});
