import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { apiCreateExpense, apiListParties } from '../lib/api';
import { Button } from './Button';
import { ErrorMessage } from './ErrorMessage';
import { formStyles, getSectionHeaderColor } from '../utils/formStyles';
export function ExpenseForm({ onSuccess, onCancel }) {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        expense_date: new Date().toISOString().split('T')[0],
        expense_type: '',
        category: '',
        subcategory: '',
        description: '',
        amount: 0,
        payment_method: 'Cash',
        account_head: 'Cash',
        reference_number: '',
        vendor_id: undefined,
        gst_rate: 0,
        notes: ''
    });
    const expenseCategories = [
        { value: 'Direct/COGS', label: 'Direct/COGS' },
        { value: 'Indirect/Operating', label: 'Indirect/Operating' }
    ];
    const expenseTypes = [
        { value: 'Salary', label: 'Salary', category: 'Indirect/Operating' },
        { value: 'Rent', label: 'Rent', category: 'Indirect/Operating' },
        { value: 'Electricity', label: 'Electricity', category: 'Indirect/Operating' },
        { value: 'Raw Materials', label: 'Raw Materials', category: 'Direct/COGS' },
        { value: 'Packing Materials', label: 'Packing Materials', category: 'Direct/COGS' },
        { value: 'Freight', label: 'Freight', category: 'Direct/COGS' },
        { value: 'Office Supplies', label: 'Office Supplies', category: 'Indirect/Operating' },
        { value: 'Marketing', label: 'Marketing', category: 'Indirect/Operating' },
        { value: 'Professional Fees', label: 'Professional Fees', category: 'Indirect/Operating' },
        { value: 'Bank Charges', label: 'Bank Charges', category: 'Indirect/Operating' }
    ];
    const paymentMethods = ['Cash', 'Bank', 'UPI', 'Cheque', 'NEFT', 'RTGS', 'IMPS'];
    const accountHeads = ['Cash', 'Bank', 'Funds', 'Credit Card'];
    useEffect(() => {
        loadVendors();
    }, []);
    const loadVendors = async () => {
        try {
            const vendorsData = await apiListParties();
            setVendors(vendorsData.filter(p => p.type === 'vendor'));
        }
        catch (err) {
            console.error('Failed to load vendors:', err);
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.expense_type || !formData.category || !formData.description || formData.amount <= 0) {
            setError('Please fill all required fields');
            return;
        }
        try {
            setLoading(true);
            setError(null);
            await apiCreateExpense(formData);
            onSuccess();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create expense');
        }
        finally {
            setLoading(false);
        }
    };
    const handleCategoryChange = (category) => {
        setFormData(prev => ({ ...prev, category, expense_type: '' }));
    };
    return (_jsxs("form", { onSubmit: handleSubmit, children: [_jsx(ErrorMessage, { message: error }), _jsxs("div", { style: formStyles.section, children: [_jsx("h3", { style: { ...formStyles.sectionHeader, borderBottomColor: getSectionHeaderColor('basic') }, children: "Expense Details" }), _jsxs("div", { style: formStyles.grid2Col, children: [_jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Date *" }), _jsx("input", { type: "date", value: formData.expense_date, onChange: (e) => setFormData(prev => ({ ...prev, expense_date: e.target.value })), required: true, style: formStyles.input })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Amount *" }), _jsx("input", { type: "number", step: "0.01", value: formData.amount || '', onChange: (e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 })), required: true, placeholder: "Enter amount", style: formStyles.input })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Category *" }), _jsxs("select", { value: formData.category, onChange: (e) => handleCategoryChange(e.target.value), required: true, style: formStyles.select, children: [_jsx("option", { value: "", children: "Select Category" }), expenseCategories.map(cat => (_jsx("option", { value: cat.value, children: cat.label }, cat.value)))] })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Expense Type *" }), _jsxs("select", { value: formData.expense_type, onChange: (e) => setFormData(prev => ({ ...prev, expense_type: e.target.value })), required: true, style: formStyles.select, children: [_jsx("option", { value: "", children: "Select Type" }), expenseTypes
                                                .filter(type => !formData.category || type.category === formData.category)
                                                .map(type => (_jsx("option", { value: type.value, children: type.label }, type.value)))] })] }), _jsxs("div", { style: { ...formStyles.formGroup, gridColumn: '1 / -1' }, children: [_jsx("label", { style: formStyles.label, children: "Description *" }), _jsx("input", { type: "text", value: formData.description, onChange: (e) => setFormData(prev => ({ ...prev, description: e.target.value })), required: true, placeholder: "Enter expense description", style: formStyles.input })] })] })] }), _jsxs("div", { style: formStyles.section, children: [_jsx("h3", { style: { ...formStyles.sectionHeader, borderBottomColor: getSectionHeaderColor('payment') }, children: "Payment Information" }), _jsxs("div", { style: formStyles.grid2Col, children: [_jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Payment Method" }), _jsx("select", { value: formData.payment_method, onChange: (e) => setFormData(prev => ({ ...prev, payment_method: e.target.value })), style: formStyles.select, children: paymentMethods.map(method => (_jsx("option", { value: method, children: method }, method))) })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Account Head" }), _jsx("select", { value: formData.account_head, onChange: (e) => setFormData(prev => ({ ...prev, account_head: e.target.value })), style: formStyles.select, children: accountHeads.map(head => (_jsx("option", { value: head, children: head }, head))) })] }), _jsxs("div", { children: [_jsx("label", { children: "Vendor" }), _jsxs("select", { value: formData.vendor_id || '', onChange: (e) => setFormData(prev => ({ ...prev, vendor_id: e.target.value ? parseInt(e.target.value) : undefined })), style: { width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }, children: [_jsx("option", { value: "", children: "Select Vendor" }), vendors.map(vendor => (_jsx("option", { value: vendor.id, children: vendor.name }, vendor.id)))] })] }), _jsxs("div", { children: [_jsx("label", { children: "GST Rate (%)" }), _jsx("input", { type: "number", step: "0.01", value: formData.gst_rate || '', onChange: (e) => setFormData(prev => ({ ...prev, gst_rate: parseFloat(e.target.value) || 0 })), placeholder: "Enter GST rate", style: { width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' } })] }), _jsxs("div", { children: [_jsx("label", { children: "Reference Number" }), _jsx("input", { type: "text", value: formData.reference_number, onChange: (e) => setFormData(prev => ({ ...prev, reference_number: e.target.value })), placeholder: "Enter bill/receipt number", style: { width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' } })] })] })] }), _jsxs("div", { style: { marginBottom: '24px' }, children: [_jsx("h3", { style: { marginBottom: '16px', color: '#333', borderBottom: '2px solid #6c757d', paddingBottom: '8px' }, children: "Additional Information" }), _jsx("div", { style: { display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }, children: _jsxs("div", { children: [_jsx("label", { children: "Notes" }), _jsx("textarea", { value: formData.notes, onChange: (e) => setFormData(prev => ({ ...prev, notes: e.target.value })), placeholder: "Enter additional notes (optional)", rows: 3, style: { width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' } })] }) })] }), _jsxs("div", { style: { display: 'flex', gap: '12px', justifyContent: 'flex-end' }, children: [_jsx(Button, { type: "button", variant: "secondary", onClick: onCancel, children: "Cancel" }), _jsx(Button, { type: "submit", variant: "primary", disabled: loading, children: loading ? 'Creating...' : 'Create Expense' })] })] }));
}
