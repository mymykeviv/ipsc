import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useAuth } from '../modules/AuthContext';
import { apiAdjustStock, apiGetStockSummary } from '../lib/api';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
export function Stock() {
    const { token } = useAuth();
    const [rows, setRows] = useState([]);
    const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [adjustmentForm, setAdjustmentForm] = useState({
        productId: '',
        quantity: '',
        adjustmentType: 'add',
        dateOfAdjustment: new Date().toISOString().split('T')[0],
        referenceBillNumber: '',
        supplier: '',
        category: '',
        notes: ''
    });
    useEffect(() => {
        if (!token)
            return;
        apiGetStockSummary().then(setRows);
    }, [token]);
    const resetAdjustmentForm = () => {
        setAdjustmentForm({
            productId: '',
            quantity: '',
            adjustmentType: 'add',
            dateOfAdjustment: new Date().toISOString().split('T')[0],
            referenceBillNumber: '',
            supplier: '',
            category: '',
            notes: ''
        });
        setError(null);
    };
    const handleStockAdjustment = async (e) => {
        e.preventDefault();
        if (!adjustmentForm.productId || !adjustmentForm.quantity)
            return;
        setLoading(true);
        setError(null);
        try {
            // Validation
            const quantity = parseInt(adjustmentForm.quantity);
            if (quantity < 0 || quantity > 999999) {
                setError('Quantity must be between 0 and 999999');
                return;
            }
            if (adjustmentForm.referenceBillNumber && adjustmentForm.referenceBillNumber.length > 10) {
                setError('Reference bill number must be 10 characters or less');
                return;
            }
            if (adjustmentForm.supplier && adjustmentForm.supplier.length > 50) {
                setError('Supplier must be 50 characters or less');
                return;
            }
            if (adjustmentForm.category && adjustmentForm.category.length > 50) {
                setError('Category must be 50 characters or less');
                return;
            }
            if (adjustmentForm.notes && adjustmentForm.notes.length > 200) {
                setError('Notes must be 200 characters or less');
                return;
            }
            await apiAdjustStock(Number(adjustmentForm.productId), quantity, adjustmentForm.adjustmentType, adjustmentForm.dateOfAdjustment, adjustmentForm.referenceBillNumber || undefined, adjustmentForm.supplier || undefined, adjustmentForm.category || undefined, adjustmentForm.notes || undefined);
            setShowAdjustmentModal(false);
            resetAdjustmentForm();
            apiGetStockSummary().then(setRows);
        }
        catch (error) {
            setError(error.message || 'Failed to adjust stock');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "content", children: [_jsxs(Card, { children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }, children: [_jsx("h1", { children: "Stock Management" }), _jsx(Button, { variant: "primary", onClick: () => setShowAdjustmentModal(true), children: "Stock Adjustment" })] }), _jsxs("table", { "data-testid": "stock-table", style: { width: '100%', borderCollapse: 'collapse' }, children: [_jsx("thead", { children: _jsxs("tr", { style: { borderBottom: '1px solid var(--border)' }, children: [_jsx("th", { style: { padding: '12px', textAlign: 'left' }, children: "SKU" }), _jsx("th", { style: { padding: '12px', textAlign: 'left' }, children: "Name" }), _jsx("th", { style: { padding: '12px', textAlign: 'left' }, children: "Item Type" }), _jsx("th", { style: { padding: '12px', textAlign: 'left' }, children: "On Hand" }), _jsx("th", { style: { padding: '12px', textAlign: 'left' }, children: "Unit" })] }) }), _jsx("tbody", { children: rows.map(r => (_jsxs("tr", { style: { borderBottom: '1px solid var(--border)' }, children: [_jsx("td", { style: { padding: '12px' }, children: r.sku }), _jsx("td", { style: { padding: '12px' }, children: r.name }), _jsx("td", { style: { padding: '12px' }, children: r.item_type || 'N/A' }), _jsx("td", { style: { padding: '12px' }, children: r.onhand }), _jsx("td", { style: { padding: '12px' }, children: r.unit || 'Pcs' })] }, r.product_id))) })] })] }), showAdjustmentModal && (_jsx("div", { style: {
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }, children: _jsxs(Card, { style: { width: '80%', maxWidth: '600px', maxHeight: '90vh', overflow: 'auto' }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }, children: [_jsx("h2", { children: "Stock Adjustment" }), _jsx("button", { onClick: () => setShowAdjustmentModal(false), style: {
                                        background: 'none',
                                        border: 'none',
                                        fontSize: '24px',
                                        cursor: 'pointer',
                                        color: 'var(--muted)',
                                        padding: '4px 8px',
                                        borderRadius: '4px'
                                    }, children: "\u00D7" })] }), error && (_jsx("div", { style: {
                                color: 'crimson',
                                padding: '8px',
                                backgroundColor: '#ffe6e6',
                                borderRadius: '4px',
                                border: '1px solid #ff9999',
                                marginBottom: '16px'
                            }, children: error })), _jsxs("form", { onSubmit: handleStockAdjustment, children: [_jsxs("div", { style: { marginBottom: '24px' }, children: [_jsx("h3", { style: { marginBottom: '16px', color: '#333', borderBottom: '2px solid #007bff', paddingBottom: '8px' }, children: "Stock Adjustment Details" }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }, children: [_jsxs("div", { children: [_jsx("label", { children: "Product *" }), _jsxs("select", { value: adjustmentForm.productId, onChange: (e) => setAdjustmentForm({ ...adjustmentForm, productId: e.target.value ? Number(e.target.value) : '' }), required: true, style: { width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }, children: [_jsx("option", { value: "", children: "Select Product" }), rows.map(r => _jsxs("option", { value: r.product_id, children: [r.sku, " - ", r.name] }, r.product_id))] })] }), _jsxs("div", { children: [_jsx("label", { children: "Adjustment Type *" }), _jsxs("select", { value: adjustmentForm.adjustmentType, onChange: (e) => setAdjustmentForm({ ...adjustmentForm, adjustmentType: e.target.value }), required: true, style: { width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }, children: [_jsx("option", { value: "add", children: "Add Stock" }), _jsx("option", { value: "reduce", children: "Reduce Stock" })] })] }), _jsxs("div", { children: [_jsx("label", { children: "Quantity *" }), _jsx("input", { type: "number", value: adjustmentForm.quantity, onChange: (e) => setAdjustmentForm({ ...adjustmentForm, quantity: e.target.value }), required: true, min: "0", max: "999999", style: { width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' } })] }), _jsxs("div", { children: [_jsx("label", { children: "Date of Adjustment *" }), _jsx("input", { type: "date", value: adjustmentForm.dateOfAdjustment, onChange: (e) => setAdjustmentForm({ ...adjustmentForm, dateOfAdjustment: e.target.value }), required: true, style: { width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' } })] }), _jsxs("div", { children: [_jsx("label", { children: "Reference Bill Number" }), _jsx("input", { type: "text", value: adjustmentForm.referenceBillNumber, onChange: (e) => setAdjustmentForm({ ...adjustmentForm, referenceBillNumber: e.target.value }), maxLength: 10, style: { width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' } })] }), _jsxs("div", { children: [_jsx("label", { children: "Supplier" }), _jsx("input", { type: "text", value: adjustmentForm.supplier, onChange: (e) => setAdjustmentForm({ ...adjustmentForm, supplier: e.target.value }), maxLength: 50, style: { width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' } })] }), _jsxs("div", { children: [_jsx("label", { children: "Category" }), _jsx("input", { type: "text", value: adjustmentForm.category, onChange: (e) => setAdjustmentForm({ ...adjustmentForm, category: e.target.value }), maxLength: 50, style: { width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' } })] })] })] }), _jsxs("div", { style: { marginBottom: '24px' }, children: [_jsx("h3", { style: { marginBottom: '16px', color: '#333', borderBottom: '2px solid #6c757d', paddingBottom: '8px' }, children: "Additional Information" }), _jsx("div", { style: { display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }, children: _jsxs("div", { children: [_jsx("label", { children: "Notes" }), _jsx("textarea", { value: adjustmentForm.notes, onChange: (e) => setAdjustmentForm({ ...adjustmentForm, notes: e.target.value }), rows: 3, maxLength: 200, placeholder: "Enter adjustment notes (optional)", style: { width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' } })] }) })] }), _jsxs("div", { style: { display: 'flex', gap: '12px', justifyContent: 'flex-end' }, children: [_jsx(Button, { type: "button", variant: "secondary", onClick: () => setShowAdjustmentModal(false), children: "Cancel" }), _jsx(Button, { type: "submit", variant: "primary", disabled: loading, children: loading ? 'Adjusting...' : 'Apply Adjustment' })] })] })] }) }))] }));
}
