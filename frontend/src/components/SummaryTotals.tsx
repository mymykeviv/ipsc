import React from 'react'
import type { InvoiceSummaryTotals } from '../lib/api'
import { SummaryCardGrid, type SummaryCardItem } from './common/SummaryCardGrid'

interface Props {
  totals: InvoiceSummaryTotals
}

export function SummaryTotals({ totals }: Props) {
  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount)

  // Graceful fallbacks if any new fields are absent
  const paidCount = (totals as any).paid_count ?? 0
  const outstandingCount = (totals as any).outstanding_count ?? 0
  const overdueCount = (totals as any).overdue_count ?? 0
  const overdueAvgDays = (totals as any).overdue_avg_days ?? 0

  const items: SummaryCardItem[] = [
    {
      label: 'Total Amount',
      primary: formatCurrency(totals.total || 0),
      secondary: `${(totals.count || 0).toLocaleString('en-IN')} Invoices`,
      accentColor: '#0d6efd', // blue - consistent with existing summary accents
    },
    {
      label: 'Amount Paid',
      primary: formatCurrency(totals.amount_paid || 0),
      secondary: `${paidCount.toLocaleString('en-IN')} Invoices Paid (incl. partial payments)`,
      accentColor: '#198754', // green
    },
    {
      label: 'Outstanding Amount',
      primary: formatCurrency(totals.outstanding || 0),
      secondary: `${outstandingCount.toLocaleString('en-IN')} Invoices Outstanding (incl. partial payments)`,
      accentColor: '#fd7e14', // orange
    },
    {
      label: 'Overdue Invoices',
      primary: overdueCount.toLocaleString('en-IN'),
      secondary: `Avg. ${overdueAvgDays} days`,
      accentColor: '#dc3545', // red
    },
  ]

  return <SummaryCardGrid items={items} columnsMin={220} gapPx={12} />
}

export default SummaryTotals
