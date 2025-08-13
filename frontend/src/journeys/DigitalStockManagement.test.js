import { jsx as _jsx } from "react/jsx-runtime";
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from '../modules/App';
// Mock APIs
vi.mock('../lib/api', async (orig) => {
    const mod = await orig();
    let onhand = 100;
    return {
        ...mod,
        apiLogin: vi.fn(async (u, p) => {
            if (u === 'admin' && p === 'admin123')
                return { access_token: 'dummy.jwt.token', token_type: 'bearer' };
            throw new Error('Invalid credentials');
        }),
        apiListProducts: vi.fn(async () => ([{ id: 1, sku: 'MSB-001', name: 'Mild Steel Bracket', hsn: '7308', uom: 'NOS', gst_rate: 18, price: 250 }])),
        apiListParties: vi.fn(async () => ([
            { id: 10, type: 'vendor', name: 'Fabrication Vendor', state: 'Karnataka' },
            { id: 20, type: 'customer', name: 'Acme Industries', state: 'Maharashtra' },
        ])),
        apiGetStockSummary: vi.fn(async () => ([{ product_id: 1, sku: 'MSB-001', name: 'Mild Steel Bracket', onhand }])),
        apiCreatePurchase: vi.fn(async (_token, _payload) => { onhand += 10; return { id: 500 }; }),
        apiCreateInvoice: vi.fn(async (_token, _payload) => { onhand -= 5; return { id: 900, invoice_no: 'INV-00001' }; }),
    };
});
// Provide a deterministic exp parser usage by setting an exp in localStorage directly
beforeEach(() => {
    localStorage.clear();
    // Pre-authenticate to focus on stock journey steps (simulate prior successful login)
    const future = Date.now() + 30 * 60 * 1000;
    localStorage.setItem('auth_token', 'dummy.jwt.token');
    localStorage.setItem('auth_exp', String(future));
});
describe('Digital Stock Management journey', () => {
    it('adds incoming stock via purchase, then reduces via invoice, reflecting in Stock summary', async () => {
        render(_jsx(MemoryRouter, { initialEntries: ["/stock"], children: _jsx(App, {}) }));
        // 1) View initial stock
        await waitFor(() => expect(screen.getByRole('heading', { name: /stock/i })).toBeInTheDocument());
        const table = screen.getByTestId('stock-table');
        expect(within(table).getByText('MSB-001')).toBeInTheDocument();
        expect(within(table).getByText('Mild Steel Bracket')).toBeInTheDocument();
        expect(within(table).getByText('100')).toBeInTheDocument();
        // 2) Create purchase (incoming +10)
        // navigate to Purchases
        fireEvent.click(screen.getByRole('link', { name: 'Purchases' }));
        await waitFor(() => expect(screen.getByRole('heading', { name: /purchases/i })).toBeInTheDocument());
        // select vendor
        fireEvent.change(screen.getByTestId('purchase-vendor'), { target: { value: '10' } });
        // select product
        fireEvent.change(screen.getByTestId('purchase-product'), { target: { value: '1' } });
        // qty stays default 1; set to 10
        fireEvent.change(screen.getByTestId('purchase-qty'), { target: { value: '10' } });
        // click create
        fireEvent.click(screen.getByRole('button', { name: /create/i }));
        await waitFor(() => expect(screen.getByText(/Purchase created/i)).toBeInTheDocument());
        // 3) Verify stock increased to 110
        fireEvent.click(screen.getByRole('link', { name: 'Stock' }));
        await waitFor(() => expect(screen.getByRole('heading', { name: /stock/i })).toBeInTheDocument());
        const table2 = screen.getByTestId('stock-table');
        expect(within(table2).getByText('110')).toBeInTheDocument();
        // 4) Create invoice (outgoing -5)
        fireEvent.click(screen.getByRole('link', { name: 'Invoices' }));
        await waitFor(() => expect(screen.getByRole('heading', { name: /create invoice/i })).toBeInTheDocument());
        fireEvent.change(screen.getByTestId('invoice-customer'), { target: { value: '20' } });
        fireEvent.change(screen.getByTestId('invoice-product'), { target: { value: '1' } });
        fireEvent.change(screen.getByTestId('invoice-qty'), { target: { value: '5' } });
        fireEvent.click(screen.getByRole('button', { name: /create/i }));
        await waitFor(() => expect(screen.getByText(/Invoice created/i)).toBeInTheDocument());
        // 5) Verify stock decreased to 105
        fireEvent.click(screen.getByRole('link', { name: 'Stock' }));
        await waitFor(() => expect(screen.getByRole('heading', { name: /stock/i })).toBeInTheDocument());
        const table3 = screen.getByTestId('stock-table');
        expect(within(table3).getByText('105')).toBeInTheDocument();
    });
});
