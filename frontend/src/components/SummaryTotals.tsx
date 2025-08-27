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

  const items: Array<{ label: string; value: string }> = [
    { label: 'Invoices', value: totals.count.toLocaleString('en-IN') },
    { label: 'Subtotal', value: formatCurrency(totals.subtotal) },
    { label: 'Discount', value: formatCurrency(totals.discount) },
    { label: 'Tax', value: formatCurrency(totals.tax) },
    { label: 'Total', value: formatCurrency(totals.total) },
    { label: 'Amount Paid', value: formatCurrency(totals.amount_paid) },
    { label: 'Outstanding', value: formatCurrency(totals.outstanding) },
  ]

  return (
    <SummaryCardGrid
      items={(
        [
          { label: 'Invoices', primary: totals.count.toLocaleString('en-IN') },
          { label: 'Subtotal', primary: formatCurrency(totals.subtotal) },
          { label: 'Discount', primary: formatCurrency(totals.discount) },
          { label: 'Tax', primary: formatCurrency(totals.tax) },
          { label: 'Total', primary: formatCurrency(totals.total) },
          { label: 'Amount Paid', primary: formatCurrency(totals.amount_paid) },
          { label: 'Outstanding', primary: formatCurrency(totals.outstanding) },
        ] as SummaryCardItem[]
      )}
    />
  )
}

export default SummaryTotals
