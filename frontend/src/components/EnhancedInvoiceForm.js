import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { apiCreateInvoice, apiListParties, apiGetProducts } from '../lib/api';
// Indian States for GST Compliance
const INDIAN_STATES = {
    "Andhra Pradesh": "37",
    "Arunachal Pradesh": "12",
    "Assam": "18",
    "Bihar": "10",
    "Chhattisgarh": "22",
    "Goa": "30",
    "Gujarat": "24",
    "Haryana": "06",
    "Himachal Pradesh": "02",
    "Jharkhand": "20",
    "Karnataka": "29",
    "Kerala": "32",
    "Madhya Pradesh": "23",
    "Maharashtra": "27",
    "Manipur": "14",
    "Meghalaya": "17",
    "Mizoram": "15",
    "Nagaland": "13",
    "Odisha": "21",
    "Punjab": "03",
    "Rajasthan": "08",
    "Sikkim": "11",
    "Tamil Nadu": "33",
    "Telangana": "36",
    "Tripura": "16",
    "Uttar Pradesh": "09",
    "Uttarakhand": "05",
    "West Bengal": "19",
    "Delhi": "07",
    "Jammu and Kashmir": "01",
    "Ladakh": "38",
    "Chandigarh": "04",
    "Dadra and Nagar Haveli": "26",
    "Daman and Diu": "25",
    "Lakshadweep": "31",
    "Puducherry": "34",
    "Andaman and Nicobar Islands": "35"
};
export function EnhancedInvoiceForm({ onSuccess, onCancel }) {
    const [customers, setCustomers] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        customer_id: 0,
        supplier_id: 0,
        date: new Date().toISOString().split('T')[0],
        due_date: new Date().toISOString().split('T')[0],
        terms: 'Due on Receipt',
        invoice_type: 'Invoice',
        currency: 'INR',
        place_of_supply: 'Uttar Pradesh',
        place_of_supply_state_code: '09',
        eway_bill_number: '',
        reverse_charge: false,
        export_supply: false,
        bill_to_address: '',
        ship_to_address: '',
        items: [],
        notes: ''
    });
    const [currentItem, setCurrentItem] = useState({
        product_id: 0,
        qty: 1,
        rate: 0,
        discount: 0,
        discount_type: 'Percentage'
    });
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const invoiceTypes = ['Invoice', 'Credit Note', 'Debit Note'];
    const currencies = ['INR', 'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'];
    const invoiceTerms = ['15 days', '30 days', '45 days', '60 days', '90 days', 'Due on Receipt', 'Immediate'];
    const discountTypes = ['Percentage', 'Fixed'];
    useEffect(() => {
        loadData();
    }, []);
    const loadData = async () => {
        try {
            const [customersData, suppliersData, productsData] = await Promise.all([
                apiListParties(),
                apiListParties(),
                apiGetProducts()
            ]);
            setCustomers(customersData.filter(p => p.type === 'customer'));
            setSuppliers(suppliersData.filter(p => p.type === 'vendor'));
            setProducts(productsData);
        }
        catch (err) {
            console.error('Failed to load data:', err);
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.customer_id || !formData.supplier_id || formData.items.length === 0) {
            setError('Please select customer, supplier and add at least one item');
            return;
        }
        try {
            setLoading(true);
            setError(null);
            await apiCreateInvoice(formData);
            onSuccess();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create invoice');
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
            discount: 0,
            discount_type: 'Percentage'
        });
        setError(null);
    };
    const removeItem = (index) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };
    const handleCustomerChange = (customerId) => {
        const customer = customers.find(c => c.id === customerId);
        setSelectedCustomer(customer || null);
        setFormData(prev => ({
            ...prev,
            customer_id: customerId,
            bill_to_address: customer ? `${customer.billing_address_line1}, ${customer.billing_city}, ${customer.billing_state}` : '',
            ship_to_address: customer ? `${customer.shipping_address_line1 || customer.billing_address_line1}, ${customer.shipping_city || customer.billing_city}, ${customer.shipping_state || customer.billing_state}` : ''
        }));
    };
    const handleSupplierChange = (supplierId) => {
        const supplier = suppliers.find(s => s.id === supplierId);
        setSelectedSupplier(supplier || null);
    };
    const handleTermsChange = (terms) => {
        setFormData(prev => ({ ...prev, terms }));
        // Auto-calculate due date based on terms
        const today = new Date();
        let dueDate = new Date(today);
        switch (terms) {
            case '15 days':
                dueDate.setDate(today.getDate() + 15);
                break;
            case '30 days':
                dueDate.setDate(today.getDate() + 30);
                break;
            case '45 days':
                dueDate.setDate(today.getDate() + 45);
                break;
            case '60 days':
                dueDate.setDate(today.getDate() + 60);
                break;
            case '90 days':
                dueDate.setDate(today.getDate() + 90);
                break;
            case 'Immediate':
                dueDate = today;
                break;
            default: // Due on Receipt
                dueDate = today;
        }
        setFormData(prev => ({
            ...prev,
            due_date: dueDate.toISOString().split('T')[0]
        }));
    };
    const calculateItemTotal = (item) => {
        const subtotal = item.qty * item.rate;
        const discount = item.discount_type === 'Percentage' ? (subtotal * item.discount / 100) : item.discount;
        return subtotal - discount;
    };
    const calculateTotals = () => {
        let subtotal = 0;
        let totalDiscount = 0;
        formData.items.forEach(item => {
            const itemSubtotal = item.qty * item.rate;
            const itemDiscount = item.discount_type === 'Percentage' ? (itemSubtotal * item.discount / 100) : item.discount;
            subtotal += itemSubtotal;
            totalDiscount += itemDiscount;
        });
        const taxableValue = subtotal - totalDiscount;
        const gstRate = 18; // Default GST rate - in real app, this would come from product
        const gstAmount = taxableValue * (gstRate / 100);
        const total = taxableValue + gstAmount;
        const roundOff = Math.round(total) - total;
        return {
            subtotal,
            totalDiscount,
            taxableValue,
            gstAmount,
            total: total + roundOff,
            roundOff
        };
    };
    const totals = calculateTotals();
    return (_jsxs("form", { onSubmit: handleSubmit, style: { display: 'grid', gap: '20px' }, children: [error && (_jsx("div", { style: {
                    padding: '12px',
                    backgroundColor: '#fee',
                    border: '1px solid #fcc',
                    borderRadius: '4px',
                    color: '#c33',
                    fontSize: '14px'
                }, children: error })), _jsxs("div", { style: { border: '1px solid #dee2e6', borderRadius: '8px', padding: '20px' }, children: [_jsx("h3", { style: { margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#495057' }, children: "\uD83D\uDCC4 Invoice Details" }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }, children: [_jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }, children: "Invoice Number *" }), _jsx("input", { type: "text", value: formData.invoice_no || '', onChange: (e) => setFormData(prev => ({ ...prev, invoice_no: e.target.value })), placeholder: "Auto-generated", maxLength: 16, style: {
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                            backgroundColor: '#f8f9fa'
                                        }, readOnly: true }), _jsxs("small", { style: { fontSize: '12px', color: '#6c757d' }, children: ["Format: FY", new Date().getFullYear(), "/INV-XXXX"] })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }, children: "Invoice Date *" }), _jsx("input", { type: "date", value: formData.date, onChange: (e) => setFormData(prev => ({ ...prev, date: e.target.value })), required: true, style: {
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '4px',
                                            fontSize: '14px'
                                        } })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }, children: "Due Date *" }), _jsx("input", { type: "date", value: formData.due_date, onChange: (e) => setFormData(prev => ({ ...prev, due_date: e.target.value })), required: true, style: {
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '4px',
                                            fontSize: '14px'
                                        } })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }, children: "Invoice Status" }), _jsx("div", { style: {
                                            padding: '8px 12px',
                                            backgroundColor: '#d4edda',
                                            border: '1px solid #c3e6cb',
                                            borderRadius: '4px',
                                            color: '#155724',
                                            fontSize: '14px',
                                            fontWeight: '500'
                                        }, children: "Draft" })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }, children: "Invoice Type *" }), _jsx("select", { value: formData.invoice_type, onChange: (e) => setFormData(prev => ({ ...prev, invoice_type: e.target.value })), required: true, style: {
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                            backgroundColor: 'white'
                                        }, children: invoiceTypes.map(type => (_jsx("option", { value: type, children: type }, type))) })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }, children: "Currency" }), _jsx("select", { value: formData.currency, onChange: (e) => setFormData(prev => ({ ...prev, currency: e.target.value })), style: {
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                            backgroundColor: 'white'
                                        }, children: currencies.map(currency => (_jsx("option", { value: currency, children: currency }, currency))) })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }, children: "Invoice Terms *" }), _jsx("select", { value: formData.terms, onChange: (e) => handleTermsChange(e.target.value), required: true, style: {
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                            backgroundColor: 'white'
                                        }, children: invoiceTerms.map(term => (_jsx("option", { value: term, children: term }, term))) })] })] })] }), _jsxs("div", { style: { border: '1px solid #dee2e6', borderRadius: '8px', padding: '20px' }, children: [_jsx("h3", { style: { margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#495057' }, children: "\uD83C\uDFE2 Supplier Details" }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }, children: [_jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }, children: "Supplier Name *" }), _jsxs("select", { value: formData.supplier_id || '', onChange: (e) => handleSupplierChange(parseInt(e.target.value) || 0), required: true, style: {
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                            backgroundColor: 'white'
                                        }, children: [_jsx("option", { value: "", children: "Select Supplier" }), suppliers.map(supplier => (_jsx("option", { value: supplier.id, children: supplier.name }, supplier.id)))] })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }, children: "Supplier Address *" }), _jsx("textarea", { value: selectedSupplier ? `${selectedSupplier.billing_address_line1}, ${selectedSupplier.billing_city}, ${selectedSupplier.billing_state}` : '', readOnly: true, maxLength: 200, rows: 3, style: {
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                            backgroundColor: '#f8f9fa',
                                            resize: 'vertical'
                                        } })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }, children: "Supplier GSTIN *" }), _jsx("input", { type: "text", value: selectedSupplier?.gstin || '', readOnly: true, maxLength: 15, style: {
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                            backgroundColor: '#f8f9fa'
                                        } })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }, children: "Supplier Email" }), _jsx("input", { type: "email", value: selectedSupplier?.email || '', readOnly: true, maxLength: 100, style: {
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                            backgroundColor: '#f8f9fa'
                                        } })] })] })] }), _jsxs("div", { style: { border: '1px solid #dee2e6', borderRadius: '8px', padding: '20px' }, children: [_jsx("h3", { style: { margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#495057' }, children: "\uD83C\uDFDB\uFE0F GST Compliance" }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }, children: [_jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }, children: "Place of Supply *" }), _jsx("select", { value: formData.place_of_supply, onChange: (e) => {
                                            const state = e.target.value;
                                            const stateCode = INDIAN_STATES[state] || '09';
                                            setFormData(prev => ({
                                                ...prev,
                                                place_of_supply: state,
                                                place_of_supply_state_code: stateCode
                                            }));
                                        }, required: true, style: {
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                            backgroundColor: 'white'
                                        }, children: Object.keys(INDIAN_STATES).map(state => (_jsx("option", { value: state, children: state }, state))) })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }, children: "E-way Bill Number" }), _jsx("input", { type: "text", value: formData.eway_bill_number, onChange: (e) => setFormData(prev => ({ ...prev, eway_bill_number: e.target.value })), maxLength: 15, placeholder: "Enter e-way bill number", style: {
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '4px',
                                            fontSize: '14px'
                                        } })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx("input", { type: "checkbox", id: "reverse_charge", checked: formData.reverse_charge, onChange: (e) => setFormData(prev => ({ ...prev, reverse_charge: e.target.checked })), style: { width: '16px', height: '16px' } }), _jsx("label", { htmlFor: "reverse_charge", style: { fontSize: '14px', fontWeight: '500' }, children: "Reverse Charge" })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx("input", { type: "checkbox", id: "export_supply", checked: formData.export_supply, onChange: (e) => setFormData(prev => ({ ...prev, export_supply: e.target.checked })), style: { width: '16px', height: '16px' } }), _jsx("label", { htmlFor: "export_supply", style: { fontSize: '14px', fontWeight: '500' }, children: "Export Supply" })] })] })] }), _jsxs("div", { style: { border: '1px solid #dee2e6', borderRadius: '8px', padding: '20px' }, children: [_jsx("h3", { style: { margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#495057' }, children: "\uD83D\uDC64 Customer Details" }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }, children: [_jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }, children: "Customer Name *" }), _jsxs("select", { value: formData.customer_id || '', onChange: (e) => handleCustomerChange(parseInt(e.target.value) || 0), required: true, style: {
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                            backgroundColor: 'white'
                                        }, children: [_jsx("option", { value: "", children: "Select Customer" }), customers.map(customer => (_jsx("option", { value: customer.id, children: customer.name }, customer.id)))] })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }, children: "Bill To Address *" }), _jsx("textarea", { value: formData.bill_to_address, onChange: (e) => setFormData(prev => ({ ...prev, bill_to_address: e.target.value })), required: true, maxLength: 200, rows: 3, style: {
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                            resize: 'vertical'
                                        } })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }, children: "Ship To Address *" }), _jsx("textarea", { value: formData.ship_to_address, onChange: (e) => setFormData(prev => ({ ...prev, ship_to_address: e.target.value })), required: true, maxLength: 200, rows: 3, style: {
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                            resize: 'vertical'
                                        } })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }, children: "Customer GSTIN *" }), _jsx("input", { type: "text", value: selectedCustomer?.gstin || '', readOnly: true, maxLength: 15, style: {
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                            backgroundColor: '#f8f9fa'
                                        } })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }, children: "Customer Email" }), _jsx("input", { type: "email", value: selectedCustomer?.email || '', readOnly: true, maxLength: 100, style: {
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                            backgroundColor: '#f8f9fa'
                                        } })] })] })] }), _jsxs("div", { style: { border: '1px solid #dee2e6', borderRadius: '8px', padding: '20px' }, children: [_jsx("h3", { style: { margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#495057' }, children: "\uD83D\uDCE6 Invoice Items" }), _jsxs("div", { style: { border: '1px solid #e9ecef', borderRadius: '6px', padding: '16px', marginBottom: '16px' }, children: [_jsx("h4", { style: { margin: '0 0 12px 0', fontSize: '16px', fontWeight: '500' }, children: "Add New Item" }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', alignItems: 'end' }, children: [_jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '12px' }, children: "Product *" }), _jsxs("select", { value: currentItem.product_id || '', onChange: (e) => {
                                                    const productId = parseInt(e.target.value) || 0;
                                                    const product = products.find(p => p.id === productId);
                                                    setCurrentItem(prev => ({
                                                        ...prev,
                                                        product_id: productId,
                                                        rate: product?.sales_price || 0,
                                                        description: product?.name || '',
                                                        hsn_code: product?.hsn || ''
                                                    }));
                                                }, style: {
                                                    width: '100%',
                                                    padding: '6px 8px',
                                                    border: '1px solid #ced4da',
                                                    borderRadius: '4px',
                                                    fontSize: '12px',
                                                    backgroundColor: 'white'
                                                }, children: [_jsx("option", { value: "", children: "Select Product" }), products.map(product => (_jsx("option", { value: product.id, children: product.name }, product.id)))] })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '12px' }, children: "Quantity *" }), _jsx("input", { type: "number", value: currentItem.qty || '', onChange: (e) => setCurrentItem(prev => ({ ...prev, qty: parseInt(e.target.value) || 0 })), min: "1", style: {
                                                    width: '100%',
                                                    padding: '6px 8px',
                                                    border: '1px solid #ced4da',
                                                    borderRadius: '4px',
                                                    fontSize: '12px'
                                                } })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '12px' }, children: "Rate *" }), _jsx("input", { type: "number", step: "0.01", value: currentItem.rate || '', onChange: (e) => setCurrentItem(prev => ({ ...prev, rate: parseFloat(e.target.value) || 0 })), style: {
                                                    width: '100%',
                                                    padding: '6px 8px',
                                                    border: '1px solid #ced4da',
                                                    borderRadius: '4px',
                                                    fontSize: '12px'
                                                } })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '12px' }, children: "Discount Type" }), _jsx("select", { value: currentItem.discount_type, onChange: (e) => setCurrentItem(prev => ({ ...prev, discount_type: e.target.value })), style: {
                                                    width: '100%',
                                                    padding: '6px 8px',
                                                    border: '1px solid #ced4da',
                                                    borderRadius: '4px',
                                                    fontSize: '12px',
                                                    backgroundColor: 'white'
                                                }, children: discountTypes.map(type => (_jsx("option", { value: type, children: type }, type))) })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '12px' }, children: "Discount Value" }), _jsx("input", { type: "number", step: "0.01", value: currentItem.discount || '', onChange: (e) => setCurrentItem(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 })), style: {
                                                    width: '100%',
                                                    padding: '6px 8px',
                                                    border: '1px solid #ced4da',
                                                    borderRadius: '4px',
                                                    fontSize: '12px'
                                                } })] }), _jsx("button", { type: "button", onClick: addItem, style: {
                                            padding: '8px 16px',
                                            backgroundColor: '#28a745',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '12px',
                                            fontWeight: '500'
                                        }, children: "Add Item" })] })] }), formData.items.length > 0 && (_jsxs("div", { style: { border: '1px solid #e9ecef', borderRadius: '6px', padding: '16px' }, children: [_jsx("h4", { style: { margin: '0 0 12px 0', fontSize: '16px', fontWeight: '500' }, children: "Invoice Items" }), _jsx("div", { style: { overflowX: 'auto' }, children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse', fontSize: '12px' }, children: [_jsx("thead", { children: _jsxs("tr", { style: { backgroundColor: '#f8f9fa' }, children: [_jsx("th", { style: { padding: '8px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }, children: "Product" }), _jsx("th", { style: { padding: '8px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }, children: "Qty" }), _jsx("th", { style: { padding: '8px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }, children: "Rate" }), _jsx("th", { style: { padding: '8px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }, children: "Discount" }), _jsx("th", { style: { padding: '8px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }, children: "GST Rate" }), _jsx("th", { style: { padding: '8px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }, children: "Amount" }), _jsx("th", { style: { padding: '8px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }, children: "Action" })] }) }), _jsx("tbody", { children: formData.items.map((item, index) => {
                                                const product = products.find(p => p.id === item.product_id);
                                                const total = calculateItemTotal(item);
                                                return (_jsxs("tr", { style: { borderBottom: '1px solid #f0f0f0' }, children: [_jsxs("td", { style: { padding: '8px' }, children: [_jsx("div", { children: product?.name }), product?.description && (_jsx("small", { style: { color: '#6c757d', fontSize: '11px' }, children: product.description }))] }), _jsx("td", { style: { padding: '8px', textAlign: 'right' }, children: item.qty }), _jsxs("td", { style: { padding: '8px', textAlign: 'right' }, children: ["\u20B9", item.rate.toFixed(2)] }), _jsx("td", { style: { padding: '8px', textAlign: 'right' }, children: item.discount_type === 'Percentage' ? `${item.discount}%` : `₹${item.discount.toFixed(2)}` }), _jsxs("td", { style: { padding: '8px', textAlign: 'right' }, children: [product?.gst_rate || 18, "%"] }), _jsxs("td", { style: { padding: '8px', textAlign: 'right', fontWeight: '500' }, children: ["\u20B9", total.toFixed(2)] }), _jsx("td", { style: { padding: '8px', textAlign: 'center' }, children: _jsx("button", { type: "button", onClick: () => removeItem(index), style: {
                                                                    padding: '4px 8px',
                                                                    backgroundColor: '#dc3545',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '2px',
                                                                    cursor: 'pointer',
                                                                    fontSize: '10px'
                                                                }, children: "Remove" }) })] }, index));
                                            }) })] }) })] }))] }), _jsxs("div", { style: { border: '1px solid #dee2e6', borderRadius: '8px', padding: '20px' }, children: [_jsx("h3", { style: { margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#495057' }, children: "\uD83D\uDCB0 Invoice Totals" }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }, children: [_jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }, children: "Subtotal" }), _jsxs("div", { style: {
                                            padding: '8px 12px',
                                            backgroundColor: '#f8f9fa',
                                            border: '1px solid #ced4da',
                                            borderRadius: '4px',
                                            fontSize: '16px',
                                            fontWeight: '600'
                                        }, children: ["\u20B9", totals.subtotal.toFixed(2)] })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }, children: "Total Discount" }), _jsxs("div", { style: {
                                            padding: '8px 12px',
                                            backgroundColor: '#f8f9fa',
                                            border: '1px solid #ced4da',
                                            borderRadius: '4px',
                                            fontSize: '16px',
                                            fontWeight: '600',
                                            color: '#dc3545'
                                        }, children: ["\u20B9", totals.totalDiscount.toFixed(2)] })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }, children: "Taxable Value" }), _jsxs("div", { style: {
                                            padding: '8px 12px',
                                            backgroundColor: '#f8f9fa',
                                            border: '1px solid #ced4da',
                                            borderRadius: '4px',
                                            fontSize: '16px',
                                            fontWeight: '600'
                                        }, children: ["\u20B9", totals.taxableValue.toFixed(2)] })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }, children: "GST Amount (18%)" }), _jsxs("div", { style: {
                                            padding: '8px 12px',
                                            backgroundColor: '#f8f9fa',
                                            border: '1px solid #ced4da',
                                            borderRadius: '4px',
                                            fontSize: '16px',
                                            fontWeight: '600',
                                            color: '#28a745'
                                        }, children: ["\u20B9", totals.gstAmount.toFixed(2)] })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }, children: "Round Off" }), _jsxs("div", { style: {
                                            padding: '8px 12px',
                                            backgroundColor: '#f8f9fa',
                                            border: '1px solid #ced4da',
                                            borderRadius: '4px',
                                            fontSize: '16px',
                                            fontWeight: '600'
                                        }, children: ["\u20B9", totals.roundOff.toFixed(2)] })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }, children: "Grand Total" }), _jsxs("div", { style: {
                                            padding: '8px 12px',
                                            backgroundColor: '#d4edda',
                                            border: '1px solid #c3e6cb',
                                            borderRadius: '4px',
                                            fontSize: '18px',
                                            fontWeight: '700',
                                            color: '#155724'
                                        }, children: ["\u20B9", totals.total.toFixed(2)] })] })] })] }), _jsxs("div", { style: { border: '1px solid #dee2e6', borderRadius: '8px', padding: '20px' }, children: [_jsx("h3", { style: { margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#495057' }, children: "\uD83D\uDCDD Other Details" }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }, children: "Invoice Notes" }), _jsx("textarea", { value: formData.notes, onChange: (e) => setFormData(prev => ({ ...prev, notes: e.target.value })), placeholder: "Enter any additional notes...", maxLength: 200, rows: 4, style: {
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid #ced4da',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    resize: 'vertical'
                                } }), _jsxs("small", { style: { fontSize: '12px', color: '#6c757d' }, children: [formData.notes.length, "/200 characters"] })] })] }), _jsxs("div", { style: { display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }, children: [_jsx("button", { type: "button", onClick: onCancel, style: {
                            padding: '12px 24px',
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500'
                        }, children: "Cancel" }), _jsx("button", { type: "submit", disabled: loading, style: {
                            padding: '12px 24px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            opacity: loading ? 0.6 : 1
                        }, children: loading ? 'Creating Invoice...' : 'Create Invoice' })] })] }));
}
