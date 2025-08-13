import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { apiCreatePurchase, apiListParties, apiGetProducts } from '../lib/api';
import { Button } from './Button';
import { ErrorMessage } from './ErrorMessage';
import { formStyles, getSectionHeaderColor } from '../utils/formStyles';
export function PurchaseForm({ onSuccess, onCancel }) {
    const [vendors, setVendors] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        vendor_id: 0,
        date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        terms: 'Due on Receipt',
        place_of_supply: 'Karnataka',
        place_of_supply_state_code: '29',
        bill_from_address: '',
        ship_from_address: '',
        notes: '',
        items: []
    });
    const [currentItem, setCurrentItem] = useState({
        product_id: 0,
        qty: 1,
        rate: 0,
        description: '',
        hsn_code: '',
        discount: 0,
        discount_type: 'Percentage',
        gst_rate: 18
    });
    useEffect(() => {
        loadData();
    }, []);
    const loadData = async () => {
        try {
            const [vendorsData, productsData] = await Promise.all([
                apiListParties(),
                apiGetProducts()
            ]);
            setVendors(vendorsData.filter(p => p.type === 'vendor'));
            setProducts(productsData);
        }
        catch (err) {
            console.error('Failed to load data:', err);
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.vendor_id || formData.items.length === 0) {
            setError('Please select a vendor and add at least one item');
            return;
        }
        try {
            setLoading(true);
            setError(null);
            await apiCreatePurchase({
                ...formData,
                vendor_id: formData.vendor_id,
                eway_bill_number: '',
                reverse_charge: false,
                export_supply: false,
                total_discount: 0
            });
            onSuccess();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create purchase');
        }
        finally {
            setLoading(false);
        }
    };
    const addItem = () => {
        if (!currentItem.product_id || currentItem.qty <= 0 || currentItem.rate <= 0) {
            setError('Please fill all item fields');
            return;
        }
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { ...currentItem }]
        }));
        setCurrentItem({
            product_id: 0,
            qty: 1,
            rate: 0,
            description: '',
            hsn_code: '',
            discount: 0,
            discount_type: 'Percentage',
            gst_rate: 18
        });
        setError(null);
    };
    const removeItem = (index) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };
    const getSelectedProduct = () => {
        return products.find(p => p.id === currentItem.product_id);
    };
    return (_jsxs("form", { onSubmit: handleSubmit, children: [_jsx(ErrorMessage, { message: error }), _jsxs("div", { style: formStyles.section, children: [_jsx("h3", { style: { ...formStyles.sectionHeader, borderBottomColor: getSectionHeaderColor('basic') }, children: "Purchase Information" }), _jsxs("div", { style: formStyles.grid2Col, children: [_jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Vendor *" }), _jsxs("select", { value: formData.vendor_id || '', onChange: (e) => setFormData(prev => ({ ...prev, vendor_id: parseInt(e.target.value) || 0 })), required: true, style: formStyles.select, children: [_jsx("option", { value: "", children: "Select Vendor" }), vendors.map(vendor => (_jsx("option", { value: vendor.id, children: vendor.name }, vendor.id)))] })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Purchase Date *" }), _jsx("input", { type: "date", value: formData.date, onChange: (e) => setFormData(prev => ({ ...prev, date: e.target.value })), required: true, style: formStyles.input })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Due Date" }), _jsx("input", { type: "date", value: formData.due_date, onChange: (e) => setFormData(prev => ({ ...prev, due_date: e.target.value })), style: formStyles.input })] }), _jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Terms" }), _jsx("input", { type: "text", value: formData.terms, onChange: (e) => setFormData(prev => ({ ...prev, terms: e.target.value })), placeholder: "Enter payment terms", style: formStyles.input })] })] })] }), _jsxs("div", { style: formStyles.section, children: [_jsx("h3", { style: { ...formStyles.sectionHeader, borderBottomColor: getSectionHeaderColor('items') }, children: "Purchase Items" }), _jsx("div", { style: { display: 'grid', gap: '16px', marginBottom: '16px' }, children: _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: '16px', alignItems: 'end' }, children: [_jsxs("div", { children: [_jsx("label", { children: "Product" }), _jsxs("select", { value: currentItem.product_id || '', onChange: (e) => {
                                                const productId = parseInt(e.target.value) || 0;
                                                const product = products.find(p => p.id === productId);
                                                setCurrentItem(prev => ({
                                                    ...prev,
                                                    product_id: productId,
                                                    rate: product?.purchase_price || 0,
                                                    description: product?.name || '',
                                                    hsn_code: product?.hsn || ''
                                                }));
                                            }, style: { width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }, children: [_jsx("option", { value: "", children: "Select Product" }), products.map(product => (_jsx("option", { value: product.id, children: product.name }, product.id)))] })] }), _jsxs("div", { children: [_jsx("label", { children: "Qty" }), _jsx("input", { type: "number", value: currentItem.qty || '', onChange: (e) => setCurrentItem(prev => ({ ...prev, qty: parseInt(e.target.value) || 0 })), min: "1", placeholder: "Quantity", style: { width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' } })] }), _jsxs("div", { children: [_jsx("label", { children: "Rate" }), _jsx("input", { type: "number", step: "0.01", value: currentItem.rate || '', onChange: (e) => setCurrentItem(prev => ({ ...prev, rate: parseFloat(e.target.value) || 0 })), placeholder: "Rate", style: { width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' } })] }), _jsxs("div", { children: [_jsx("label", { children: "GST %" }), _jsx("input", { type: "number", step: "0.01", value: currentItem.gst_rate || '', onChange: (e) => setCurrentItem(prev => ({ ...prev, gst_rate: parseFloat(e.target.value) || 0 })), placeholder: "GST %", style: { width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' } })] }), _jsx("button", { type: "button", onClick: addItem, style: {
                                        padding: '6px 12px',
                                        backgroundColor: '#28a745',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '12px'
                                    }, children: "Add" })] }) }), formData.items.length > 0 && (_jsx("div", { style: { borderTop: '1px solid #ced4da', paddingTop: '8px' }, children: formData.items.map((item, index) => {
                            const product = products.find(p => p.id === item.product_id);
                            const subtotal = item.qty * item.rate;
                            const gstAmount = subtotal * (item.gst_rate / 100);
                            const total = subtotal + gstAmount;
                            return (_jsxs("div", { style: {
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '4px 0',
                                    borderBottom: '1px solid #f0f0f0'
                                }, children: [_jsx("span", { style: { fontSize: '12px', flex: 1 }, children: product?.name }), _jsxs("span", { style: { fontSize: '12px', width: '60px' }, children: ["Qty: ", item.qty] }), _jsxs("span", { style: { fontSize: '12px', width: '80px' }, children: ["\u20B9", item.rate] }), _jsxs("span", { style: { fontSize: '12px', width: '80px' }, children: ["\u20B9", total.toFixed(2)] }), _jsx("button", { type: "button", onClick: () => removeItem(index), style: {
                                            padding: '2px 6px',
                                            backgroundColor: '#dc3545',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '2px',
                                            cursor: 'pointer',
                                            fontSize: '10px'
                                        }, children: "\u00D7" })] }, index));
                        }) }))] }), _jsxs("div", { style: { marginBottom: '24px' }, children: [_jsx("h3", { style: { marginBottom: '16px', color: '#333', borderBottom: '2px solid #6c757d', paddingBottom: '8px' }, children: "Additional Information" }), _jsx("div", { style: { display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }, children: _jsxs("div", { children: [_jsx("label", { children: "Notes" }), _jsx("textarea", { value: formData.notes, onChange: (e) => setFormData(prev => ({ ...prev, notes: e.target.value })), placeholder: "Enter additional notes (optional)", rows: 3, style: { width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' } })] }) })] }), _jsxs("div", { style: { display: 'flex', gap: '12px', justifyContent: 'flex-end' }, children: [_jsx(Button, { type: "button", variant: "secondary", onClick: onCancel, children: "Cancel" }), _jsx(Button, { type: "submit", variant: "primary", disabled: loading, children: loading ? 'Creating...' : 'Create Purchase' })] })] }));
}
