import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { apiCreateInvoice, apiListParties, apiGetProducts } from '../lib/api';
import { Button } from './Button';
import { ErrorMessage } from './ErrorMessage';
import { formStyles, getSectionHeaderColor } from '../utils/formStyles';
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
const INVOICE_TYPES = ['Invoice', 'Credit Note', 'Debit Note'];
const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP'];
const INVOICE_TERMS = ['15 days', '30 days', '45 days', '60 days', '90 days', 'Due on Receipt', 'Immediate'];
const DISCOUNT_TYPES = ['Percentage', 'Fixed'];
// Helper function to convert number to words
function numberToWords(num) {
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
}
// Generate invoice number
function generateInvoiceNumber() {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `FY${year}/INV-${randomNum}`;
}
export function ComprehensiveInvoiceForm({ onSuccess, onCancel }) {
    const [customers, setCustomers] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        // Invoice Details
        invoice_no: generateInvoiceNumber(),
        date: new Date().toISOString().split('T')[0],
        due_date: new Date().toISOString().split('T')[0],
        status: 'Draft',
        invoice_type: 'Invoice',
        currency: 'INR',
        terms: 'Immediate',
        // Supplier Details
        supplier_id: null,
        supplier_address: '',
        supplier_gstin: '',
        supplier_email: '',
        // GST Compliance
        place_of_supply: 'Uttar Pradesh',
        place_of_supply_state_code: '09',
        eway_bill_number: '',
        reverse_charge: false,
        export_supply: false,
        // Customer Details
        customer_id: null,
        bill_to_address: '',
        ship_to_address: '',
        customer_gstin: '',
        customer_email: '',
        // Items and Notes
        items: [{
                product_id: 0,
                qty: 0,
                rate: 0,
                discount: 0,
                discount_type: 'Percentage',
                gst_rate: 0,
                gst_amount: 0,
                hsn_code: '',
                description: '',
                amount: 0
            }],
        notes: ''
    });
    useEffect(() => {
        loadData();
    }, []);
    const loadData = async () => {
        try {
            const [customersData, suppliersData, productsData] = await Promise.all([
                apiListParties('customer'),
                apiListParties('supplier'),
                apiGetProducts()
            ]);
            setCustomers(customersData);
            setSuppliers(suppliersData);
            setProducts(productsData);
        }
        catch (err) {
            setError(err.message || 'Failed to load data');
        }
    };
    const updateItem = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index] = { ...newItems[index], [field]: value };
        // Recalculate amounts
        const item = newItems[index];
        const product = products.find(p => p.id === item.product_id);
        if (product) {
            item.rate = product.sales_price;
            item.gst_rate = product.gst_rate || 0;
            item.hsn_code = product.hsn || '';
            item.description = product.description || '';
        }
        // Calculate amount
        const discountAmount = item.discount_type === 'Percentage'
            ? (item.rate * item.qty * item.discount / 100)
            : item.discount;
        item.amount = (item.rate * item.qty) - discountAmount;
        item.gst_amount = item.amount * (item.gst_rate / 100);
        setFormData({ ...formData, items: newItems });
    };
    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, {
                    product_id: 0,
                    qty: 0,
                    rate: 0,
                    discount: 0,
                    discount_type: 'Percentage',
                    gst_rate: 0,
                    gst_amount: 0,
                    hsn_code: '',
                    description: '',
                    amount: 0
                }]
        });
    };
    const removeItem = (index) => {
        if (formData.items.length > 1) {
            const newItems = formData.items.filter((_, i) => i !== index);
            setFormData({ ...formData, items: newItems });
        }
    };
    const updateDueDate = (terms) => {
        let dueDate = new Date();
        switch (terms) {
            case '15 days':
                dueDate.setDate(dueDate.getDate() + 15);
                break;
            case '30 days':
                dueDate.setDate(dueDate.getDate() + 30);
                break;
            case '45 days':
                dueDate.setDate(dueDate.getDate() + 45);
                break;
            case '60 days':
                dueDate.setDate(dueDate.getDate() + 60);
                break;
            case '90 days':
                dueDate.setDate(dueDate.getDate() + 90);
                break;
            default:
                dueDate = new Date();
        }
        setFormData({
            ...formData,
            terms,
            due_date: dueDate.toISOString().split('T')[0]
        });
    };
    const updateSupplierDetails = (supplierId) => {
        const supplier = suppliers.find(s => s.id === supplierId);
        if (supplier) {
            const address = `${supplier.billing_address_line1}${supplier.billing_address_line2 ? ', ' + supplier.billing_address_line2 : ''}, ${supplier.billing_city}, ${supplier.billing_state} - ${supplier.billing_pincode}`;
            setFormData({
                ...formData,
                supplier_id: supplierId,
                supplier_address: address,
                supplier_gstin: supplier.gstin || '',
                supplier_email: supplier.email || ''
            });
        }
    };
    const updateCustomerDetails = (customerId) => {
        const customer = customers.find(c => c.id === customerId);
        if (customer) {
            const address = `${customer.billing_address_line1}${customer.billing_address_line2 ? ', ' + customer.billing_address_line2 : ''}, ${customer.billing_city}, ${customer.billing_state} - ${customer.billing_pincode}`;
            setFormData({
                ...formData,
                customer_id: customerId,
                bill_to_address: address,
                ship_to_address: address,
                customer_gstin: customer.gstin || '',
                customer_email: customer.email || ''
            });
        }
    };
    // Calculate totals with GST breakup
    const totals = {
        subtotal: formData.items.reduce((sum, item) => sum + item.amount, 0),
        discount: formData.items.reduce((sum, item) => {
            const discountAmount = item.discount_type === 'Percentage'
                ? (item.rate * item.qty * item.discount / 100)
                : item.discount;
            return sum + discountAmount;
        }, 0),
        gst: formData.items.reduce((sum, item) => sum + item.gst_amount, 0),
        total: 0,
        totalInWords: '',
        // GST Breakup calculation
        cgst: 0,
        sgst: 0,
        igst: 0,
        utgst: 0,
        cess: 0
    };
    // Calculate GST breakup based on place of supply
    const supplierState = suppliers.find(s => s.id === formData.supplier_id)?.billing_state || '';
    const customerState = customers.find(c => c.id === formData.customer_id)?.billing_state || '';
    const placeOfSupplyState = formData.place_of_supply;
    // If supplier and customer are in same state, apply CGST + SGST
    // If different states, apply IGST
    if (supplierState && customerState && supplierState === customerState && supplierState === placeOfSupplyState) {
        totals.cgst = totals.gst / 2;
        totals.sgst = totals.gst / 2;
    }
    else {
        totals.igst = totals.gst;
    }
    totals.total = totals.subtotal + totals.gst;
    totals.totalInWords = numberToWords(Math.round(totals.total)) + ' Rupees Only';
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await apiCreateInvoice({
                customer_id: formData.customer_id,
                supplier_id: formData.supplier_id,
                invoice_no: formData.invoice_no,
                date: formData.date,
                terms: formData.terms,
                place_of_supply: formData.place_of_supply,
                place_of_supply_state_code: formData.place_of_supply_state_code,
                eway_bill_number: formData.eway_bill_number,
                reverse_charge: formData.reverse_charge,
                export_supply: formData.export_supply,
                bill_to_address: formData.bill_to_address,
                ship_to_address: formData.ship_to_address,
                items: formData.items.map(item => ({
                    product_id: item.product_id,
                    qty: item.qty,
                    rate: item.rate,
                    discount: item.discount,
                    discount_type: item.discount_type,
                    description: item.description,
                    hsn_code: item.hsn_code
                })),
                notes: formData.notes
            });
            onSuccess();
        }
        catch (err) {
            setError(err.message || 'Failed to create invoice');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("form", { onSubmit: handleSubmit, children: [_jsx(ErrorMessage, { message: error }), _jsxs("div", { style: formStyles.section, children: [_jsx("h3", { style: { ...formStyles.sectionHeader, borderBottomColor: getSectionHeaderColor('basic') }, children: "Invoice Details" }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }, children: [_jsxs("div", { style: formStyles.formGroup, children: [_jsx("label", { style: formStyles.label, children: "Invoice Number *" }), _jsx("input", { type: "text", value: formData.invoice_no, onChange: (e) => setFormData({ ...formData, invoice_no: e.target.value }), maxLength: 16, required: true, style: formStyles.input })] }), _jsxs("div", { children: [_jsx("label", { children: "Invoice Date *" }), _jsx("input", { type: "date", value: formData.date, onChange: (e) => setFormData({ ...formData, date: e.target.value }), required: true, style: { width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' } })] }), _jsxs("div", { children: [_jsx("label", { children: "Invoice Due Date *" }), _jsx("input", { type: "date", value: formData.due_date, onChange: (e) => setFormData({ ...formData, due_date: e.target.value }), required: true, style: { width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' } })] }), _jsxs("div", { children: [_jsx("label", { children: "Invoice Status" }), _jsx("input", { type: "text", value: formData.status, readOnly: true, style: { width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', backgroundColor: '#f9f9f9' } })] }), _jsxs("div", { children: [_jsx("label", { children: "Invoice Type *" }), _jsx("select", { value: formData.invoice_type, onChange: (e) => setFormData({ ...formData, invoice_type: e.target.value }), required: true, style: { width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }, children: INVOICE_TYPES.map(type => (_jsx("option", { value: type, children: type }, type))) })] }), _jsxs("div", { children: [_jsx("label", { children: "Invoice Currency" }), _jsx("select", { value: formData.currency, onChange: (e) => setFormData({ ...formData, currency: e.target.value }), style: { width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }, children: CURRENCIES.map(currency => (_jsx("option", { value: currency, children: currency }, currency))) })] }), _jsxs("div", { children: [_jsx("label", { children: "Invoice Terms *" }), _jsx("select", { value: formData.terms, onChange: (e) => updateDueDate(e.target.value), required: true, style: { width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }, children: INVOICE_TERMS.map(term => (_jsx("option", { value: term, children: term }, term))) })] })] })] }), _jsxs("div", { style: { marginBottom: '24px' }, children: [_jsx("h3", { style: { marginBottom: '16px', color: '#333', borderBottom: '2px solid #28a745', paddingBottom: '8px' }, children: "Supplier Details" }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }, children: [_jsxs("div", { children: [_jsx("label", { children: "Supplier Name *" }), _jsxs("select", { value: formData.supplier_id || '', onChange: (e) => updateSupplierDetails(Number(e.target.value)), required: true, style: { width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }, children: [_jsx("option", { value: "", children: "Select Supplier..." }), suppliers.map(supplier => (_jsx("option", { value: supplier.id, children: supplier.name }, supplier.id)))] })] }), _jsxs("div", { children: [_jsx("label", { children: "Supplier Address *" }), _jsx("input", { type: "text", value: formData.supplier_address, onChange: (e) => setFormData({ ...formData, supplier_address: e.target.value }), maxLength: 200, required: true, style: { width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' } })] }), _jsxs("div", { children: [_jsx("label", { children: "Supplier GSTIN *" }), _jsx("input", { type: "text", value: formData.supplier_gstin, onChange: (e) => setFormData({ ...formData, supplier_gstin: e.target.value }), maxLength: 15, required: true, style: { width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' } })] }), _jsxs("div", { children: [_jsx("label", { children: "Supplier Email" }), _jsx("input", { type: "email", value: formData.supplier_email, onChange: (e) => setFormData({ ...formData, supplier_email: e.target.value }), maxLength: 100, style: { width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' } })] })] })] }), _jsxs("div", { style: { marginBottom: '24px' }, children: [_jsx("h3", { style: { marginBottom: '16px', color: '#333', borderBottom: '2px solid #ffc107', paddingBottom: '8px' }, children: "GST Compliance" }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }, children: [_jsxs("div", { children: [_jsx("label", { children: "Place of Supply *" }), _jsx("select", { value: formData.place_of_supply, onChange: (e) => {
                                            const state = e.target.value;
                                            const stateCode = INDIAN_STATES[state] || '';
                                            setFormData({
                                                ...formData,
                                                place_of_supply: state,
                                                place_of_supply_state_code: stateCode
                                            });
                                        }, required: true, style: { width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }, children: Object.keys(INDIAN_STATES).map(state => (_jsxs("option", { value: state, children: [state, " (", INDIAN_STATES[state], ")"] }, state))) })] }), _jsxs("div", { children: [_jsx("label", { children: "E-way Bill Number" }), _jsx("input", { type: "text", value: formData.eway_bill_number, onChange: (e) => setFormData({ ...formData, eway_bill_number: e.target.value }), maxLength: 15, style: { width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' } })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx("input", { type: "checkbox", checked: formData.reverse_charge, onChange: (e) => setFormData({ ...formData, reverse_charge: e.target.checked }), style: { width: '16px', height: '16px' } }), _jsx("label", { children: "Reverse Charge" })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx("input", { type: "checkbox", checked: formData.export_supply, onChange: (e) => setFormData({ ...formData, export_supply: e.target.checked }), style: { width: '16px', height: '16px' } }), _jsx("label", { children: "Export Supply" })] })] })] }), _jsxs("div", { style: { marginBottom: '24px' }, children: [_jsx("h3", { style: { marginBottom: '16px', color: '#333', borderBottom: '2px solid #6c757d', paddingBottom: '8px' }, children: "Customer Details" }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }, children: [_jsxs("div", { children: [_jsx("label", { children: "Customer Name *" }), _jsxs("select", { value: formData.customer_id || '', onChange: (e) => updateCustomerDetails(Number(e.target.value)), required: true, style: { width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }, children: [_jsx("option", { value: "", children: "Select Customer..." }), customers.map(customer => (_jsx("option", { value: customer.id, children: customer.name }, customer.id)))] })] }), _jsxs("div", { children: [_jsx("label", { children: "Bill To Address *" }), _jsx("input", { type: "text", value: formData.bill_to_address, onChange: (e) => setFormData({ ...formData, bill_to_address: e.target.value }), maxLength: 200, required: true, style: { width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' } })] }), _jsxs("div", { children: [_jsx("label", { children: "Ship To Address *" }), _jsx("input", { type: "text", value: formData.ship_to_address, onChange: (e) => setFormData({ ...formData, ship_to_address: e.target.value }), maxLength: 200, required: true, style: { width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' } })] }), _jsxs("div", { children: [_jsx("label", { children: "Customer GSTIN *" }), _jsx("input", { type: "text", value: formData.customer_gstin, onChange: (e) => setFormData({ ...formData, customer_gstin: e.target.value }), maxLength: 15, required: true, style: { width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' } })] }), _jsxs("div", { children: [_jsx("label", { children: "Customer Email" }), _jsx("input", { type: "email", value: formData.customer_email, onChange: (e) => setFormData({ ...formData, customer_email: e.target.value }), maxLength: 100, style: { width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' } })] })] })] }), _jsxs("div", { style: { marginBottom: '24px' }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }, children: [_jsx("h3", { style: { marginBottom: '16px', color: '#333', borderBottom: '2px solid #007bff', paddingBottom: '8px' }, children: "Invoice Items" }), _jsx(Button, { type: "button", onClick: addItem, variant: "secondary", children: "Add Item" })] }), _jsx("div", { style: { overflowX: 'auto' }, children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse' }, children: [_jsx("thead", { children: _jsxs("tr", { style: { backgroundColor: '#f9f9f9' }, children: [_jsx("th", { style: { padding: '8px', textAlign: 'left', border: '1px solid var(--border)' }, children: "Product" }), _jsx("th", { style: { padding: '8px', textAlign: 'left', border: '1px solid var(--border)' }, children: "Qty" }), _jsx("th", { style: { padding: '8px', textAlign: 'left', border: '1px solid var(--border)' }, children: "Rate" }), _jsx("th", { style: { padding: '8px', textAlign: 'left', border: '1px solid var(--border)' }, children: "Discount Type" }), _jsx("th", { style: { padding: '8px', textAlign: 'left', border: '1px solid var(--border)' }, children: "Discount" }), _jsx("th", { style: { padding: '8px', textAlign: 'left', border: '1px solid var(--border)' }, children: "GST Rate" }), _jsx("th", { style: { padding: '8px', textAlign: 'left', border: '1px solid var(--border)' }, children: "GST Amount" }), _jsx("th", { style: { padding: '8px', textAlign: 'left', border: '1px solid var(--border)' }, children: "HSN Code" }), _jsx("th", { style: { padding: '8px', textAlign: 'left', border: '1px solid var(--border)' }, children: "Amount" }), _jsx("th", { style: { padding: '8px', textAlign: 'left', border: '1px solid var(--border)' }, children: "Action" })] }) }), _jsx("tbody", { children: formData.items.map((item, index) => {
                                        const product = products.find(p => p.id === item.product_id);
                                        return (_jsxs("tr", { children: [_jsxs("td", { style: { padding: '8px', border: '1px solid var(--border)' }, children: [_jsxs("select", { value: item.product_id, onChange: (e) => updateItem(index, 'product_id', Number(e.target.value)), required: true, style: { width: '100%', padding: '4px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }, children: [_jsx("option", { value: 0, children: "Select Product..." }), products.map(product => (_jsx("option", { value: product.id, children: product.name }, product.id)))] }), product?.description && (_jsx("div", { style: { fontSize: '12px', color: '#666', marginTop: '4px' }, children: product.description }))] }), _jsx("td", { style: { padding: '8px', border: '1px solid var(--border)' }, children: _jsx("input", { type: "number", value: item.qty, onChange: (e) => updateItem(index, 'qty', Number(e.target.value)), min: 1, required: true, style: { width: '60px', padding: '4px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' } }) }), _jsx("td", { style: { padding: '8px', border: '1px solid var(--border)' }, children: _jsx("input", { type: "number", value: item.rate, onChange: (e) => updateItem(index, 'rate', Number(e.target.value)), min: 0, step: 0.01, required: true, style: { width: '80px', padding: '4px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' } }) }), _jsx("td", { style: { padding: '8px', border: '1px solid var(--border)' }, children: _jsx("select", { value: item.discount_type, onChange: (e) => updateItem(index, 'discount_type', e.target.value), style: { width: '80px', padding: '4px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }, children: DISCOUNT_TYPES.map(type => (_jsx("option", { value: type, children: type === 'Percentage' ? '%' : '₹' }, type))) }) }), _jsx("td", { style: { padding: '8px', border: '1px solid var(--border)' }, children: _jsx("input", { type: "number", value: item.discount, onChange: (e) => updateItem(index, 'discount', Number(e.target.value)), min: 0, step: 0.01, style: { width: '60px', padding: '4px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' } }) }), _jsx("td", { style: { padding: '8px', border: '1px solid var(--border)' }, children: _jsx("input", { type: "number", value: item.gst_rate, onChange: (e) => updateItem(index, 'gst_rate', Number(e.target.value)), min: 0, step: 0.01, required: true, style: { width: '60px', padding: '4px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' } }) }), _jsx("td", { style: { padding: '8px', border: '1px solid var(--border)' }, children: _jsx("input", { type: "number", value: item.gst_amount.toFixed(2), readOnly: true, style: { width: '80px', padding: '4px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', backgroundColor: '#f9f9f9' } }) }), _jsx("td", { style: { padding: '8px', border: '1px solid var(--border)' }, children: _jsx("input", { type: "text", value: item.hsn_code, onChange: (e) => updateItem(index, 'hsn_code', e.target.value), maxLength: 10, required: true, style: { width: '80px', padding: '4px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' } }) }), _jsx("td", { style: { padding: '8px', border: '1px solid var(--border)' }, children: _jsx("input", { type: "number", value: item.amount.toFixed(2), readOnly: true, style: { width: '80px', padding: '4px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', backgroundColor: '#f9f9f9' } }) }), _jsx("td", { style: { padding: '8px', border: '1px solid var(--border)' }, children: formData.items.length > 1 && (_jsx(Button, { type: "button", onClick: () => removeItem(index), variant: "secondary", children: "Remove" })) })] }, index));
                                    }) })] }) })] }), _jsxs("div", { style: { marginBottom: '24px' }, children: [_jsx("h3", { style: { marginBottom: '16px', color: '#333', borderBottom: '2px solid #28a745', paddingBottom: '8px' }, children: "Invoice Totals" }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }, children: [_jsxs("div", { children: [_jsx("label", { children: "Subtotal" }), _jsx("input", { type: "text", value: `₹${totals.subtotal.toFixed(2)}`, readOnly: true, style: { width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', backgroundColor: '#f9f9f9' } })] }), _jsxs("div", { children: [_jsx("label", { children: "Total Discount" }), _jsx("input", { type: "text", value: `₹${totals.discount.toFixed(2)}`, readOnly: true, style: { width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', backgroundColor: '#f9f9f9' } })] }), _jsxs("div", { children: [_jsx("label", { children: "Total GST Amount" }), _jsx("input", { type: "text", value: `₹${totals.gst.toFixed(2)}`, readOnly: true, style: { width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', backgroundColor: '#f9f9f9' } })] }), totals.cgst > 0 && (_jsxs("div", { children: [_jsx("label", { children: "CGST (9%)" }), _jsx("input", { type: "text", value: `₹${totals.cgst.toFixed(2)}`, readOnly: true, style: { width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', backgroundColor: '#f9f9f9' } })] })), totals.sgst > 0 && (_jsxs("div", { children: [_jsx("label", { children: "SGST (9%)" }), _jsx("input", { type: "text", value: `₹${totals.sgst.toFixed(2)}`, readOnly: true, style: { width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', backgroundColor: '#f9f9f9' } })] })), totals.igst > 0 && (_jsxs("div", { children: [_jsx("label", { children: "IGST (18%)" }), _jsx("input", { type: "text", value: `₹${totals.igst.toFixed(2)}`, readOnly: true, style: { width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', backgroundColor: '#f9f9f9' } })] })), _jsxs("div", { children: [_jsx("label", { children: "Grand Total" }), _jsx("input", { type: "text", value: `₹${totals.total.toFixed(2)}`, readOnly: true, style: { width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', backgroundColor: '#f9f9f9', fontWeight: 'bold' } })] }), _jsxs("div", { style: { gridColumn: '1 / -1' }, children: [_jsx("label", { children: "Total in Words" }), _jsx("input", { type: "text", value: totals.totalInWords, readOnly: true, style: { width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', backgroundColor: '#f9f9f9', fontStyle: 'italic' } })] })] })] }), _jsxs("div", { style: { marginBottom: '24px' }, children: [_jsx("h3", { style: { marginBottom: '16px', color: '#333', borderBottom: '2px solid #6c757d', paddingBottom: '8px' }, children: "Other Details" }), _jsxs("div", { children: [_jsx("label", { children: "Invoice Notes" }), _jsx("textarea", { value: formData.notes, onChange: (e) => setFormData({ ...formData, notes: e.target.value }), maxLength: 200, rows: 3, placeholder: "Optional notes...", style: { width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' } })] })] }), _jsxs("div", { style: { display: 'flex', gap: '12px', justifyContent: 'flex-end' }, children: [_jsx(Button, { type: "button", onClick: onCancel, variant: "secondary", children: "Cancel" }), _jsx(Button, { type: "submit", variant: "primary", disabled: loading, children: loading ? 'Creating...' : 'Create Invoice' })] })] }));
}
