import { render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { Invoices } from './Invoices'
import * as flags from '../config/featureFlags'

// Vitest globals
import { vi } from 'vitest'

// Mock AuthContext hook to provide token
vi.mock('../modules/AuthContext', () => ({
  useAuth: () => ({ token: 't', forceLogout: () => {} })
}))

describe('Invoices page totals integration', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    // enable flag
    vi.spyOn(flags, 'featureFlags', 'get').mockReturnValue({ invoicesSummaryTotals: true } as any)
    // mock fetch for invoice list
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        invoices: [],
        pagination: { page: 1, limit: 10, total_count: 0, total_pages: 0, has_next: false, has_prev: false },
        meta: {
          totals: {
            count: 2,
            subtotal: 300,
            discount: 15,
            tax: 47,
            total: 341,
            amount_paid: 150,
            outstanding: 191,
            currency: 'INR',
          }
        }
      })
    } as any)
  })

  it('renders SummaryTotals when meta.totals is present and feature flag is on', async () => {
    render(<Invoices mode="manage" />)

    await waitFor(() => {
      expect(screen.getByText('Subtotal')).toBeInTheDocument()
      expect(screen.getByText('₹300.00')).toBeInTheDocument()
    })
  })
})
