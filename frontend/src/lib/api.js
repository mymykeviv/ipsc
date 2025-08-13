export async function apiLogin(username, password) {
    const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });
    if (!r.ok)
        throw new Error('Invalid credentials');
    return r.json();
}
export async function apiGetProducts() {
    const r = await fetch('/api/products', {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
    });
    if (r.status === 401)
        throw new Error('unauthorized');
    if (!r.ok)
        throw new Error('failed');
    return r.json();
}
export async function apiCreateProduct(payload) {
    const r = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
        body: JSON.stringify(payload)
    });
    if (!r.ok) {
        // Try to extract error details from response
        try {
            const errorData = await r.json();
            throw new Error(errorData.detail || `HTTP ${r.status}: ${r.statusText}`);
        }
        catch (parseError) {
            // If we can't parse the error response, throw a generic error with status
            throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        }
    }
    return r.json();
}
export async function apiUpdateProduct(id, payload) {
    const r = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
        body: JSON.stringify(payload)
    });
    if (!r.ok)
        throw new Error('failed');
    return r.json();
}
export async function apiToggleProduct(id) {
    const r = await fetch(`/api/products/${id}/toggle`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
    });
    if (!r.ok)
        throw new Error('failed');
    return r.json();
}
export async function apiAddStockToProduct(productId, payload) {
    const r = await fetch(`/api/products/${productId}/stock`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(payload)
    });
    if (!r.ok)
        throw new Error('failed');
    return r.json();
}
export async function apiListParties(type, search, includeInactive = false) {
    const params = new URLSearchParams();
    if (type)
        params.append('type', type);
    if (search)
        params.append('search', search);
    if (includeInactive)
        params.append('include_inactive', 'true');
    const url = `/api/parties${params.toString() ? '?' + params.toString() : ''}`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` } });
    if (r.status === 401)
        throw new Error('unauthorized');
    if (!r.ok)
        throw new Error('failed');
    return r.json();
}
export async function apiListCustomers(search, includeInactive = false) {
    const params = new URLSearchParams();
    if (search)
        params.append('search', search);
    if (includeInactive)
        params.append('include_inactive', 'true');
    const url = `/api/parties/customers${params.toString() ? '?' + params.toString() : ''}`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` } });
    if (r.status === 401)
        throw new Error('unauthorized');
    if (!r.ok)
        throw new Error('failed');
    return r.json();
}
export async function apiListVendors(search, includeInactive = false) {
    const params = new URLSearchParams();
    if (search)
        params.append('search', search);
    if (includeInactive)
        params.append('include_inactive', 'true');
    const url = `/api/parties/vendors${params.toString() ? '?' + params.toString() : ''}`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` } });
    if (r.status === 401)
        throw new Error('unauthorized');
    if (!r.ok)
        throw new Error('failed');
    return r.json();
}
export async function apiCreateParty(payload) {
    const r = await fetch('/api/parties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
        body: JSON.stringify(payload)
    });
    if (!r.ok) {
        try {
            const errorData = await r.json();
            throw new Error(errorData.detail || `HTTP ${r.status}: ${r.statusText}`);
        }
        catch (parseError) {
            throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        }
    }
    return r.json();
}
export async function apiUpdateParty(id, payload) {
    const r = await fetch(`/api/parties/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
        body: JSON.stringify(payload)
    });
    if (!r.ok) {
        try {
            const errorData = await r.json();
            throw new Error(errorData.detail || `HTTP ${r.status}: ${r.statusText}`);
        }
        catch (parseError) {
            throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        }
    }
    return r.json();
}
export async function apiToggleParty(id) {
    const r = await fetch(`/api/parties/${id}/toggle`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
    });
    if (!r.ok) {
        try {
            const errorData = await r.json();
            throw new Error(errorData.detail || `HTTP ${r.status}: ${r.statusText}`);
        }
        catch (parseError) {
            throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        }
    }
    return r.json();
}
export async function apiCreateInvoice(payload) {
    const r = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
        body: JSON.stringify(payload)
    });
    if (!r.ok) {
        try {
            const errorData = await r.json();
            throw new Error(errorData.detail || `HTTP ${r.status}: ${r.statusText}`);
        }
        catch (parseError) {
            throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        }
    }
    return r.json();
}
// Purchase Management APIs
export async function apiCreatePurchase(payload) {
    const r = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
        body: JSON.stringify(payload)
    });
    if (!r.ok) {
        try {
            const errorData = await r.json();
            throw new Error(errorData.detail || `HTTP ${r.status}: ${r.statusText}`);
        }
        catch (parseError) {
            throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        }
    }
    return r.json();
}
export async function apiListPurchases(search, status) {
    const params = new URLSearchParams();
    if (search)
        params.append('search', search);
    if (status)
        params.append('status', status);
    const url = `/api/purchases${params.toString() ? '?' + params.toString() : ''}`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` } });
    if (!r.ok) {
        try {
            const errorData = await r.json();
            throw new Error(errorData.detail || `HTTP ${r.status}: ${r.statusText}`);
        }
        catch (parseError) {
            throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        }
    }
    return r.json();
}
export async function apiGetPurchase(id) {
    const r = await fetch(`/api/purchases/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` } });
    if (!r.ok) {
        try {
            const errorData = await r.json();
            throw new Error(errorData.detail || `HTTP ${r.status}: ${r.statusText}`);
        }
        catch (parseError) {
            throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        }
    }
    return r.json();
}
export async function apiDeletePurchase(id) {
    const r = await fetch(`/api/purchases/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
    });
    if (!r.ok) {
        try {
            const errorData = await r.json();
            throw new Error(errorData.detail || `HTTP ${r.status}: ${r.statusText}`);
        }
        catch (parseError) {
            throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        }
    }
    return r.json();
}
// Purchase Payment APIs
export async function apiAddPurchasePayment(purchaseId, payload) {
    const r = await fetch(`/api/purchases/${purchaseId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
        body: JSON.stringify(payload)
    });
    if (!r.ok) {
        try {
            const errorData = await r.json();
            throw new Error(errorData.detail || `HTTP ${r.status}: ${r.statusText}`);
        }
        catch (parseError) {
            throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        }
    }
    return r.json();
}
export async function apiListPurchasePayments(purchaseId) {
    const r = await fetch(`/api/purchases/${purchaseId}/payments`, { headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` } });
    if (!r.ok) {
        try {
            const errorData = await r.json();
            throw new Error(errorData.detail || `HTTP ${r.status}: ${r.statusText}`);
        }
        catch (parseError) {
            throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        }
    }
    return r.json();
}
// Expense Management APIs
export async function apiCreateExpense(payload) {
    const r = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
        body: JSON.stringify(payload)
    });
    if (!r.ok) {
        try {
            const errorData = await r.json();
            throw new Error(errorData.detail || `HTTP ${r.status}: ${r.statusText}`);
        }
        catch (parseError) {
            throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        }
    }
    return r.json();
}
export async function apiListExpenses(search, category, expense_type, start_date, end_date) {
    const params = new URLSearchParams();
    if (search)
        params.append('search', search);
    if (category)
        params.append('category', category);
    if (expense_type)
        params.append('expense_type', expense_type);
    if (start_date)
        params.append('start_date', start_date);
    if (end_date)
        params.append('end_date', end_date);
    const url = `/api/expenses${params.toString() ? '?' + params.toString() : ''}`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` } });
    if (!r.ok) {
        try {
            const errorData = await r.json();
            throw new Error(errorData.detail || `HTTP ${r.status}: ${r.statusText}`);
        }
        catch (parseError) {
            throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        }
    }
    return r.json();
}
export async function apiGetExpense(id) {
    const r = await fetch(`/api/expenses/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` } });
    if (!r.ok) {
        try {
            const errorData = await r.json();
            throw new Error(errorData.detail || `HTTP ${r.status}: ${r.statusText}`);
        }
        catch (parseError) {
            throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        }
    }
    return r.json();
}
export async function apiUpdateExpense(id, payload) {
    const r = await fetch(`/api/expenses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
        body: JSON.stringify(payload)
    });
    if (!r.ok) {
        try {
            const errorData = await r.json();
            throw new Error(errorData.detail || `HTTP ${r.status}: ${r.statusText}`);
        }
        catch (parseError) {
            throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        }
    }
    return r.json();
}
export async function apiDeleteExpense(id) {
    const r = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
    });
    if (!r.ok) {
        try {
            const errorData = await r.json();
            throw new Error(errorData.detail || `HTTP ${r.status}: ${r.statusText}`);
        }
        catch (parseError) {
            throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        }
    }
    return r.json();
}
// Cashflow APIs
export async function apiGetCashflowSummary(start_date, end_date) {
    const params = new URLSearchParams();
    if (start_date)
        params.append('start_date', start_date);
    if (end_date)
        params.append('end_date', end_date);
    const url = `/api/cashflow/summary${params.toString() ? '?' + params.toString() : ''}`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` } });
    if (!r.ok) {
        try {
            const errorData = await r.json();
            throw new Error(errorData.detail || `HTTP ${r.status}: ${r.statusText}`);
        }
        catch (parseError) {
            throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        }
    }
    return r.json();
}
export async function apiGetInvoices(search, status, page = 1, limit = 10, sort_field = 'date', sort_direction = 'desc') {
    const params = new URLSearchParams();
    if (search)
        params.append('search', search);
    if (status)
        params.append('status', status);
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    params.append('sort_field', sort_field);
    params.append('sort_direction', sort_direction);
    const url = `/api/invoices?${params.toString()}`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` } });
    if (!r.ok) {
        try {
            const errorData = await r.json();
            throw new Error(errorData.detail || `HTTP ${r.status}: ${r.statusText}`);
        }
        catch (parseError) {
            throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        }
    }
    return r.json();
}
export async function apiGetInvoice(id) {
    const r = await fetch(`/api/invoices/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` } });
    if (!r.ok) {
        try {
            const errorData = await r.json();
            throw new Error(errorData.detail || `HTTP ${r.status}: ${r.statusText}`);
        }
        catch (parseError) {
            throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        }
    }
    return r.json();
}
export async function apiUpdateInvoice(id, payload) {
    const r = await fetch(`/api/invoices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
        body: JSON.stringify(payload)
    });
    if (!r.ok) {
        try {
            const errorData = await r.json();
            throw new Error(errorData.detail || `HTTP ${r.status}: ${r.statusText}`);
        }
        catch (parseError) {
            throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        }
    }
    return r.json();
}
export async function apiDeleteInvoice(id) {
    const r = await fetch(`/api/invoices/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
    });
    if (!r.ok) {
        try {
            const errorData = await r.json();
            throw new Error(errorData.detail || `HTTP ${r.status}: ${r.statusText}`);
        }
        catch (parseError) {
            throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        }
    }
}
export async function apiUpdateInvoiceStatus(id, status) {
    const r = await fetch(`/api/invoices/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
        body: JSON.stringify({ status })
    });
    if (!r.ok) {
        try {
            const errorData = await r.json();
            throw new Error(errorData.detail || `HTTP ${r.status}: ${r.statusText}`);
        }
        catch (parseError) {
            throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        }
    }
    return r.json();
}
export async function apiEmailInvoice(id, email) {
    const r = await fetch(`/api/invoices/${id}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
        body: JSON.stringify({ to: email })
    });
    if (!r.ok) {
        try {
            const errorData = await r.json();
            throw new Error(errorData.detail || `HTTP ${r.status}: ${r.statusText}`);
        }
        catch (parseError) {
            throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        }
    }
}
export async function apiGetStockSummary() {
    const r = await fetch('/api/stock/summary', { headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` } });
    if (!r.ok)
        throw new Error('failed');
    return r.json();
}
export async function apiAdjustStock(product_id, quantity, adjustmentType, dateOfAdjustment, referenceBillNumber, supplier, category, notes) {
    const r = await fetch('/api/stock/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
        body: JSON.stringify({
            product_id,
            quantity: quantity,
            adjustment_type: adjustmentType,
            date_of_adjustment: dateOfAdjustment,
            reference_bill_number: referenceBillNumber,
            supplier: supplier,
            category: category,
            notes: notes
        })
    });
    if (!r.ok) {
        try {
            const errorData = await r.json();
            throw new Error(errorData.detail || `HTTP ${r.status}: ${r.statusText}`);
        }
        catch (parseError) {
            throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        }
    }
    return r.json();
}
// Payment Management API Functions
export async function apiAddPayment(invoiceId, payload) {
    const r = await fetch(`/api/invoices/${invoiceId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
        body: JSON.stringify(payload)
    });
    if (!r.ok) {
        try {
            const errorData = await r.json();
            throw new Error(errorData.detail || `HTTP ${r.status}: ${r.statusText}`);
        }
        catch (parseError) {
            throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        }
    }
    return r.json();
}
export async function apiGetInvoicePayments(invoiceId) {
    const r = await fetch(`/api/invoices/${invoiceId}/payments`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
    });
    if (!r.ok) {
        try {
            const errorData = await r.json();
            throw new Error(errorData.detail || `HTTP ${r.status}: ${r.statusText}`);
        }
        catch (parseError) {
            throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        }
    }
    return r.json();
}
export async function apiDeletePayment(paymentId) {
    const r = await fetch(`/api/payments/${paymentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
    });
    if (!r.ok) {
        try {
            const errorData = await r.json();
            throw new Error(errorData.detail || `HTTP ${r.status}: ${r.statusText}`);
        }
        catch (parseError) {
            throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        }
    }
}
export async function apiGetCashflowTransactions() {
    const r = await fetch('/api/cashflow/transactions', {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
    });
    if (!r.ok) {
        try {
            const errorData = await r.json();
            throw new Error(errorData.detail || `HTTP ${r.status}: ${r.statusText}`);
        }
        catch (parseError) {
            throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        }
    }
    return r.json();
}
export async function apiGetGstFilingReport(periodType, periodValue, reportType, format = 'json') {
    const response = await fetch(`/api/reports/gst-filing?period_type=${periodType}&period_value=${periodValue}&report_type=${reportType}&format=${format}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json',
        },
    });
    if (!response.ok) {
        throw new Error(`Failed to get GST filing report: ${response.statusText}`);
    }
    if (format === 'json') {
        return response.json();
    }
    else {
        // For CSV and Excel, return the blob for download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gst_${reportType}_${periodValue}.${format === 'csv' ? 'csv' : 'xlsx'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        return {}; // Return empty object for download
    }
}
