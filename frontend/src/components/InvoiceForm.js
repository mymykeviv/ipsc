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
export function InvoiceForm({ onSuccess, onCancel }) {
    const [customers, setCustomers] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        // Invoice Details
        invoice_no: '',
        date: new Date().toISOString().split('T')[0],
        due_date: new Date().toISOString().split('T')[0],
        status: 'Draft',
        invoice_type: 'Invoice',
        currency: 'INR',
        terms: 'Due on Receipt',
        // Supplier Details
        supplier_id: 0,
        supplier_address: '',
        supplier_gstin: '',
        supplier_email: '',
        // GST Compliance
        place_of_supply: 'Uttar Pradesh',
        eway_bill_number: '',
        reverse_charge: false,
        export_supply: false,
        // Customer Details
        customer_id: 0,
        bill_to_address: '',
        ship_to_address: '',
        customer_gstin: '',
        customer_email: '',
        // Items and Notes
        items: [],
        notes: ''
    });
    const [currentItem, setCurrentItem] = useState({
        product_id: 0,
        qty: 1,
        rate: 0,
        discount: 0,
        discount_type: 'Percentage',
        gst_rate: 0,
        gst_amount: 0,
        hsn_code: '',
        description: ''
    });
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
            setError('Please select a customer, supplier and add at least one item');
            return;
        }
        try {
            setLoading(true);
            setError(null);
            await apiCreateInvoice({
                customer_id: formData.customer_id,
                supplier_id: formData.supplier_id,
                invoice_no: formData.invoice_no || undefined,
                date: formData.date,
                due_date: formData.due_date,
                invoice_type: formData.invoice_type,
                currency: formData.currency,
                terms: formData.terms,
                place_of_supply: formData.place_of_supply,
                place_of_supply_state_code: INDIAN_STATES[formData.place_of_supply] || '09',
                eway_bill_number: formData.eway_bill_number || undefined,
                reverse_charge: formData.reverse_charge,
                export_supply: formData.export_supply,
                bill_to_address: formData.bill_to_address,
                ship_to_address: formData.ship_to_address,
                notes: formData.notes || undefined,
                items: formData.items.map(item => ({
                    product_id: item.product_id,
                    qty: item.qty,
                    rate: item.rate,
                    discount: item.discount,
                    discount_type: item.discount_type,
                    description: item.description,
                    hsn_code: item.hsn_code
                }))
            });
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
            setError('Please fill all mandatory item fields');
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
            discount_type: 'Percentage',
            gst_rate: 0,
            gst_amount: 0,
            hsn_code: '',
            description: ''
        });
        setError(null);
    };
    const removeItem = (index) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };
    const handleSupplierChange = (supplierId) => {
        const supplier = suppliers.find(s => s.id === supplierId);
        setFormData(prev => ({
            ...prev,
            supplier_id: supplierId,
            supplier_address: supplier ? `${supplier.billing_address_line1}${supplier.billing_address_line2 ? ', ' + supplier.billing_address_line2 : ''}, ${supplier.billing_city}, ${supplier.billing_state} - ${supplier.billing_pincode}` : '',
            supplier_gstin: supplier?.gstin || '',
            supplier_email: supplier?.email || ''
        }));
    };
    const handleCustomerChange = (customerId) => {
        const customer = customers.find(c => c.id === customerId);
        setFormData(prev => ({
            ...prev,
            customer_id: customerId,
            bill_to_address: customer ? `${customer.billing_address_line1}${customer.billing_address_line2 ? ', ' + customer.billing_address_line2 : ''}, ${customer.billing_city}, ${customer.billing_state} - ${customer.billing_pincode}` : '',
            ship_to_address: customer && customer.shipping_address_line1 ? `${customer.shipping_address_line1}${customer.shipping_address_line2 ? ', ' + customer.shipping_address_line2 : ''}, ${customer.shipping_city}, ${customer.shipping_state} - ${customer.shipping_pincode}` : '',
            customer_gstin: customer?.gstin || '',
            customer_email: customer?.email || ''
        }));
    };
    const handleProductChange = (productId) => {
        const product = products.find(p => p.id === productId);
        setCurrentItem(prev => ({
            ...prev,
            product_id: productId,
            rate: product?.sales_price || 0,
            gst_rate: product?.gst_rate || 0,
            hsn_code: product?.hsn || '',
            description: product?.description || ''
        }));
    };
    const handleTermsChange = (terms) => {
        const today = new Date();
        let dueDate = new Date();
        if (terms === '15 days') {
            dueDate.setDate(today.getDate() + 15);
        }
        else if (terms === '30 days') {
            dueDate.setDate(today.getDate() + 30);
        }
        else if (terms === '45 days') {
            dueDate.setDate(today.getDate() + 45);
        }
        else if (terms === '60 days') {
            dueDate.setDate(today.getDate() + 60);
        }
        else if (terms === '90 days') {
            dueDate.setDate(today.getDate() + 90);
        }
        else if (terms === 'Due on Receipt') {
            dueDate = today;
        }
        else if (terms === 'Immediate') {
            dueDate = today;
        }
        setFormData(prev => ({
            ...prev,
            terms,
            due_date: dueDate.toISOString().split('T')[0]
        }));
    };
    const calculateItemAmount = (item) => {
        const subtotal = item.qty * item.rate;
        const discount = item.discount_type === 'Percentage'
            ? (subtotal * item.discount / 100)
            : item.discount;
        return subtotal - discount;
    };
    const calculateTotals = () => {
        const subtotal = formData.items.reduce((sum, item) => sum + calculateItemAmount(item), 0);
        const totalDiscount = formData.items.reduce((sum, item) => {
            const discount = item.discount_type === 'Percentage'
                ? (item.qty * item.rate * item.discount / 100)
                : item.discount;
            return sum + discount;
        }, 0);
        const totalGST = formData.items.reduce((sum, item) => sum + item.gst_amount, 0);
        const grandTotal = subtotal + totalGST;
        const roundOff = Math.round(grandTotal) - grandTotal;
        const finalTotal = grandTotal + roundOff;
        return {
            subtotal,
            totalDiscount,
            totalGST,
            roundOff,
            grandTotal: finalTotal
        };
    };
    const numberToWords = (num) => {
        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        if (num === 0)
            return 'Zero';
        if (num < 10)
            return ones[num];
        if (num < 20)
            return teens[num - 10];
        if (num < 100)
            return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
        if (num < 1000)
            return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' and ' + numberToWords(num % 100) : '');
        if (num < 100000)
            return numberToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + numberToWords(num % 1000) : '');
        if (num < 10000000)
            return numberToWords(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 ? ' ' + numberToWords(num % 100000) : '');
        return numberToWords(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 ? ' ' + numberToWords(num % 10000000) : '');
    };
    const totals = calculateTotals();
    return (_jsxs("form", { onSubmit: handleSubmit, style: { display: 'grid', gap: '20px' }, children: [error && (_jsx("div", { style: {
                    padding: '12px',
                    backgroundColor: '#fee',
                    border: '1px solid #fcc',
                    borderRadius: '4px',
                    color: '#c33',
                    fontSize: '14px'
                }, children: error })), _jsxs("div", { style: { border: '1px solid #ddd', borderRadius: '8px', padding: '16px' }, children: [_jsx("h3", { style: { margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#333' }, children: "Invoice Details" }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }, children: [_jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }, children: "Invoice Number *" }), _jsx("input", { type: "text", value: formData.invoice_no, onChange: (e) => setFormData(prev => ({ ...prev, invoice_no: e.target.value })), placeholder: "Auto-generated if empty", maxLength: 16, style: {
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '4px',
                                            fontSize: '14px'
                                        } })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }, children: "Invoice Date *" }), _jsx("input", { type: "date", value: formData.date, onChange: (e) => setFormData(prev => ({ ...prev, date: e.target.value })), required: true, style: {
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
                                        } })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }, children: "Invoice Status" }), _jsx("input", { type: "text", value: formData.status, readOnly: true, style: {
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                            backgroundColor: '#f8f9fa'
                                        } })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }, children: "Invoice Type *" }), _jsxs("select", { value: formData.invoice_type, onChange: (e) => setFormData(prev => ({ ...prev, invoice_type: e.target.value })), required: true, style: {
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                            backgroundColor: 'white'
                                        }, children: [_jsx("option", { value: "Invoice", children: "Invoice" }), _jsx("option", { value: "Credit Note", children: "Credit Note" }), _jsx("option", { value: "Debit Note", children: "Debit Note" })] })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }, children: "Currency" }), _jsxs("select", { value: formData.currency, onChange: (e) => setFormData(prev => ({ ...prev, currency: e.target.value })), style: {
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                            backgroundColor: 'white'
                                        }, children: [_jsx("option", { value: "INR", children: "INR" }), _jsx("option", { value: "USD", children: "USD" }), _jsx("option", { value: "EUR", children: "EUR" }), _jsx("option", { value: "GBP", children: "GBP" })] })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }, children: "Terms *" }), _jsxs("select", { value: formData.terms, onChange: (e) => handleTermsChange(e.target.value), required: true, style: {
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                            backgroundColor: 'white'
                                        }, children: [_jsx("option", { value: "15 days", children: "15 days" }), _jsx("option", { value: "30 days", children: "30 days" }), _jsx("option", { value: "45 days", children: "45 days" }), _jsx("option", { value: "60 days", children: "60 days" }), _jsx("option", { value: "90 days", children: "90 days" }), _jsx("option", { value: "Due on Receipt", children: "Due on Receipt" }), _jsx("option", { value: "Immediate", children: "Immediate" })] })] })] })] }), _jsxs("div", { style: { border: '1px solid #ddd', borderRadius: '8px', padding: '16px' }, children: [_jsx("h3", { style: { margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#333' }, children: "Supplier Details" }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }, children: [_jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }, children: "Supplier Name *" }), _jsxs("select", { value: formData.supplier_id || '', onChange: (e) => handleSupplierChange(parseInt(e.target.value) || 0), required: true, style: {
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                            backgroundColor: 'white'
                                        }, children: [_jsx("option", { value: "", children: "Select Supplier" }), suppliers.map(supplier => (_jsx("option", { value: supplier.id, children: supplier.name }, supplier.id)))] })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }, children: "Supplier GSTIN *" }), _jsx("input", { type: "text", value: formData.supplier_gstin, onChange: (e) => setFormData(prev => ({ ...prev, supplier_gstin: e.target.value })), maxLength: 15, required: true, style: {
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '4px',
                                            fontSize: '14px'
                                        } })] }), _jsxs("div", { style: { gridColumn: '1 / -1' }, children: [_jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }, children: "Supplier Address *" }), _jsx("textarea", { value: formData.supplier_address, onChange: (e) => setFormData(prev => ({ ...prev, supplier_address: e.target.value })), maxLength: 200, required: true, rows: 2, style: {
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                            resize: 'vertical'
                                        } })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }, children: "Supplier Email" }), _jsx("input", { type: "email", value: formData.supplier_email, onChange: (e) => setFormData(prev => ({ ...prev, supplier_email: e.target.value })), maxLength: 100, style: {
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '4px',
                                            fontSize: '14px'
                                        } })] })] })] }), _jsxs("div", { style: { border: '1px solid #ddd', borderRadius: '8px', padding: '16px' }, children: [_jsx("h3", { style: { margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#333' }, children: "GST Compliance" }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }, children: [_jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }, children: "Place of Supply *" }), _jsx("select", { value: formData.place_of_supply, onChange: (e) => setFormData(prev => ({ ...prev, place_of_supply: e.target.value })), required: true, style: {
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                            backgroundColor: 'white'
                                        }, children: Object.keys(INDIAN_STATES).map(state => (_jsx("option", { value: state, children: state }, state))) })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }, children: "E-way Bill Number" }), _jsx("input", { type: "text", value: formData.eway_bill_number, onChange: (e) => setFormData(prev => ({ ...prev, eway_bill_number: e.target.value })), maxLength: 15, placeholder: "Optional - Enter e-way bill number", style: {
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '4px',
                                            fontSize: '14px'
                                        } })] }), _jsxs("div", { style: { display: 'flex', gap: '16px', alignItems: 'center' }, children: [_jsxs("label", { style: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }, children: [_jsx("input", { type: "checkbox", checked: formData.reverse_charge, onChange: (e) => setFormData(prev => ({ ...prev, reverse_charge: e.target.checked })), style: { margin: 0, cursor: 'pointer' } }), "Reverse Charge"] }), _jsxs("label", { style: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }, children: [_jsx("input", { type: "checkbox", checked: formData.export_supply, onChange: (e) => setFormData(prev => ({ ...prev, export_supply: e.target.checked })), style: { margin: 0, cursor: 'pointer' } }), "Export Supply"] })] })] })] }), _jsxs("div", { style: { border: '1px solid #ddd', borderRadius: '8px', padding: '16px' }, children: [_jsx("h3", { style: { margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#333' }, children: "Customer Details" }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }, children: [_jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }, children: "Customer Name *" }), _jsxs("select", { value: formData.customer_id || '', onChange: (e) => handleCustomerChange(parseInt(e.target.value) || 0), required: true, style: {
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                            backgroundColor: 'white'
                                        }, children: [_jsx("option", { value: "", children: "Select Customer" }), customers.map(customer => (_jsx("option", { value: customer.id, children: customer.name }, customer.id)))] })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }, children: "Customer GSTIN *" }), _jsx("input", { type: "text", value: formData.customer_gstin, onChange: (e) => setFormData(prev => ({ ...prev, customer_gstin: e.target.value })), maxLength: 15, required: true, style: {
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '4px',
                                            fontSize: '14px'
                                        } })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }, children: "Bill To Address *" }), _jsx("textarea", { value: formData.bill_to_address, onChange: (e) => setFormData(prev => ({ ...prev, bill_to_address: e.target.value })), maxLength: 200, required: true, rows: 2, style: {
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                            resize: 'vertical'
                                        } })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }, children: "Ship To Address *" }), _jsx("textarea", { value: formData.ship_to_address, onChange: (e) => setFormData(prev => ({ ...prev, ship_to_address: e.target.value })), maxLength: 200, required: true, rows: 2, style: {
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                            resize: 'vertical'
                                        } })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }, children: "Customer Email" }), _jsx("input", { type: "email", value: formData.customer_email, onChange: (e) => setFormData(prev => ({ ...prev, customer_email: e.target.value })), maxLength: 100, style: {
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '4px',
                                            fontSize: '14px'
                                        } })] })] })] }), _jsxs("div", { style: { border: '1px solid #ddd', borderRadius: '8px', padding: '16px' }, children: [_jsx("h3", { style: { margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#333' }, children: "Invoice Items" }), _jsx("div", { style: { border: '1px solid #eee', borderRadius: '4px', padding: '12px', marginBottom: '16px' }, children: _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr', gap: '8px', alignItems: 'end' }, children: [_jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500' }, children: "Product *" }), _jsxs("select", { value: currentItem.product_id || '', onChange: (e) => handleProductChange(parseInt(e.target.value) || 0), style: {
                                                width: '100%',
                                                padding: '6px 8px',
                                                border: '1px solid #ced4da',
                                                borderRadius: '4px',
                                                fontSize: '12px',
                                                backgroundColor: 'white'
                                            }, children: [_jsx("option", { value: "", children: "Select Product" }), products.map(product => (_jsx("option", { value: product.id, children: product.name }, product.id)))] })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500' }, children: "Qty *" }), _jsx("input", { type: "number", value: currentItem.qty || '', onChange: (e) => setCurrentItem(prev => ({ ...prev, qty: parseInt(e.target.value) || 0 })), min: "1", style: {
                                                width: '100%',
                                                padding: '6px 8px',
                                                border: '1px solid #ced4da',
                                                borderRadius: '4px',
                                                fontSize: '12px'
                                            } })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500' }, children: "Rate *" }), _jsx("input", { type: "number", step: "0.01", value: currentItem.rate || '', onChange: (e) => setCurrentItem(prev => ({ ...prev, rate: parseFloat(e.target.value) || 0 })), style: {
                                                width: '100%',
                                                padding: '6px 8px',
                                                border: '1px solid #ced4da',
                                                borderRadius: '4px',
                                                fontSize: '12px'
                                            } })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500' }, children: "Discount" }), _jsx("input", { type: "number", step: "0.01", value: currentItem.discount || '', onChange: (e) => setCurrentItem(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 })), style: {
                                                width: '100%',
                                                padding: '6px 8px',
                                                border: '1px solid #ced4da',
                                                borderRadius: '4px',
                                                fontSize: '12px'
                                            } })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500' }, children: "Discount Type" }), _jsxs("select", { value: currentItem.discount_type, onChange: (e) => setCurrentItem(prev => ({ ...prev, discount_type: e.target.value })), style: {
                                                width: '100%',
                                                padding: '6px 8px',
                                                border: '1px solid #ced4da',
                                                borderRadius: '4px',
                                                fontSize: '12px',
                                                backgroundColor: 'white'
                                            }, children: [_jsx("option", { value: "Percentage", children: "Percentage" }), _jsx("option", { value: "Fixed", children: "Fixed Amount" })] })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500' }, children: "GST Rate *" }), _jsx("input", { type: "number", step: "0.01", value: currentItem.gst_rate || '', onChange: (e) => setCurrentItem(prev => ({ ...prev, gst_rate: parseFloat(e.target.value) || 0 })), style: {
                                                width: '100%',
                                                padding: '6px 8px',
                                                border: '1px solid #ced4da',
                                                borderRadius: '4px',
                                                fontSize: '12px'
                                            } })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500' }, children: "HSN Code *" }), _jsx("input", { type: "text", value: currentItem.hsn_code, onChange: (e) => setCurrentItem(prev => ({ ...prev, hsn_code: e.target.value })), maxLength: 10, style: {
                                                width: '100%',
                                                padding: '6px 8px',
                                                border: '1px solid #ced4da',
                                                borderRadius: '4px',
                                                fontSize: '12px'
                                            } })] }), _jsx("button", { type: "button", onClick: addItem, style: {
                                        padding: '6px 12px',
                                        backgroundColor: '#28a745',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '12px'
                                    }, children: "Add" })] }) }), formData.items.length > 0 && (_jsx("div", { style: { border: '1px solid #eee', borderRadius: '4px', overflow: 'hidden' }, children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse', fontSize: '12px' }, children: [_jsx("thead", { children: _jsxs("tr", { style: { backgroundColor: '#f8f9fa' }, children: [_jsx("th", { style: { padding: '8px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }, children: "Product" }), _jsx("th", { style: { padding: '8px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }, children: "Qty" }), _jsx("th", { style: { padding: '8px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }, children: "Rate" }), _jsx("th", { style: { padding: '8px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }, children: "Discount" }), _jsx("th", { style: { padding: '8px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }, children: "HSN" }), _jsx("th", { style: { padding: '8px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }, children: "GST" }), _jsx("th", { style: { padding: '8px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }, children: "Amount" }), _jsx("th", { style: { padding: '8px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }, children: "Action" })] }) }), _jsx("tbody", { children: formData.items.map((item, index) => {
                                        const product = products.find(p => p.id === item.product_id);
                                        const amount = calculateItemAmount(item);
                                        return (_jsxs("tr", { style: { borderBottom: '1px solid #f0f0f0' }, children: [_jsx("td", { style: { padding: '8px' }, children: _jsxs("div", { children: [_jsx("div", { style: { fontWeight: '500' }, children: product?.name }), item.description && (_jsx("div", { style: { fontSize: '11px', color: '#666' }, children: item.description }))] }) }), _jsx("td", { style: { padding: '8px', textAlign: 'right' }, children: item.qty }), _jsxs("td", { style: { padding: '8px', textAlign: 'right' }, children: ["\u20B9", item.rate.toFixed(2)] }), _jsx("td", { style: { padding: '8px', textAlign: 'right' }, children: item.discount_type === 'Percentage' ? `${item.discount}%` : `₹${item.discount.toFixed(2)}` }), _jsx("td", { style: { padding: '8px', textAlign: 'right' }, children: item.hsn_code }), _jsxs("td", { style: { padding: '8px', textAlign: 'right' }, children: ["\u20B9", item.gst_amount.toFixed(2)] }), _jsxs("td", { style: { padding: '8px', textAlign: 'right', fontWeight: '500' }, children: ["\u20B9", amount.toFixed(2)] }), _jsx("td", { style: { padding: '8px', textAlign: 'center' }, children: _jsx("button", { type: "button", onClick: () => removeItem(index), style: {
                                                            padding: '2px 6px',
                                                            backgroundColor: '#dc3545',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '2px',
                                                            cursor: 'pointer',
                                                            fontSize: '10px'
                                                        }, children: "\u00D7" }) })] }, index));
                                    }) })] }) }))] }), _jsxs("div", { style: { border: '1px solid #ddd', borderRadius: '8px', padding: '16px' }, children: [_jsx("h3", { style: { margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#333' }, children: "Invoice Totals" }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }, children: [_jsxs("div", { style: { display: 'grid', gap: '8px' }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between' }, children: [_jsx("span", { style: { fontSize: '14px' }, children: "Subtotal:" }), _jsxs("span", { style: { fontSize: '14px', fontWeight: '500' }, children: ["\u20B9", totals.subtotal.toFixed(2)] })] }), _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between' }, children: [_jsx("span", { style: { fontSize: '14px' }, children: "Total Discount:" }), _jsxs("span", { style: { fontSize: '14px', fontWeight: '500' }, children: ["\u20B9", totals.totalDiscount.toFixed(2)] })] }), _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between' }, children: [_jsx("span", { style: { fontSize: '14px' }, children: "Total GST:" }), _jsxs("span", { style: { fontSize: '14px', fontWeight: '500' }, children: ["\u20B9", totals.totalGST.toFixed(2)] })] }), _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between' }, children: [_jsx("span", { style: { fontSize: '14px' }, children: "Round Off:" }), _jsxs("span", { style: { fontSize: '14px', fontWeight: '500' }, children: ["\u20B9", totals.roundOff.toFixed(2)] })] }), _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #ddd', paddingTop: '8px' }, children: [_jsx("span", { style: { fontSize: '16px', fontWeight: '600' }, children: "Grand Total:" }), _jsxs("span", { style: { fontSize: '16px', fontWeight: '600', color: '#007bff' }, children: ["\u20B9", totals.grandTotal.toFixed(2)] })] })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }, children: "Total in Words" }), _jsx("div", { style: {
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                            backgroundColor: '#f8f9fa',
                                            fontStyle: 'italic',
                                            minHeight: '20px'
                                        }, children: `${numberToWords(Math.floor(totals.grandTotal))} Rupees Only` })] })] })] }), _jsxs("div", { style: { border: '1px solid #ddd', borderRadius: '8px', padding: '16px' }, children: [_jsx("h3", { style: { margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#333' }, children: "Other Details" }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }, children: "Invoice Notes" }), _jsx("textarea", { value: formData.notes, onChange: (e) => setFormData(prev => ({ ...prev, notes: e.target.value })), placeholder: "Additional notes...", maxLength: 200, rows: 3, style: {
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid #ced4da',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    resize: 'vertical'
                                } })] })] }), _jsxs("div", { style: { display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }, children: [_jsx("button", { type: "button", onClick: onCancel, style: {
                            padding: '10px 20px',
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }, children: "Cancel" }), _jsx("button", { type: "submit", disabled: loading, style: {
                            padding: '10px 20px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            opacity: loading ? 0.6 : 1
                        }, children: loading ? 'Creating...' : 'Create Invoice' })] })] }));
}
